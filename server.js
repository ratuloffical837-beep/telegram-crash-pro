const admin = require("firebase-admin");
const express = require("express");
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Render Environment Variables
const token = process.env.BOT_TOKEN;
const chatId = process.env.ADMIN_CHAT_ID;
const bot = new TelegramBot(token, {polling: false});

// Base64 Private Key Decoder logic
const decodeKey = (base64Key) => {
    try {
        const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
        // কিছু ক্ষেত্রে \n হুবহু টেক্সট হিসেবে থাকে, তাই সেটি রিপ্লেস করা জরুরি
        return decoded.replace(/\\n/g, '\n');
    } catch (err) {
        console.error("Base64 decoding failed:", err);
        return null;
    }
};

const privateKey = decodeKey(process.env.FIREBASE_PRIVATE_KEY);

// Firebase Admin Setup
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
});

const db = admin.database();

// Game Variables
let gameStatus = "waiting"; 
let multiplier = 1.0;
let timer = 10;
let targetCrashPoint = 1.5;

// Main Game Loop
async function gameLoop() {
  if (gameStatus === "waiting") {
    timer--;
    if (timer <= 0) {
      gameStatus = "flying";
      multiplier = 1.0;
      await calculateCrashPoint();
    }
  } else if (gameStatus === "flying") {
    multiplier += 0.05; 
    if (multiplier >= targetCrashPoint) {
      gameStatus = "crashed";
      timer = 5; 
    }
  } else {
    timer--;
    if (timer <= 0) {
      gameStatus = "waiting";
      timer = 10;
    }
  }

  // Update Firebase for all users
  db.ref('gameState').set({
    status: gameStatus,
    multiplier: parseFloat(multiplier.toFixed(2)),
    timer: timer
  });
}

// 20% Profit Logic
async function calculateCrashPoint() {
    const snapshot = await db.ref('currentRoundBets').once('value');
    const bets = snapshot.val() || {};
    let totalBet = 0;
    Object.values(bets).forEach(b => totalBet += b.amount);

    if (totalBet === 0) {
        targetCrashPoint = (Math.random() * 3) + 1.1; 
    } else {
        // Simple logic to ensure house edge
        targetCrashPoint = 1.0 + (Math.random() * 1.2); 
    }
}

setInterval(gameLoop, 1000);

// API Endpoints for Deposit/Withdraw
app.use(express.json());
app.post('/send-deposit', (req, res) => {
    const { message } = req.body;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Earn Pro Server is Live!'));
app.listen(port, () => console.log(`Server is running on port ${port}`));
