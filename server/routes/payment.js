const router = require('express').Router();

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com'; // Use sandbox for dev

// Helper: Get Access Token
const generateAccessToken = async () => {
    try {
        const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET).toString('base64');
        const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Failed to generate Access Token:', error);
        throw error;
    }
};

// Create Order
router.post('/orders', async (req, res) => {
    const { amount } = req.body;

    try {
        const accessToken = await generateAccessToken();
        const payload = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'EUR',
                        value: amount,
                    },
                },
            ],
        };

        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order.' });
    }
});

// Capture Order
router.post('/orders/:orderID/capture', async (req, res) => {
    const { orderID } = req.params;

    try {
        const accessToken = await generateAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error capturing order:', error);
        res.status(500).json({ error: 'Failed to capture order.' });
    }
});

// Get Order Details (for polling)
router.get('/orders/:orderID', async (req, res) => {
    const { orderID } = req.params;
    try {
        const accessToken = await generateAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order.' });
    }
});

// Get PayPal Client ID for frontend
router.get('/config', (req, res) => {
    res.json({ clientId: PAYPAL_CLIENT_ID });
});

module.exports = router;

