const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const path = require('path');
const app = express();

// এনভায়রনমেন্ট ভেরিয়েবল থেকে টোকেন নেওয়া
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Firebase initialization
if (!admin.apps.length) {
    admin.initializeApp({
        databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com/"
    });
}
const db = admin.database();

// গেমের স্টেট - এটা সার্ভারে থাকবে যাতে সবাই একই টাইম দেখে
let gameState = { 
    status: 'waiting', 
    timer: 10, 
    multiplier: 1.0, 
    crashAt: 2.0 
};

// গেম লুপ (সবার জন্য এক সাথে চলবে)
function runGameLogic() {
    if (gameState.status === 'waiting') {
        gameState.timer--;
        if (gameState.timer <= 0) {
            gameState.status = 'flying';
            gameState.multiplier = 1.0;
            // র‍্যান্ডম ক্রাশ পয়েন্ট (১.১০ থেকে ৫.০০ পর্যন্ত)
            gameState.crashAt = parseFloat((Math.random() * (5.0 - 1.1) + 1.1).toFixed(2));
        }
    } else if (gameState.status === 'flying') {
        gameState.multiplier += 0.05;
        if (gameState.multiplier >= gameState.crashAt) {
            gameState.status = 'crashed';
            setTimeout(() => {
                gameState.status = 'waiting';
                gameState.timer = 10;
            }, 3000); // ৩ সেকেন্ড বিরতি
        }
    }
    // ডাটাবেসে আপডেট করা যাতে ইউজার দেখতে পায়
    db.ref('game_state').set(gameState);
}

setInterval(runGameLogic, 1000);

app.use(express.static(path.join(__dirname, 'public')));

// টেলিগ্রাম রিকোয়েস্ট হ্যান্ডলার (ডিপোজিট/উইথড্রর জন্য)
app.get('/send-telegram', async (req, res) => {
    const { type, details } = req.query;
    const message = `🔔 *${type.toUpperCase()} REQUEST*\n\n${details}`;
    
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await axios.get(url, {
            params: {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            }
        });
        res.status(200).send("Success");
    } catch (error) {
        console.error("Telegram Error:", error);
        res.status(500).send("Error sending to Telegram");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
