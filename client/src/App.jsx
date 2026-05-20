import { useState } from 'react';
import './index.css';
import { useAuth } from './context/AuthContext';
import { LogOut } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import CoursePage from './pages/CoursePage';
import AttendancePage from './pages/AttendancePage';
import TimetablePage from './pages/TimetablePage';
import StudentPortalPage from './pages/StudentPortalPage';
import FacultyPortalPage from './pages/FacultyPortalPage';
import SettingsPage from './pages/SettingsPage';
import FinancePage from './pages/FinancePage';
import NoticeBoardPage from './pages/NoticeBoardPage';
import PredictiveAnalyticsPage from './pages/PredictiveAnalyticsPage';

// ── Placeholder for future pages ─────────────────────────────────────────────
const Placeholder = ({ name }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '60vh', gap: 16,
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      boxShadow: '0 4px 16px rgba(99,102,241,0.10)',
    }}>🚧</div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 17, fontWeight: 600, color: '#475569' }}>{name}</p>
      <p style={{ fontSize: 13, marginTop: 4, color: '#94a3b8' }}>This module is under construction.</p>
    </div>
  </div>
);

const PAGES = {
  dashboard:  <Dashboard />,
  students:   <StudentsPage />,
  faculty:    <FacultyPage />,
  courses:    <CoursePage />,
  attendance: <AttendancePage />,
  timetable:  <TimetablePage />,
  finance:    <FinancePage />,
  notices:    <NoticeBoardPage />,
  analytics:  <PredictiveAnalyticsPage />,
  settings:   <SettingsPage />,
};

// ── Authenticated Admin Shell ─────────────────────────────────────────────────
function AppShell() {
  const [activePage, setActivePage] = useState('dashboard');
  const SIDEBAR_W   = 260;
  const SIDEBAR_GAP = 12;

  return (
    <div style={{ minHeight: '100dvh', background: '#f4f6fb', position: 'relative' }}>
      <Sidebar active={activePage} onNavigate={setActivePage} />

      <main style={{
        marginLeft: SIDEBAR_W + SIDEBAR_GAP * 2,
        minHeight: '100dvh',
        padding: '28px 32px',
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', zIndex: 1,
        maxWidth: 1240,
      }}>
        {PAGES[activePage]}
      </main>
    </div>
  );
}

// ── Authenticated Student Shell ───────────────────────────────────────────────
function StudentShell() {
  const { logout } = useAuth();
  return (
    <div style={{ minHeight: '100dvh', background: '#f4f6fb', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button 
            onClick={logout} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, 
              color: '#64748b', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.15s' 
            }} 
            onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; }} 
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <LogOut size={16} /> Logout
          </button>
        </header>
        <StudentPortalPage />
      </div>
    </div>
  );
}

// ── Authenticated Faculty Shell ───────────────────────────────────────────────
function FacultyShell() {
  const { logout } = useAuth();
  return (
    <div style={{ minHeight: '100dvh', background: '#f4f6fb', padding: '24px 32px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button 
            onClick={logout} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, 
              color: '#64748b', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.15s' 
            }} 
            onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; }} 
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <LogOut size={16} /> Logout
          </button>
        </header>
        <FacultyPortalPage />
      </div>
    </div>
  );
}

// ── Root: route guard ─────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  if (user?.role === 'student') return <StudentShell />;
  if (user?.role === 'faculty') return <FacultyShell />;
  return <AppShell />;
}
