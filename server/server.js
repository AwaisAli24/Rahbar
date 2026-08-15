import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Load Environment Variables ───────────────────────────────────────────────
dotenv.config({ path: path.join(__dirname, '.env') });

// ─── Import Routes ────────────────────────────────────────────────────────────
import healthRoutes from './routes/healthRoutes.js';
import authRoutes   from './routes/authRoutes.js';
import userRoutes   from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import facultyAttendanceRoutes from './routes/facultyAttendanceRoutes.js';
import transcriptRoutes from './routes/transcriptRoutes.js';

// ─── Initialize App ───────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());                          // Security headers
app.use(cors({ 
  origin: [
    process.env.CLIENT_URL,          // e.g. https://rahbar.vercel.app (set on Render)
    'http://localhost:5173',          // local Vite dev server
  ].filter(Boolean),
  credentials: true 
}));
app.use(express.json());                    // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve profile pics

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
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/faculty-attendance', facultyAttendanceRoutes);
app.use('/api/transcripts', transcriptRoutes);

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
