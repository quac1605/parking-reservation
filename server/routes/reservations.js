const router = require('express').Router();
const db = require('../db');

// Create a new reservation
router.post('/', async (req, res) => {
    // Expect user_id from session or body (if we rely on client for now, but better from session)
    // For now, we'll assume the client sends everything or we get user from req.user (Passport)
    const { slot_id, location, start_time, end_time, total_price } = req.body;

    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const userId = req.user.id;

        const newReservation = await db.query(
            'INSERT INTO reservations (user_id, slot_id, location, start_time, end_time, total_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, slot_id, location, start_time, end_time, total_price]
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

module.exports = router;
