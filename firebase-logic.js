const firebaseConfig = { databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe.user?.id || "000000";
let userBalance = 0;

// User initial data load
db.ref('users/' + userId).on('value', snap => {
    const u = snap.val();
    if (!u) {
        db.ref('users/' + userId).set({ balance: 50.00, tasks: 0 });
    } else {
        userBalance = u.balance;
        document.getElementById('balance').innerText = userBalance.toFixed(2);
        document.getElementById('user-id').innerText = userId;
    }
});

function openTab(type) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    modal.classList.add('active');

    if (type === 'deposit') {
        content.innerHTML = `
            <h2 class="text-xl font-bold text-yellow-500 mb-4">Deposit Money</h2>
            <p class="text-[10px] text-gray-400 mb-2">Send Money to: 01757257580 (Bkash/Nagad)</p>
            <select id="dep-method" class="w-full bg-slate-800 p-3 rounded mb-2">
                <option>Bkash Personal</option>
                <option>Nagad Personal</option>
            </select>
            <input id="dep-amt" type="number" placeholder="Amount (৳)" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input id="dep-trx" type="text" placeholder="Transaction ID" class="w-full bg-slate-800 p-3 rounded mb-2">
            <label class="text-xs text-blue-400">Upload Screenshot:</label>
            <input id="dep-ss" type="file" accept="image/*" class="w-full text-xs mt-1 mb-4">
            <button onclick="submitDep()" class="w-full bg-yellow-600 py-3 rounded-xl font-bold">Submit Deposit</button>
        `;
    } else if (type === 'withdraw') {
        content.innerHTML = `
            <h2 class="text-xl font-bold text-red-500 mb-4">Withdraw</h2>
            <select id="w-method" class="w-full bg-slate-800 p-3 rounded mb-2">
                <option>Bkash Personal</option>
                <option>Nagad Personal</option>
            </select>
            <input id="w-num" type="number" placeholder="Account Number" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input id="w-amt" type="number" placeholder="Amount (Min ৳500)" class="w-full bg-slate-800 p-3 rounded mb-4">
            <button onclick="submitWith()" class="w-full bg-red-600 py-3 rounded-xl font-bold">Request Withdraw</button>
        `;
    } else if (type === 'task') {
        db.ref('users/' + userId).once('value', snap => {
            let done = snap.val().tasks || 0;
            content.innerHTML = `
                <h2 class="text-xl font-bold mb-2">Daily Task (60 Ads)</h2>
                <p class="text-xs mb-4">Earn ৳10 by watching ads. (${done}/60)</p>
                <div id="ad-trigger" onclick="runAdSystem()" class="bg-blue-600 h-24 rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer">WATCH VIDEO AD</div>
            `;
        });
    } else if (type === 'history') {
        loadLogs(content);
    }
}

function runAdSystem() {
    const trigger = document.getElementById('ad-trigger');
    let timer = 15;
    trigger.onclick = null;
    trigger.innerText = `Ad Loading... ${timer}s`;
    
    let countdown = setInterval(() => {
        timer--;
        trigger.innerText = `Watching Ad... ${timer}s`;
        if (timer <= 0) {
            clearInterval(countdown);
            completeAd();
        }
    }, 1000);
}

function completeAd() {
    db.ref('users/' + userId).transaction(u => {
        if (u && (u.tasks || 0) < 60) {
            u.tasks = (u.tasks || 0) + 1;
            u.balance += 0.16; // 60 ads ≈ 10 Taka
        }
        return u;
    }, () => {
        alert("Success! Reward added.");
        openTab('task');
    });
}

function submitDep() {
    const amt = document.getElementById('dep-amt').value;
    addHistory("Deposit", `Pending ৳${amt}`, "yellow");
    alert("Deposit request submitted! Wait for admin approval.");
    closeTab();
}

function submitWith() {
    const amt = document.getElementById('w-amt').value;
    if (userBalance >= amt && amt >= 500) {
        userBalance -= amt;
        updateDBBalance(userBalance);
        addHistory("Withdraw", `Pending ৳${amt}`, "red");
        alert("Withdrawal request sent!");
        closeTab();
    } else { alert("Min ৳500 and check balance!"); }
}

function loadLogs(div) {
    db.ref('users/' + userId + '/history').limitToLast(10).once('value', snap => {
        let h = '<h2 class="text-lg font-bold mb-3">Logs</h2>';
        snap.forEach(c => {
            h += `<div class="flex justify-between text-[10px] border-b border-slate-800 py-2">
                <span>${c.val().type}</span>
                <span class="text-${c.val().color}-500">${c.val().msg}</span>
            </div>`;
        });
        div.innerHTML = h || "No history yet.";
    });
}

function updateDBBalance(b) { db.ref('users/' + userId).update({ balance: b }); }
function addHistory(type, msg, color) { db.ref('users/' + userId + '/history').push({ type, msg, color }); }
function closeTab() { document.getElementById('modal').classList.remove('active'); }
