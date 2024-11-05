const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// CORS configuration
app.use(cors({
    origin: [
        'https://budgetmax.replit.app',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json());

// Serve static files from the dist directory
app.use(express.static('dist'));

// Your API routes here
app.get('/api/download-all', async (req, res) => {
    // ... your existing route handler
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
}); 