import {
  Bell, Search, TrendingUp, Users, BookOpen, Bus,
  ArrowUpRight, Activity, Zap, Shield, Clock,
} from 'lucide-react';

const stats = [
  { label: 'Total Students', value: '3,842', change: '+12%', icon: Users,    color: '#6366f1', bg: 'rgba(99,102,241,0.10)',  shadow: 'rgba(99,102,241,0.12)' },
  { label: 'Active Courses', value: '128',   change: '+4%',  icon: BookOpen, color: '#10b981', bg: 'rgba(16,185,129,0.10)',  shadow: 'rgba(16,185,129,0.10)' },
  { label: 'Buses Running',  value: '24',    change: '100%', icon: Bus,      color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  shadow: 'rgba(245,158,11,0.10)' },
  { label: 'System Health',  value: '99.8%', change: 'Live', icon: Activity, color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',   shadow: 'rgba(244,63,94,0.10)'  },
];

const activity = [
  { icon: Zap,        color: '#6366f1', title: 'Timetable conflict resolved',   time: '2 min ago' },
  { icon: Users,      color: '#10b981', title: '14 new admissions approved',    time: '18 min ago' },
  { icon: Shield,     color: '#f59e0b', title: 'Attendance report generated',   time: '1 hr ago' },
  { icon: Bus,        color: '#f43f5e', title: 'Route B7 delay alert cleared',  time: '3 hr ago' },
  { icon: TrendingUp, color: '#8b5cf6', title: 'Semester analytics published',  time: '5 hr ago' },
];

const Card = ({ style, children, hoverable }) => (
  <div
    style={{
      background: '#ffffff',
      border: '1px solid rgba(99,102,241,0.10)',
      borderRadius: 16,
      boxShadow: '0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(99,102,241,0.03)',
      transition: hoverable ? 'box-shadow 0.2s, transform 0.2s' : undefined,
      ...style,
    }}
    onMouseEnter={hoverable ? e => { e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; } : undefined}
    onMouseLeave={hoverable ? e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(99,102,241,0.03)'; e.currentTarget.style.transform = ''; } : undefined}
  >
    {children}
  </div>
);

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#ffffff', border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: 11, padding: '9px 14px', flex: 1, maxWidth: 360,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <Search size={15} color="#94a3b8" />
          <input
            placeholder="Search students, courses, routes…"
            style={{
              background: 'none', border: 'none', outline: 'none', width: '100%',
              fontSize: 13.5, color: '#0f172a',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            position: 'relative', width: 40, height: 40, borderRadius: 11,
            border: '1px solid rgba(99,102,241,0.12)',
            background: '#ffffff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <Bell size={16} color="#64748b" />
            <span style={{
              position: 'absolute', top: 8, right: 8, width: 7, height: 7,
              borderRadius: '50%', background: '#6366f1', border: '1.5px solid #ffffff',
            }} />
          </button>
        </div>
      </div>

      {/* Hero Banner (Solid Color) */}
      <div style={{
        borderRadius: 20,
        background: '#f1f5ff',
        border: '1px solid rgba(99,102,241,0.15)',
        padding: '36px',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(99,102,241,0.04)',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 999, padding: '4px 12px', marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6366f1', letterSpacing: '0.05em' }}>SYSTEM ONLINE</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, letterSpacing: '-0.03em',
            color: '#0f172a', lineHeight: 1.15, marginBottom: 10,
          }}>
            Welcome back,{' '}
            <span style={{ color: '#6366f1' }}>Awais</span>{' '}👋
          </h1>
          <p style={{ fontSize: 14.5, color: '#64748b', maxWidth: 480 }}>
            Rahbar is running smoothly. You have{' '}
            <span style={{ color: '#6366f1', fontWeight: 600 }}>3 pending alerts</span>{' '}
            and the semester report is ready for review.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#6366f1',
              color: '#fff', fontSize: 13.5, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.25)'; }}
            >
              View Report <ArrowUpRight size={14} />
            </button>
            <button style={{
              padding: '9px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
              background: '#ffffff', border: '1px solid rgba(99,102,241,0.20)', color: '#475569',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.40)'; e.currentTarget.style.color = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.20)'; e.currentTarget.style.color = '#475569'; }}
            >
              View Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {stats.map(({ label, value, change, icon: Icon, color, bg, shadow }) => (
          <Card key={label} style={{ padding: '22px' }} hoverable>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={19} color={color} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
                background: 'rgba(16,185,129,0.08)', color: '#10b981',
              }}>
                {change}
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginTop: 16 }}>{value}</p>
            <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{label}</p>
          </Card>
        ))}
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
        {/* Activity Feed */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Activity</h2>
            <button style={{ fontSize: 12.5, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              See all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.map(({ icon: Icon, color, title, time }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '13px 0',
                borderBottom: i < activity.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, color: '#1e293b', fontWeight: 500 }}>{title}</p>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Add New Student',    color: '#6366f1', bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.12)' },
              { label: 'Generate Report',    color: '#10b981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.12)' },
              { label: 'Mark Attendance',    color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.12)' },
              { label: 'Post Announcement',  color: '#f43f5e', bg: 'rgba(244,63,94,0.06)',   border: 'rgba(244,63,94,0.12)' },
              { label: 'View Live Tracking', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)',  border: 'rgba(139,92,246,0.12)' },
            ].map(({ label, color, bg, border }) => (
              <button
                key={label}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  fontSize: 13, fontWeight: 600, color,
                  background: bg, border: `1px solid ${border}`,
                  transition: 'transform 0.12s, filter 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.95)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
