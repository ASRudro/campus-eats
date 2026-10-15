require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getDb, getDbType } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const groupRoutes = require('./routes/groupRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    database: {
      driver: getDbType(),
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      name: process.env.DB_NAME || 'campuseats',
      connected: true
    },
    message: 'CampusEats Backend API is running smoothly.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/admin', adminRoutes);

const path = require('path');
const fs = require('fs');

// Serve static frontend assets if available
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
const publicPath = path.join(__dirname, '..', 'frontend', 'public');

app.use(express.static(publicPath));
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Client-side routing fallback (for SPA page refreshes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  next();
});

// 404 Route handler for unhandled API calls
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize DB and start server if executed directly
if (require.main === module) {
  getDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 CampusEats API Server is running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database on startup:', err);
      process.exit(1);
    });
}

module.exports = app;
