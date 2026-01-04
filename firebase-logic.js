const firebaseConfig = {
  apiKey: "AIzaSyBTu-63HAarfY0w2BZYFldwbPAxgIEIm8c",
  authDomain: "earn-pro-5d8a8.firebaseapp.com",
  projectId: "earn-pro-5d8a8",
  storageBucket: "earn-pro-5d8a8.firebasestorage.app",
  messagingSenderId: "1090324824300",
  appId: "1:1090324824300:web:ce2815eee7837856fee5c9",
  measurementId: "G-6817R7G4YH",
  databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;

const user = tg.initDataUnsafe.user || { id: 888888, first_name: "Player" };
const uid = user.id.toString();
let userBalance = 0;

db.ref('users/' + uid).on('value', snap => {
    let d = snap.val() || {};
    if (!snap.exists()) {
        db.ref('users/' + uid).set({ balance: 0.00, tasks: 0, wins: 0, losses: 0 });
    } else {
        userBalance = d.balance || 0;
        document.getElementById('balance').innerText = userBalance.toFixed(2);
        document.getElementById('user-name').innerText = user.first_name;
        document.getElementById('user-id-display').innerText = "@" + (user.username || uid);
        document.getElementById('user-initial').innerText = user.first_name[0].toUpperCase();
    }
});

function updateBalance(amount) {
    db.ref('users/' + uid + '/balance').transaction(b => (b || 0) + amount);
}

function logRound(win, amount, multiplier) {
    const type = win ? "Win" : "Loss";
    const color = win ? "green" : "red";
    db.ref('users/' + uid + '/history').push({ type, msg: `${win ? "Won" : "Lost"} ৳${Math.abs(amount).toFixed(2)} @ ${multiplier}x`, color, time: Date.now() });
    if (win) {
        db.ref('globalLeaderboard').push({ uid, name: user.first_name, profit: amount, multiplier, time: Date.now() });
    }
      }
