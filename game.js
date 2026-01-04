let status = "waiting";
let multiplier = 1.0;
let myCurrentBet = 0;
let cashedOut = false;

// Firebase Listener for Game State
db.ref('gameState').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    status = data.status;
    multiplier = data.multiplier;
    updateUI(data);
});

function updateUI(data) {
    const multText = document.getElementById('multiplier');
    const timerText = document.getElementById('timer-display');
    const plane = document.getElementById('plane');
    const btn = document.getElementById('main-btn');

    multText.innerText = data.multiplier.toFixed(2) + "x";

    if (data.status === "waiting") {
        timerText.innerText = `NEXT ROUND IN ${data.timer}s`;
        multText.style.color = "white";
        plane.classList.add('hidden');
        if (myCurrentBet === 0) {
            btn.innerText = "Place Bet";
            btn.className = "w-full bg-green-600 py-4 rounded-xl font-bold text-xl uppercase";
            cashedOut = false;
        }
    } else if (data.status === "flying") {
        timerText.innerText = "PLANE IS FLYING";
        plane.classList.remove('hidden');
        movePlane(data.multiplier); // এনিমেশন শুরু
        if (myCurrentBet > 0 && !cashedOut) {
            let profit = (myCurrentBet * data.multiplier).toFixed(2);
            btn.innerText = `Cash Out ৳${profit}`;
            btn.className = "w-full bg-yellow-500 text-black py-4 rounded-xl font-bold text-xl uppercase";
        }
    } else if (data.status === "crashed") {
        timerText.innerText = "CRASHED!";
        multText.style.color = "#ff4444";
        if (myCurrentBet > 0 && !cashedOut) {
            saveHistory("Crash", `Lost ৳${myCurrentBet}`, "red");
            myCurrentBet = 0;
        }
        myCurrentBet = 0;
    }
}

function movePlane(m) {
    const plane = document.getElementById('plane');
    let x = (m - 1) * 30; // মাল্টিপ্লায়ার অনুযায়ী ডানে সরবে
    let y = (m - 1) * 20; // মাল্টিপ্লায়ার অনুযায়ী উপরে উঠবে
    plane.style.left = `${Math.min(x + 10, 70)}%`;
    plane.style.bottom = `${Math.min(y + 20, 60)}%`;
    createSmokeEffect();
}

function createSmokeEffect() {
    const box = document.getElementById('plane-box');
    const plane = document.getElementById('plane');
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    smoke.style.left = plane.style.left;
    smoke.style.bottom = plane.style.bottom;
    box.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1000);
}

function handleMainAction() {
    const amt = parseFloat(document.getElementById('bet-amount').value);
    if (status === "waiting" && myCurrentBet === 0) {
        if (userBalance >= amt && amt >= 10) {
            myCurrentBet = amt;
            userBalance -= amt;
            updateBalance(userBalance);
            document.getElementById('main-btn').innerText = "Bet Placed";
            document.getElementById('main-btn').className = "w-full bg-gray-600 py-4 rounded-xl font-bold text-xl uppercase";
        } else { alert("Insufficient Balance!"); }
    } else if (status === "flying" && myCurrentBet > 0 && !cashedOut) {
        let win = myCurrentBet * multiplier;
        userBalance += win;
        updateBalance(userBalance);
        saveHistory("Win", `Won ৳${win.toFixed(2)}`, "green");
        cashedOut = true;
        myCurrentBet = 0;
        document.getElementById('main-btn').innerText = "Success!";
    }
                }
