import { useState, useEffect } from 'react';
import { 
  Brain, ShieldAlert, AlertTriangle, HelpCircle, 
  ArrowRight, CheckCircle2, User, Search, RefreshCw, Loader2, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function PredictiveAnalyticsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, totalAtRisk: 0, criticalCount: 0, highCount: 0, moderateCount: 0 });
  const [atRiskList, setAtRiskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPredictiveData();
  }, [token]);

  const fetchPredictiveData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predictions/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setAtRiskList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load predictive analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/predictions/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setAtRiskList(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter list by search term
  const filteredList = atRiskList.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.campusID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Recharts Pie Chart Data
  const pieData = [
    { name: 'Critical Risk', value: stats.criticalCount, color: '#f43f5e' },
    { name: 'High Risk', value: stats.highCount, color: '#f59e0b' },
    { name: 'Moderate Risk', value: stats.moderateCount, color: '#fb923c' },
    { name: 'Safe Students', value: stats.totalStudents - stats.totalAtRisk, color: '#10b981' }
  ].filter(item => item.value > 0); // Only display non-zero slices

  // Recharts Bar Chart Data for features comparison
  const barData = filteredList.slice(0, 5).map(student => ({
    name: student.name.split(' ')[0],
    Attendance: student.features.attendance_rate,
    Midterm: student.features.midterm_score,
    Quizzes: student.features.quiz_avg,
    Assignments: student.features.assignment_avg
  }));

  const getRiskBadgeStyles = (status) => {
    if (status === 'Critical Risk') return { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' };
    if (status === 'High Risk') return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' };
    return { bg: 'rgba(251,146,60,0.1)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' };
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Loader2 className="animate-spin" color="#6366f1" size={36} /></div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Predictive Student Risk Analytics</h1>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: 8 }}>
              <Sparkles size={12} /> Powered by Python ML
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Identifies students at-risk of academic failure based on real-time attendance, quizzes, assignments, and midterms.
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Recalculate Risk
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Campus Risk Index', value: `${stats.totalStudents > 0 ? Math.round((stats.totalAtRisk / stats.totalStudents) * 100) : 0}%`, sub: `${stats.totalAtRisk} out of ${stats.totalStudents} students`, color: '#6366f1', icon: Brain },
          { label: 'Critical Risk Students', value: stats.criticalCount, sub: 'Needs immediate intervention', color: '#f43f5e', icon: ShieldAlert },
          { label: 'High Risk Students', value: stats.highCount, sub: 'Falling behind in core subjects', color: '#f59e0b', icon: AlertTriangle },
          { label: 'Academic Safe Zone', value: stats.totalStudents - stats.totalAtRisk, sub: 'Performance meets criteria', color: '#10b981', icon: CheckCircle2 }
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{c.value}</p>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{c.sub}</p>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${c.color}10`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        
        {/* Risk Distribution Pie Chart */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.08)', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Campus Risk Distribution</h2>
          <div style={{ width: '100%', height: 260 }}>
            {pieData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No distribution data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Students`, 'Total']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feature Comparison Chart */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.08)', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Predictive Feature Breakdown (Top 5 At-Risk)</h2>
          <div style={{ width: '100%', height: 260 }}>
            {barData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No student feature comparison.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                  <Bar dataKey="Attendance" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Midterm" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Quizzes" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Assignments" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Roster of At-Risk Students */}
      <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>At-Risk Student Roster</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Actionable database of students requiring academic intervention.</p>
          </div>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              style={{ width: '100%', height: 40, padding: '0 14px 0 40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none' }} 
              placeholder="Search by name or roll id..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={thStyle}>Student Profile</th>
              <th style={thStyle}>Attendance</th>
              <th style={thStyle}>Midterm</th>
              <th style={thStyle}>Quizzes & Assignments</th>
              <th style={thStyle}>Failure Probability</th>
              <th style={thStyle}>Risk Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No students classified as at-risk.</td></tr>
            ) : filteredList.map(student => {
              const badge = getRiskBadgeStyles(student.prediction.risk_status);
              return (
                <tr key={student._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>{student.campusID} • {student.program}</p>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: student.features.attendance_rate < 75 ? '#f43f5e' : '#475569' }}>
                      {student.features.attendance_rate}%
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: student.features.midterm_score < 50 ? '#f43f5e' : '#475569' }}>
                      {student.features.midterm_score}%
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Quiz Avg: <b>{student.features.quiz_avg}%</b></p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Assign Avg: <b>{student.features.assignment_avg}%</b></p>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: badge.color }}>
                      {student.prediction.risk_percentage}%
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, border: badge.border }}>
                      {student.prediction.risk_status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button 
                      onClick={() => alert(`Alert notification sent to advisor of ${student.name}`)}
                      style={{ padding: '6px 12px', background: '#fff', border: `1px solid ${badge.color}`, color: badge.color, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = badge.color; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = badge.color; }}
                    >
                      Alert Advisor
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Table styles
const thStyle = { padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' };
const tdStyle = { padding: '16px 24px', verticalAlign: 'middle' };
