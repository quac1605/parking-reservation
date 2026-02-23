const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const db = require('../db');

// Register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hashedPassword, name || '']
        );

        // Auto login after register
        req.login(newUser.rows[0], (err) => {
            if (err) throw err;
            res.json(newUser.rows[0]);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ message: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.json({ id: user.id, email: user.email, name: user.name });
        });
    })(req, res, next);
});

// Google Auth
const FRONTEND_URL = process.env.CORS_ORIGIN || 'http://localhost:5173';
console.log(`[DEBUG] Auth routes initialized. Frontend: ${FRONTEND_URL}, Google Callback: ${process.env.GOOGLE_CALLBACK_URL}`);

router.get('/google', (req, res, next) => {
    console.log(`[DEBUG] Initiating Google Auth with Callback: ${process.env.GOOGLE_CALLBACK_URL}`);
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=true` }),
    (req, res) => {
        // Successful authentication, redirect dashboard.
        res.redirect(`${FRONTEND_URL}/dashboard`);
    }
);

// Logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect(`${FRONTEND_URL}/login`);
    });
});

// Current User
router.get('/current_user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

module.exports = router;
