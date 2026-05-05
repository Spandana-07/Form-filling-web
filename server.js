const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve frontend files

// Simple health check endpoint
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running', database: 'Supabase (Client-side)' });
});

// Since database logic is now on the client side, we don't need /api/submit here.
// However, we'll keep the server running to serve the static files on port 5000.

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Serving static files from: ${__dirname}`);
});
