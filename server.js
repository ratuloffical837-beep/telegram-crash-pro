const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/send-telegram', async (req, res) => {
    const { type, user, data } = req.query;
    const msg = `🎰 *REQUEST: ${type}*%0A👤 User: ${user}%0A📄 Data: ${data}`;
    try {
        await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${msg}&parse_mode=Markdown`);
        res.status(200).send("Done");
    } catch (e) {
        res.status(500).send("Err");
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
