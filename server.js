const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Serve CSS from src directory
app.use('/css', express.static(path.join(__dirname, 'src/css')));

// Serve JS from src directory
app.use('/js', express.static(path.join(__dirname, 'src/js')));

// Serve images from public directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// All routes serve the main HTML file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
    console.log(`Ziver pitch deck running at http://localhost:${port}`);
});
