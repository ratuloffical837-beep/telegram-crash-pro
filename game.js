let status = "waiting";
let mult = 1.00;
let myBet = 0;
let hasBet = false;
let hasCashed = false;
let currentRound = Date.now().toString();

const adLinks = [
    "https://www.effectivegatecpm.com/e0xpfuhe?key=fb81fa455f0ff2d6a8fa09ce5d18dd57",
    "https://otieu.com/4/10315373"
];
let adIndex = 0;

db.ref('gameState').on('value', snap => {
    const data = snap.val();
    if (!data) return;
    status = data.status;
    mult = data.multiplier;
    currentRound = data.roundId || currentRound;
    renderGame(data);
});

function renderGame(data) {
    const mDiv = document.getElementById('multiplier');
    const plane = document.getElementById('plane');
    const explosion = document.getElementById('explosion');
    const statusDiv = document.getElementById('game-status');
    const btn = document.getElementById('main-btn');

    mDiv.innerText = data.multiplier.toFixed(2) + "x";

    if (status === "waiting") {
        statusDiv.innerText = `READY IN ${data.timer}s`;
        plane.style.display = "none";
        explosion.classList.add("hidden");
        mDiv.style.color = "white";
        if(!hasBet) {
            btn.innerText = "PLACE BET";
            btn.className = "w-full bg-green-600 h-16 rounded-2xl font-black text-2xl active:scale-95";
        }
        hasCashed = false;
    } else if (status === "flying") {
        statusDiv.innerText = "PLANE FLYING 🚀";
        plane.style.display = "block";
        explosion.classList.add("hidden");

        let progress = (data.multiplier - 1) * 15; 
        plane.style.left = `${Math.min(10 + progress, 80)}%`;
        plane.style.bottom = `${Math.min(30 + progress, 70)}%`;

        if (hasBet && !hasCashed) {
            let potential = (myBet * data.multiplier).toFixed(2);
            btn.innerText = `CASHOUT ৳${potential}`;
            btn.className = "w-full bg-yellow-500 text-black h-16 rounded-2xl font-black text-2xl pulse-anim";
        }
    } else if (status === "crashed") {
        statusDiv.innerText = `CRASHED @ ${data.multiplier.toFixed(2)}x 💥`;
        mDiv.style.color = "#ef4444";
        plane.style.display = "none";
        explosion.classList.remove("hidden");
        
        if (hasBet && !hasCashed) {
            logRound(false, -myBet, data.multiplier.toFixed(2));
            hasBet = false;
        }
        myBet = 0;
        hasBet = false;
    }
}

document.getElementById('main-btn').onclick = () => {
    const btn = document.getElementById('main-btn');
    const amount = parseFloat(document.getElementById('bet-amount').value);

    if (status === "waiting" && !hasBet) {
        if (userBalance >= amount && amount >= 10) {
            myBet = amount;
            hasBet = true;
            updateBalance(-amount);
            btn.innerText = "BET PLACED";
            btn.className = "w-full bg-slate-600 h-16 rounded-2xl font-black text-2xl";
            db.ref(`rounds/${currentRound}/bets/${uid}`).set({ amount, cashoutAt: null });
        } else {
            alert("কমপক্ষে ১০৳ দরকার!");
        }
    } else if (status === "flying" && hasBet && !hasCashed) {
        hasCashed = true;
        let winAmt = myBet * mult;
        updateBalance(winAmt);
        logRound(true, winAmt, mult.toFixed(2));
        db.ref(`rounds/${currentRound}/bets/${uid}`).update({ cashoutAt: mult });
        btn.innerText = "CASHED OUT!";
        btn.className = "w-full bg-blue-600 h-16 rounded-2xl font-black text-2xl";
        hasBet = false;
    }
};

// Modal functions
function openModal(type) {
    const modal = document.getElementById('modal-box');
    const body = document.getElementById('modal-body');
    modal.classList.add('active');
    // ... (rest of your existing modal logic is fine, just ensure backticks for template strings)
    if(type === 'task') {
        db.ref('users/' + uid + '/tasks').once('value', s => {
            let done = s.val() || 0;
            body.innerHTML = `<h2 class="text-xl font-bold mb-2">Daily Tasks (${done}/60)</h2><div id="ad-box" onclick="watchAd()" class="h-32 bg-blue-900 rounded-2xl flex items-center justify-center font-bold cursor-pointer">WATCH AD</div>`;
        });
    }
}
function closeModal() { document.getElementById('modal-box').classList.remove('active'); }
