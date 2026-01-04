const admin = require("firebase-admin");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const formatPrivateKey = (key) => key ? key.replace(/\\n/g, '\n').trim() : undefined;

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
    console.log("Firebase Connected!");
} catch (e) { console.error(e); }

const db = admin.database();

let gameStatus = "waiting";
let multiplier = 1.00;
let timer = 10;
let roundId = Date.now().toString();

async function gameLoop() {
    if (gameStatus === "waiting") {
        timer--;
        if (timer <= 0) {
            gameStatus = "flying";
            multiplier = 1.00;
            roundId = Date.now().toString();
            // Fair crash point (standard ~1% house edge)
            const rnd = Math.random() * 100;
            const crashPoint = rnd < 1 ? 1.00 : 1.00 / (1 - rnd / 100); // can go very high
            db.ref('gameState').update({ targetCrash: crashPoint }); // hidden
        }
    } else if (gameStatus === "flying") {
        multiplier += 0.01; // slower & smoother
        const target = (await db.ref('gameState/targetCrash').once('value')).val();
        if (multiplier >= target) {
            gameStatus = "crashed";
            timer = 8;
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
        timer: timer,
        roundId: roundId,
        lastUpdate: Date.now()
    });
}

setInterval(gameLoop, 100);

app.get('/', (req, res) => res.send("Server Running"));
app.listen(port, () => console.log(`Server on ${port}`));
