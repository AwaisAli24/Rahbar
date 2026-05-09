import { useState } from 'react';
import './index.css';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentsPage from './pages/StudentsPage';

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
  faculty:    <Placeholder name="Faculty" />,
  courses:    <Placeholder name="Courses" />,
  transport:  <Placeholder name="Transport" />,
  attendance: <Placeholder name="Attendance" />,
  timetable:  <Placeholder name="Timetable" />,
  analytics:  <Placeholder name="Analytics" />,
  settings:   <Placeholder name="Settings" />,
};

// ── Authenticated Shell ───────────────────────────────────────────────────────
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

// ── Root: route guard ─────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppShell /> : <LoginPage />;
}
