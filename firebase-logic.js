// Firebase Config (Replace with yours)
const firebaseConfig = {
    databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe.user?.id || "654321";
let userBalance = 0;

function showPanel(type) {
    const body = document.getElementById('dynamic-body');
    document.getElementById('modal-overlay').classList.remove('hidden');

    if (type === 'referral') {
        const refLink = `https://t.me/crashgamepro_bot?start=${userId}`;
        body.innerHTML = `
            <h2 class="text-xl font-bold text-yellow-500 mb-4">Refer & Earn</h2>
            <p class="text-sm text-gray-300 mb-4">Invite friends and get ৳2 per friend!</p>
            <input id="refInput" value="${refLink}" class="w-full bg-slate-900 p-3 rounded mb-4 text-xs" readonly>
            <button onclick="copyLink()" class="w-full bg-yellow-600 py-2 rounded">Copy Link</button>
        `;
    } else if (type === 'task') {
        renderTasks();
    } else if (type === 'history') {
        renderHistory();
    } else if (type === 'deposit') {
        body.innerHTML = `<h2>Deposit</h2><p>Send ৳150+ to 017xxxxxxxx (Bkash/Nagad) then msg Admin.</p>`;
    }
}

function renderTasks() {
    db.ref('users/' + userId).once('value', snapshot => {
        const data = snapshot.val();
        const done = data.tasksDone || 0;
        document.getElementById('dynamic-body').innerHTML = `
            <h2 class="text-xl font-bold mb-2 text-blue-400">Daily Task</h2>
            <p class="mb-4">Complete 60 Ads: ${done}/60</p>
            <div id="ad-container" class="h-40 bg-black rounded flex items-center justify-center mb-4 cursor-pointer" onclick="startAd()">
                <span id="ad-text">Click to Watch Ad</span>
            </div>
        `;
    });
}

function startAd() {
    const adText = document.getElementById('ad-text');
    let sec = 10;
    adText.innerText = `Ad Loading... ${sec}s`;
    let interval = setInterval(() => {
        sec--;
        adText.innerText = `Watch Ad... ${sec}s`;
        if (sec <= 0) {
            clearInterval(interval);
            completeTask();
        }
    }, 1000);
}

function completeTask() {
    db.ref('users/' + userId).transaction(user => {
        if (user) {
            if ((user.tasksDone || 0) < 60) {
                user.tasksDone = (user.tasksDone || 0) + 1;
                user.balance += 0.15; // 60 ads = 10 taka
            }
        }
        return user;
    }, () => {
        alert("Ad Complete! ৳0.15 Added.");
        renderTasks();
    });
}

function renderHistory() {
    db.ref('users/' + userId + '/history').limitToLast(10).once('value', snapshot => {
        let html = '<h2 class="text-xl font-bold mb-4">Recent History</h2>';
        snapshot.forEach(child => {
            const h = child.val();
            html += `<div class="flex justify-between border-b border-slate-700 py-2 text-sm">
                <span>${h.type}</span>
                <span class="text-${h.color}-500">${h.msg}</span>
            </div>`;
        });
        document.getElementById('dynamic-body').innerHTML = html;
    });
}

function addHistory(type, msg, color) {
    db.ref('users/' + userId + '/history').push({ type, msg, color, time: Date.now() });
}

function copyLink() {
    const copyText = document.getElementById("refInput");
    copyText.select();
    document.execCommand("copy");
    alert("Link Copied!");
}

function closePanel() { document.getElementById('modal-overlay').classList.add('hidden'); }
