const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!admin.apps.length) {
    admin.initializeApp({ databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com/" });
}
const db = admin.database();

// রিয়েল-টাইম গেম লজিক
let gameState = { status: 'waiting', timer: 10, multiplier: 1.0, crashAt: 2.0 };

function runGame() {
    if (gameState.status === 'waiting') {
        gameState.timer--;
        if (gameState.timer <= 0) {
            gameState.status = 'flying';
            gameState.multiplier = 1.0;
            gameState.crashAt = parseFloat((Math.random() * 4 + 1.1).toFixed(2));
        }
    } else if (gameState.status === 'flying') {
        gameState.multiplier += 0.05;
        if (gameState.multiplier >= gameState.crashAt) {
            gameState.status = 'crashed';
            setTimeout(() => { gameState.status = 'waiting'; gameState.timer = 10; }, 3000);
        }
    }
    db.ref('game_state').set(gameState);
}
setInterval(runGame, 1000);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/notify', async (req, res) => {
    const { type, details } = req.query;
    const text = `🔔 *${type.toUpperCase()} REQUEST*\n\n${details}`;
    try {
        await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}&parse_mode=Markdown`);
        res.send("OK");
    } catch (e) { res.status(500).send("Fail"); }
});

app.listen(process.env.PORT || 10000);
