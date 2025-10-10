// server.js - PRODUCTION READY FOR RENDER
require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Database connection - Render provides DATABASE_URL automatically
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Configure multer for file uploads
// IMPORTANT: Render has ephemeral storage, so files may be lost on redeploy
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public/uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slide-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Default slides data (fallback)
const defaultSlidesData = [
    {
        type: 'title',
        title: 'Ziver: The Zenith of Adaptive Intelligence',
        subtitle: 'Unlocking Verifiable Value & Financial Inclusion with Causal AI',
        tagline: 'A multi-blockchain platform built on a revolutionary, proprietary Explainable AI (ZAIE) that translates user participation and reputation into verifiable financial utility.',
        presenter: ''
    },
    {
        title: 'The Problem: The Two-Part Trust Deficit',
        visual: 'Split visual: AI Black Box vs Financial Exclusion',
        sections: [
            {
                title: 'A. The AI Trust Crisis: The Hallucination & Reasoning Gap',
                list: [
                    'Current LLMs operate on statistical correlations, not true causal reasoning',
                    'Hallucination & Inaccuracy: Models confidently generate fabricated outputs',
                    'Opaque "Black Box" decisions prevent deployment in high-stakes industries (finance, law, medicine)',
                    'Unsustainable Scaling: Reliance on brute-force, parameter-intensive calculations'
                ]
            },
            {
                title: 'B. The Web3 Adoption Barrier: Lack of Verifiable Human Capital',
                list: [
                    'High Barrier to Entry: DeFi access is gated by capital collateral, excluding the unbanked',
                    'Untapped Value: User activity, loyalty, and reputation hold no tangible financial value'
                ]
            }
        ]
    },
    {
        title: 'The Solution: Ziver & The Zenith Protocol',
        visual: 'Three pillars diagram: ZAIE → Social Capital Score → SEB-DeFi',
        sections: [
            {
                title: 'Bridging the trust gap with transparent, causal AI',
                list: [
                    '<strong>Zenith AI (ZAIE):</strong> Adaptive Self-Regulating Explainable Hybrid Algorithm for genuine causal reasoning',
                    '<strong>Social Capital Score (SCS):</strong> Transparent, on-chain reputation from user contributions',
                    '<strong>SEB-DeFi Protocol:</strong> Novel DeFi primitive using SCS, not just collateral, for financial access'
                ]
            }
        ]
    },
    {
        title: 'Core Technology: Ziver Adaptive Intelligence Engine (ZAIE)',
        visual: 'ASREH Architecture: SSWM (Eye) → ARLC (Brain) → EM (Mouth)',
        sections: [
            {
                title: 'Three-module ASREH architecture for explainable AI',
                list: [
                    '<strong>Self-Supervised World Model (SSWM) - The Eye:</strong> Observes data and makes proactive predictions',
                    '<strong>Adaptive Reasoning & Learning Controller (ARLC) - The Brain:</strong> Simulates possibilities and makes strategic decisions',
                    '<strong>Explainability Module (EM) - The Mouth:</strong> Provides human-readable justifications for every decision',
                    '<strong>Hyper-Conceptual Thinking (HCT):</strong> Forms novel concepts for emergent intelligence beyond training data'
                ]
            }
        ]
    },
    {
        title: 'The Product & Ecosystem: $ZIV Coin Utility',
        visual: 'Ecosystem map with $ZIV token at center connecting all utilities',
        sections: [
            {
                title: '$ZIV Coin (Total Supply: 45 Billion) powers the entire ecosystem',
                list: [
                    '<strong>Social & Engagement-Backed DeFi (SEB-DeFi):</strong> Sharia-compliant, Riba-free model with transparent Ujrah fees',
                    '<strong>Job Marketplace & SCAID:</strong> Gig Jobs, Micro-Tasks, Compute Provision, Data Monetization',
                    '<strong>Reward Mechanism:</strong> Incentivizes contributions that build Social Capital Score',
                    '<strong>Payment Gateway:</strong> Low-cost, instant crypto transactions',
                    '<strong>Gaming & NFT Marketplace:</strong> Achievements as Engagement-Backed Collateral'
                ]
            }
        ]
    },
    {
        title: 'Tokenomics & Financial Strategy',
        visual: 'Pie chart showing token allocation percentages',
        sections: [
            {
                title: 'Designed for long-term sustainability and market stability',
                list: [
                    '<strong>Community & Ecosystem Rewards:</strong> 22.23% (10B $ZIV) - Released over years',
                    '<strong>Public Sale:</strong> 9.015% - 6-month linear vesting',
                    '<strong>Ecosystem Development:</strong> 10% - Milestone-based unlocks',
                    '<strong>Liquidity Pool:</strong> 10% - DEX/CEX provision',
                    '<strong>Team & Founders:</strong> 8% - 4-year vesting with 1-year cliff',
                    '<strong>Controlled Release:</strong> Initial circulating supply 0.22%-0.27% for stable growth'
                ]
            }
        ]
    },
    {
        title: 'Traction, Proof of Concept & Vision',
        visual: 'Tetris simulation with AI explanation bubbles',
        sections: [
            {
                title: 'Proof of Concept: ASREH Algorithm Validation',
                list: [
                    'Successfully demonstrated in Tetris environment',
                    'Algorithm made optimal decisions with multi-layered explanations',
                    'Proved capability for explainable, causal reasoning with counterfactuals'
                ]
            },
            {
                title: 'Vision: Foundation for Trust and Inclusion',
                content: 'Empowering global community through accessible, transparent platform that rewards participation and promotes true financial inclusion'
            },
            {
                title: 'Current Status: Live Product',
                content: 'Telegram Mini-App deployed on AWS, in final testing with initial user cohort. This is a functioning product today.'
            }
        ]
    },
    {
        title: 'The Team & The Ask',
        visual: 'Team structure and fund allocation chart',
        sections: [
            {
                title: 'The Team',
                list: [
                    'Specialized team with roles including Lead Graphics Designer, UI/UX Designer, Copywriters',
                    'Financial alignment via 4-year vesting schedule with 1-year cliff for team allocation'
                ]
            },
            {
                title: 'The Ask: $1 Million to Scale Vision',
                list: [
                    '<strong>40% - Technology & Security Scalability:</strong> Smart contract audit, AWS infrastructure, Ziver-Chain development',
                    '<strong>30% - Strategic Talent Acquisition:</strong> Core engineers and Head of Growth',
                    '<strong>20% - Go-To-Market & User Acquisition:</strong> Marketing campaigns, KOL partnerships, first 10,000 users',
                    '<strong>10% - Legal & Operational Runway:</strong> Regulatory compliance and financial buffer'
                ]
            }
        ]
    }
];

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

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Middleware - Production optimizations
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files with caching for production
app.use(express.static('public', {
    maxAge: isProduction ? '1d' : '0',
    etag: true,
    lastModified: true
}));

app.use('/src', express.static('src'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Security headers for production
app.use((req, res, next) => {
    if (isProduction) {
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // CORS headers for your domain
        const allowedOrigins = [
            'https://pitch.ziverapp.xyz',
            'https://ziverapp.xyz',
            'http://localhost:3000'
        ];
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
    }
    next();
});

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

// Slides management - FIXED: Properly handle image_url loading
app.get('/api/slides', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM slides ORDER BY slide_order'
        );

        const dbSlides = result.rows;

        // If no slides in database, return default slides
        if (dbSlides.length === 0) {
            console.log('No slides in database, returning default slides');
            return res.json(defaultSlidesData.map((slide, index) => ({
                id: index,
                slide_order: index,
                title: slide.title || `Slide ${index + 1}`,
                content: slide,
                image_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })));
        }

        // Merge database slides with default slides
        const mergedSlides = defaultSlidesData.map((defaultSlide, index) => {
            const dbSlide = dbSlides.find(slide => slide.slide_order === index);

            if (dbSlide) {
                // Use database content but ensure we have all required fields
                const mergedContent = {
                    ...defaultSlide, // Start with default
                    ...(dbSlide.content || {}), // Override with database content if exists
                    // Ensure we preserve the structure
                    title: (dbSlide.content && dbSlide.content.title) || dbSlide.title || defaultSlide.title,
                    sections: (dbSlide.content && dbSlide.content.sections) || defaultSlide.sections,
                    visual: (dbSlide.content && dbSlide.content.visual) || defaultSlide.visual
                };

                return {
                    id: dbSlide.id,
                    slide_order: index,
                    title: dbSlide.title,
                    content: mergedContent,
                    image_url: dbSlide.image_url, // This is the key fix - use the stored image_url
                    created_at: dbSlide.created_at,
                    updated_at: dbSlide.updated_at
                };
            }

            // No database entry for this slide, use default
            return {
                id: index,
                slide_order: index,
                title: defaultSlide.title || `Slide ${index + 1}`,
                content: defaultSlide,
                image_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        });

        console.log(`Returning ${mergedSlides.length} slides (${dbSlides.length} from database)`);
        res.json(mergedSlides);

    } catch (error) {
        console.error('Fetch slides error:', error);
        // Fallback to default slides on error
        console.log('Database error, falling back to default slides');
        res.json(defaultSlidesData.map((slide, index) => ({
            id: index,
            slide_order: index,
            title: slide.title || `Slide ${index + 1}`,
            content: slide,
            image_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })));
    }
});

app.put('/api/slides/:order', async (req, res) => {
    try {
        const { order } = req.params;
        const { title, content } = req.body;

        console.log(`Saving slide ${order}:`, { title });

        // Check if slide exists
        const existingSlide = await pool.query(
            'SELECT * FROM slides WHERE slide_order = $1',
            [order]
        );

        if (existingSlide.rows.length > 0) {
            // Update existing slide
            const result = await pool.query(
                `UPDATE slides 
                 SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP 
                 WHERE slide_order = $3 
                 RETURNING *`,
                [title, content, order]
            );
            res.json({ success: true, slide: result.rows[0] });
        } else {
            // Insert new slide
            const result = await pool.query(
                `INSERT INTO slides (slide_order, title, content) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
                [order, title, content]
            );
            res.json({ success: true, slide: result.rows[0] });
        }

    } catch (error) {
        console.error('Update slide error:', error);
        res.status(500).json({ error: 'Failed to update slide: ' + error.message });
    }
});

// File upload endpoint
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            message: 'File uploaded successfully'
        });

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed: ' + error.message });
    }
});

app.post('/api/slides/:order/image', async (req, res) => {
    try {
        const { order } = req.params;
        const { imageUrl } = req.body;

        console.log(`Setting image for slide ${order}:`, imageUrl);

        // Check if slide exists
        const existingSlide = await pool.query(
            'SELECT * FROM slides WHERE slide_order = $1',
            [order]
        );

        if (existingSlide.rows.length > 0) {
            // Update existing slide
            const result = await pool.query(
                'UPDATE slides SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE slide_order = $2 RETURNING *',
                [imageUrl, order]
            );
            res.json({ success: true, slide: result.rows[0] });
        } else {
            // Insert new slide with image
            const defaultSlide = defaultSlidesData[order] || { title: `Slide ${parseInt(order) + 1}` };
            const result = await pool.query(
                'INSERT INTO slides (slide_order, title, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
                [order, defaultSlide.title, defaultSlide, imageUrl]
            );
            res.json({ success: true, slide: result.rows[0] });
        }

    } catch (error) {
        console.error('Update image error:', error);
        res.status(500).json({ error: 'Failed to update image: ' + error.message });
    }
});

// Delete image endpoint
app.delete('/api/slides/:order/image', async (req, res) => {
    try {
        const { order } = req.params;

        console.log(`Deleting image for slide ${order}`);

        // Get current image URL to delete the file
        const currentSlide = await pool.query(
            'SELECT image_url FROM slides WHERE slide_order = $1',
            [order]
        );

        if (currentSlide.rows.length > 0 && currentSlide.rows[0].image_url) {
            const imageUrl = currentSlide.rows[0].image_url;
            // Delete the physical file
            if (imageUrl.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, 'public', imageUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                }
            }
        }

        // Update database to remove image reference
        const result = await pool.query(
            'UPDATE slides SET image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE slide_order = $1 RETURNING *',
            [order]
        );

        res.json({ success: true, slide: result.rows[0] });

    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ error: 'Failed to delete image: ' + error.message });
    }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve main app - MUST be last
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Ziver Pitch Deck running in ${isProduction ? 'PRODUCTION' : 'development'} mode`);
        console.log(`📍 Port: ${port}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('✅ File uploads enabled at /api/upload/image');
        console.log('✅ Image delete enabled at /api/slides/:order/image');
        console.log('✅ Health check at /health');
        console.log('📊 Database integration: Edits will be saved, default content always available');
        
        if (isProduction) {
            console.log('🔒 Production mode: Security headers enabled');
            console.log('💾 Static files: 1-day cache enabled');
        }
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});