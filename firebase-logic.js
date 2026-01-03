// User Context
const userId = tg.initDataUnsafe.user?.id || "unknown";
const userRef = db.ref('users/' + userId);

// ১. ইউজারের ডেটা চেক বা ক্রিয়েট করা (রেফারেল সহ)
function initializeUser() {
    userRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            // নতুন ইউজার হলে ৩ টাকা বোনাস
            let referrer = new URLSearchParams(window.location.search).get('start');
            userRef.set({
                name: tg.initDataUnsafe.user?.first_name || "Guest",
                balance: 3.00,
                referCount: 0,
                tasksDone: 0,
                lastTaskDate: ""
            });

            // রেফারারকে ২ টাকা বোনাস দেওয়া
            if (referrer) {
                db.ref('users/' + referrer + '/balance').transaction((curr) => (curr || 0) + 2);
                db.ref('users/' + referrer + '/referCount').transaction((curr) => (curr || 0) + 1);
            }
        } else {
            userBalance = snapshot.val().balance;
            updateBalanceUI();
        }
    });
}

// ২. ব্যালেন্স আপডেট ফাংশন
function updateBalanceDB(newBalance) {
    userRef.update({ balance: parseFloat(newBalance.toFixed(2)) });
}

// ৩. ডিপোজিট সাবমিট (টেলিগ্রাম বটে মেসেজ পাঠানো)
async function submitDeposit() {
    const amt = document.getElementById('depAmt').value;
    const num = document.getElementById('depNum').value;
    const fileInput = document.getElementById('depFile');

    if(amt < 150) return alert("Min Deposit ৳150");

    const message = `💰 *New Deposit Request*\n\nUser: ${tg.initDataUnsafe.user?.first_name}\nID: ${userId}\nAmount: ৳${amt}\nNumber: ${num}`;
    
    // Server.js এর মাধ্যমে এটি আপনার টেলিগ্রামে যাবে
    fetch('/send-deposit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message, userId })
    }).then(() => {
        alert("Request Sent! Admin will verify soon.");
        closePanel();
    });
}

// ৪. ডেইলি টাস্ক ভেরিফিকেশন
function completeTask(provider) {
    const today = new Date().toDateString();
    userRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (data.lastTaskDate === today && data.tasksDone >= 40) {
            alert("Daily limit reached! Come back tomorrow.");
        } else {
            // টাস্ক কাউন্ট বাড়ানো এবং ব্যালেন্সে ০.২৫ টাকা যোগ করা (৪০টিতে ১০ টাকা)
            userRef.update({
                tasksDone: (data.tasksDone || 0) + 1,
                lastTaskDate: today,
                balance: data.balance + 0.25
            });
            alert("Task Complete! ৳0.25 added.");
        }
    });
}

// Initialize on Load
initializeUser();

// Realtime Balance Sync
userRef.on('value', (snapshot) => {
    if(snapshot.exists()) {
        userBalance = snapshot.val().balance;
        document.getElementById('balance').innerText = "৳ " + userBalance.toFixed(2);
    }
});
