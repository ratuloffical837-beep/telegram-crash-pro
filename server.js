const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(express.static(path.join(__dirname, 'public')));

// টেলিগ্রাম মেসেজ পাঠানোর রুট
app.get('/send-telegram', async (req, res) => {
    const { type, user, data } = req.query;
    const message = `📢 *NEW ${type.toUpperCase()} REQUEST*%0A👤 User: ${user}%0A📝 Details:%0A${data}`;
    
    try {
        await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${message}&parse_mode=Markdown`);
        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
