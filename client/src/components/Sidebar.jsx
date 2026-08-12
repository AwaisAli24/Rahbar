import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import {
  LayoutDashboard, Users, BookOpen, Bus, Calendar,
  ClipboardList, BarChart3, Settings, ChevronLeft,
  GraduationCap, Sparkles, DollarSign, Megaphone,
  ScrollText, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ active, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState({ students: 0, faculty: 0, courses: 0 });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/users/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch sidebar stats');
      }
    };

    if (token) fetchStats();
    
    // Refresh stats every 30 seconds to keep badges accurate
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const navGroups = [
    {
      label: 'Core',
      items: [
        { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard',    badge: null },
        { id: 'students',    icon: GraduationCap,   label: 'Students',     badge: stats.students > 0 ? stats.students : null },
        { id: 'faculty',     icon: Users,           label: 'Faculty',      badge: stats.faculty > 0 ? stats.faculty : null },
        { id: 'courses',     icon: BookOpen,        label: 'Courses',      badge: stats.courses > 0 ? stats.courses : null },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'attendance',         icon: ClipboardList, label: 'Attendance',           badge: '!' },
        { id: 'timetable',          icon: Calendar,      label: 'Timetable',            badge: null },
        { id: 'finance',            icon: DollarSign,    label: 'Finance',              badge: null },
        { id: 'notices',            icon: Megaphone,     label: 'Notices',              badge: null },
        { id: 'transcripts',        icon: ScrollText,    label: 'Transcripts & Degree', badge: null },
        { id: 'faculty-attendance', icon: UserCheck,     label: 'Faculty Attendance',   badge: null },
      ],
    },
    {
      label: 'Insights',
      items: [
        { id: 'analytics',   icon: BarChart3,       label: 'Analytics',    badge: null },
        { id: 'settings',    icon: Settings,        label: 'Settings',     badge: null },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'fixed',
        top: '12px',
        left: '12px',
        bottom: '12px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '18px',
        background: '#ffffff',
        border: '1px solid rgba(99,102,241,0.12)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 20px rgba(99,102,241,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding: collapsed ? '24px 0' : '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
        }}>
          <Sparkles size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>Rahbar</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Smart Campus</p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: '#cbd5e1', textTransform: 'uppercase',
                padding: '10px 12px 6px',
              }}>
                {group.label}
              </p>
            )}
            {group.items.map(({ id, icon: Icon, label, badge }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  title={collapsed ? label : undefined}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: collapsed ? '10px 0' : '10px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 10, marginBottom: 2, cursor: 'pointer',
                    border: 'none',
                    background: isActive
                      ? 'rgba(99,102,241,0.08)'
                      : 'transparent',
                    color: isActive ? '#6366f1' : '#64748b',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = '#475569'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                >
                  {isActive && (
                    <span style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: '0 3px 3px 0',
                      background: '#6366f1',
                    }} />
                  )}
                  <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  {!collapsed && (
                    <>
                      <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500, flex: 1, textAlign: 'left' }}>
                        {label}
                      </span>
                      {badge && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                          background: badge === '!' ? 'rgba(244,63,94,0.10)' : 'rgba(99,102,241,0.10)',
                          color: badge === '!' ? '#f43f5e' : '#6366f1',
                        }}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User + Collapse ── */}
      <div style={{
        borderTop: '1px solid rgba(99,102,241,0.08)',
        padding: '12px 8px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            padding: '8px 12px', borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#cbd5e1',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
          onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
        >
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </button>

        {/* Avatar + Logout */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'rgba(99,102,241,0.05)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            boxShadow: '0 2px 8px rgba(99,102,241,0.2)',
          }}>{initials}</div>
          {!collapsed && (
            <>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name ?? 'User'}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role ?? 'guest'}</p>
              </div>
              <button onClick={logout} title="Logout" style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1',
                display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
              >
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
