import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapVisualization from '../components/MapVisualization';

export default function Dashboard() {
    const navigate = useNavigate();
    const [selectedSide, setSelectedSide] = useState('Front Side');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('21:00');

    // Generate time slots: 18:00 today to 06:00 tomorrow (every 30 mins)
    const timeSlots = [];
    let currentHour = 18;
    let currentMinute = 0;

    // We want 18:00 (18.0) to 06:00 (30.0) next day
    // 18.0 to 30.0
    for (let i = 0; i <= 24; i++) { // 12 hours * 2 slots/hr = 24 slots + 06:00 end
        const hour = currentHour % 24;
        const timeString = `${hour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        timeSlots.push(timeString);

        currentMinute += 30;
        if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour += 1;
        }
        if (currentHour > 30) break; // Safety break, though loop handles it (18+12=30)
    }

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        // Smooth scroll to bottom or show summary
    };

    const handleReserve = () => {
        if (selectedSlot) {
            navigate('/confirmation', {
                state: {
                    slot: selectedSlot,
                    location: selectedSide,
                    startTime: startTime,
                    endTime: endTime
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="px-8 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-primary">Fachhochschule<br />Dortmund</h1>
                    <p className="text-xs text-gray-500">University of Applied Sciences and Arts</p>
                </div>
                <button className="text-gray-500 hover:text-primary px-4 py-2 border border-gray-300 rounded hover:border-primary transition-colors">
                    Sign Out
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Welcome, Andreas</h2>

                {/* Location Selector */}
                <div className="mb-6">
                    <label className="block text-lg font-medium text-gray-900 mb-2">Select Parking Location</label>
                    <div className="flex bg-gray-50 rounded-lg p-1 w-full max-w-md border border-gray-200">
                        {['Front Side', 'Back Side'].map((side) => (
                            <button
                                key={side}
                                onClick={() => { setSelectedSide(side); setSelectedSlot(null); }}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${selectedSide === side
                                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {side}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mb-4">
                    <h3 className="font-medium text-gray-700">Legend</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-sm text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-sm text-gray-600">Occupied</span>
                    </div>
                </div>

                {/* Map */}
                <div className="mb-8">
                    <MapVisualization side={selectedSide} onSelectSlot={handleSlotSelect} />
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-t pt-6">
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-gray-900">Time</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700"
                            >
                                {timeSlots.slice(0, -1).map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                            <span className="text-gray-400">—</span>
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700"
                            >
                                {timeSlots.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                        {selectedSlot && (
                            <p className="text-sm text-green-600 mt-1">
                                Selected: <span className="font-bold">{selectedSlot.id}</span>
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleReserve}
                        disabled={!selectedSlot}
                        className={`px-8 py-3 rounded-md font-medium text-white transition-colors ${selectedSlot
                            ? 'bg-primary hover:bg-orange-600 shadow-lg'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        Reserve Now
                    </button>
                </div>
            </main>
        </div>
    );
}
