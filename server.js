const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/send-telegram', async (req, res) => {
    const { type, data } = req.query;
    const message = `🔔 *NEW REQUEST*%0A📌 Type: ${type}%0A📄 Details: ${data}`;
    
    try {
        await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${message}&parse_mode=Markdown`);
        res.status(200).send("OK");
    } catch (e) {
        res.status(500).send("Error");
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
