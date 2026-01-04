let status = "waiting";
let mult = 1.0;
let myBetValue = 0;
let hasCashedOut = false;

db.ref('gameState').on('value', (snap) => {
    const data = snap.val();
    if(!data) return;
    status = data.status;
    mult = data.multiplier;
    renderGame(data);
});

function renderGame(data) {
    const mDiv = document.getElementById('multiplier');
    const p = document.getElementById('plane');
    const sDiv = document.getElementById('game-status');
    const btn = document.getElementById('main-btn');

    mDiv.innerText = data.multiplier.toFixed(2) + "x";

    if(status === "waiting") {
        sDiv.innerText = `READY IN ${data.timer}s...`;
        p.style.display = "none";
        p.innerHTML = `<img src="https://i.ibb.co/V9m8S9v/plane.png" style="width: 60px;">`;
        mDiv.style.color = "white";
        if(myBetValue === 0) {
            btn.innerText = "PLACE BET";
            btn.className = "w-full bg-green-600 h-16 rounded-2xl font-black text-2xl";
        }
    } else if(status === "flying") {
        sDiv.innerText = "PLANE IS FLYING";
        p.style.display = "block";
        
        // স্মুথ মুভমেন্ট
        let progress = (data.multiplier - 1);
        p.style.left = `${Math.min(10 + (progress * 35), 80)}%`;
        p.style.bottom = `${Math.min(30 + (progress * 25), 75)}%`;
        
        // ধোঁয়া তৈরি
        createSmoke(p.style.left, p.style.bottom);

        if(myBetValue > 0 && !hasCashedOut) {
            let win = (myBetValue * data.multiplier).toFixed(2);
            btn.innerText = `CASHOUT ৳${win}`;
            btn.className = "w-full bg-yellow-500 text-black h-16 rounded-2xl font-black text-2xl animate-pulse";
        }
    } else if(status === "crashed") {
        sDiv.innerText = "💥 CRASHED!";
        mDiv.style.color = "#ff4d4d";
        p.innerHTML = `<span style="font-size: 50px;">💥</span>`;
        if(myBetValue > 0 && !hasCashedOut) {
            logHistory("Crash", `Lost ৳${myBetValue}`, "red");
            myBetValue = 0;
        }
        myBetValue = 0;
        hasCashedOut = false;
    }
}

function createSmoke(l, b) {
    const screen = document.querySelector('.game-screen');
    const s = document.createElement('div');
    s.className = 'smoke';
    s.style.left = l;
    s.style.bottom = b;
    screen.appendChild(s);
    setTimeout(() => s.remove(), 600);
}

function handleGameAction() {
    const amount = parseFloat(document.getElementById('bet-amount').value);
    if(status === "waiting" && myBetValue === 0) {
        if(userBalance >= amount && amount >= 10) {
            myBetValue = amount;
            userBalance -= amount;
            updateBalance(userBalance);
            document.getElementById('main-btn').innerText = "WAITING...";
            document.getElementById('main-btn').className = "w-full bg-gray-700 h-16 rounded-2xl font-black text-2xl";
        } else { alert("Insufficient Balance!"); }
    } else if(status === "flying" && myBetValue > 0 && !hasCashedOut) {
        let winAmt = myBetValue * mult;
        userBalance += winAmt;
        updateBalance(userBalance);
        logHistory("Win", `Won ৳${winAmt.toFixed(2)}`, "green");
        hasCashedOut = true;
        myBetValue = 0;
        document.getElementById('main-btn').innerText = "SUCCESS!";
    }
}
