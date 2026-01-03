const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');
const app = express();

// Firebase Initialization
// এখানে তোর ডাটাবেস URL টা চেক করে নিবি
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Render automatically uses env variables
        databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com/"
    });
}
const db = admin.database();

let gameState = { status: 'waiting', timer: 10, multiplier: 1.0, crashAt: 2.0 };

// Game Engine
setInterval(async () => {
    try {
        if (gameState.status === 'waiting') {
            gameState.timer--;
            if (gameState.timer <= 0) {
                gameState.status = 'flying';
                gameState.multiplier = 1.0;
                gameState.crashAt = parseFloat((Math.random() * 3 + 1.1).toFixed(2));
            }
        } else if (gameState.status === 'flying') {
            gameState.multiplier += 0.04;
            if (gameState.multiplier >= gameState.crashAt) {
                gameState.status = 'crashed';
                setTimeout(() => { 
                    gameState.status = 'waiting'; 
                    gameState.timer = 10; 
                }, 4000);
            }
        }
        await db.ref('game_state').set(gameState);
    } catch (e) {
        console.error("Firebase Sync Error:", e);
    }
}, 1000);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/notify', async (req, res) => {
    const { msg } = req.query;
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;
    try {
        await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}`);
        res.send("Sent");
    } catch (err) { res.status(500).send("Err"); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
