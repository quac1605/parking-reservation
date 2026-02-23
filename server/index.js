const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();
require('./config/passport')(passport);

const cron = require('node-cron');
const db = require('./db');

const app = express();
app.set('trust proxy', true); 

// Request Logger (for debugging tunnels)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Schedule task to run every minute
cron.schedule('* * * * *', async () => {
    try {
        const result = await db.query("DELETE FROM reservations WHERE end_time < NOW()");
        if (result.rowCount > 0) {
            console.log(`[Cleaner] Deleted ${result.rowCount} expired reservation(s).`);
        }
    } catch (err) {
        console.error('[Cleaner] Error deleting expired reservations:', err);
    }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Support Tunnels
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Config
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    name: 'parking.sid', 
    cookie: {
        secure: true, 
        sameSite: 'none',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport Config
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/payment', require('./routes/payment'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


