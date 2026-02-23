const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db');

module.exports = function (passport) {
    // Serialize User
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize User
    passport.deserializeUser(async (id, done) => {
        try {
            const { rows } = await db.query('SELECT id, email, name FROM users WHERE id = $1', [id]);
            done(null, rows[0]);
        } catch (err) {
            done(err);
        }
    });

    // Local Strategy
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = rows[0];

            if (!user) {
                return done(null, false, { message: 'Email not registered' });
            }

            if (!user.password) {
                return done(null, false, { message: 'Please log in with your social account' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (err) {
            return done(err);
        }
    }));

    // Google Strategy
    const callbackURL = (process.env.GOOGLE_CALLBACK_URL || '').trim().replace('http://', 'https://');

    passport.use(new GoogleStrategy({
        clientID: (process.env.GOOGLE_CLIENT_ID || '').trim(),
        clientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
        callbackURL: callbackURL,
        proxy: true
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                const { rows } = await db.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);

                if (rows.length > 0) {
                    return done(null, rows[0]);
                } else {
                    // Create new user
                    const newUser = {
                        google_id: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName
                    };

                    // Ensure email doesn't exist under local auth
                    const existingEmail = await db.query('SELECT * FROM users WHERE email = $1', [newUser.email]);
                    if (existingEmail.rows.length > 0) {
                        const updatedUser = await db.query(
                            'UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *',
                            [newUser.google_id, newUser.email]
                        );
                        return done(null, updatedUser.rows[0]);
                    }

                    const res = await db.query(
                        'INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING *',
                        [newUser.google_id, newUser.email, newUser.name]
                    );
                    return done(null, res.rows[0]);
                }
            } catch (err) {
                return done(err);
            }
        }));// Express session configuration + Passport session integration (index.js)
    }