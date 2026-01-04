let currentStatus = "waiting";
let currentMult = 1.0;
let myBet = 0;
let hasCasheout = false;

// Firebase Listeners
db.ref('gameState').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    currentStatus = data.status;
    currentMult = data.multiplier;

    updateUI(data);
});

function updateUI(data) {
    const multDisp = document.getElementById('multiplier');
    const timerDisp = document.getElementById('timer-display');
    const planeCont = document.getElementById('plane-container');
    const mainBtn = document.getElementById('main-btn');

    multDisp.innerText = data.multiplier.toFixed(2) + "x";

    if (data.status === "waiting") {
        timerDisp.innerText = "Next Round: " + data.timer + "s";
        planeCont.style.display = "none";
        multDisp.style.color = "white";
        if (myBet === 0) {
            mainBtn.innerText = "PLACE BET";
            mainBtn.className = "w-full bg-green-600 py-4 rounded-xl font-bold text-xl";
            hasCasheout = false;
        }
    } 
    else if (data.status === "flying") {
        timerDisp.innerText = "LIVE FLYING";
        planeCont.style.display = "block";
        if (myBet > 0 && !hasCasheout) {
            let winAmt = (myBet * data.multiplier).toFixed(2);
            mainBtn.innerText = "CASHOUT ৳" + winAmt;
            mainBtn.className = "w-full bg-yellow-500 py-4 rounded-xl font-bold text-xl text-black btn-pulse";
        }
    } 
    else if (data.status === "crashed") {
        timerDisp.innerText = "CRASHED!";
        multDisp.style.color = "#ef4444";
        planeCont.classList.add('crashed');
        if (myBet > 0 && !hasCasheout) {
            myBet = 0; // Lost
            addHistory("Bet", "Lost", "red");
        }
        myBet = 0;
        setTimeout(() => planeCont.classList.remove('crashed'), 2000);
    }
}

function handleMainButton() {
    const amtInput = document.getElementById('bet-amount');
    const amt = parseFloat(amtInput.value);

    if (currentStatus === "waiting" && myBet === 0) {
        if (amt >= 10 && userBalance >= amt) {
            myBet = amt;
            userBalance -= amt;
            updateBalanceDB(userBalance);
            document.getElementById('main-btn').innerText = "BET PLACED";
            document.getElementById('main-btn').className = "w-full bg-gray-600 py-4 rounded-xl font-bold";
        } else {
            alert("Insufficient Balance or Min ৳10");
        }
    } 
    else if (currentStatus === "flying" && myBet > 0 && !hasCasheout) {
        let win = myBet * currentMult;
        userBalance += win;
        updateBalanceDB(userBalance);
        addHistory("Bet", `Won ৳${win.toFixed(2)}`, "green");
        hasCasheout = true;
        myBet = 0;
        document.getElementById('main-btn').innerText = "SUCCESS!";
        document.getElementById('main-btn').className = "w-full bg-blue-600 py-4 rounded-xl font-bold";
    }
}
