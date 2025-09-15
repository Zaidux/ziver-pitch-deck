const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Serve static files from the src directory
app.use('/src', express.static('src'));

// All routes serve the main HTML file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
    console.log(`Ziver pitch deck running at http://localhost:${port}`);
});