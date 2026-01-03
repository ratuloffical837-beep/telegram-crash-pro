const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Firebase Admin Setup
if (!admin.apps.length) {
    admin.initializeApp({
        databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com/"
    });
}
const db = admin.database();

// রিয়েল-টাইম গেম লজিক (যাতে সবার জন্য এক থাকে)
let gameState = { status: 'waiting', timer: 10, multiplier: 1.0, crashAt: 2.0 };

function gameLoop() {
    if (gameState.status === 'waiting') {
        gameState.timer--;
        if (gameState.timer <= 0) {
            gameState.status = 'flying';
            gameState.multiplier = 1.0;
            gameState.crashAt = (Math.random() * 4 + 1.1); // ১.১ থেকে ৫ এর মধ্যে ফাটবে
        }
    } else if (gameState.status === 'flying') {
        gameState.multiplier += 0.05;
        if (gameState.multiplier >= gameState.crashAt) {
            gameState.status = 'crashed';
            setTimeout(() => {
                gameState.status = 'waiting';
                gameState.timer = 10;
            }, 3000);
        }
    }
    db.ref('game_state').set(gameState);
}
setInterval(gameLoop, 1000);

app.use(express.static(path.join(__dirname, 'public')));

// টেলিগ্রাম মেসেজ পাঠানোর সিস্টেম
app.get('/send-telegram', async (req, res) => {
    const { type, details } = req.query;
    const text = `🚀 *NEW ${type.toUpperCase()} REQUEST*\n\n${details}`;
    try {
        await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}&parse_mode=Markdown`);
        res.status(200).send("Sent");
    } catch (e) {
        res.status(500).send("Fail");
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(process.env.PORT || 3000);
