const admin = require("firebase-admin");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const formatPrivateKey = (key) => key ? key.replace(/\\n/g, '\n').trim() : undefined;

try {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || "earn-pro-5d8a8",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@earn-pro-5d8a8.iam.gserviceaccount.com",
        private_key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1bdMPmEgHlxPT\nAba7N+6uxU8Cda77yicycqmVOY60x/vmHWv0Avm2C6ikANErDlySN6wkYGpyYyOi\n3rbku+GLCCDiaYiBaDPfqkf3Jquj0SyYgfcLm/xvXjTjzy2u1fAGIy8K4e7pOejZ\nIXQOu3e2SJCHmp8bFVl+ixY+fGE7wPXzOdpat653sXs8mjAJo+a9TDagqcpj2Ofh\numpS0TyGBK0IRhAGIg32HdA0vkcbaJj/AUFL30hxxLaAP1/3liz5es9kGgCcVJ/o\nQK2vrkv596ifC3wJQWJFnbmeqd1S1Vz70Mjn+2D/81C3MrffXfYhbTkwn4Tm8GEJ\nm/a/FLIVAgMBAAECggEAAsPekcrG3O1rB8NrbGALsGM2czmlm0B3UiKtk1DSFs7u\nImbeudR/x3asW8+ICz7H9LyKJZsd6YoO8CZdJZBNfYfNWdYKQWVRVmkrI/OqwwTm\n8pjB0fikeMgNSKQ5idlzM+ITuffmjcHBsD7ScipeRotwPyOBUEbbhdJghOmdYRfn\nC1JyEUMBD/YjzaDP1c1+jEhwIrY7sEOKk/557Q3i11TCiww0qTnROGtNnTm4eRDD\nAkLXw277Uyy/YRbTY5rl7MH5lpKRSXg5Vl8fB7M2HgQDoxGaBhZKXR6I8XjYZK1a\n7O6I65Ut0Ii1ArlPaDoAPz5wg6/ec8XmyPwhxwI1AwKBgQDXg2KWZn/Y0cd/dG1X\nU9zpvOkWVJD36PztfcJHcd5lwRlMQBYuGp+nYbCU62xtZ63bk5+cnHW0bzcpSqyZ\nZT4TTvZjgA8P5iu4/SxtpuFbt1T/2UIOkRXfIx6z+YSGw19UQrYWpv7PsDLx+wZj\nLsRUNL72WY6+xUedslf0En6A/wKBgQDXgzyeCFyol0u8iRibuWjAUNNy31/XsS2x\nSyMWOg+HTbbpZVzaKcC85FfdY2BdqltrnIsdX7ncloEbdFBmWV9E2vDVLL/ApV6P\nid3woKN3A+/EIfNZ/Cs50Er6Mf5fWq9rMk0Y1CmIHZjCqqmgoV+3OFOX2zI6XpFW\n6a0nasO46wKBgDmtzED8hdL9sisGeg0ZQNK94JQ9Zd8z2B2nvstoSmFpYN/rdwQ3\n0+r0VlJE/+v4B6vwwpMjvMzhxx2iAre7RPXd+EuBBob2z1TfTXi7ZS0qz/D5sJg9\ndGEYASuh6Do5J9ZhVGKTpzbmrXvd90OsTJdM1p8QMQgVvKkUBj4ohPr5AoGBANcf\nDwEIg8Vd0KHPj5rSBngBti+yPS9Gkr+oqstjBWEf9/cd0QOMLfHfVL2OlwCoLj1K\ns6qMhTBlo1ZOUnr3txs6GLARzQ51g+Bv0/R/xOvmKA11fj5Scqtw+YapJKr2EKhG\nO6MPFK3kLToTtOK8cpinRvoMOST+hMFm3Aq+jcQlAoGAblVtkTbfbKqQK1JrwD7l\nIAwVgTOPO6z2bY3gjmac+IuTPLPOHk6iYgcB/pLCiv5MZ7lt5SD4fCzq2CevYLTl\noAa3zYjqVnVeAm00/eih0+aq24frOwer5PIPLlXe41wGSzJZC524hAZSf1Lzq2K9\n6qLNsaj7yGBE30gJ75YGNHI=\n-----END PRIVATE KEY-----\n")
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com"
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
            const rnd = Math.random() * 100;
            const crashPoint = rnd < 1 ? 1.00 : 1.00 / (1 - rnd / 100);
            db.ref('gameState').update({ targetCrash: crashPoint });
        }
    } else if (gameStatus === "flying") {
        multiplier += 0.01;
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
