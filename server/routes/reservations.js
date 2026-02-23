const router = require('express').Router();
const db = require('../db');

const QRCode = require('qrcode');

// Create a new reservation
router.post('/', async (req, res) => {
    const { slot_id, location, start_time, end_time, total_price } = req.body;

    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const userId = req.user.id;

        // Check for overlapping reservations on the same slot
        // Enforce a 1-hour buffer between reservations
        const overlap = await db.query(
            `SELECT id FROM reservations
             WHERE slot_id = $1 AND status = 'confirmed'
             AND start_time < ($3::timestamp + INTERVAL '1 hour') 
             AND (end_time + INTERVAL '1 hour') > $2::timestamp`,
            [slot_id, start_time, end_time]
        );

        if (overlap.rows.length > 0) {
            return res.status(400).json({ message: 'This time slot overlaps with an existing reservation.' });
        }

        // Generate QR Code Data (JSON string of reservation details)
        const qrData = JSON.stringify({
            uid: userId,
            slot: slot_id,
            loc: location,
            start: start_time,
            end: end_time
        });

        // Generate QR Code as Data URL
        const qrCodeImage = await QRCode.toDataURL(qrData);

        const newReservation = await db.query(
            'INSERT INTO reservations (user_id, slot_id, location, start_time, end_time, total_price, qr_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, slot_id, location, start_time, end_time, total_price, qrCodeImage]
        );

        res.json(newReservation.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while saving reservation' });
    }
});

// Get user's reservations
router.get('/my-reservations', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const userId = req.user.id;
        const reservations = await db.query(
            'SELECT * FROM reservations WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(reservations.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching reservations' });
    }
});

// Get occupied slots with end times
router.get('/occupied', async (req, res) => {
    try {
        // Prevent caching on mobile/browsers
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        // Find reservations where end_time > NOW, return slot_id and the latest end_time per slot
        const result = await db.query(
            `SELECT slot_id, MAX(end_time) as end_time
             FROM reservations
             WHERE status = 'confirmed' AND end_time > NOW()
             GROUP BY slot_id`
        );

        // Return array of objects: [{ slot_id: 'F1', end_time: '...' }]
        const occupiedData = result.rows.map(row => ({
            slot_id: row.slot_id,
            end_time: row.end_time
        }));

        console.log(`[Status] Occupied: ${occupiedData.map(o => o.slot_id).join(', ')}`);

        res.json(occupiedData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching availability' });
    }
});

module.exports = router;
