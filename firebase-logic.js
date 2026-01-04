const firebaseConfig = { databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe.user?.id || "000000";
let userBalance = 0;

// প্রথমবার ঢুকলে ৫০ টাকা বোনাস
db.ref('users/' + userId).on('value', snap => {
    const data = snap.val();
    if (!data) {
        db.ref('users/' + userId).set({ balance: 50.00, tasks: 0 });
    } else {
        userBalance = data.balance;
        document.getElementById('balance').innerText = userBalance.toFixed(2);
        document.getElementById('user-id').innerText = userId;
    }
});

function openPanel(type) {
    document.getElementById('modal-bg').classList.remove('hidden');
    const body = document.getElementById('panel-body');
    
    if (type === 'deposit') {
        body.innerHTML = `
            <h2 class="text-xl font-bold mb-4">Deposit Money</h2>
            <p class="text-xs text-gray-400 mb-2">Send Money to: <b>01757257580</b> (Bkash/Nagad)</p>
            <input id="dep-amt" type="number" placeholder="Amount" class="w-full bg-slate-900 p-3 rounded mb-2">
            <input id="dep-trx" type="text" placeholder="TrxID" class="w-full bg-slate-900 p-3 rounded mb-2">
            <p class="text-[10px] mb-1">Upload Screenshot:</p>
            <input id="dep-file" type="file" class="text-xs mb-4">
            <button onclick="submitDeposit()" class="w-full bg-blue-600 py-3 rounded font-bold">Submit Request</button>
        `;
    } else if (type === 'history') {
        renderHistory(body);
    } else if (type === 'task') {
        renderTasks(body);
    } else if (type === 'withdraw') {
        body.innerHTML = `<h2 class="text-xl font-bold mb-4">Withdraw</h2><input id="w-amt" type="number" placeholder="Amount" class="w-full bg-slate-900 p-3 rounded mb-4"><button onclick="alert('Admin will process soon')" class="w-full bg-red-600 py-3 rounded">Withdraw Now</button>`;
    } else if (type === 'refer') {
        body.innerHTML = `<h2 class="text-xl font-bold mb-2">Refer</h2><p class="text-xs">Your Link: t.me/Bot?start=${userId}</p>`;
    }
}

function renderTasks(body) {
    db.ref('users/' + userId).once('value', snap => {
        let done = snap.val().tasks || 0;
        body.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Daily Tasks</h2>
            <p class="text-xs mb-4">Complete 60 Ads to get ৳10 (${done}/60)</p>
            <div onclick="startAd()" class="bg-indigo-600 p-8 rounded-xl text-center cursor-pointer font-bold">WATCH AD</div>
        `;
    });
}

function startAd() {
    alert("Ad Loading... (Simulation)");
    db.ref('users/' + userId).transaction(u => {
        if (u && (u.tasks || 0) < 60) {
            u.tasks = (u.tasks || 0) + 1;
            u.balance += 0.16; // 60 ads ≈ 10 taka
        }
        return u;
    }, () => openPanel('task'));
}

function submitDeposit() {
    const amt = document.getElementById('dep-amt').value;
    const trx = document.getElementById('dep-trx').value;
    saveHistory("Deposit", `Pending ৳${amt}`, "yellow");
    alert("Request Sent to Admin!");
    closePanel();
}

function renderHistory(body) {
    db.ref('users/' + userId + '/history').limitToLast(10).once('value', snap => {
        let htm = '<h2 class="text-xl font-bold mb-4">History</h2>';
        snap.forEach(c => {
            htm += `<div class="flex justify-between border-b border-slate-700 py-2 text-xs">
                <span>${c.val().type}</span>
                <span class="text-${c.val().color}-500">${c.val().msg}</span>
            </div>`;
        });
        body.innerHTML = htm || "No History";
    });
}

function updateBalance(b) { db.ref('users/' + userId).update({ balance: b }); }
function saveHistory(type, msg, color) { db.ref('users/' + userId + '/history').push({ type, msg, color }); }
function closePanel() { document.getElementById('modal-bg').classList.add('hidden'); }
