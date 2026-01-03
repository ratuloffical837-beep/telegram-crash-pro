const admin = require("firebase-admin");
const express = require("express");
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Firebase Admin Setup (Direct Key Usage)
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
});

const db = admin.database();
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: false});

// গেম লুপ এবং বাকি লজিক আগের মতোই থাকবে...
let gameStatus = "waiting"; 
let multiplier = 1.0;
let timer = 10;
let targetCrashPoint = 1.5;

async function gameLoop() {
  if (gameStatus === "waiting") {
    timer--;
    if (timer <= 0) {
      gameStatus = "flying";
      multiplier = 1.0;
      // লজিক অনুযায়ী ক্রাশ পয়েন্ট সেট
      const snapshot = await db.ref('currentRoundBets').once('value');
      const bets = snapshot.val() || {};
      let totalBet = 0;
      Object.values(bets).forEach(b => totalBet += b.amount);
      targetCrashPoint = totalBet === 0 ? (Math.random() * 3) + 1.2 : 1.0 + (Math.random() * 0.8);
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

  db.ref('gameState').set({
    status: gameStatus,
    multiplier: parseFloat(multiplier.toFixed(2)),
    timer: timer
  });
}

setInterval(gameLoop, 1000);

app.use(express.json());
app.post('/send-deposit', (req, res) => {
    bot.sendMessage(process.env.ADMIN_CHAT_ID, req.body.message, { parse_mode: 'Markdown' });
    res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Earn Pro Server is Running Successfully!'));
app.listen(port, () => console.log(`Server is running on port ${port}`));
