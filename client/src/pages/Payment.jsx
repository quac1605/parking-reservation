import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PayPalWrapper from '../components/PayPalWrapper';

export default function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { slot, location: locName, startTime, endTime, totalPrice } = location.state || {};
    const [complete, setComplete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Kiosk/QR Logic
    const [kioskOrderId, setKioskOrderId] = useState(null);
    const [approveUrl, setApproveUrl] = useState(null);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        fetch('/api/auth/current_user')
            .then(res => res.json())
            .then(user => setCurrentUser(user))
            .catch(() => navigate('/login'));
    }, [navigate]);

    // Create Kiosk Order if admin
    useEffect(() => {
        if (currentUser?.email === 'F1@admin.com' && totalPrice > 0 && !kioskOrderId) {
            const createKioskOrder = async () => {
                try {
                    const res = await fetch('/api/payment/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: totalPrice })
                    });
                    const data = await res.json();
                    if (data.id) {
                        setKioskOrderId(data.id);
                        const link = data.links.find(l => l.rel === 'approve');
                        setApproveUrl(link?.href);
                        setIsPolling(true);
                    }
                } catch (err) {
                    console.error('Kiosk Order Error:', err);
                }
            };
            createKioskOrder();
        }
    }, [currentUser, totalPrice, kioskOrderId]);

    // Polling Logic
    useEffect(() => {
        let interval;
        if (isPolling && kioskOrderId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/payment/orders/${kioskOrderId}`);
                    const data = await res.json();

                    if (data.status === 'APPROVED') {
                        setIsPolling(false);
                        clearInterval(interval);
                        handleCaptureAndSubmit(kioskOrderId);
                    }
                } catch (err) {
                    console.error('Polling Error:', err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isPolling, kioskOrderId]);

    const handleCaptureAndSubmit = async (orderId) => {
        setLoading(true);
        try {
            // 1. Capture PayPal
            const capRes = await fetch(`/api/payment/orders/${orderId}/capture`, { method: 'POST' });
            if (!capRes.ok) throw new Error('Capture failed');

            // 2. Save to our DB
            await handleReservationSubmit();
        } catch (err) {
            alert('Error finalizing payment: ' + err.message);
            setLoading(false);
        }
    };

    const handleReservationSubmit = async () => {
        setLoading(true);
        try {
            // Helper to parse "Day HH:MM" to Date
            const parseToDate = (str) => {
                const parts = str.split(' ');
                let dayName, timePart;
                if (parts.length === 2) {
                    dayName = parts[0];
                    timePart = parts[1];
                } else {
                    dayName = null;
                    timePart = str;
                }
                const [h, m] = timePart.split(':').map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);

                if (dayName) {
                    const daysMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
                    const targetDay = daysMap[dayName];
                    const currentDay = new Date().getDay();
                    let diff = targetDay - currentDay;
                    if (diff < 0) diff += 7;
                    d.setDate(new Date().getDate() + diff);
                }
                return d;
            };

            const startDateTime = parseToDate(startTime);
            let endDateTime = parseToDate(endTime);

            // Safety: If end < start (shouldn't happen with correct Day names), add 1 day
            if (endDateTime <= startDateTime) {
                endDateTime.setDate(endDateTime.getDate() + 1);
            }

            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slot_id: slot?.id,
                    location: locName,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    total_price: totalPrice
                })
            });

            if (res.ok) {
                setComplete(true);
            } else if (res.status === 401) {
                alert('Session expired. Please sign in again to complete the reservation.');
                navigate('/login');
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
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
                    <p className="text-gray-600 mb-8 max-w-sm mx-auto">Your reservation for <strong>{slot?.id}</strong> has been confirmed. You can view your QR code in the dashboard.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-primary text-white px-8 py-3 rounded-md font-medium hover:bg-orange-600 transition-colors shadow-lg"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const isAdmin = currentUser?.email === 'F1@admin.com';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Final Step: Payment</h2>
                    <p className="text-gray-500 mt-2">Secure your reservation in Dortmund</p>
                </div>

                <div className="bg-orange-50/50 rounded-xl p-6 mb-8 border border-orange-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Booking Details</span>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">{slot?.id || 'Slot'}</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                            <div className="text-2xl font-black text-primary">€ {totalPrice}</div>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Location:</span>
                            <span className="font-semibold text-gray-900">{locName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="font-semibold text-gray-900">{startTime} — {endTime}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {isAdmin ? (
                        <div className="text-center">
                            <div className="mb-6 p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl inline-block relative">
                                {approveUrl ? (
                                    <>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(approveUrl)}`}
                                            alt="PayPal Payment QR"
                                            className="w-64 h-64"
                                        />
                                        {loading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-64 h-64 flex items-center justify-center bg-gray-50 text-gray-400">
                                        Generating order...
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-lg font-bold text-gray-900">Scan to Pay</h4>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    Please scan this QR code with your smartphone to complete the payment on your device.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium animate-pulse">
                                    <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                                    Waiting for payment approval...
                                </div>
                            </div>
                        </div>
                    ) : (
                        <PayPalWrapper
                            amount={totalPrice}
                            onSuccess={handleReservationSubmit}
                            onError={(err) => alert('Payment failed: ' + (err.message || err))}
                        />
                    )}
                </div>

                <button
                    onClick={() => navigate('/confirmation', { state: location.state })}
                    disabled={loading}
                    className="w-full text-gray-500 font-medium py-3 rounded-md hover:text-gray-900 transition-colors mt-8 text-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Confirmation
                </button>
            </div>
        </div>
    );
}

