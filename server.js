const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const app = express();

// Firebase Admin Setup (তোর JSON ফাইল ডাউনলোড করে এখানে লিঙ্ক করতে পারিস অথবা ডাটাবেস ইউআরএল দিলেই হবে)
const dbUrl = "https://earn-pro-5d8a8-default-rtdb.firebaseio.com/";
admin.initializeApp({ databaseURL: dbUrl });
const db = admin.database();

// রিয়েল-টাইম গেম লুপ (সার্ভার থেকে কন্ট্রোল হবে)
let gameState = { status: 'waiting', timer: 10, multiplier: 1.0 };

function runGame() {
    if(gameState.status === 'waiting') {
        gameState.timer--;
        if(gameState.timer <= 0) {
            gameState.status = 'flying';
            gameState.multiplier = 1.0;
            gameState.crashAt = (Math.random() * 3 + 1.1); // ক্র্যাশ পয়েন্ট জেনারেট
        }
    } else if(gameState.status === 'flying') {
        gameState.multiplier += 0.05;
        if(gameState.multiplier >= gameState.crashAt) {
            gameState.status = 'crashed';
            setTimeout(() => {
                gameState.status = 'waiting';
                gameState.timer = 10;
            }, 3000);
        }
    }
    db.ref('game_state').set(gameState);
}

setInterval(runGame, 1000); // প্রতি সেকেন্ডে আপডেট হবে

app.use(express.static('public'));
app.get('/send-telegram', (req, res) => {
    const { type, data } = req.query;
    axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${process.env.CHAT_ID}&text=${type}: ${data}`);
    res.send("ok");
});

app.listen(process.env.PORT || 3000);
