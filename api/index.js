require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Authmodel = require('./authmodel.js');
const PORT2 = process.env.PORT2 || 3003;
const URL1 = process.env.URL1;

const NodeCache = require("node-cache");
const userCache = new NodeCache({ stdTTL: 300 }); // cache for 5 mins

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(URL1, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("Error while connecting:", err.message));


// Load all users into cache (helper function)
async function loadAllUsersToCache() {
    const users = await Authmodel.find().lean();
    users.forEach(user => {
        userCache.set(user.username, user);
    });
    console.log("✅ All users cached");
}


// Authenticate endpoint
app.post('/authenticate', async (req, res) => {
    const { username, password } = req.body;

    try {
        // If cache is empty, load all users
        if (userCache.keys().length === 0) {
            await loadAllUsersToCache();
        }

        // Lookup from cache
        const user = userCache.get(username);

        if (user && user.password === password) {
            res.json({
                success: true,
                message: "Authentication successful",
                company: user.company
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }

    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
});


// Get all users (no password)
app.get('/users', async (req, res) => {
    try {
        // Cache users if not already cached
        if (userCache.keys().length === 0) {
            await loadAllUsersToCache();
        }

        // Get all users from cache
        const allUsers = userCache.keys().map(key => {
            const { password, ...rest } = userCache.get(key);
            return rest;
        });

        res.json({ success: true, data: allUsers });

    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch users", error: err.message });
    }
});


app.listen(PORT2, () => console.log(`Server is running on PORT ${PORT2}`));
