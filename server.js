const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    try {
        new URL(targetUrl);
    } catch (_) {
        return res.status(400).send('Invalid URL format');
    }

    try {
        const cacheBusterUrl = `${targetUrl}?nocache=${new Date().getTime()}`;
        const response = await axios.get(cacheBusterUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
            },
            proxy: false
        });
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching the URL');
    }
});

app.listen(port, () => {
    console.log(`Proxy server is running on http://localhost:${port}`);
});

module.exports = app;