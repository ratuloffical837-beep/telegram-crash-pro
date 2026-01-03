const admin = require("firebase-admin");
const express = require("express");
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// ১. ফায়ারবেস প্রাইভেট কি ফরম্যাট করার ফাংশন
const formatPrivateKey = (key) => {
    if (!key) return undefined;
    // এটি কি-র ভেতরের স্পেস এবং ভুল নিউলাইন ঠিক করবে
    return key.replace(/\\n/g, '\n').trim();
};

// ২. ফায়ারবেস অ্যাডমিন সেটআপ
try {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
    });
    console.log("✅ Firebase Connected Successfully!");
} catch (error) {
    console.error("❌ Firebase Initialization Error:", error.message);
}

const db = admin.database();
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: false});

// ৩. গেম লজিক (সব ইউজারের জন্য একই টাইমিং)
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
      
      // ২০% প্রফিট লজিক: বেট থাকলে ক্রাশ পয়েন্ট কম হবে
      const snapshot = await db.ref('currentRoundBets').once('value');
      const bets = snapshot.val() || {};
      let totalBet = 0;
      Object.values(bets).forEach(b => totalBet += b.amount);
      
      // কেউ বেট না ধরলে ১.৫x থেকে ৫.০x পর্যন্ত উরবে
      // বেট থাকলে ১.০x থেকে ১.৯x এর মধ্যে ক্রাশ করবে
      targetCrashPoint = totalBet === 0 ? (Math.random() * 3.5) + 1.5 : 1.0 + (Math.random() * 0.9);
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

  // ফায়ারবেসে গ্লোবাল স্টেট আপডেট
  db.ref('gameState').set({
    status: gameStatus,
    multiplier: parseFloat(multiplier.toFixed(2)),
    timer: timer,
    lastUpdate: Date.now()
  });
}

// প্রতি ১ সেকেন্ডে লুপ চলবে
setInterval(gameLoop, 1000);

// ৪. এপিআই এন্ডপয়েন্ট (ডিপোজিট মেসেজ পাঠানোর জন্য)
app.use(express.json());
app.post('/send-deposit', (req, res) => {
    const { message } = req.body;
    bot.sendMessage(process.env.ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send(`<h1>Earn Pro Server is Running!</h1><p>Current Multiplier: ${multiplier.toFixed(2)}x</p>`);
});

app.listen(port, () => {
    console.log(`🚀 Server is live on port ${port}`);
});
