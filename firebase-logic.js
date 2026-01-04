const firebaseConfig = { databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;

const user = tg.initDataUnsafe.user || { id: "Guest", first_name: "User" };
const uid = user.id;
let userBalance = 0;

// অটোমেটিক ইউজার প্রোফাইল সেটআপ
db.ref('users/' + uid).on('value', snap => {
    const d = snap.val();
    if(!d) {
        db.ref('users/' + uid).set({ balance: 50.00, tasks: 0 });
    } else {
        userBalance = d.balance;
        document.getElementById('balance').innerText = userBalance.toFixed(2);
        document.getElementById('user-id-display').innerText = "@" + (user.username || uid);
        document.getElementById('user-name').innerText = user.first_name;
        document.getElementById('user-initial').innerText = user.first_name[0];
    }
});

function openModal(type) {
    const m = document.getElementById('modal-box');
    const b = document.getElementById('modal-body');
    m.classList.add('active');

    if(type === 'task') {
        db.ref('users/'+uid).once('value', s => {
            let done = s.val().tasks || 0;
            b.innerHTML = `
                <h2 class="text-xl font-bold mb-2">Daily Task (${done}/60)</h2>
                <p class="text-[10px] mb-4 text-gray-400 text-center">নিচের বাটনে ক্লিক করে এডটি ১৫ সেকেন্ড দেখুন।</p>
                <div id="ad-box" onclick="watchAdNow()" class="h-32 bg-blue-900 rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer border-2 border-blue-500">WATCH VIDEO AD</div>
            `;
        });
    } else if(type === 'refer') {
        const refLink = `https://t.me/crashgamepro_bot?start=${uid}`;
        b.innerHTML = `
            <h2 class="text-xl font-bold mb-2 text-yellow-500">Refer & Earn</h2>
            <div class="bg-black p-3 rounded-lg break-all text-[10px] mb-4">${refLink}</div>
            <button onclick="copyRef('${refLink}')" class="w-full bg-yellow-600 py-3 rounded-xl font-bold">COPY LINK</button>
        `;
    } else if(type === 'deposit') {
        b.innerHTML = `<h2 class="text-xl font-bold mb-4 text-blue-400">Deposit</h2>
            <p class="text-xs mb-2">Bkash/Nagad: 01757257580</p>
            <input id="d-amt" type="number" placeholder="Amount" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input id="d-trx" type="text" placeholder="TrxID" class="w-full bg-slate-800 p-3 rounded mb-2 text-xs">
            <input type="file" id="d-ss" class="w-full text-[10px] mb-4">
            <button onclick="alert('Submitted!')" class="w-full bg-blue-600 py-3 rounded-xl font-bold">SUBMIT</button>`;
    } else if(type === 'withdraw') {
        b.innerHTML = `<h2 class="text-xl font-bold mb-4 text-red-500">Withdraw</h2>
            <select class="w-full bg-slate-800 p-3 rounded mb-2"><option>Bkash</option><option>Nagad</option></select>
            <input type="number" placeholder="Number" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input type="number" placeholder="Amount (Min 500)" class="w-full bg-slate-800 p-3 rounded mb-4">
            <button onclick="alert('Request Sent!')" class="w-full bg-red-600 py-3 rounded-xl font-bold">WITHDRAW</button>`;
    } else if(type === 'history') {
        loadMyHistory(b);
    }
}

function watchAdNow() {
    const adLink = "https://otieu.com/4/10315373"; // এখানে আপনার Monetag/Adsterra লিঙ্ক দিন
    window.open(adLink, '_blank'); // এড ওপেন হবে
    
    const box = document.getElementById('ad-box');
    let timer = 15;
    box.onclick = null;
    
    let inter = setInterval(() => {
        timer--;
        box.innerText = `CHECKING AD... ${timer}s`;
        if(timer <= 0) {
            clearInterval(inter);
            finishAdTask();
        }
    }, 1000);
}

function finishAdTask() {
    db.ref('users/' + uid).transaction(u => {
        if(u && (u.tasks || 0) < 60) {
            u.tasks = (u.tasks || 0) + 1;
            u.balance += 0.16;
        }
        return u;
    }, () => { alert("Reward Added!"); openModal('task'); });
}

function copyRef(link) {
    navigator.clipboard.writeText(link);
    alert("Copied to clipboard!");
}
function loadMyHistory(div) {
    db.ref('users/' + uid + '/history').limitToLast(10).once('value', snap => {
        let h = '<h2 class="text-lg font-bold mb-3">Logs</h2>';
        snap.forEach(c => { h += `<div class="flex justify-between border-b border-slate-800 py-2 text-[10px]"><span>${c.val().type}</span><span class="text-${c.val().color}-500">${c.val().msg}</span></div>`; });
        div.innerHTML = h || "No History";
    });
}
function updateBalance(b) { db.ref('users/' + uid).update({ balance: b }); }
function logHistory(type, msg, color) { db.ref('users/' + uid + '/history').push({ type, msg, color }); }
function closeModal() { document.getElementById('modal-box').classList.remove('active'); }
