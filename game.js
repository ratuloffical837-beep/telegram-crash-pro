let status = "waiting";
let mult = 1.0;
let myBetValue = 0;
let hasCashedOut = false;

// Real-time server sync
db.ref('gameState').on('value', (snap) => {
    const data = snap.val();
    if(!data) return;

    status = data.status;
    mult = data.multiplier;
    render(data);
});

function render(data) {
    const mDiv = document.getElementById('multiplier');
    const pIcon = document.getElementById('plane');
    const sDiv = document.getElementById('game-status');
    const btn = document.getElementById('main-btn');

    mDiv.innerText = data.multiplier.toFixed(2) + "x";

    if(status === "waiting") {
        sDiv.innerText = `STARTING IN ${data.timer}s...`;
        pIcon.style.display = "none";
        mDiv.style.color = "white";
        if(myBetValue === 0) {
            btn.innerText = "PLACE BET";
            btn.className = "w-full bg-green-600 h-16 rounded-2xl font-black text-2xl";
        }
    } else if(status === "flying") {
        sDiv.innerText = "PLANE IS FLYING";
        pIcon.style.display = "block";
        mDiv.style.color = "#fff";
        
        // ১% স্মুথ মুভমেন্ট লজিক
        let progress = (data.multiplier - 1);
        pIcon.style.left = `${Math.min(10 + (progress * 30), 75)}%`;
        pIcon.style.bottom = `${Math.min(30 + (progress * 20), 70)}%`;
        
        spawnSmoke(pIcon.style.left, pIcon.style.bottom);

        if(myBetValue > 0 && !hasCashedOut) {
            let win = (myBetValue * data.multiplier).toFixed(2);
            btn.innerText = `CASHOUT ৳${win}`;
            btn.className = "w-full bg-yellow-500 text-black h-16 rounded-2xl font-black text-2xl";
        }
    } else if(status === "crashed") {
        sDiv.innerText = "💥 CRASHED!";
        mDiv.style.color = "#ff4d4d";
        pIcon.innerText = "💥";
        setTimeout(() => { pIcon.innerText = "✈️"; }, 1500);
        if(myBetValue > 0 && !hasCashedOut) {
            logHistory("Crash", `Lost ৳${myBetValue}`, "red");
            myBetValue = 0;
        }
        myBetValue = 0;
        hasCashedOut = false;
    }
}

function spawnSmoke(l, b) {
    const screen = document.querySelector('.game-screen');
    const s = document.createElement('div');
    s.className = 'smoke';
    s.style.left = l;
    s.style.bottom = b;
    screen.appendChild(s);
    setTimeout(() => s.remove(), 700);
}

function handleGameAction() {
    const amount = parseFloat(document.getElementById('bet-amount').value);
    if(status === "waiting" && myBetValue === 0) {
        if(userBalance >= amount && amount >= 10) {
            myBetValue = amount;
            userBalance -= amount;
            updateBalance(userBalance);
            document.getElementById('main-btn').innerText = "BET PLACED";
            document.getElementById('main-btn').className = "w-full bg-gray-700 h-16 rounded-2xl font-black text-2xl";
        } else { alert("ব্যালেন্স নেই!"); }
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
