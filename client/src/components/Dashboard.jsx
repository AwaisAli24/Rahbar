import { useState, useEffect } from 'react';
import {
  Bell, Search, TrendingUp, Users, BookOpen, Activity, Zap,
  Shield, Clock, Loader2, Award, GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// UI Helpers
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

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function Dashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAnalytics();
  }, [token]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Loader2 className="animate-spin" color="#6366f1" size={36} /></div>;
  }

  // Fallback data if API returns empty
  const kpis = data?.kpis || { totalStudents: 0, totalFaculty: 0, activeCourses: 0, totalAssessments: 0 };
  const deptData = data?.charts?.departmentStudents || [];
  const facultyData = data?.charts?.facultyDesignations || [];
  const activityFeed = data?.activity || [];

  const stats = [
    { label: 'Total Enrolled Students', value: kpis.totalStudents.toLocaleString(), change: 'Active', icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
    { label: 'Total Faculty Members', value: kpis.totalFaculty.toLocaleString(), change: 'Active', icon: GraduationCap, color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
    { label: 'Active Courses Catalog', value: kpis.activeCourses.toLocaleString(), change: 'Live', icon: BookOpen, color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
    { label: 'Total Assessments', value: kpis.totalAssessments.toLocaleString(), change: 'Grading', icon: Award, color: '#f43f5e', bg: 'rgba(244,63,94,0.10)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.4s ease-out' }}>

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
            placeholder="Search students, courses, reports…"
            style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: 13.5, color: '#0f172a' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            position: 'relative', width: 40, height: 40, borderRadius: 11,
            border: '1px solid rgba(99,102,241,0.12)', background: '#ffffff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            <Bell size={16} color="#64748b" />
            <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#6366f1', border: '1.5px solid #ffffff' }} />
          </button>
        </div>
      </div>

      {/* Hero Banner (Solid Color) */}
      <div style={{
        borderRadius: 20, background: '#f1f5ff', border: '1px solid rgba(99,102,241,0.15)',
        padding: '36px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(99,102,241,0.04)',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)', borderRadius: 999, padding: '4px 12px', marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6366f1', letterSpacing: '0.05em' }}>CAMPUS ONLINE</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, letterSpacing: '-0.03em',
            color: '#0f172a', lineHeight: 1.15, marginBottom: 10,
          }}>
            Welcome back,{' '}
            <span style={{ color: '#6366f1' }}>{user?.name?.split(' ')[0] || 'Admin'}</span>{' '}👋
          </h1>
          <p style={{ fontSize: 14.5, color: '#64748b', maxWidth: 480 }}>
            Rahbar is running smoothly. Your daily analytics and campus insights are updated and ready for review.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
          <Card key={label} style={{ padding: '22px' }} hoverable>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} color={color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                {change}
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginTop: 16 }}>{value}</p>
            <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{label}</p>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* Left: Department Distribution Bar Chart */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Department-wise Enrollment</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Distribution of students across academic departments.</p>
            </div>
            <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
              Export PDF
            </button>
          </div>
          <div style={{ height: 300, width: '100%' }}>
            {deptData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>No department data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.04)' }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  />
                  <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Right: Faculty Designations Pie Chart */}
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Faculty Composition</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Breakdown of academic staff by rank.</p>
          </div>
          <div style={{ height: 260, width: '100%', marginTop: 20 }}>
            {facultyData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>No faculty data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={facultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="designation"
                    stroke="none"
                  >
                    {facultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Recent Activity Feed */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Recent Campus Activity</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Live tracking of system events and updates.</p>
          </div>
          <button style={{ fontSize: 13, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            View Action Logs →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {activityFeed.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14, background: '#f8fafc', borderRadius: 12 }}>No recent activity recorded.</p>
          ) : activityFeed.map((item, i) => {
            const isCourse = item.type === 'course';
            const Icon = isCourse ? BookOpen : Award;
            const color = isCourse ? '#10b981' : '#f43f5e';

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 0', borderBottom: i < activityFeed.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} /> {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
