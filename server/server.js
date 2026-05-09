import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// ─── Load Environment Variables ───────────────────────────────────────────────
dotenv.config();

// ─── Import Routes ────────────────────────────────────────────────────────────
import healthRoutes from './routes/healthRoutes.js';
import authRoutes   from './routes/authRoutes.js';
import userRoutes   from './routes/userRoutes.js';

// ─── Initialize App ───────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());                          // Security headers
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());                    // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (Dev Only) ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`\x1b[36m[${new Date().toISOString()}]\x1b[0m ${req.method} ${req.url}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api',      healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error('\x1b[31m[ERROR]\x1b[0m', err.message);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(
    `\x1b[32m✔ Rahbar Server running\x1b[0m → http://localhost:${PORT} [\x1b[33m${process.env.NODE_ENV}\x1b[0m]`
  );
});
