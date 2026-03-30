// server.js — TalentLaunch Rwanda API entry point

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { testConnection } = require('./config/db');

const authRoutes     = require('./routes/authRoutes');
const mentorRoutes   = require('./routes/mentorRoutes');
const workshopRoutes = require('./routes/workshopRoutes');
const talentRoutes   = require('./routes/talentRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────
//  Global Middleware
// ─────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-frontend-domain.com'  // 🔧 Replace with your real domain
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files from the Front-end folder
app.use(express.static(path.join(__dirname, 'Front-end')));

// ─────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/mentors',   mentorRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/talents',   talentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'TalentLaunch API is running 🚀', env: process.env.NODE_ENV });
});

// Root route for browser checks
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'TalentLaunch API is running. Use /api/health or /api/<resource> endpoints.',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ─────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀  TalentLaunch API running on http://localhost:${PORT}`);
    console.log(`📋  Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

start();