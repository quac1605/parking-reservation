import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapVisualization from '../components/MapVisualization';
import { calculatePrice } from '../utils/pricing';

export default function Dashboard() {
    const navigate = useNavigate();
    const [selectedSide, setSelectedSide] = useState('Front Side');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // --- Time Logic ---
    const now = new Date();

    // Generate base slots (18:00 today -> 06:00 tomorrow)
    const generateSlots = () => {
        const slots = [];
        let baseDate = new Date();
        baseDate.setHours(18, 0, 0, 0); // Today 18:00

        // If it's currently early morning (e.g. 02:00), "Today 18:00" is in the future relative to "booking for tonight"? 
        // No, typically "Night Shift" implies the current active night. 
        // If it's 02:00, user might want to book 02:30-06:00.
        // In that case, the window started yesterday 18:00. 
        // Let's Simplify: The app always shows the *Upcoming* or *Current* valid window.
        // If Now < 06:00, we are in the window. Avail slots = Now -> 06:00.
        // If Now > 06:00, we are waiting for 18:00. Avail slots = 18:00 -> 06:00 (+1).

        let windowStart = new Date();
        windowStart.setHours(18, 0, 0, 0);

        // If we are in the Early Morning (00:00 - 06:00), we want the window that started yesterday
        if (now.getHours() < 6) {
            windowStart.setDate(windowStart.getDate() - 1);
        }

        // Generate 30 min intervals for 12 hours from windowStart
        for (let i = 0; i <= 24; i++) { // 12 hours
            const slotTime = new Date(windowStart.getTime() + i * 30 * 60000);

            // Only add if it's in the future (plus a small buffer, e.g. 1 min)
            if (slotTime > now) {
                const h = slotTime.getHours().toString().padStart(2, '0');
                const m = slotTime.getMinutes().toString().padStart(2, '0');
                slots.push(`${h}:${m}`);
            }
        }
        return slots;
    };

    const availableTimeSlots = generateSlots();

    // Set default times on mount or invalid
    React.useEffect(() => {
        if (availableTimeSlots.length > 0) {
            // If current start time is not in list (or empty), reset to first available
            if (!availableTimeSlots.includes(startTime)) {
                setStartTime(availableTimeSlots[0]);
                // Default end time to 3 hours later or max
                const startIndex = 0;
                const endIndex = Math.min(startIndex + 6, availableTimeSlots.length - 1); // +3 hours
                setEndTime(availableTimeSlots[endIndex]);
            }
        }
    }, [availableTimeSlots, startTime]); // Run whenever slots or startTime changes

    // Calculate price
    const totalPrice = calculatePrice(startTime, endTime);

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
                    endTime: endTime,
                    totalPrice: totalPrice
                }
            });
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login'); // Redirect anyway
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
                <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-primary px-4 py-2 border border-gray-300 rounded hover:border-primary transition-colors"
                >
                    Sign Out
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Welcome</h2>

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
                                {availableTimeSlots.slice(0, -1).map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                            <span className="text-gray-400">—</span>
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700"
                            >
                                {availableTimeSlots.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                        {selectedSlot && (
                            <div className="mt-1">
                                <p className="text-sm text-green-600">
                                    Selected: <span className="font-bold">{selectedSlot.id}</span>
                                </p>
                                <p className="text-sm text-gray-900 mt-1">
                                    Est. Price: <span className="font-bold text-primary">€ {totalPrice}</span>
                                </p>
                            </div>
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
