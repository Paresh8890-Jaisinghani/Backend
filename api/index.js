const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Authmodel = require('./authmodel.js'); // Ensure this path is correct
const PORT2 = process.env.PORT2 || 3003;
const URL1 = "mongodb+srv://ce21btech11031:nXJLf1WSAOywUoI2@cluster0.dpct2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" || process.env.URL1

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
            // Update the company field in the database
            const updatedUser = await Authmodel.findByIdAndUpdate(
                user._id,
                { company: user.company }, // Keep the company field as it is in the database
                { new: true } // Return the updated document
            );

            console.log("Updated company:", updatedUser.company);
            res.json({ success: true, message: "Authentication successful", company: updatedUser.company });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
});


// Get all Kaizen entries
app.get('/kaizens', async (req, res) => {
    try {
        const kaizens = await Authmodel.find(); // Adjust the model if `Authmodel` is not for Kaizens
        res.json({ success: true, data: kaizens });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch Kaizen entries", error: err.message });
    }
});

// Start server

app.listen(PORT2, () => console.log(`Server is running on PORT ${PORT2}`));