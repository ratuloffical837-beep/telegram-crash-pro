const admin = require("firebase-admin");
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;

// Private key formatting for Render env
const formatPrivateKey = (key) => {
    if (!key) return undefined;
    return key.replace(/\\n/g, '\n').trim();
};

try {
    const serviceAccount = {
        projectId: "earn-pro-5d8a8",
        clientEmail: "firebase-adminsdk-fbsvc@earn-pro-5d8a8.iam.gserviceaccount.com",
        private_key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com"
    });
    console.log("Firebase Connected!");
} catch (error) {
    console.error("Firebase init error:", error);
}

const db = admin.database();
let gameStatus = "waiting";
let multiplier = 1.00;
let timer = 10;
let roundId = Date.now().toString();
let targetCrash = 2.00;

setInterval(() => {
    try {
        if (gameStatus === "waiting") {
            timer--;
            if (timer <= 0) {
                gameStatus = "flying";
                multiplier = 1.00;
                roundId = Date.now().toString();
                const rnd = Math.random() * 100;
                targetCrash = rnd < 1 ? 1.00 : 1.00 / (1 - rnd / 100);
                console.log(`New round! Crash target: ${targetCrash.toFixed(2)}`);
            }
        } else if (gameStatus === "flying") {
            multiplier += 0.01;
            if (multiplier >= targetCrash) {
                gameStatus = "crashed";
                timer = 8;
                console.log(`Crashed at ${multiplier.toFixed(2)}x`);
            }
        } else if (gameStatus === "crashed") {
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
        }).catch(err => console.error("DB write error:", err));

    } catch (err) {
        console.error("Game loop error:", err);
    }
}, 1000);

app.get('/', (req, res) => res.send("Server Alive!"));
app.listen(port, () => console.log(`Server running on port ${port}`));
