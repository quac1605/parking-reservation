import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Confirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const { slot, location: locName, startTime, endTime, totalPrice } = location.state || {
        slot: { id: 'F 12' },
        location: 'Front Side',
        startTime: '18:00',
        endTime: '21:00',
        totalPrice: '0.00'
    };

    return (
        <div className="min-h-screen bg-white p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-xl font-bold text-primary">Fachhochschule<br />Dortmund</h1>
                    <p className="text-xs text-gray-500">University of Applied Sciences and Arts</p>
                </div>

                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reservation Confirmed</h2>
                    <p className="text-2xl text-gray-800">Thank you.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
                    <div className="grid grid-cols-[140px_1fr] gap-y-4 text-lg">
                        <span className="font-bold text-gray-900">Location:</span>
                        <span className="text-gray-900">{locName}</span>

                        <span className="font-bold text-gray-900">Slot:</span>
                        <div className="flex flex-col">
                            <span className="text-gray-900">{slot.id}</span>
                            <span className="text-gray-600 text-base">{startTime} — {endTime}</span>
                        </div>

                        <span className="font-bold text-gray-900 mt-4">Reservation Cost:</span>
                        <span className="font-bold text-primary mt-4">€ {totalPrice}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/payment', { state: location.state })}
                        className="flex-1 bg-primary text-white font-medium py-3 px-6 rounded-md hover:bg-orange-600 transition-colors text-center"
                    >
                        Proceed to Payment
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 bg-white text-gray-900 border border-gray-300 font-medium py-3 px-6 rounded-md hover:bg-gray-50 transition-colors text-center"
                    >
                        Go Back to Booking
                    </button>
                </div>
            </div>
        </div>
    );
}

