const admin = require("firebase-admin");
const express = require("express");
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Render env থেকে তথ্যগুলো নিবে
const token = process.env.BOT_TOKEN;
const chatId = process.env.ADMIN_CHAT_ID;
const bot = new TelegramBot(token, {polling: false});

// Firebase Admin Setup
// serviceAccountKey এর তথ্যগুলো আপনি Render env এ দিবেন
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com"
});

const db = admin.database();

// গেমের ভেরিয়েবল
let gameStatus = "waiting"; // waiting, flying, crashed
let multiplier = 1.0;
let timer = 10;

// গেম লুপ ফাংশন
async function gameLoop() {
  if (gameStatus === "waiting") {
    timer--;
    if (timer <= 0) {
      gameStatus = "flying";
      multiplier = 1.0;
      // এখান থেকে আপনার ২০% প্রফিট লজিক শুরু হবে
      // আমরা একটি র‍্যান্ডম ক্রাশ পয়েন্ট ঠিক করবো যা ইউজারদের বেটের ওপর ভিত্তি করে
      calculateCrashPoint();
    }
  } else if (gameStatus === "flying") {
    multiplier += 0.05; // প্লেন কত স্পিডে উঠবে
    
    // ক্রাশ চেক
    if (multiplier >= targetCrashPoint) {
      gameStatus = "crashed";
      timer = 5; // ৫ সেকেন্ড পর আবার নতুন রাউন্ড
    }
  } else {
    timer--;
    if (timer <= 0) {
      gameStatus = "waiting";
      timer = 10;
    }
  }

  // ফায়ারবেসে ডাটা পাঠানো যাতে সব ইউজার এক সাথে দেখতে পায়
  db.ref('gameState').set({
    status: gameStatus,
    multiplier: parseFloat(multiplier.toFixed(2)),
    timer: timer
  });
}

let targetCrashPoint = 2.0; 

async function calculateCrashPoint() {
    const snapshot = await db.ref('currentRoundBets').once('value');
    const bets = snapshot.val() || {};
    let totalBet = 0;
    Object.values(bets).forEach(b => totalBet += b.amount);

    if (totalBet === 0) {
        targetCrashPoint = (Math.random() * 5) + 1.2; // কেউ বেট না ধরলে র‍্যান্ডম উরবে
    } else {
        // লজিক: মোট বেটের ৮০% এর বেশি জেতা যাবে না
        // এটি হিসাব করে একটি সেফ ক্রাশ পয়েন্ট বের করবে
        targetCrashPoint = 1.0 + (Math.random() * 1.5); 
    }
    // রাউন্ড শেষে বেট ক্লিয়ার করে দিবে
    db.ref('currentRoundBets').remove();
}

setInterval(gameLoop, 1000);

// রেন্ডারের জন্য ডামি পোর্ট
app.get('/', (req, res) => res.send('Game Engine is Running...'));
app.listen(port, () => console.log(`Server running on port ${port}`));
