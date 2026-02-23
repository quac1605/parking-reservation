import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapVisualization from '../components/MapVisualization';
import { calculatePrice } from '../utils/pricing';

export default function Dashboard() {
    const navigate = useNavigate();

    // --- UI Logic ---
    const [selectedSide, setSelectedSide] = useState('Front Side');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const controlsRef = useRef(null);

    // --- Occupied Slots Logic (must be before time filtering) ---
    const [occupiedSlots, setOccupiedSlots] = useState([]);

    React.useEffect(() => {
        const fetchOccupied = async () => {
            try {
                const res = await fetch('/api/reservations/occupied', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setOccupiedSlots(data);
                }
            } catch (error) {
                console.error('Failed to fetch occupied slots', error);
            }
        };
        fetchOccupied();
    }, []);

    // --- User Logic ---
    const [currentUser, setCurrentUser] = useState(null);

    React.useEffect(() => {
        fetch('/api/auth/current_user', { credentials: 'include' })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Not logged in');
            })
            .then(user => {
                setCurrentUser(user);
            })
            .catch(err => {
                console.log('Guest or error:', err);
            });
    }, []);

    // Time Logic
    const now = new Date();

    // Generate base slots
    // Weekdays: 18:00 -> 06:00 next day
    // Fri: 18:00 -> Mon 06:00
    // Sat/Sun: 00:00 -> Mon 06:00
    const generateSlots = () => {
        const slots = [];
        let windowStart = new Date();
        const currentDay = windowStart.getDay(); // 0=Sun...6=Sat

        // Define Start Time
        if (currentDay === 0 || currentDay === 6) {
            windowStart.setHours(0, 0, 0, 0); // Sat/Sun start midnight
        } else {
            windowStart.setHours(18, 0, 0, 0); // Weekdays start 18:00
        }

        // Adjust for "Late Night" flow (e.g. 02:00am on Tuesday belongs to Monday's window)
        // But for Sat/Sun (00:00 start), 02:00am is just 02:00am of that day.
        if (now.getHours() < 6 && currentDay !== 0 && currentDay !== 6) {
            windowStart.setDate(windowStart.getDate() - 1);
        }

        // Define Duration (Hours to generate)
        let hoursToAdd = 12; // Default (18:00 to 06:00 = 12h)

        if (currentDay === 5) { // Fri -> Mon 06:00
            // Fri 18:00 to Mon 06:00 = 6 + 24 + 24 + 6 = 60 hours
            hoursToAdd = 60;
        } else if (currentDay === 6) { // Sat -> Mon 06:00
            // Sat 00:00 to Mon 06:00 = 24 + 24 + 6 = 54 hours
            hoursToAdd = 54;
        } else if (currentDay === 0) { // Sun -> Mon 06:00
            // Sun 00:00 to Mon 06:00 = 24 + 6 = 30 hours
            hoursToAdd = 30;
        }

        // Generate Loop
        const loopCount = hoursToAdd * 2; // 30 min intervals

        for (let i = 0; i <= loopCount; i++) {
            const slotTime = new Date(windowStart.getTime() + i * 30 * 60000);

            // Allow booking if the slot time + 30 mins is in the future (i.e., we are currently IN this slot)
            // or if the slot is fully in the future.
            if (slotTime.getTime() + 30 * 60000 > now.getTime()) {
                // Formatting: "Day HH:MM" (e.g. "Fri 18:00", "Sat 09:30")
                const dayName = slotTime.toLocaleDateString('en-US', { weekday: 'short' });
                const timeStr = slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                slots.push(`${dayName} ${timeStr}`);
            }
        }
        return slots;
    };

    const availableTimeSlots = generateSlots();

    // Occupied slot time filtering
    // Find occupied info for the selected slot
    const selectedOccupiedInfo = selectedSlot
        ? occupiedSlots.find(o => o.slot_id === selectedSlot.id)
        : null;

    // Helper: parse a slot label like "Wed 19:00" into a Date object
    const parseSlotLabel = (label) => {
        if (!label) return null;
        const [dayName, timeStr] = label.split(' ');
        if (!dayName || !timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const targetDay = days.indexOf(dayName);
        if (targetDay === -1) return null;
        const d = new Date();
        const todayDay = d.getDay();
        let diff = targetDay - todayDay;
        if (diff < 0) diff += 7;
        // If it's the same day but time is before now's hour, it could be today or next week
        // Use the diff as-is since generateSlots handles the window
        d.setDate(d.getDate() + diff);
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    // Filter start slots: if selected slot is occupied, only show times >= end_time + 1 hour
    const filteredStartSlots = React.useMemo(() => {
        if (!selectedOccupiedInfo) return availableTimeSlots;
        const endTime1hLater = new Date(new Date(selectedOccupiedInfo.end_time).getTime() + 60 * 60 * 1000);
        return availableTimeSlots.filter(label => {
            const slotDate = parseSlotLabel(label);
            return slotDate && slotDate >= endTime1hLater;
        });
    }, [availableTimeSlots, selectedOccupiedInfo]);

    // Reset start/end time when selected slot changes
    React.useEffect(() => {
        if (filteredStartSlots.length > 0) {
            if (!filteredStartSlots.includes(startTime)) {
                const firstSlot = filteredStartSlots[0];
                setStartTime(firstSlot);
                const endIdx = Math.min(6, filteredStartSlots.length - 1);
                setEndTime(filteredStartSlots[endIdx] || filteredStartSlots[filteredStartSlots.length - 1]);
            } else {
                const sIdx = filteredStartSlots.indexOf(startTime);
                const eIdx = filteredStartSlots.indexOf(endTime);
                if (eIdx <= sIdx && sIdx < filteredStartSlots.length - 1) {
                    setEndTime(filteredStartSlots[sIdx + 1]);
                }
            }
        }
    }, [filteredStartSlots, startTime, endTime]);

    // Calculate available END times (must be after start time)
    const startIndex = filteredStartSlots.indexOf(startTime);
    const availableEndSlots = startIndex >= 0
        ? filteredStartSlots.slice(startIndex + 1)
        : [];

    // Calculate price
    const totalPrice = calculatePrice(startTime, endTime);

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        if (controlsRef.current) {
            controlsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
            await fetch('/api/auth/logout', { credentials: 'include' });
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login'); // Redirect anyway
        }
    };

    // --- QR Code Logic ---
    const [showQR, setShowQR] = useState(false);
    const [myReservations, setMyReservations] = useState([]);
    const [loadingQR, setLoadingQR] = useState(false);

    const handleShowQR = async () => {
        setShowQR(true);
        setLoadingQR(true);
        try {
            const res = await fetch('/api/reservations/my-reservations', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setMyReservations(data);
            }
        } catch (error) {
            console.error('Failed to fetch QR:', error);
        } finally {
            setLoadingQR(false);
        }
    };


    return (
        <div className="min-h-screen bg-white relative">
            {/* Header */}
            <header className="px-8 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-primary">Fachhochschule<br />Dortmund</h1>
                    <p className="text-xs text-gray-500">University of Applied Sciences and Arts</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleShowQR}
                        className="text-primary hover:text-orange-700 font-medium px-4 py-2 border border-primary rounded transition-colors"
                    >
                        My QR
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-primary px-4 py-2 border border-gray-300 rounded hover:border-primary transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
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
                    <MapVisualization
                        side={selectedSide}
                        onSelectSlot={handleSlotSelect}
                        occupiedSlots={occupiedSlots}
                    />
                </div>

                {/* Controls */}
                <div ref={controlsRef} className="flex flex-col md:flex-row items-end justify-between gap-4 border-t pt-6">
                    <div className={`flex flex-col gap-2 transition-all duration-300 ${!selectedSlot ? 'opacity-40 blur-sm pointer-events-none select-none' : ''}`}>
                        <label className="font-bold text-gray-900">Time</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700"
                                disabled={!selectedSlot}
                            >
                                {filteredStartSlots.slice(0, -1).map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                            <span className="text-gray-400">—</span>
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-700"
                                disabled={!selectedSlot}
                            >
                                {availableEndSlots.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSlot && (
                            <div className="mt-1">
                                <p className="text-sm text-green-600">
                                    Selected: <span className="font-bold">{selectedSlot.id}</span>
                                </p>
                                {selectedOccupiedInfo && (
                                    <p className="text-sm text-orange-600 mt-1">
                                        ⚠ Occupied until {new Date(selectedOccupiedInfo.end_time).toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}.
                                        Earliest start: {new Date(new Date(selectedOccupiedInfo.end_time).getTime() + 60 * 60 * 1000).toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </p>
                                )}
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

            {/* QR Modal */}
            {showQR && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">My Active Reservations</h3>

                        {loadingQR ? (
                            <div className="py-8 text-center text-gray-500">Loading...</div>
                        ) : myReservations.length > 0 ? (
                            <div className="space-y-6">
                                {myReservations.map((res) => (
                                    <div key={res.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center bg-gray-50">
                                        <div className="bg-white p-2 border border-gray-100 rounded mb-4">
                                            <img src={res.qr_code} alt="QR Code" className="w-32 h-32" />
                                        </div>

                                        <div className="w-full text-center">
                                            <div className="font-bold text-lg text-primary mb-1">{res.slot_id}</div>
                                            <div className="text-sm text-gray-600 mb-2">{res.location}</div>

                                            <div className="text-xs text-gray-500 space-y-1">
                                                <div className="flex justify-between px-4 border-t border-gray-200 pt-2">
                                                    <span>Start:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {new Date(res.start_time).toLocaleString('en-US', {
                                                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between px-4">
                                                    <span>End:</span>
                                                    <span className="font-medium text-gray-800">
                                                        {new Date(res.end_time).toLocaleString('en-US', {
                                                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-gray-500 mb-2">You have no active reservations.</p>
                                <button
                                    onClick={() => setShowQR(false)}
                                    className="text-primary font-medium hover:underline"
                                >
                                    Make a Reservation
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


