import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck, Clock, PlayCircle, StopCircle, Calendar,
  Users, Loader2, Search, Building2, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, BarChart2,
  Timer, X, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['All', 'Computer Science', 'Electrical Engineering', 'Business School', 'Mathematics'];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PK', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function DurationBadge({ minutes }) {
  if (minutes === null || minutes === undefined) {
    return <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>Ongoing</span>;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
      {h > 0 ? `${h}h ` : ''}{m}m
    </span>
  );
}

export default function FacultyAttendancePage() {
  const { token } = useAuth();
  const [mainTab, setMainTab] = useState('sessions'); // 'sessions' | 'summary'
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [expandedFaculty, setExpandedFaculty] = useState(null);

  const currentMonth = new Date().getMonth() + 1;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/faculty-attendance/all?';
      if (filterDept !== 'All') url += `department=${encodeURIComponent(filterDept)}&`;
      if (filterMonth) url += `month=${filterMonth}&year=${filterYear}&`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSessions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch faculty attendance sessions');
    } finally {
      setLoading(false);
    }
  }, [token, filterDept, filterMonth, filterYear]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/faculty-attendance/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSummary(data.data || []);
    } catch (err) {
      console.error('Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (mainTab === 'sessions') fetchSessions();
    if (mainTab === 'summary') fetchSummary();
  }, [mainTab, fetchSessions, fetchSummary]);

  const filteredSessions = sessions.filter(s => {
    if (search === '') return true;
    const name = s.faculty?.name?.toLowerCase() || '';
    const course = s.course?.title?.toLowerCase() || '';
    const code = s.course?.code?.toLowerCase() || '';
    const id = s.faculty?.campusID?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || course.includes(q) || code.includes(q) || id.includes(q);
  });

  const filteredSummary = summary.filter(s => {
    if (search === '') return true;
    const name = s.faculty?.name?.toLowerCase() || '';
    const dept = s.faculty?.department?.toLowerCase() || '';
    const id = s.faculty?.campusID?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || dept.includes(q) || id.includes(q);
  });

  // Stats
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.sessionActive).length;
  const totalPresent = sessions.filter(s => s.status === 'Present').length;
  const avgDuration = (() => {
    const withDuration = sessions.filter(s => s.durationMinutes !== null);
    if (withDuration.length === 0) return 0;
    return Math.round(withDuration.reduce((a, s) => a + s.durationMinutes, 0) / withDuration.length);
  })();

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 24, padding: '32px 36px', marginBottom: 28,
        color: '#fff', boxShadow: '0 12px 40px rgba(15,23,42,0.2)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 120, width: 130, height: 130, borderRadius: '50%', background: 'rgba(99,102,241,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'rgba(99,102,241,0.2)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(99,102,241,0.3)',
          }}>
            <UserCheck size={24} color="#818cf8" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Faculty Attendance
            </h1>
            <p style={{ fontSize: 14, opacity: 0.6, margin: 0, marginTop: 2 }}>
              Class sessions, start/end times & attendance tracking
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', position: 'relative' }}>
          {[
            { label: 'Total Sessions', value: totalSessions, color: '#818cf8', icon: Calendar },
            { label: 'Active Now', value: activeSessions, color: '#34d399', icon: PlayCircle },
            { label: 'Present', value: totalPresent, color: '#6366f1', icon: CheckCircle2 },
            { label: 'Avg Duration', value: `${avgDuration}m`, color: '#f59e0b', icon: Timer },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
              borderRadius: 14, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color, margin: 0, marginTop: 1 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { id: 'sessions', label: 'All Sessions', icon: Calendar },
          { id: 'summary', label: 'Faculty Summary', icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = mainTab === id;
          return (
            <button key={id} onClick={() => setMainTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: isActive ? '#6366f1' : '#fff',
              color: isActive ? '#fff' : '#64748b',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
              border: isActive ? 'none' : '1px solid #e2e8f0',
              transition: 'all 0.15s',
            }}>
              <Icon size={16} /> {label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: '16px 20px', marginBottom: 20,
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search faculty, course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13,
              outline: 'none', color: '#0f172a', background: '#f8fafc',
            }}
          />
        </div>

        {mainTab === 'sessions' && (
          <>
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
            >
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Loader2 className="animate-spin" color="#6366f1" size={36} />
        </div>
      ) : mainTab === 'sessions' ? (
        // ── Sessions Table ──
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
          {filteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <UserCheck size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>No sessions found</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Faculty haven't started any classes yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#fafbff' }}>
                    {['Faculty', 'Course', 'Date', 'Start Time', 'End Time', 'Duration', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '14px 16px', fontSize: 11, fontWeight: 700,
                        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
                        textAlign: 'left', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session, idx) => (
                    <tr key={session._id} style={{
                      borderBottom: idx < filteredSessions.length - 1 ? '1px solid #f8fafc' : 'none',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Faculty */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                            background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800,
                          }}>
                            {session.faculty?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FC'}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{session.faculty?.name || '—'}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{session.faculty?.designation || session.faculty?.department || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <span style={{
                            fontSize: 11, fontWeight: 800, color: '#6366f1',
                            background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: 6,
                            display: 'inline-block', marginBottom: 3,
                          }}>{session.course?.code || '—'}</span>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{session.course?.title || '—'}</p>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {formatDate(session.date)}
                      </td>

                      {/* Start Time */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PlayCircle size={14} color="#10b981" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                            {formatTime(session.startTime)}
                          </span>
                        </div>
                      </td>

                      {/* End Time */}
                      <td style={{ padding: '14px 16px' }}>
                        {session.endTime ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StopCircle size={14} color="#ef4444" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                              {formatTime(session.endTime)}
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#f59e0b',
                            background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 6,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                            Ongoing
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '14px 16px' }}>
                        <DurationBadge minutes={session.durationMinutes} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                          background: session.status === 'Present' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: session.status === 'Present' ? '#10b981' : '#ef4444',
                        }}>
                          {session.status === 'Present' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // ── Summary Tab ──
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredSummary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <Users size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>No faculty found</p>
            </div>
          ) : (
            filteredSummary.map((item) => {
              const isExpanded = expandedFaculty === item.faculty.id;
              const pct = item.attendancePercentage;
              const pctColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 40 ? '#f59e0b' : '#ef4444';

              return (
                <div key={item.faculty.id} style={{
                  background: '#fff', borderRadius: 16, border: '1.5px solid',
                  borderColor: isExpanded ? 'rgba(99,102,241,0.3)' : '#e2e8f0',
                  overflow: 'hidden', transition: 'border-color 0.15s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                }}>
                  <div
                    onClick={() => setExpandedFaculty(isExpanded ? null : item.faculty.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '18px 24px', cursor: 'pointer',
                      background: isExpanded ? 'rgba(99,102,241,0.03)' : '#fff',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800,
                    }}>
                      {item.faculty.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>{item.faculty.name}</p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, marginTop: 2 }}>
                        {item.faculty.designation || 'Faculty'} · {item.faculty.department}
                      </p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      {[
                        { label: 'Sessions', value: item.totalSessions },
                        { label: 'Present', value: item.presentCount, color: '#10b981' },
                        { label: 'Active', value: item.activeSessions, color: '#f59e0b' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 18, fontWeight: 800, color: color || '#0f172a', margin: 0 }}>{value}</p>
                          <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{label}</p>
                        </div>
                      ))}
                      {/* Attendance % */}
                      <div style={{ width: 80 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Attendance</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: pctColor }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pctColor, borderRadius: 999, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={16} color="#94a3b8" style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0,
                    }} />
                  </div>

                  {/* Expanded: recent sessions */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', padding: '16px 24px', background: '#fafbff' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Recent Sessions</p>
                      {item.recentSessions?.length === 0 ? (
                        <p style={{ fontSize: 13, color: '#94a3b8' }}>No sessions recorded yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {item.recentSessions?.map((s, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '12px 16px', background: '#fff', borderRadius: 10,
                              border: '1px solid #e2e8f0',
                            }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: s.status === 'Present' ? '#10b981' : '#ef4444' }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{s.course}</p>
                                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{formatDate(s.date)}</p>
                              </div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                <span style={{ color: '#10b981' }}>▶ {formatTime(s.startTime)}</span>
                                <span style={{ color: s.endTime ? '#ef4444' : '#f59e0b' }}>
                                  {s.endTime ? `⏹ ${formatTime(s.endTime)}` : '⏳ Ongoing'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
