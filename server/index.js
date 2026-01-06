const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite Frontend
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Config
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using https
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport Config
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservations', require('./routes/reservations'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
