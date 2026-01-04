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
        btn.innerText = "PLACE BET";
        btn.className = "w-full bg-green-600 h-16 rounded-2xl font-black text-2xl";
        hasBet = false;
        hasCashed = false;
        myBet = 0;
    } else if (status === "flying") {
        statusDiv.innerText = "PLANE FLYING 🚀";
        plane.style.display = "block";
        explosion.classList.add("hidden");

        let progress = data.multiplier - 1;
        plane.style.left = `${10 + progress * 30}%`;
        plane.style.bottom = `${30 + progress * 20}%`;

        createSmoke(plane.style.left, plane.style.bottom);

        if (hasBet && !hasCashed) {
            let potential = (myBet * data.multiplier).toFixed(2);
            btn.innerText = `CASHOUT ৳${potential}`;
            btn.className = "w-full bg-yellow-500 text-black h-16 rounded-2xl font-black text-2xl btn-pulse";
        }
    } else if (status === "crashed") {
        statusDiv.innerText = `CRASHED @ ${data.multiplier.toFixed(2)}x 💥`;
        mDiv.style.color = "#ef4444";
        plane.style.display = "none";
        explosion.classList.remove("hidden");
        if (hasBet && !hasCashed) {
            updateBalance(-myBet);
            logRound(false, -myBet, data.multiplier.toFixed(2));
        }
        myBet = 0;
        hasBet = false;
        hasCashed = false;
    }
}

function createSmoke(l, b) {
    const screen = document.querySelector('.game-screen');
    const s = document.createElement('div');
    s.className = 'smoke';
    s.style.left = parseFloat(l) - 5 + "%";
    s.style.bottom = parseFloat(b) + 10 + "px";
    screen.appendChild(s);
    setTimeout(() => s.remove(), 1000);
}

function handleGameAction() {
    const amount = parseFloat(document.getElementById('bet-amount').value);
    if (status === "waiting" && !hasBet) {
        if (userBalance >= amount && amount >= 10) {
            myBet = amount;
            hasBet = true;
            updateBalance(-amount);
            btn.innerText = "BET PLACED";
            db.ref(`rounds/\( {currentRound}/bets/ \){uid}`).set({ amount, cashoutAt: null });
        } else {
            alert("Insufficient balance or min 10৳");
        }
    } else if (status === "flying" && hasBet && !hasCashed) {
        hasCashed = true;
        let winAmt = myBet * mult;
        updateBalance(winAmt);
        logRound(true, winAmt, mult.toFixed(2));
        db.ref(`rounds/\( {currentRound}/bets/ \){uid}`).update({ cashoutAt: mult });
        btn.innerText = "CASHED OUT!";
    }
}

document.getElementById('main-btn').onclick = handleGameAction;

function openModal(type) {
    const modal = document.getElementById('modal-box');
    const body = document.getElementById('modal-body');
    modal.classList.add('active');

    if (type === 'deposit') {
        body.innerHTML = `<h2 class="text-xl font-bold mb-4 text-blue-400">Deposit</h2>
            <p class="text-xs mb-2">Bkash/Nagad: 01757257580</p>
            <input id="d-amt" type="number" placeholder="Amount" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input id="d-trx" type="text" placeholder="TrxID" class="w-full bg-slate-800 p-3 rounded mb-2 text-xs">
            <input type="file" id="d-ss" class="w-full text-[10px] mb-4">
            <button onclick="alert('Submitted!')" class="w-full bg-blue-600 py-3 rounded-xl font-bold">SUBMIT</button>`;
    } else if (type === 'withdraw') {
        body.innerHTML = `<h2 class="text-xl font-bold mb-4 text-red-500">Withdraw</h2>
            <select class="w-full bg-slate-800 p-3 rounded mb-2"><option>Bkash</option><option>Nagad</option></select>
            <input type="number" placeholder="Number" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input type="number" placeholder="Amount (Min 500)" class="w-full bg-slate-800 p-3 rounded mb-4">
            <button onclick="alert('Request Sent!')" class="w-full bg-red-600 py-3 rounded-xl font-bold">WITHDRAW</button>`;
    } else if (type === 'task') {
        db.ref('users/' + uid + '/tasks').once('value', s => {
            let done = s.val() || 0;
            body.innerHTML = `
                <h2 class="text-xl font-bold mb-2">Daily Tasks (${done}/60)</h2>
                <p class="text-xs mb-4">৬০টি এড দেখলে ১০৳ পাবেন</p>
                <div id="ad-box" onclick="watchAd()" class="h-32 bg-blue-900 rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer">WATCH AD</div>
                <p class="text-xs mt-2 text-gray-400">Progress: ${done}/60</p>
            `;
        });
    } else if (type === 'refer') {
        const link = `https://t.me/yourbotname?start=ref_${uid}`;
        body.innerHTML = `
            <h2 class="text-xl font-bold mb-2 text-yellow-500">Refer & Earn ২৳</h2>
            <div class="bg-black p-3 rounded-lg break-all text-xs mb-4">${link}</div>
            <button onclick="navigator.clipboard.writeText('${link}'); alert('Copied!')" class="w-full bg-yellow-600 py-3 rounded-xl font-bold">COPY</button>
        `;
    } else if (type === 'history') {
        body.innerHTML = `
            <div class="flex gap-2 mb-4">
                <button onclick="loadMyHistory()" class="bg-slate-700 px-4 py-2 rounded">My History</button>
                <button onclick="loadTop10()" class="bg-slate-700 px-4 py-2 rounded">Top 10 Winners</button>
            </div>
            <div id="history-content"></div>
        `;
        loadMyHistory();
    }
}

function watchAd() {
    const link = adLinks[adIndex % 2];
    adIndex++;
    window.open(link, '_blank');
    const box = document.getElementById('ad-box');
    box.onclick = null;
    box.innerText = "Checking... 15s";
    let t = 15;
    const int = setInterval(() => {
        t--;
        box.innerText = `Checking... ${t}s`;
        if (t <= 0) {
            clearInterval(int);
            db.ref('users/' + uid).transaction(u => {
                if (u && (u.tasks || 0) < 60) {
                    u.tasks = (u.tasks || 0) + 1;
                    u.balance += 10 / 60;
                }
                return u;
            });
            alert("০.১৭৳ Added!");
            openModal('task');
        }
    }, 1000);
}

function loadMyHistory() {
    const cont = document.getElementById('history-content');
    db.ref('users/' + uid + '/history').limitToLast(20).once('value', snap => {
        let html = '<h3 class="font-bold mb-2">My Bets</h3>';
        let wins = 0, losses = 0;
        snap.forEach(child => {
            const v = child.val();
            html += `<div class="flex justify-between py-1 text-xs"><span>\( {v.type}</span><span class="text- \){v.color}-500">${v.msg}</span></div>`;
            if (v.type === "Win") wins++; else losses++;
        });
        html += `<p class="mt-4 text-xs">Wins: ${wins} | Losses: ${losses}</p>`;
        cont.innerHTML = html;
    });
}

function loadTop10() {
    const cont = document.getElementById('history-content');
    cont.innerHTML = '<h3 class="font-bold mb-2">Top 10 Winners</h3><div class="text-xs">Loading...</div>';
    db.ref('globalLeaderboard').orderByChild('profit').limitToLast(10).once('value', snap => {
        let html = '';
        let rank = 1;
        snap.forEach(child => {
            const v = child.val();
            html = `<div class="flex justify-between py-1"><span>${rank++}. \( {v.name}</span><span class="text-green-500">+৳ \){v.profit.toFixed(2)} @ ${v.multiplier}x</span></div>` + html;
        });
        cont.innerHTML = '<h3 class="font-bold mb-2">Top 10 Winners</h3>' + (html || "No data yet");
    });
}

function closeModal() { document.getElementById('modal-box').classList.remove('active'); }
