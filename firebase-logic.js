const firebaseConfig = { databaseURL: "https://earn-pro-5d8a8-default-rtdb.firebaseio.com" };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;

// ইউজার ডেটা সংগ্রহ (টেলিগ্রাম থেকে অটো)
const user = tg.initDataUnsafe.user || { id: "Guest", first_name: "User" };
const uid = user.id;
let userBalance = 0;

document.getElementById('user-id-display').innerText = "@" + (user.username || uid);
document.getElementById('user-name').innerText = user.first_name;
document.getElementById('user-initial').innerText = user.first_name[0];

// একজনের ব্যালেন্স শুধু সেই দেখবে (UID লজিক)
db.ref('users/' + uid).on('value', snap => {
    const d = snap.val();
    if(!d) {
        db.ref('users/' + uid).set({ balance: 50.00, tasks: 0 });
    } else {
        userBalance = d.balance;
        document.getElementById('balance').innerText = userBalance.toFixed(2);
    }
});

function openModal(type) {
    const m = document.getElementById('modal-box');
    const b = document.getElementById('modal-body');
    m.classList.add('active');

    if(type === 'deposit') {
        b.innerHTML = `
            <h2 class="text-xl font-bold mb-4 text-blue-400">Deposit</h2>
            <p class="text-xs text-gray-400 mb-2">Send Money: <b>01757257580</b></p>
            <select id="d-meth" class="w-full bg-slate-800 p-3 rounded mb-2"><option>Bkash</option><option>Nagad</option></select>
            <input id="d-amt" type="number" placeholder="Amount" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input id="d-trx" type="text" placeholder="Transaction ID" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input type="file" accept="image/*" class="w-full text-xs mb-4">
            <button onclick="alert('Sent!')" class="w-full bg-blue-600 py-3 rounded-xl font-bold">SUBMIT</button>
        `;
    } else if(type === 'task') {
        db.ref('users/'+uid).once('value', s => {
            let done = s.val().tasks || 0;
            b.innerHTML = `
                <h2 class="text-xl font-bold mb-2">Daily Task (${done}/60)</h2>
                <div id="ad-box" onclick="startRealAd()" class="h-32 bg-indigo-900 rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer border-2 border-indigo-500">WATCH VIDEO AD</div>
                <p class="text-[10px] mt-2 text-center text-gray-500">প্রতিটি এডের জন্য ১০ পয়েন্ট</p>
            `;
        });
    } else if(type === 'withdraw') {
        b.innerHTML = `
            <h2 class="text-xl font-bold mb-4 text-red-500">Withdraw</h2>
            <input id="w-num" type="number" placeholder="Mobile Number" class="w-full bg-slate-800 p-3 rounded mb-2">
            <input id="w-amt" type="number" placeholder="Min ৳500" class="w-full bg-slate-800 p-3 rounded mb-4">
            <button onclick="alert('Processing...')" class="w-full bg-red-600 py-3 rounded-xl font-bold">WITHDRAW</button>
        `;
    } else if(type === 'history') {
        loadMyHistory(b);
    } else if(type === 'refer') {
        b.innerHTML = `<h2 class="text-xl font-bold mb-2">Refer</h2><p class="text-sm">Link: t.me/bot?start=${uid}</p>`;
    }
}

function startRealAd() {
    const box = document.getElementById('ad-box');
    let timer = 15;
    box.onclick = null; // বারবার ক্লিক বন্ধ
    let inter = setInterval(() => {
        timer--;
        box.innerText = `AD PLAYING... ${timer}s`;
        if(timer <= 0) {
            clearInterval(inter);
            finishAd();
        }
    }, 1000);
}

function finishAd() {
    db.ref('users/' + uid).transaction(u => {
        if(u) {
            u.tasks = (u.tasks || 0) + 1;
            u.balance += 0.16;
        }
        return u;
    }, () => {
        alert("Reward Added!");
        openModal('task');
    });
}

function loadMyHistory(div) {
    db.ref('users/' + uid + '/history').limitToLast(10).once('value', snap => {
        let h = '<h2 class="text-lg font-bold mb-3">My History</h2>';
        snap.forEach(c => {
            h += `<div class="flex justify-between border-b border-slate-800 py-2 text-[10px]">
                <span>${c.val().type}</span><span class="text-${c.val().color}-500">${c.val().msg}</span>
            </div>`;
        });
        div.innerHTML = h || "No History";
    });
}

function updateBalance(b) { db.ref('users/' + uid).update({ balance: b }); }
function logHistory(type, msg, color) { db.ref('users/' + uid + '/history').push({ type, msg, color }); }
function closeModal() { document.getElementById('modal-box').classList.remove('active'); }
