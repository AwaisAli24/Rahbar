import { useState, useEffect } from 'react';
import { 
  Calendar, BookOpen, CheckCircle2, XCircle, Clock, 
  AlertCircle, Save, Loader2, Search, Filter, BarChart2,
  FileSpreadsheet, UserCheck, UserX, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AttendancePage() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [recorded, setRecorded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'analytics'
  const [summary, setSummary] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [leaveLimit, setLeaveLimit] = useState(4);
  const [withdrawThreshold, setWithdrawThreshold] = useState(2);

  // Fetch available courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setCourses(data.data);
          if (data.data.length > 0) {
            setSelectedCourse(data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch courses');
      }
    };
    if (token) fetchCourses();
  }, [token]);

  // Fetch attendance sheet when course or date changes
  useEffect(() => {
    const fetchAttendanceSheet = async () => {
      if (!selectedCourse || !selectedDate) return;
      setLoading(true);
      setSaveMessage(null);
      try {
        const res = await fetch(`/api/attendance?courseId=${selectedCourse}&date=${selectedDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRecorded(data.recorded);
          setRecords(data.data.records || []);
          if (data.freeAbsents !== undefined) setLeaveLimit(data.freeAbsents);
          if (data.withdrawThreshold !== undefined) setWithdrawThreshold(data.withdrawThreshold);
          if (data.leaveLimit !== undefined) setLeaveLimit(data.leaveLimit);
        }
      } catch (err) {
        console.error('Failed to fetch attendance');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'mark') {
      fetchAttendanceSheet();
    }
  }, [selectedCourse, selectedDate, token, activeTab]);

  // Fetch summary analytics when switching to analytics tab
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedCourse) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/attendance/summary/${selectedCourse}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSummary(data.summary || []);
          setTotalSessions(data.totalSessions || 0);
        }
      } catch (err) {
        console.error('Failed to fetch summary');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [selectedCourse, token, activeTab]);

  // Handle status toggle
  const handleStatusChange = (studentId, newStatus) => {
    setRecords(prev => prev.map(rec => 
      rec.student._id === studentId ? { ...rec, status: newStatus } : rec
    ));
  };

  // Handle remarks change
  const handleRemarksChange = (studentId, text) => {
    setRecords(prev => prev.map(rec => 
      rec.student._id === studentId ? { ...rec, remarks: text } : rec
    ));
  };

  // Mark all as Present / Absent
  const handleBulkStatus = (status) => {
    setRecords(prev => prev.map(rec => ({ ...rec, status })));
  };

  // Save Attendance Sheet
  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          date: selectedDate,
          records: records.map(r => ({ student: r.student._id, status: r.status, remarks: r.remarks }))
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRecorded(true);
        setSaveMessage({ type: 'success', text: 'Attendance sheet saved successfully!' });
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        throw new Error(data.message || 'Failed to save attendance');
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Calculate live stats
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const leaveCount = records.filter(r => r.status === 'Leave').length;
  const totalCount = records.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  const filteredRecords = records.filter(r => 
    r.student.name.toLowerCase().includes(search.toLowerCase()) ||
    r.student.campusID.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSummary = summary.filter(s => 
    s.student.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student.campusID.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Attendance Management</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Record daily course attendance and monitor student participation.</p>
        </div>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 4 }}>
          <button 
            onClick={() => setActiveTab('mark')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
              border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === 'mark' ? '#fff' : 'transparent',
              color: activeTab === 'mark' ? '#6366f1' : '#64748b',
              boxShadow: activeTab === 'mark' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <FileSpreadsheet size={16} /> Mark Daily Attendance
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
              border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === 'analytics' ? '#fff' : 'transparent',
              color: activeTab === 'analytics' ? '#6366f1' : '#64748b',
              boxShadow: activeTab === 'analytics' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <BarChart2 size={16} /> Analytics & Summary
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div style={{ 
        display: 'flex', gap: 16, marginBottom: 24, padding: 20, 
        background: '#fff', borderRadius: 16, border: '1px solid rgba(99,102,241,0.08)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 240px' }}>
          <label style={labelStyle}>Select Course</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 14px', height: 42 }}>
            <BookOpen size={16} color="#64748b" />
            <select 
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#0f172a' }}
            >
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {activeTab === 'mark' && (
          <div style={{ flex: '0 1 200px' }}>
            <label style={labelStyle}>Date of Session</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 14px', height: 42 }}>
              <Calendar size={16} color="#64748b" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={e => setSelectedDate(e.target.value)}
                style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#0f172a' }}
              />
            </div>
          </div>
        )}

        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle}>Search Students</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0 14px', height: 42 }}>
            <Search size={15} color="#94a3b8" />
            <input 
              placeholder="Search by name or Roll #..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 13.5, color: '#0f172a' }}
            />
          </div>
        </div>
      </div>

      {/* Save Message Notification */}
      {saveMessage && (
        <div style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
          background: saveMessage.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
          color: saveMessage.type === 'success' ? '#10b981' : '#f43f5e',
          border: `1px solid ${saveMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
          fontWeight: 600, fontSize: 14, animation: 'fadeIn 0.3s ease-out'
        }}>
          {saveMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {saveMessage.text}
        </div>
      )}

      {/* ── TAB 1: MARK DAILY ATTENDANCE ── */}
      {activeTab === 'mark' && (
        <>
          {/* Live Stats Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ ...statCardStyle, borderLeft: '4px solid #6366f1' }}>
              <p style={statLabelStyle}>Total Enrolled</p>
              <p style={statValueStyle}>{totalCount}</p>
            </div>
            <div style={{ ...statCardStyle, borderLeft: '4px solid #10b981' }}>
              <p style={statLabelStyle}>Present</p>
              <p style={{ ...statValueStyle, color: '#10b981' }}>{presentCount}</p>
            </div>
            <div style={{ ...statCardStyle, borderLeft: '4px solid #f43f5e' }}>
              <p style={statLabelStyle}>Absent</p>
              <p style={{ ...statValueStyle, color: '#f43f5e' }}>{absentCount}</p>
            </div>
            <div style={{ ...statCardStyle, borderLeft: '4px solid #eab308' }}>
              <p style={statLabelStyle}>Late / Leave</p>
              <p style={{ ...statValueStyle, color: '#eab308' }}>{lateCount + leaveCount}</p>
            </div>
            <div style={{ ...statCardStyle, borderLeft: '4px solid #0ea5e9' }}>
              <p style={statLabelStyle}>Attendance Rate</p>
              <p style={{ ...statValueStyle, color: '#0ea5e9' }}>{attendanceRate}%</p>
            </div>
          </div>

          {/* Table & Controls */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            
            {/* Table Header Bar */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Sheet Status:
                </span>
                <span style={{ 
                  padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: recorded ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: recorded ? '#10b981' : '#f59e0b'
                }}>
                  {recorded ? '✔ Recorded & Saved' : '● Unrecorded Roster'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Quick Action:</span>
                <button onClick={() => handleBulkStatus('Present')} style={{ ...quickButtonStyle, color: '#10b981', background: 'rgba(16,185,129,0.08)' }}>Mark All Present</button>
                <button onClick={() => handleBulkStatus('Absent')} style={{ ...quickButtonStyle, color: '#f43f5e', background: 'rgba(244,63,94,0.08)' }}>Mark All Absent</button>
              </div>
            </div>

            {/* Main Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                  <th style={thStyle}>Student Name</th>
                  <th style={thStyle}>Roll Number</th>
                  <th style={thStyle}>Leaves / Absents</th>
                  <th style={thStyle}>Attendance Status</th>
                  <th style={thStyle}>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#6366f1' }} /></td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No students found in this course roster.</td></tr>
                ) : filteredRecords.map((record) => {
                  const leaveUsed = record.cumulativeLeave ?? 0;
                  const absentTotal = record.cumulativeAbsent ?? 0;
                  const leaveExhausted = leaveUsed >= leaveLimit;
                  const showWithdraw = record.withdraw || absentTotal > withdrawThreshold;
                  const studentId = record.student._id;
                  return (
                  <>
                    {/* WITHDRAW WARNING BANNER */}
                    {showWithdraw && (
                      <tr key={`withdraw-${studentId}`}>
                        <td colSpan={5} style={{ padding: '6px 20px 0', background: 'transparent' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: 'linear-gradient(90deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))',
                            border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: 10, padding: '8px 16px',
                            color: '#dc2626', fontWeight: 700, fontSize: 12.5,
                            animation: 'fadeIn 0.3s ease-out'
                          }}>
                            <AlertTriangle size={15} />
                            ⚠ WITHDRAW WARNING — {record.student.name} has exceeded the allowed absents limit ({leaveLimit} free + {withdrawThreshold} max). Subject to course withdrawal.
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr key={studentId} style={{ borderBottom: '1px solid #f8fafc', background: showWithdraw ? 'rgba(239,68,68,0.03)' : leaveExhausted ? 'rgba(244,63,94,0.02)' : 'transparent' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.08)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                            {record.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: showWithdraw ? '#dc2626' : '#0f172a' }}>{record.student.name}</p>
                            <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{record.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>
                          {record.student.campusID}
                        </span>
                      </td>
                      {/* ── Leave & Absent Count Badges ── */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {/* Leave Badge */}
                          <div
                            title={leaveExhausted ? `Leave quota (${leaveLimit}) exhausted! Further absents counted as real absents.` : `${leaveUsed} of ${leaveLimit} free absents used`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                              background: leaveExhausted ? 'rgba(244,63,94,0.12)' : 'rgba(14,165,233,0.1)',
                              color: leaveExhausted ? '#f43f5e' : '#0ea5e9',
                              border: `1px solid ${leaveExhausted ? 'rgba(244,63,94,0.25)' : 'rgba(14,165,233,0.2)'}`,
                              cursor: 'help'
                            }}
                          >
                            {leaveExhausted ? <ShieldAlert size={12} /> : <Clock size={12} />}
                            Leave: {leaveUsed}/{leaveLimit}
                          </div>
                          {/* Absent Badge */}
                          <div
                            title={`Real absents (beyond ${leaveLimit} free): ${absentTotal}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                              background: showWithdraw ? 'rgba(239,68,68,0.15)' : absentTotal > 0 ? 'rgba(244,63,94,0.08)' : 'rgba(100,116,139,0.08)',
                              color: showWithdraw ? '#dc2626' : absentTotal > 0 ? '#f43f5e' : '#94a3b8',
                              border: `1px solid ${showWithdraw ? 'rgba(239,68,68,0.4)' : absentTotal > 0 ? 'rgba(244,63,94,0.2)' : '#e2e8f0'}`,
                              cursor: 'help'
                            }}
                          >
                            <XCircle size={12} />
                            Absent: {absentTotal}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {showWithdraw ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                            <ShieldAlert size={14} color="#dc2626" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>WITHDRAWN — Attendance Locked</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {['Present', 'Absent', 'Late'].map((status) => {
                              const isSelected = record.status === status;
                              const activeColor = 
                                status === 'Present' ? '#10b981' :
                                status === 'Absent' ? '#f43f5e' : '#eab308';
                              
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(studentId, status)}
                                  style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                                    border: `1px solid ${isSelected ? activeColor : '#e2e8f0'}`,
                                    background: isSelected ? (
                                      status === 'Present' ? 'rgba(16,185,129,0.1)' :
                                      status === 'Absent' ? 'rgba(244,63,94,0.1)' : 'rgba(234,179,8,0.1)'
                                    ) : '#fff',
                                    color: isSelected ? activeColor : '#64748b',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <input 
                          placeholder={showWithdraw ? 'Locked — student withdrawn' : 'Optional remarks...'} 
                          value={record.remarks || ''}
                          onChange={e => !showWithdraw && handleRemarksChange(studentId, e.target.value)}
                          disabled={showWithdraw}
                          style={{ width: '100%', height: 36, padding: '0 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', opacity: showWithdraw ? 0.5 : 1, cursor: showWithdraw ? 'not-allowed' : 'text' }}
                        />
                      </td>
                    </tr>
                  </>
                  );
                })}
              </tbody>
            </table>

            {/* Footer Save Bar */}
            <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                disabled={saving || loading || records.length === 0}
                onClick={handleSaveAttendance}
                style={{
                  padding: '12px 28px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12,
                  fontWeight: 700, fontSize: 14.5, cursor: saving || loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
                }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {recorded ? 'Update Attendance Sheet' : 'Save Attendance Sheet'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: ANALYTICS & SUMMARY ── */}
      {activeTab === 'analytics' && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Cumulative Attendance Report</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Total recorded sessions for this course: <b>{totalSessions}</b></p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Satisfactory (≥75%)
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f43f5e', marginLeft: 12 }} /> Short Attendance (&lt;75%)
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                <th style={thStyle}>Student Name</th>
                <th style={thStyle}>Roll Number</th>
                <th style={thStyle}>Present</th>
                <th style={thStyle}>Absent</th>
                <th style={thStyle}>Late / Leave</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Attendance Percentage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#6366f1' }} /></td></tr>
              ) : filteredSummary.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No analytics available for this course.</td></tr>
              ) : filteredSummary.map((item) => {
                const isShort = item.percentage < 75;
                return (
                  <tr key={item.student.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.08)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                          {item.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.student.name}</p>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>
                        {item.student.campusID}
                      </span>
                    </td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#10b981' }}>{item.present}</span></td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#f43f5e' }}>{item.absent}</span></td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#eab308' }}>{item.late + item.leave}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        {isShort && <AlertTriangle size={16} color="#f43f5e" title="Short Attendance Warning" />}
                        <span style={{ 
                          padding: '6px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
                          background: isShort ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                          color: isShort ? '#f43f5e' : '#10b981'
                        }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 };
const statCardStyle = { background: '#fff', padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(99,102,241,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };
const statLabelStyle = { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };
const statValueStyle = { fontSize: 24, fontWeight: 800, color: '#0f172a' };
const thStyle = { padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' };
const tdStyle = { padding: '16px 24px', verticalAlign: 'middle' };
const quickButtonStyle = { padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s' };
