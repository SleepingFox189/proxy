const express = require('express');
const axios = require('axios');
const cors = require('cors');
const compression = require('compression');
const NodeCache = require('node-cache');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Initialize cache
const cache = new NodeCache({ stdTTL: 100, checkperiod: 120 });

// In-memory store for tracking users online
const usersOnline = new Map();

app.use(cors());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    const targetUrl = req.query.url;
    const userName = req.query.name;

    if (!targetUrl) {
        return res.status(400).send('URL is required');
    }

    if (userName) {
        usersOnline.set(req.ip + userName, userName);
    }

    try {
        new URL(targetUrl);
    } catch (_) {
        return res.status(400).send('Invalid URL format');
    }

    // Send message to Discord webhook
    const webhookUrl = 'https://canary.discord.com/api/webhooks/1269411161250594836/NHgXa5wC5sCjMnZXOrwb9_pe5JAq4eIZwV9r4VJ7z3yP2ILrH1o8tHGk1hYMU1akqT9A';
    const message = {
        content: `${userName} is visiting ${targetUrl}`
    };
    await axios.post(webhookUrl, message);

    // Check cache
    const cachedResponse = cache.get(targetUrl);
    if (cachedResponse) {
        return res.send(cachedResponse);
    }

    try {
        const cacheBusterUrl = `${targetUrl}?nocache=${new Date().getTime()}`;
        const response = await axios.get(cacheBusterUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1',
                ...req.headers // Forward all request headers
            },
            responseType: 'arraybuffer' // Handle different content types
        });

        // Forward all response headers
        Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
        });

        // Cache the response
        cache.set(targetUrl, response.data);

        res.send(response.data);
    } catch (error) {
        console.error(error);
        if (error.response) {
            res.status(error.response.status).send(error.response.statusText);
        } else {
            res.status(500).send('Error fetching the URL');
        }
    }
});

// Middleware to track users online
app.use((req, res, next) => {
    const userName = req.query.name;
    if (userName) {
        usersOnline.set(req.ip + userName, userName);
    }
    next();
});

// Admin route to show users online
app.get('/admin', (req, res) => {
    res.send(`
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(to right, #ff7e5f, #feb47b);
                color: white;
                text-align: center;
                padding: 50px;
            }
            h1 {
                font-size: 2.5em;
            }
            form {
                margin: 20px auto;
                padding: 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                width: 300px;
            }
            input[type="password"] {
                padding: 10px;
                margin: 10px 0;
                width: 100%;
                border: none;
                border-radius: 5px;
            }
            button {
                padding: 10px;
                width: 100%;
                border: none;
                border-radius: 5px;
                background: #ff7e5f;
                color: white;
                font-size: 1em;
                cursor: pointer;
            }
            ul {
                list-style: none;
                padding: 0;
            }
            li {
                background: rgba(255, 255, 255, 0.1);
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
            }
        </style>
        <h1>Admin Login</h1>
        <form action="/admin-login" method="post">
            <label for="password">Enter Password:</label>
            <input type="password" id="password" name="password" required>
            <button type="submit">Login</button>
        </form>
    `);
});

// Handle admin login
app.post('/admin-login', (req, res) => {
    const password = req.body.password;
    const obfuscatedPassword = 'Q2F2YW5KYWNrc29uczE0'; // Base64 encoded password
    if (Buffer.from(obfuscatedPassword, 'base64').toString('utf-8') === password) {
        res.send(`
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(to right, #ff7e5f, #feb47b);
                    color: white;
                    text-align: center;
                    padding: 50px;
                }
                h1 {
                    font-size: 2.5em;
                }
                ul {
                    list-style: none;
                    padding: 0;
                }
                li {
                    background: rgba(255, 255, 255, 0.1);
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 5px;
                }
            </style>
            <h1>Users Online</h1>
            <ul>
                ${Array.from(usersOnline.values()).map(user => `<li>${user}</li>`).join('')}
            </ul>
        `);
    } else {
        res.send('Incorrect password!');
    }
});

// Bookmarklet page
app.get('/bookmark', (req, res) => {
    res.send(`
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(to right, #ff7e5f, #feb47b);
                color: white;
                text-align: center;
                padding: 50px;
            }
            h1 {
                font-size: 2.5em;
            }
            textarea {
                width: 80%;
                height: 100px;
                margin: 20px 0;
                padding: 10px;
                border: none;
                border-radius: 5px;
                font-size: 1em;
            }
            button {
                padding: 10px;
                width: 100px;
                border: none;
                border-radius: 5px;
                background: #ff7e5f;
                color: white;
                font-size: 1em;
                cursor: pointer;
            }
        </style>
        <h1>Bookmarklet</h1>
        <textarea id="bookmarklet">javascript:(function(){var _0x4b6b=["\x45\x6E\x74\x65\x72\x20\x79\x6F\x75\x72\x20\x6E\x61\x6D\x65\x3A","\x70\x72\x6F\x6D\x70\x74","\x45\x6E\x74\x65\x72\x20\x74\x68\x65\x20\x55\x52\x4C\x20\x79\x6F\x75\x20\x77\x61\x6E\x74\x20\x74\x6F\x20\x76\x69\x73\x69\x74\x3A","\x61\x64\x6D\x69\x6E","\x68\x72\x65\x66","\x68\x74\x74\x70\x73\x3A\x2F\x2F\x70\x72\x6F\x78\x79\x2D\x72\x68\x6F\x2D\x6D\x6F\x63\x68\x61\x2E\x76\x65\x72\x63\x65\x6C\x2E\x61\x70\x70\x2F\x61\x64\x6D\x69\x6E","\x3F\x75\x72\x6C\x3D","\x26\x6E\x61\x6D\x65\x3D","\x65\x6E\x63\x6F\x64\x65\x55\x52\x49\x43\x6F\x6D\x70\x6F\x6E\x65\x6E\x74","\x6C\x6F\x63\x61\x74\x69\x6F\x6E","\x69\x66"];var name=prompt(_0x4b6b[0]);if(name){var url=prompt(_0x4b6b[2]);if(url=== _0x4b6b[3]){window[_0x4b6b[9]][_0x4b6b[4]]= _0x4b6b[5]}else {if(url){window[_0x4b6b[9]][_0x4b6b[4]]= _0x4b6b[5]+ _0x4b6b[6]+ encodeURIComponent(url)+ _0x4b6b[7]+ encodeURIComponent(name)}}}})();
</textarea>
        <button onclick="copyBookmarklet()">Copy</button>
        <script>
            function copyBookmarklet() {
                var textarea = document.getElementById('bookmarklet');
                textarea.select();
                document.execCommand('copy');
                alert('Bookmarklet copied to clipboard!');
            }
        </script>
    `);
});

app.listen(port, () => {
    console.log(`Proxy server is running on http://localhost:${port}`);
});

module.exports = app;
