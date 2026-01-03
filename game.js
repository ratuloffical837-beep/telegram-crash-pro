// Firebase Configuration (From your data)
const firebaseConfig = {
  apiKey: "AIzaSyBTu-63HAarfY0w2BZYFldwbPAxgIEIm8c",
  authDomain: "earn-pro-5d8a8.firebaseapp.com",
  databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com",
  projectId: "earn-pro-5d8a8",
  storageBucket: "earn-pro-5d8a8.firebasestorage.app",
  appId: "1:1090324824300:web:ce2815eee7837856fee5c9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
tg.expand();

// User Data
let user = tg.initDataUnsafe.user || { id: "12345", first_name: "Tester" };
let userBalance = 0;
let currentBet = 0;
let isBetting = false;

// UI Elements
const balanceEl = document.getElementById('balance');
const multEl = document.getElementById('multiplier');
const betBtn = document.getElementById('betBtn');
const plane = document.getElementById('plane');

// 1. Sync Game State (Server Time Simulation)
// সকল ইউজারের জন্য একই সাথে ডাটাবেস থেকে টাইম আসবে
db.ref('gameState').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.status === "waiting") {
        updateWaitingUI(data.timer);
    } else if (data.status === "flying") {
        startFlyingUI(data.multiplier);
    } else {
        crashUI(data.multiplier);
    }
});

// 2. Betting Logic
betBtn.onclick = () => {
    if (!isBetting) {
        let amount = parseInt(document.getElementById('betInput').value);
        if (amount >= 10 && userBalance >= amount) {
            placeBet(amount);
        } else {
            alert("Insufficient Balance or Min Bet ৳10");
        }
    } else {
        cashOut();
    }
};

function placeBet(amt) {
    currentBet = amt;
    userBalance -= amt;
    updateBalanceDB(userBalance);
    isBetting = true;
    betBtn.innerText = "CASH OUT (x1.00)";
    betBtn.classList.replace('bg-green-600', 'bg-yellow-600');
}

// 3. 20% Profit Logic (House Edge)
// এটি ডাটাবেসে ব্যাকগ্রাউন্ডে চেক করবে: 
// Total Bet vs Total Potential Payout. যখন পেআউট ৮০% ছাড়াবে, তখন প্লেন ক্রাশ করবে।

function openPanel(type) {
    const modal = document.getElementById('modal');
    const body = document.getElementById('modalBody');
    const title = document.getElementById('modalTitle');
    modal.classList.remove('hidden');
    title.innerText = type;

    if (type === 'deposit') {
        body.innerHTML = `
            <div class="bg-gray-800 p-4 rounded-xl">
                <p class="text-sm text-gray-300">বিকাশ/নগদ (Personal):</p>
                <p class="text-xl font-bold text-yellow-500 mb-4">01757257580</p>
                <input id="depAmt" type="number" placeholder="৳ Amount (Min 150)" class="w-full p-3 bg-black rounded-lg mb-2">
                <input id="depNum" type="text" placeholder="Sender Number" class="w-full p-3 bg-black rounded-lg mb-4">
                <p class="text-[10px] mb-2">Upload Screenshot (Proof):</p>
                <input id="depFile" type="file" accept="image/*" class="mb-4">
                <button onclick="submitDeposit()" class="w-full bg-blue-600 py-3 rounded-lg font-bold">Submit Payment</button>
            </div>
        `;
    }

    if (type === 'task') {
        body.innerHTML = `
            <div class="grid grid-cols-1 gap-3">
                <p class="text-center text-xs text-gray-400">প্রতিটি এডে ৫ সেকেন্ড থাকুন। ৪০টি দেখলে ১০ টাকা।</p>
                <button onclick="watchAd('monetag')" class="bg-purple-600 p-4 rounded-xl font-bold">Monetag Ad (20 Left)</button>
                <button onclick="watchAd('adstar')" class="bg-indigo-600 p-4 rounded-xl font-bold">Adsterra Ad (20 Left)</button>
            </div>
        `;
    }
}

// Ad Logic
function watchAd(provider) {
    const link = provider === 'monetag' 
        ? "https://www.effectivegatecpm.com/e0xpfuhe?key=fb81fa455f0ff2d6a8fa09ce5d18dd57" 
        : "https://www.effectivegatecpm.com/e0xpfuhe?key=fb81fa455f0ff2d6a8fa09ce5d18dd57";
    
    window.open(link, '_blank');
    // টাস্ক কাউন্টার এবং ফায়ারবেস আপডেট লজিক এখানে হবে
}

function closePanel() {
    document.getElementById('modal').classList.add('hidden');
            }
