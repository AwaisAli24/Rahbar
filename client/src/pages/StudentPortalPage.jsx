import { useState, useEffect } from 'react';
import { 
  User, BookOpen, Calendar, Clock, MapPin, 
  CheckCircle2, AlertCircle, AlertTriangle, 
  GraduationCap, Award, Building2, Phone, Mail,
  Loader2, BarChart2, ChevronRight, FileText, Megaphone, BellRing, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentPortalPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'courses' | 'attendance' | 'exams' | 'timetable'
  
  // Data State
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grades State
  const [gradesSummary, setGradesSummary] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);

  // Notices State
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(false);

  // Prediction State
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;
      setLoading(true);
      try {
        const [coursesRes, attRes, timeRes] = await Promise.all([
          fetch(`/api/courses?studentId=${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/attendance/student/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/timetable?department=${encodeURIComponent(user.department || 'Computer Science')}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const coursesData = await coursesRes.json();
        const attData = await attRes.json();
        const timeData = await timeRes.json();

        if (coursesData.success) setCourses(coursesData.data || []);
        if (attData.success) setAttendance(attData.data || []);
        if (timeData.success) {
          const studentCourseIds = (coursesData.data || []).map(c => c._id.toString());
          const filteredSlots = (timeData.data || []).filter(slot => 
            slot.course && studentCourseIds.includes(slot.course._id ? slot.course._id.toString() : slot.course.toString())
          );
          setTimetable(filteredSlots);
        }
      } catch (err) {
        console.error('Failed to fetch student portal data');
      } finally {
        setLoading(false);
      }
    };

    if (token && user) {
      fetchStudentData();
    }
  }, [token, user]);

  // Fetch Grades Data
  useEffect(() => {
    const fetchGrades = async () => {
      const userId = user?._id || user?.id;
      if (!userId || activeTab !== 'exams') return;
      setGradesLoading(true);
      try {
        const res = await fetch(`/api/assessments/student/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setGradesSummary(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch student grades');
      } finally {
        setGradesLoading(false);
      }
    };

    fetchGrades();
  }, [activeTab, token, user]);

  // Fetch Notices Data
  useEffect(() => {
    const fetchNotices = async () => {
      if (activeTab !== 'notices') return;
      setNoticesLoading(true);
      try {
        const res = await fetch('/api/notices', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setNotices(data.data || []);
      } catch (err) {
        console.error('Failed to fetch notices');
      } finally {
        setNoticesLoading(false);
      }
    };
    fetchNotices();
  }, [activeTab, token]);

  // Fetch Prediction early warning details
  useEffect(() => {
    const fetchPrediction = async () => {
      const userId = user?._id || user?.id;
      if (!userId || !token) return;
      try {
        const res = await fetch(`/api/predictions/student/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setPrediction(data.prediction);
        }
      } catch (err) {
        console.error('Failed to fetch student risk analysis');
      }
    };
    fetchPrediction();
  }, [token, user]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Loader2 className="animate-spin" color="#6366f1" size={36} /></div>;
  }

  // Calculate overall metrics
  const totalCredits = courses.reduce((sum, c) => sum + c.creditHours, 0);
  const totalSessions = attendance.reduce((sum, a) => sum + a.totalSessions, 0);
  const totalAttended = attendance.reduce((sum, a) => sum + a.present + a.late, 0);
  const overallAttendanceRate = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 100;

  // Calculate CGPA
  const totalGPA = gradesSummary.reduce((sum, g) => sum + (g.gpa || 0), 0);
  const cgpa = gradesSummary.length > 0 ? (totalGPA / gradesSummary.length).toFixed(2) : 'N/A';

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Top Banner / Student Identity Card */}
      <div style={{ 
        background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.12)', 
        padding: '32px 36px', marginBottom: 32, boxShadow: '0 10px 30px -10px rgba(99,102,241,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ 
            width: 72, height: 72, borderRadius: 20, background: '#6366f1', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800,
            boxShadow: '0 8px 20px rgba(99,102,241,0.3)'
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ST'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{user?.name}</h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 10px', borderRadius: 8, fontFamily: 'monospace' }}>
                {user?.campusID}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span><Mail size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> {user?.email}</span>
              <span><Building2 size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> {user?.department || 'Computer Science'}</span>
              <span><GraduationCap size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> {user?.program || 'BCS'} ({user?.session || 'FA24'})</span>
            </p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Enrolled Courses</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{courses.length}</p>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Credits</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#6366f1', marginTop: 2 }}>{totalCredits}</p>
          </div>
          <div style={{ background: overallAttendanceRate < 75 ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.06)', border: `1px solid ${overallAttendanceRate < 75 ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: overallAttendanceRate < 75 ? '#f43f5e' : '#10b981', textTransform: 'uppercase' }}>Overall Attendance</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: overallAttendanceRate < 75 ? '#f43f5e' : '#10b981', marginTop: 2 }}>{overallAttendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Risk Alert Warning Banner */}
      {prediction && prediction.risk_status !== 'Safe' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
          background: prediction.risk_status === 'Critical Risk' ? 'rgba(244,63,94,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${prediction.risk_status === 'Critical Risk' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
          borderRadius: 20, marginBottom: 24, animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: prediction.risk_status === 'Critical Risk' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
            color: prediction.risk_status === 'Critical Risk' ? '#f43f5e' : '#f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: prediction.risk_status === 'Critical Risk' ? '#f43f5e' : '#f59e0b' }}>
              Academic Risk Early Warning ({prediction.risk_status})
            </h4>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Our predictive model detects that you are currently at a <b>{prediction.risk_percentage}%</b> risk of academic difficulty. We suggest improving class attendance or speaking with your faculty advisor for guidance.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', padding: '0 8px 12px', overflowX: 'auto' }}>
        {[
          { id: 'overview',   label: 'Academic Overview', icon: BookOpen },
          { id: 'courses',    label: 'My Courses',        icon: GraduationCap },
          { id: 'attendance', label: 'Attendance Report', icon: BarChart2 },
          { id: 'exams',      label: 'Exams & Grades',    icon: Award },
          { id: 'timetable',  label: 'Class Schedule',    icon: Calendar },
          { id: 'notices',    label: 'Notice Board',      icon: Megaphone }
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: isActive ? '#6366f1' : 'transparent',
                color: isActive ? '#fff' : '#64748b',
                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.25)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} /> {label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: ACADEMIC OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Left Column: Course Summary & Announcements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Current Semester Subjects</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {courses.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>No courses enrolled for this semester yet.</p>
                ) : courses.map(course => (
                  <div key={course._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '4px 10px', borderRadius: 8 }}>{course.code}</span>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{course.title}</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Instructor: {course.faculty?.name || 'Assigned Staff'}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', background: '#fff', padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>{course.creditHours} Credits</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timetable Quick Widget */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Today's Classes</h2>
                <button onClick={() => setActiveTab('timetable')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>View Full Timetable <ChevronRight size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {timetable.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>No classes scheduled or timetable unassigned.</p>
                ) : timetable.slice(0, 3).map(slot => (
                  <div key={slot._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.08)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{slot.course?.title || slot.course?.code}</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{slot.day} • {slot.startTime} - {slot.endTime}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <MapPin size={14} color="#6366f1" /> {slot.room}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Student Profile Details */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', height: 'fit-content' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Personal & Academic Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={detailLabelStyle}>Full Name</p>
                <p style={detailValueStyle}>{user?.name}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Campus Roll Number</p>
                <p style={detailValueStyle}>{user?.campusID}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Official Email</p>
                <p style={detailValueStyle}>{user?.email}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Degree Program</p>
                <p style={detailValueStyle}>{user?.program || 'Bachelor of Computer Science'} ({user?.session})</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Academic Department</p>
                <p style={detailValueStyle}>{user?.department || 'Computer Science'}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Section & Semester</p>
                <p style={detailValueStyle}>Section {user?.section || 'A'} • Semester {user?.semester || '1st'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY COURSES ── */}
      {activeTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {courses.map(course => (
            <div key={course._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ padding: '6px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, color: '#6366f1', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{course.code}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>{course.creditHours} Credits</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{course.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20, flex: 1 }}>{course.description || 'No description provided for this course curriculum.'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="#64748b" /></div>
                <div>
                  <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Course Instructor</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{course.faculty?.name || 'Assigned Staff'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: ATTENDANCE REPORT ── */}
      {activeTab === 'attendance' && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Cumulative Attendance Status</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>University requirement: Minimum <b>75%</b> attendance required to sit in final exams.</p>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
                <th style={thStyle}>Course Code</th>
                <th style={thStyle}>Course Title</th>
                <th style={thStyle}>Present</th>
                <th style={thStyle}>Absent</th>
                <th style={thStyle}>Late / Leave</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No attendance records published yet.</td></tr>
              ) : attendance.map(item => {
                const isShort = item.percentage < 75;
                return (
                  <tr key={item.course.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>{item.course.code}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.course.title}</span></td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#10b981' }}>{item.present}</span></td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#f43f5e' }}>{item.absent}</span></td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#eab308' }}>{item.late + item.leave}</span></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        {isShort && <AlertTriangle size={16} color="#f43f5e" title="Short Attendance Warning" />}
                        <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, background: isShort ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: isShort ? '#f43f5e' : '#10b981' }}>{item.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 4: EXAMS & GRADES ── */}
      {activeTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* CGPA Banner */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Cumulative Academic Performance</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Live CGPA calculated across all graded semester courses.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Overall CGPA</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>{cgpa}</span>
                  <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 700 }}>/ 4.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Grades Grid */}
          {gradesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 className="animate-spin" color="#6366f1" size={28} /></div>
          ) : gradesSummary.length === 0 ? (
            <p style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>No examination records published for your courses yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
              {gradesSummary.map(({ course, assessments, cumulativeScore, grade, gpa }) => (
                <div key={course.id} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <span style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, color: '#6366f1', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{course.code}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>{course.creditHours} Credits</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>{course.title}</h3>

                  {/* Assessments breakdown list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, flex: 1 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment Breakdown</span>
                    {assessments.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No assessments graded yet.</p>
                    ) : assessments.map(item => (
                      <div key={item.assessmentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.title}</p>
                          <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.type} • {item.weightage}% Weight</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#1e293b' }}>{item.marksObtained}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}> / {item.totalMarks}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Course Summary Footer */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Weighted Score</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{cumulativeScore}%</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Grade</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: grade === 'A' || grade === 'A-' ? '#10b981' : grade.startsWith('B') ? '#6366f1' : grade.startsWith('C') ? '#eab308' : '#f43f5e', marginTop: 2 }}>{grade}</p>
                      </div>
                      <div style={{ height: 32, width: 1, background: '#e2e8f0' }} />
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>GPA</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{gpa.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: CLASS SCHEDULE / TIMETABLE ── */}
      {activeTab === 'timetable' && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Weekly Lecture Schedule</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Showing scheduled timetable slots for your enrolled subjects.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={thStyle}>Day & Time</th>
                <th style={thStyle}>Course Details</th>
                <th style={thStyle}>Instructor</th>
                <th style={thStyle}>Room / Venue</th>
              </tr>
            </thead>
            <tbody>
              {timetable.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No timetable slots scheduled for your courses.</td></tr>
              ) : timetable.map(slot => (
                <tr key={slot._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{slot.day}</p>
                    <p style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Clock size={13} color="#6366f1" /> {slot.startTime} - {slot.endTime}</p>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: 6 }}>{slot.course?.code}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{slot.course?.title}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}><User size={14} color="#94a3b8" /> {slot.course?.faculty?.name || 'Assigned Staff'}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f172a' }}><MapPin size={14} color="#6366f1" /> {slot.room}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 6: NOTICE BOARD ── */}
      {activeTab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Campus Announcements</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Stay updated with the latest news, schedules, and alerts.</p>
          </div>

          {noticesLoading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 className="animate-spin" color="#6366f1" size={28} /></div>
          ) : notices.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0' }}>
              <Megaphone size={40} color="#cbd5e1" style={{ marginBottom: 16 }} />
              <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>No recent announcements.</p>
            </div>
          ) : (
            notices.map(notice => {
              const urgencyProps = notice.urgency === 'Urgent' ? { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', icon: AlertTriangle } : notice.urgency === 'High' ? { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: BellRing } : { bg: 'rgba(56,189,248,0.1)', color: '#0ea5e9', icon: Info };
              const UIcon = urgencyProps.icon;
              return (
                <div key={notice._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.12)', padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: urgencyProps.bg, color: urgencyProps.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UIcon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{notice.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(notice.createdAt).toLocaleString()}</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>By {notice.author?.name || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notice.content}</p>
                </div>
              );
            })
          )}
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

const detailLabelStyle = { fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 };
const detailValueStyle = { fontSize: 15, fontWeight: 600, color: '#0f172a' };
const thStyle = { padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' };
const tdStyle = { padding: '16px 24px', verticalAlign: 'middle' };
