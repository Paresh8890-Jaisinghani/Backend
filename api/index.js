require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Authmodel = require('./authmodel.js');
const NodeCache = require("node-cache");

const PORT2 = process.env.PORT2 || 3003;
const URL1 = process.env.URL1;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const userCache = new NodeCache({ stdTTL: 0 }); // cache forever for now
const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(URL1, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ MongoDB connection error:", err.message));


// Helper: Load all users into cache
async function loadAllUsersToCache() {
    const users = await Authmodel.find().lean();
    users.forEach(user => userCache.set(user.username, user));
    console.log("✅ All users cached");
}


// ✅ JWT Token generator
function generateToken(user) {
    return jwt.sign(
        { username: user.username, company: user.company },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}


// ✅ Middleware to verify JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Token missing" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid or expired token" });
        req.user = decoded; // attach decoded user data
        next();
    });
}


// ✅ Authentication route (login)
app.post('/authenticate', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (userCache.keys().length === 0) await loadAllUsersToCache();

        const user = userCache.get(username);

        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        // Generate JWT
        const token = generateToken(user);

        res.json({
            success: true,
            message: "Authentication successful",
            company: user.company,
            token
        });

    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
});


// ✅ Protected route (requires token)
app.get('/users', verifyToken, async (req, res) => {
    try {
        if (userCache.keys().length === 0) await loadAllUsersToCache();

        const allUsers = userCache.keys().map(key => {
            const { password, ...rest } = userCache.get(key);
            return rest;
        });

        res.json({ success: true, data: allUsers, accessedBy: req.user.username });

    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch users", error: err.message });
    }
});


app.listen(PORT2, () => console.log(`🚀 Server running on PORT ${PORT2}`));
