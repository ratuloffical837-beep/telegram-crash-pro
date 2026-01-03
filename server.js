const express = require('express');
const admin = require('firebase-admin');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Base64 থেকে Private Key ডিকোড করা
const decodedKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8');

const serviceAccount = {
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key": decodedKey.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: true});
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// গেম লজিক
let multiplier = 1.00;
let gameStatus = "waiting"; 
let timer = 10;

setInterval(async () => {
  if (gameStatus === "waiting") {
    timer -= 0.1;
    if (timer <= 0) { gameStatus = "flying"; multiplier = 1.00; }
  } else if (gameStatus === "flying") {
    multiplier += 0.05; 
    if (Math.random() < 0.03) {
      gameStatus = "crashed";
      setTimeout(() => { gameStatus = "waiting"; timer = 10; multiplier = 1.00; }, 4000); 
    }
  }
  db.ref('game_state').set({
    multiplier: parseFloat(multiplier.toFixed(2)),
    status: gameStatus,
    timer: Math.ceil(timer)
  });
}, 100);

app.post('/request', (req, res) => {
  const { type, userId, amount, method, number } = req.body;
  const msg = `🔔 *NEW ${type.toUpperCase()}*\n👤 User: ${userId}\n💰 Amount: ৳${amount}\n📱 Method: ${method}\n🔢 Number: ${number}`;
  bot.sendMessage(ADMIN_CHAT_ID, msg, { parse_mode: 'Markdown' });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
