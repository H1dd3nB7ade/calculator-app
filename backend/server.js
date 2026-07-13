
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'history.json');

app.use(cors());
app.use(express.json());


function readHistory() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const raaw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
    }   catch (err) {
        console.error('Failed to read history file', err);
        return[]
    }
}

function writeHistory(history) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
}


app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Calculator backend is running' });
});

app.get('/api/history', (req, res) => {
    const history = readHistory();
    res.json(history.slice().reverse());
});


app.post('/api/history', (req, res) => {
    const { expression, result, type } = req.body;

    if (!expression || result === undefined) {
        return res.status(400).json({ error: 'expression and result are required' });
    }

    const history = readHistory();
    const entry = {
        id: Date.now().toString(),
        expression,
        result,
        type: type || 'basic',
        timestamp: new Date().toISOString(),
    };

    history.push(entry)

    const trimmed = history.slice(-200);
    writeHistory(trimmed);

    res.status(201).json(entry);
});

app.delete('/api/history', (req, res) => {
    writeHistory([]);
    res.json({ message: 'History cleared' });
});

app.listen(PORT, () => {
    console.log('Calculator backend listening on http://localhost:${PORT}');
});