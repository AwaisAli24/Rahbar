import mongoose from 'mongoose';

// @desc    Health check – confirms server & DB status
// @route   GET /api/health
// @access  Public
export const getHealth = (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }[dbState] ?? 'unknown';

  res.status(200).json({
    success: true,
    message: 'Rahbar API is operational',
    timestamp: new Date().toISOString(),
    server: 'online',
    database: dbStatus,
    environment: process.env.NODE_ENV,
  });
};
