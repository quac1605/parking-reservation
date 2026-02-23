import React, { useEffect, useRef, useState } from 'react';

export default function PayPalWrapper({ amount, onSuccess, onError }) {
    const paypalRef = useRef();
    const [sdkReady, setSdkReady] = useState(false);
    const [clientId, setClientId] = useState(null);

    useEffect(() => {
        // Fetch Client ID from backend
        const getClientId = async () => {
            try {
                const res = await fetch('/api/payment/config');
                const data = await res.json();
                setClientId(data.clientId);
            } catch (err) {
                console.error('Failed to fetch PayPal config', err);
            }
        };
        getClientId();
    }, []);

    useEffect(() => {
        if (!clientId) return;

        // Check if script is already there
        if (window.paypal) {
            setSdkReady(true);
            return;
        }

        const script = document.createElement('script');
        // Sandbox URL with meaningful Client ID
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
        script.type = 'text/javascript';
        script.async = true;
        script.onload = () => {
            setSdkReady(true);
        };
        script.onerror = () => {
            console.error('PayPal SDK could not be loaded.');
            if (onError) onError('PayPal SDK failed to load.');
        };

        document.body.appendChild(script);
    }, [clientId]);

    useEffect(() => {
        if (sdkReady && window.paypal) {
            window.paypal.Buttons({
                createOrder: async (data, actions) => {
                    // Call backend to create order
                    try {
                        const res = await fetch('/api/payment/orders', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount: amount })
                        });
                        const orderData = await res.json();
                        return orderData.id; // Return the Order ID
                    } catch (err) {
                        console.error('Create Order Error:', err);
                        if (onError) onError(err);
                    }
                },
                onApprove: async (data, actions) => {
                    // Call backend to capture
                    try {
                        const res = await fetch(`/api/payment/orders/${data.orderID}/capture`, {
                            method: 'POST'
                        });
                        const captureData = await res.json();

                        // Check for error in transaction
                        const errorDetail = captureData?.details?.[0];
                        if (errorDetail?.issue === 'INSTRUMENT_DECLINED') {
                            return actions.restart();
                        } else if (errorDetail) {
                            throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
                        } else if (!captureData.purchase_units) {
                            // Minimal capture successful check
                            // throw new Error('Capture failed');
                        }

                        // Successful capture
                        if (onSuccess) onSuccess(captureData);

                    } catch (err) {
                        console.error('Capture Error:', err);
                        if (onError) onError(err);
                    }
                },
                onError: (err) => {
                    console.error('PayPal Button Error:', err);
                    if (onError) onError(err);
                }
            }).render(paypalRef.current);
        }
    }, [sdkReady, amount]);

    if (!sdkReady) {
        return <div className="text-center p-4">Loading PayPal...</div>;
    }

    return (
        <div>
            <div ref={paypalRef}></div>
        </div>
    );
}
