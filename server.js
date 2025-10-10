// server.js - UPDATED WITH SLIDE SAVING
require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create slides table with content storage
        await pool.query(`
            CREATE TABLE IF NOT EXISTS slides (
                id SERIAL PRIMARY KEY,
                slide_order INTEGER NOT NULL,
                title TEXT NOT NULL,
                content JSONB,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default slides if empty
        const slideCount = await pool.query('SELECT COUNT(*) FROM slides');
        if (parseInt(slideCount.rows[0].count) === 0) {
            console.log('Inserting default slides...');
            // You can initialize with your default content here
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/src', express.static('src'));

// API Routes

// User authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email } = req.body;

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length > 0) {
            res.json({ 
                success: true, 
                user: result.rows[0],
                isAdmin: result.rows[0].is_admin 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'User not found' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, name } = req.body;

        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const isAdmin = parseInt(userCount.rows[0].count) === 0;

        const result = await pool.query(
            'INSERT INTO users (email, name, is_admin) VALUES ($1, $2, $3) RETURNING *',
            [email, name, isAdmin]
        );

        res.json({ 
            success: true, 
            user: result.rows[0],
            isAdmin: result.rows[0].is_admin 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Slides management
app.get('/api/slides', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM slides ORDER BY slide_order'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch slides error:', error);
        res.status(500).json({ error: 'Failed to fetch slides' });
    }
});

app.put('/api/slides/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image_url } = req.body;

        const result = await pool.query(
            `UPDATE slides 
             SET title = $1, content = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4 
             RETURNING *`,
            [title, content, image_url, id]
        );

        res.json({ success: true, slide: result.rows[0] });
    } catch (error) {
        console.error('Update slide error:', error);
        res.status(500).json({ error: 'Failed to update slide' });
    }
});

app.post('/api/slides/:id/image', async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        const result = await pool.query(
            'UPDATE slides SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [imageUrl, id]
        );

        res.json({ success: true, slide: result.rows[0] });
    } catch (error) {
        console.error('Update image error:', error);
        res.status(500).json({ error: 'Failed to update image' });
    }
});

// Initialize slides with default content
app.post('/api/slides/initialize', async (req, res) => {
    try {
        const { slidesData } = req.body;
        
        // Clear existing slides
        await pool.query('DELETE FROM slides');
        
        // Insert new slides
        for (let i = 0; i < slidesData.length; i++) {
            const slide = slidesData[i];
            await pool.query(
                'INSERT INTO slides (slide_order, title, content) VALUES ($1, $2, $3)',
                [i, slide.title || `Slide ${i + 1}`, slide]
            );
        }
        
        res.json({ success: true, message: 'Slides initialized' });
    } catch (error) {
        console.error('Initialize slides error:', error);
        res.status(500).json({ error: 'Failed to initialize slides' });
    }
});

// Serve main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Ziver pitch deck running at http://localhost:${port}`);
    });
});