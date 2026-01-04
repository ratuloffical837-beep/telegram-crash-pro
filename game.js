let gameStatus = "waiting";
let currentMultiplier = 1.0;
let myBet = 0;
let isCashedOut = false;

// Firebase listener for real-time game state
db.ref('gameState').on('value', (snap) => {
    const data = snap.val();
    if (!data) return;
    
    gameStatus = data.status;
    currentMultiplier = data.multiplier;
    renderGame(data);
});

function renderGame(data) {
    const multDiv = document.getElementById('multiplier');
    const plane = document.getElementById('plane');
    const statusDiv = document.getElementById('status-text');
    const btn = document.getElementById('main-btn');

    multDiv.innerText = data.multiplier.toFixed(2) + "x";

    if (data.status === "waiting") {
        statusDiv.innerText = `NEXT ROUND IN ${data.timer}s`;
        plane.style.display = "none";
        multDiv.style.color = "white";
        if (myBet === 0) {
            btn.innerText = "PLACE BET";
            btn.className = "w-full bg-green-600 py-4 rounded-xl font-bold text-xl";
            isCashedOut = false;
        }
    } else if (data.status === "flying") {
        statusDiv.innerText = "PLANE IS FLYING";
        plane.style.display = "block";
        // স্মুথ মুভমেন্ট লজিক (১% করে)
        let x = (data.multiplier - 1) * 25;
        let y = (data.multiplier - 1) * 15;
        plane.style.left = `${Math.min(10 + x, 80)}%`;
        plane.style.bottom = `${Math.min(20 + y, 70)}%`;
        
        createSmoke(); // ধোঁয়া ছাড়ার ফাংশন

        if (myBet > 0 && !isCashedOut) {
            let profit = (myBet * data.multiplier).toFixed(2);
            btn.innerText = `CASHOUT ৳${profit}`;
            btn.className = "w-full bg-yellow-500 text-black py-4 rounded-xl font-bold text-xl animate-pulse";
        }
    } else if (data.status === "crashed") {
        statusDiv.innerText = "💥 PLANE BUSTED!";
        multDiv.style.color = "#ff4d4d";
        plane.innerText = "💥";
        setTimeout(() => { plane.innerText = "✈️"; }, 2000);
        if (myBet > 0 && !isCashedOut) {
            addHistory("Game", `Lost ৳${myBet}`, "red");
            myBet = 0;
        }
        myBet = 0;
    }
}

function createSmoke() {
    const area = document.getElementById('plane-area');
    const plane = document.getElementById('plane');
    const s = document.createElement('div');
    s.className = 'smoke';
    s.style.left = plane.style.left;
    s.style.bottom = plane.style.bottom;
    area.appendChild(s);
    setTimeout(() => s.remove(), 800);
}

function handleAction() {
    const amt = parseFloat(document.getElementById('bet-amount').value);
    if (gameStatus === "waiting" && myBet === 0) {
        if (userBalance >= amt && amt >= 10) {
            myBet = amt;
            userBalance -= amt;
            updateDBBalance(userBalance);
            document.getElementById('main-btn').innerText = "WAITING...";
            document.getElementById('main-btn').className = "w-full bg-slate-700 py-4 rounded-xl font-bold text-xl";
        } else { alert("Balance low!"); }
    } else if (gameStatus === "flying" && myBet > 0 && !isCashedOut) {
        let win = myBet * currentMultiplier;
        userBalance += win;
        updateDBBalance(userBalance);
        addHistory("Game", `Won ৳${win.toFixed(2)}`, "green");
        isCashedOut = true;
        myBet = 0;
        document.getElementById('main-btn').innerText = "SUCCESS!";
    }
        }
