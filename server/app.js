const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authMiddleware = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const meetingRoutes = require('./routes/meetingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const publicRoutes = require('./routes/publicRoutes');
const logger = require('./utils/logger');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth)
app.use('/m', publicRoutes);

// Protected routes
app.use('/api/meetings', authMiddleware, meetingRoutes);
app.use('/api/meetings', authMiddleware, aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorMiddleware);

module.exports = app;
