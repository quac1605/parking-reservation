import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { slot, location: locName, startTime, endTime, totalPrice } = location.state || {};
    const [complete, setComplete] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Construct real timestamps
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

            // Start Time
            const startDateTime = new Date(`${dateStr}T${startTime}:00`);

            // End Time
            let endDateTime = new Date(`${dateStr}T${endTime}:00`);
            // If end time is earlier than start time (e.g. 06:00 < 18:00), it's next day
            if (endDateTime < startDateTime) {
                endDateTime.setDate(endDateTime.getDate() + 1);
            }

            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot_id: slot.id,
                    location: locName,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    total_price: totalPrice
                })
            });

            if (res.ok) {
                setComplete(true);
            } else {
                const errData = await res.json();
                alert('Reservation failed: ' + (errData.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong processing your request.');
        } finally {
            setLoading(false);
        }
    };

    if (complete) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-primary mb-4">Payment Successful!</h2>
                    <p className="text-gray-600 mb-8">Reservation confirmed and saved.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-primary text-white px-8 py-3 rounded-md font-medium"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Complete Your Payment</h2>

                <div className="border rounded-lg p-6 mb-6">
                    <h3 className="text-primary font-bold mb-4">Reservation Summary</h3>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Location</span>
                            <span className="text-gray-900">{locName || 'Frz'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Slot</span>
                            <span className="text-gray-900">{slot?.id || '24 Feb 2025'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Time</span>
                            <span className="text-gray-900">{startTime || '18:00'} — {endTime || '21:00'}</span>
                        </div>
                    </div>

                    <h3 className="text-primary font-bold mb-4 border-t pt-4">Pricing</h3>

                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Booking Time</span>
                            <span className="text-gray-900">{startTime} - {endTime}</span>
                        </div>
                    </div>

                    <div className="flex justify-between border-t pt-4 font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>€ {totalPrice}</span>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-[#003087] text-white font-bold italic py-4 rounded-md hover:bg-[#001c64] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <span>Processing...</span>
                    ) : (
                        <>
                            <span>Pay with</span>
                            <span className="font-bold text-lg">PayPal</span>
                        </>
                    )}
                </button>

                <p className="mt-8 text-sm text-gray-500 text-center mb-4">
                    After payment, your QR code will be generated.
                </p>

                <button
                    onClick={() => navigate('/confirmation', { state: location.state })}
                    className="w-full bg-white text-primary border border-primary/50 font-medium py-3 rounded-md hover:bg-orange-50 transition-colors"
                >
                    Go Back to Confirmation
                </button>
            </div>
        </div>
    );
}
