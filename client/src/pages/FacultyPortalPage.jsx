import { useState, useEffect } from 'react';
import { 
  User, BookOpen, Calendar, Clock, MapPin, 
  CheckCircle2, AlertCircle, Users, GraduationCap, 
  Building2, Phone, Mail, Loader2, BarChart2, 
  ChevronRight, ClipboardList, Check, X, Search, 
  FileText, Award, Plus, Trash2, Edit3, AlertTriangle, Megaphone, BellRing, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FacultyPortalPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'courses' | 'attendance' | 'timetable' | 'exams'
  
  // Data State
  const [courses, setCourses] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notices State
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(false);

  // Selected Course for Roster Modal & Sub-tabs
  const [rosterModalCourse, setRosterModalCourse] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Attendance Marker State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState(null);

  // ── Examination & Gradebook State ──
  const [assessments, setAssessments] = useState([]);
  const [gradebook, setGradebook] = useState([]);
  const [totalWeightage, setTotalWeightage] = useState(0);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examsError, setExamsError] = useState(null);
  const [examsSuccess, setExamsSuccess] = useState(null);

  // Create Exam Modal State
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    type: 'Quiz',
    totalMarks: 10,
    weightage: 10,
    date: new Date().toISOString().split('T')[0]
  });
  const [examCreating, setExamCreating] = useState(res => false);

  // Enter Marks Modal State
  const [marksModalExam, setMarksModalExam] = useState(null);
  const [marksRecords, setMarksRecords] = useState([]);
  const [marksSaving, setMarksSaving] = useState(false);

  useEffect(() => {
    const fetchFacultyData = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;
      setLoading(true);
      try {
        const [coursesRes, timeRes] = await Promise.all([
          fetch(`/api/courses?facultyId=${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/timetable?facultyId=${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const coursesData = await coursesRes.json();
        const timeData = await timeRes.json();

        if (coursesData.success) {
          setCourses(coursesData.data || []);
          if (coursesData.data.length > 0 && !selectedCourseId) {
            setSelectedCourseId(coursesData.data[0]._id);
          }
        }
        if (timeData.success) setTimetable(timeData.data || []);
      } catch (err) {
        console.error('Failed to fetch faculty portal data');
      } finally {
        setLoading(false);
      }
    };

    if (token && user) {
      fetchFacultyData();
    }
  }, [token, user]);

  // Fetch Attendance Sheet
  const fetchAttendanceSheet = async (courseId, date) => {
    if (!courseId || !date) return;
    setAttendanceLoading(true);
    setAttendanceError(null);
    setAttendanceSuccess(null);
    try {
      const res = await fetch(`/api/attendance?courseId=${courseId}&date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (data.data && data.data.records) {
          setAttendanceRecords(data.data.records);
        } else {
          const selectedCourse = courses.find(c => c._id === courseId);
          const roster = selectedCourse?.students || [];
          const initialRecords = roster.map(student => ({
            student: student,
            status: 'Present',
            remarks: ''
          }));
          setAttendanceRecords(initialRecords);
        }
      }
    } catch (err) {
      setAttendanceError('Failed to load attendance sheet.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && selectedCourseId && attendanceDate) {
      fetchAttendanceSheet(selectedCourseId, attendanceDate);
    }
  }, [activeTab, selectedCourseId, attendanceDate, courses]);

  // Fetch Examination & Gradebook Data
  const fetchExamsData = async (courseId) => {
    if (!courseId) return;
    setExamsLoading(true);
    setExamsError(null);
    setExamsSuccess(null);
    try {
      const [assessRes, gbRes] = await Promise.all([
        fetch(`/api/assessments?courseId=${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/assessments/gradebook/${courseId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const assessData = await assessRes.json();
      const gbData = await gbRes.json();

      if (assessData.success) setAssessments(assessData.data || []);
      if (gbData.success) {
        setGradebook(gbData.data || []);
        setTotalWeightage(gbData.totalWeightageConfigured || 0);
      }
    } catch (err) {
      setExamsError('Failed to load examination gradebook.');
    } finally {
      setExamsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'exams' && selectedCourseId) {
      fetchExamsData(selectedCourseId);
    }
  }, [activeTab, selectedCourseId]);

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

  // Attendance Handlers
  const handleStatusToggle = (studentId, status) => {
    setAttendanceRecords(prev => prev.map(rec => {
      const id = rec.student?._id || rec.student?.id || rec.student;
      if (id === studentId) return { ...rec, status };
      return rec;
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords(prev => prev.map(rec => {
      const id = rec.student?._id || rec.student?.id || rec.student;
      if (id === studentId) return { ...rec, remarks };
      return rec;
    }));
  };

  const handleBulkMark = (status) => {
    setAttendanceRecords(prev => prev.map(rec => ({ ...rec, status })));
  };

  const handleSaveAttendance = async () => {
    setAttendanceSaving(true);
    setAttendanceError(null);
    setAttendanceSuccess(null);
    try {
      const payloadRecords = attendanceRecords.map(rec => ({
        studentId: rec.student?._id || rec.student?.id || rec.student,
        status: rec.status,
        remarks: rec.remarks || ''
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: selectedCourseId, date: attendanceDate, records: payloadRecords })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save attendance');

      setAttendanceSuccess('Attendance roster recorded successfully!');
      setTimeout(() => setAttendanceSuccess(null), 4000);
    } catch (err) {
      setAttendanceError(err.message);
    } finally {
      setAttendanceSaving(false);
    }
  };

  // ── Exam & Gradebook Handlers ──
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setExamCreating(true);
    setExamsError(null);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          courseId: selectedCourseId,
          ...examForm,
          totalMarks: Number(examForm.totalMarks),
          weightage: Number(examForm.weightage)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create assessment');

      setExamsSuccess(`Assessment "${data.data.title}" created successfully!`);
      setExamModalOpen(false);
      setExamForm({ title: '', type: 'Quiz', totalMarks: 10, weightage: 10, date: new Date().toISOString().split('T')[0] });
      fetchExamsData(selectedCourseId);
      setTimeout(() => setExamsSuccess(null), 4000);
    } catch (err) {
      setExamsError(err.message);
    } finally {
      setExamCreating(false);
    }
  };

  const handleDeleteExam = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove all student marks for this exam.`)) return;
    try {
      const res = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setExamsSuccess(`Assessment "${title}" removed.`);
        fetchExamsData(selectedCourseId);
        setTimeout(() => setExamsSuccess(null), 4000);
      }
    } catch (err) {
      setExamsError('Failed to delete assessment');
    }
  };

  const openMarksModal = (exam) => {
    setMarksModalExam(exam);
    // Clone records for editing
    const cloned = (exam.records || []).map(r => ({
      studentId: r.student?._id || r.student?.id || r.student,
      studentName: r.student?.name || 'Student',
      campusID: r.student?.campusID || 'ID',
      marksObtained: r.marksObtained || 0,
      remarks: r.remarks || ''
    }));
    setMarksRecords(cloned);
  };

  const handleMarkChange = (studentId, val) => {
    setMarksRecords(prev => prev.map(rec => {
      if (rec.studentId === studentId) {
        return { ...rec, marksObtained: val };
      }
      return rec;
    }));
  };

  const handleExamRemarkChange = (studentId, val) => {
    setMarksRecords(prev => prev.map(rec => {
      if (rec.studentId === studentId) {
        return { ...rec, remarks: val };
      }
      return rec;
    }));
  };

  const handleSaveMarks = async () => {
    setMarksSaving(true);
    setExamsError(null);
    try {
      const payloadRecords = marksRecords.map(rec => ({
        studentId: rec.studentId,
        marksObtained: Number(rec.marksObtained) || 0,
        remarks: rec.remarks || ''
      }));

      const res = await fetch(`/api/assessments/${marksModalExam._id}/marks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ records: payloadRecords })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update marks');

      setExamsSuccess(`Marks updated for "${marksModalExam.title}" successfully!`);
      setMarksModalExam(null);
      fetchExamsData(selectedCourseId);
      setTimeout(() => setExamsSuccess(null), 4000);
    } catch (err) {
      setExamsError(err.message);
    } finally {
      setMarksSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Loader2 className="animate-spin" color="#6366f1" size={36} /></div>;
  }

  // Calculate overall metrics
  const totalEnrolledStudents = courses.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  const totalTeachingHours = courses.reduce((sum, c) => sum + c.creditHours, 0);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Top Banner / Faculty Identity Card */}
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
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FC'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{user?.name}</h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 10px', borderRadius: 8, fontFamily: 'monospace' }}>
                {user?.campusID || 'FACULTY'}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span><Mail size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> {user?.email}</span>
              <span><Building2 size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> {user?.department || 'Computer Science'}</span>
              <span><Users size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} /> {user?.designation || 'Assistant Professor'}</span>
            </p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Subjects</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{courses.length}</p>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Enrolled</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#6366f1', marginTop: 2 }}>{totalEnrolledStudents}</p>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Weekly Hours</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{totalTeachingHours} hrs</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', padding: '0 8px 12px', overflowX: 'auto' }}>
        {[
          { id: 'overview',   label: 'Faculty Overview',  icon: BookOpen },
          { id: 'courses',    label: 'Assigned Courses',  icon: GraduationCap },
          { id: 'attendance', label: 'Mark Attendance',   icon: ClipboardList },
          { id: 'exams',      label: 'Gradebook & Exams', icon: Award },
          { id: 'timetable',  label: 'Teaching Schedule', icon: Calendar },
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

      {/* ── TAB 1: FACULTY OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Left Column: Assigned Courses Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My Teaching Allocations</h2>
                <button onClick={() => setActiveTab('courses')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>View Details <ChevronRight size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {courses.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>No courses assigned for this semester yet.</p>
                ) : courses.map(course => (
                  <div key={course._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '4px 10px', borderRadius: 8 }}>{course.code}</span>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{course.title}</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{course.creditHours} Credit Hours • Department of {course.department}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setRosterModalCourse(course)}
                      style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', background: '#fff', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Users size={14} /> {course.students?.length || 0} Students
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Timetable Quick Widget */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Upcoming Lectures</h2>
                <button onClick={() => setActiveTab('timetable')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>View Full Schedule <ChevronRight size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {timetable.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>No teaching slots scheduled in the timetable yet.</p>
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

          {/* Right Column: Faculty Profile Details */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', height: 'fit-content' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Professional Identity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={detailLabelStyle}>Full Name</p>
                <p style={detailValueStyle}>{user?.name}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Faculty ID</p>
                <p style={detailValueStyle}>{user?.campusID || 'FAC-CS-001'}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Official Email</p>
                <p style={detailValueStyle}>{user?.email}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Academic Rank</p>
                <p style={detailValueStyle}>{user?.designation || 'Assistant Professor'}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>Primary Department</p>
                <p style={detailValueStyle}>{user?.department || 'Computer Science'}</p>
              </div>
              <div>
                <p style={detailLabelStyle}>System Role</p>
                <p style={{ ...detailValueStyle, textTransform: 'capitalize', color: '#6366f1' }}>{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ASSIGNED COURSES ── */}
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
              
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
                  <Users size={16} color="#6366f1" /> <b>{course.students?.length || 0}</b> Enrolled
                </div>
                <button 
                  onClick={() => setRosterModalCourse(course)}
                  style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                >
                  View Roster
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: DAILY ATTENDANCE MARKER ── */}
      {activeTab === 'attendance' && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', padding: 32 }}>
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Select Assigned Course</label>
              <select 
                style={inputStyle} 
                value={selectedCourseId} 
                onChange={e => setSelectedCourseId(e.target.value)}
              >
                {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
              </select>
            </div>

            <div style={{ width: 220 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Attendance Date</label>
              <input 
                type="date" 
                style={inputStyle} 
                value={attendanceDate} 
                onChange={e => setAttendanceDate(e.target.value)} 
              />
            </div>

            <button 
              onClick={handleSaveAttendance}
              disabled={attendanceSaving || attendanceRecords.length === 0}
              style={{
                height: 44, padding: '0 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: (attendanceSaving || attendanceRecords.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {attendanceSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Attendance
            </button>
          </div>

          {/* Status Messages */}
          {attendanceSuccess && (
            <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600, fontSize: 14 }}>
              <CheckCircle2 size={18} /> {attendanceSuccess}
            </div>
          )}
          {attendanceError && (
            <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', fontWeight: 600, fontSize: 14 }}>
              <AlertCircle size={18} /> {attendanceError}
            </div>
          )}

          {/* Bulk Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Student Roster ({attendanceRecords.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleBulkMark('Present')} style={{ ...bulkButtonStyle, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Mark All Present</button>
              <button onClick={() => handleBulkMark('Absent')} style={{ ...bulkButtonStyle, background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>Mark All Absent</button>
            </div>
          </div>

          {/* Attendance Roster Table */}
          {attendanceLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 className="animate-spin" color="#6366f1" size={28} /></div>
          ) : attendanceRecords.length === 0 ? (
            <p style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14, background: '#f8fafc', borderRadius: 16 }}>No students enrolled in this course yet.</p>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={thStyle}>Roll Number</th>
                    <th style={thStyle}>Student Name</th>
                    <th style={thStyle}>Attendance Status</th>
                    <th style={thStyle}>Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(rec => {
                    const student = rec.student || {};
                    const studentId = student._id || student.id || student;
                    return (
                      <tr key={studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>{student.campusID || 'ID'}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.name || 'Student Name'}</span></td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {['Present', 'Absent', 'Late', 'Leave'].map(st => (
                              <button
                                key={st}
                                onClick={() => handleStatusToggle(studentId, st)}
                                style={{
                                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                                  background: rec.status === st 
                                    ? st === 'Present' ? '#10b981' : st === 'Absent' ? '#f43f5e' : '#eab308'
                                    : '#f1f5f9',
                                  color: rec.status === st ? '#fff' : '#64748b',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <input 
                            style={{ ...inputStyle, height: 36, fontSize: 13 }} 
                            placeholder="Optional remark..." 
                            value={rec.remarks || ''} 
                            onChange={e => handleRemarksChange(studentId, e.target.value)} 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: GRADEBOOK & EXAMS ── */}
      {activeTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Controls Bar */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ width: 280 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Select Assigned Course</label>
              <select 
                style={inputStyle} 
                value={selectedCourseId} 
                onChange={e => setSelectedCourseId(e.target.value)}
              >
                {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Configured Weightage</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: totalWeightage > 100 ? '#f43f5e' : '#6366f1' }}>{totalWeightage}%</span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>/ 100%</span>
                </div>
              </div>

              <button 
                onClick={() => setExamModalOpen(true)}
                style={{
                  height: 44, padding: '0 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <Plus size={16} /> Create Assessment
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {examsSuccess && (
            <div style={{ padding: '14px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600, fontSize: 14 }}>
              <CheckCircle2 size={18} /> {examsSuccess}
            </div>
          )}
          {examsError && (
            <div style={{ padding: '14px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', fontWeight: 600, fontSize: 14 }}>
              <AlertCircle size={18} /> {examsError}
            </div>
          )}

          {/* Section 1: Assessment Items Grid */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Assessment Items</h2>
            {examsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="animate-spin" color="#6366f1" size={28} /></div>
            ) : assessments.length === 0 ? (
              <p style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>No assessments created for this course yet. Click "Create Assessment" above to begin grading.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {assessments.map(exam => (
                  <div key={exam._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, color: '#6366f1', fontSize: 12, fontWeight: 700 }}>{exam.type}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>{exam.weightage}% Weightage</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{exam.title}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Total Marks: <b>{exam.totalMarks}</b> • Date: {exam.date}</p>
                    
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button 
                        onClick={() => openMarksModal(exam)}
                        style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(99,102,241,0.2)' }}
                      >
                        <Edit3 size={14} /> Enter Marks
                      </button>
                      <button 
                        onClick={() => handleDeleteExam(exam._id, exam.title)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6 }}
                        title="Delete Assessment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Automated Cumulative Gradebook */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Automated Cumulative Gradebook</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Live calculation of student GPA and Letter Grades based on assessment weightages.</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '6px 12px', borderRadius: 8 }}>
                {gradebook.length} Enrolled Students
              </span>
            </div>

            {examsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Loader2 className="animate-spin" color="#6366f1" size={28} /></div>
            ) : gradebook.length === 0 ? (
              <p style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No student gradebook records generated yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={thStyle}>Roll Number</th>
                    <th style={thStyle}>Student Name</th>
                    <th style={thStyle}>Weighted Score</th>
                    <th style={thStyle}>Letter Grade</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>GPA Points</th>
                  </tr>
                </thead>
                <tbody>
                  {gradebook.map(({ student, cumulativeScore, grade, gpa }) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>{student.campusID || 'ID'}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.name}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{cumulativeScore}%</span></td>
                      <td style={tdStyle}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                          background: grade === 'A' || grade === 'A-' ? 'rgba(16,185,129,0.1)' : grade.startsWith('B') ? 'rgba(99,102,241,0.1)' : grade.startsWith('C') ? 'rgba(234,179,8,0.1)' : 'rgba(244,63,94,0.1)',
                          color: grade === 'A' || grade === 'A-' ? '#10b981' : grade.startsWith('B') ? '#6366f1' : grade.startsWith('C') ? '#eab308' : '#f43f5e'
                        }}>
                          {grade}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}><span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{gpa.toFixed(1)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: TEACHING SCHEDULE ── */}
      {activeTab === 'timetable' && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>My Teaching Timetable</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Showing scheduled lecture slots for your assigned subjects.</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={thStyle}>Day & Time</th>
                <th style={thStyle}>Course Details</th>
                <th style={thStyle}>Room / Venue</th>
              </tr>
            </thead>
            <tbody>
              {timetable.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No timetable slots scheduled for your subjects.</td></tr>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f172a' }}><MapPin size={14} color="#6366f1" /> {slot.room}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB 5: NOTICE BOARD ── */}
      {activeTab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Campus Announcements</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Stay updated with the latest administrative news and faculty alerts.</p>
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

      {/* ── ROSTER MODAL ── */}
      {rosterModalCourse && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 640, background: '#fff', borderRadius: 24,
            padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', animation: 'modalSlide 0.3s ease-out', maxHeight: '85vh', display: 'flex', flexDirection: 'column'
          }}>
            <button onClick={() => setRosterModalCourse(null)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '4px 10px', borderRadius: 8 }}>{rosterModalCourse.code}</span>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{rosterModalCourse.title}</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Enrolled Student Roster ({rosterModalCourse.students?.length || 0} Total)</p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={thStyle}>Roll Number</th>
                    <th style={thStyle}>Student Name</th>
                    <th style={thStyle}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {!rosterModalCourse.students || rosterModalCourse.students.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No students enrolled in this course yet.</td></tr>
                  ) : rosterModalCourse.students.map(student => (
                    <tr key={student._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>{student.campusID || 'ID'}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{student.name}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 13, color: '#64748b' }}>{student.email}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setRosterModalCourse(null)} style={{ padding: '10px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE EXAM MODAL ── */}
      {examModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 500, background: '#fff', borderRadius: 24,
            padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', animation: 'modalSlide 0.3s ease-out'
          }}>
            <button onClick={() => setExamModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Create Assessment Item</h2>
            
            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Assessment Title</label>
                <input style={inputStyle} placeholder="e.g. Midterm Exam, Quiz 1, Assignment 2" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Assessment Type</label>
                  <select style={inputStyle} value={examForm.type} onChange={e => setExamForm({...examForm, type: e.target.value})}>
                    <option value="Quiz">Quiz</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Midterm">Midterm Exam</option>
                    <option value="FinalExam">Final Exam</option>
                    <option value="Project">Project</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Date</label>
                  <input type="date" style={inputStyle} value={examForm.date} onChange={e => setExamForm({...examForm, date: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Total Marks</label>
                  <input type="number" min="1" style={inputStyle} value={examForm.totalMarks} onChange={e => setExamForm({...examForm, totalMarks: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Weightage (%)</label>
                  <input type="number" min="1" max="100" style={inputStyle} value={examForm.weightage} onChange={e => setExamForm({...examForm, weightage: e.target.value})} required />
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setExamModalOpen(false)} style={{ padding: '10px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={examCreating} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: examCreating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
                  {examCreating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ENTER MARKS MODAL ── */}
      {marksModalExam && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 720, background: '#fff', borderRadius: 24,
            padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', animation: 'modalSlide 0.3s ease-out', maxHeight: '85vh', display: 'flex', flexDirection: 'column'
          }}>
            <button onClick={() => setMarksModalExam(null)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '4px 10px', borderRadius: 8 }}>{marksModalExam.type}</span>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>Enter Marks: {marksModalExam.title}</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Total Marks Configured: <b>{marksModalExam.totalMarks}</b> • Weightage: {marksModalExam.weightage}%</p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={thStyle}>Roll Number</th>
                    <th style={thStyle}>Student Name</th>
                    <th style={thStyle}>Marks Obtained</th>
                    <th style={thStyle}>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {marksRecords.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No student records found for this assessment.</td></tr>
                  ) : marksRecords.map(rec => (
                    <tr key={rec.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6 }}>{rec.campusID}</span></td>
                      <td style={tdStyle}><span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{rec.studentName}</span></td>
                      <td style={tdStyle}>
                        <input 
                          type="number" 
                          min="0" 
                          max={marksModalExam.totalMarks}
                          style={{ ...inputStyle, height: 36, width: 100, fontSize: 14, fontWeight: 700, color: '#0f172a' }} 
                          value={rec.marksObtained} 
                          onChange={e => handleMarkChange(rec.studentId, e.target.value)} 
                        />
                      </td>
                      <td style={tdStyle}>
                        <input 
                          style={{ ...inputStyle, height: 36, fontSize: 13 }} 
                          placeholder="Optional feedback..." 
                          value={rec.remarks} 
                          onChange={e => handleExamRemarkChange(rec.studentId, e.target.value)} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setMarksModalExam(null)} style={{ padding: '10px 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveMarks} disabled={marksSaving} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: marksSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}>
                {marksSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Marks
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
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
const inputStyle = { width: '100%', height: 44, padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' };
const bulkButtonStyle = { padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.15s' };
