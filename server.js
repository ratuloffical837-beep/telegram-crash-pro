const express = require('express');
const admin = require('firebase-admin');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Render Environment Variables থেকে ডাটা লোড করা
const serviceAccount = {
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com/"
});

const db = admin.database();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// গেম লজিক ভেরিয়েবল
let multiplier = 1.00;
let gameStatus = "waiting"; 
let timer = 10;

// গেম লুপ: প্রতি ১০০ মিলিসেকেন্ডে ফায়ারবেস আপডেট হবে
setInterval(async () => {
  if (gameStatus === "waiting") {
    timer -= 0.1;
    if (timer <= 0) {
      gameStatus = "flying";
      multiplier = 1.00;
    }
  } else if (gameStatus === "flying") {
    multiplier += 0.05; 
    if (Math.random() < 0.03) { // ক্রাশ লজিক
      gameStatus = "crashed";
      setTimeout(() => {
        gameStatus = "waiting";
        timer = 10;
        multiplier = 1.00;
      }, 4000); 
    }
  }

  db.ref('game_state').set({
    multiplier: parseFloat(multiplier.toFixed(2)),
    status: gameStatus,
    timer: Math.ceil(timer)
  });
}, 100);

// পেমেন্ট রিকোয়েস্ট হ্যান্ডেলার
app.post('/request', (req, res) => {
  const { type, userId, amount, method, number } = req.body;
  const msg = `🔔 *NEW ${type.toUpperCase()}*\n👤 User: ${userId}\n💰 Amount: ৳${amount}\n📱 Method: ${method}\n🔢 Number: ${number}`;
  
  bot.sendMessage(ADMIN_CHAT_ID, msg, { parse_mode: 'Markdown' });
  res.json({ success: true });
});

// টেলিগ্রাম স্টার্ট কমান্ড
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to Earn Pro Crash! 🚀", {
    reply_markup: {
      inline_keyboard: [[
        { text: "🕹️ Play Now", web_app: { url: process.env.FRONTEND_URL } }
      ]]
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
