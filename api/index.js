
require('dotenv').config({ path: '../.env' }); // Adjust path as needed

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Authmodel = require('./authmodel.js'); // Ensure this path is correct
const jwt = require('jsonwebtoken');
const secretKey = process.env.SESSION_SECRET
const PORT2 = process.env.PORT2 || 3003;
const URL1 = process.env.URL1;

const session = require('express-session');

const app = express();
app.use(cors());

app.use(express.json());


// Connect to MongoDB
try {
    mongoose.connect(URL1, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
} catch (err) {
    console.log("Error while connecting to database:", err.message);
}

// Authenticate endpoint
app.post('/authenticate', async (req, res) => {

    const { username, password } = req.body;

    try {
        const user = await Authmodel.findOne({ username, password });

        if (user) {
            const token = jwt.sign(
                { userId: user._id, username: user.username },
                secretKey,
                { expiresIn: '20s' }
            );

            res.json({
                success: true,
                message: "Authentication successful",
                token,
                company: user.company
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
});

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ success: false, message: "No token provided" });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }

        req.user = decoded; // Attach user info to request
        next();
    });
}




// Get all Kaizen entries
app.get('/kaizens', verifyToken, async (req, res) => {
    try {
        const kaizens = await Authmodel.find();
        res.json({ success: true, data: kaizens });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch Kaizen entries", error: err.message });
    }
});



app.listen(PORT2, () => console.log(`Server is running on PORT ${PORT2}`));