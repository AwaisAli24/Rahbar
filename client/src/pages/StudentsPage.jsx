import { apiFetch } from '../api';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, UserPlus, Search, Trash2, Pencil,
  Loader2, X, GraduationCap, MapPin, 
  Phone, User as UserIcon, BookOpen,
  Building2, LayoutGrid, Camera, AlertTriangle, ShieldAlert, Edit3, Save, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PROGRAM_DEPT_MAP = {
  'BCS':  'Computer Science',
  'BSSE': 'Computer Science',
  'BSAI': 'Computer Science',
  'BSDS': 'Computer Science',
  'BEE':  'Electrical Engineering',
  'BTE':  'Electrical Engineering',
  'BBA':  'Business School',
  'MBA':  'Business School',
  'BSMA': 'Mathematics',
};

const DEPT_COLORS = {
  'Computer Science':       { bg: 'rgba(99,102,241,0.09)',  text: '#6366f1', border: 'rgba(99,102,241,0.18)' },
  'Electrical Engineering': { bg: 'rgba(245,158,11,0.09)', text: '#d97706', border: 'rgba(245,158,11,0.18)' },
  'Business School':        { bg: 'rgba(16,185,129,0.09)', text: '#059669', border: 'rgba(16,185,129,0.18)' },
  'Mathematics':            { bg: 'rgba(236,72,153,0.09)', text: '#db2777', border: 'rgba(236,72,153,0.18)' },
};

const SEMESTERS = ['All', 1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);

  // Withdrawn tab state
  const [mainTab, setMainTab] = useState('students'); // 'students' | 'withdrawn'
  const [courses, setCourses] = useState([]);
  const [withdrawnData, setWithdrawnData] = useState([]); // [{course, students:[{student, records}]}]
  const [withdrawnLoading, setWithdrawnLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // {courseId, studentId, date, status}
  const [editSaving, setEditSaving] = useState(false);

  const [activeDept, setActiveDept]         = useState('All');
  const [activeSection, setActiveSection]   = useState('All');
  const [activeSemester, setActiveSemester] = useState('All');

  const [form, setForm] = useState({
    name: '', fatherName: '', password: 'password123',
    sessionSeason: 'FA', sessionYear: new Date().getFullYear().toString().slice(-2),
    program: '', section: '', semester: 1,
    department: '', gender: 'male', dob: '',
    phone: '', address: '', role: 'student',
    cgpa: 0.0, concessionType: 'none'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState('');
  const [photoFile, setPhotoFile]     = useState(null);   // File object
  const [photoPreview, setPhotoPreview] = useState(null); // data URL
  const photoInputRef = useRef(null);

  const fetchStudents = async () => {
    try {
      const res = await apiFetch('/api/users?role=student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch (err) {
      console.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [token]);

  // Fetch withdrawn students data
  const fetchWithdrawnStudents = async () => {
    setWithdrawnLoading(true);
    try {
      // Get all courses
      const cRes = await apiFetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
      const cData = await cRes.json();
      if (!cData.success) return;
      setCourses(cData.data || []);

      const FREE_ABSENTS = 4;
      const WITHDRAW_THRESHOLD = 2;

      // For each course, get attendance summary and find withdrawn students
      const results = await Promise.all(
        (cData.data || []).map(async (course) => {
          const sRes = await apiFetch(`/api/attendance/summary/${course._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
          const sData = await sRes.json();
          if (!sData.success) return null;

          const withdrawn = (sData.summary || []).filter(item => item.withdraw);
          if (withdrawn.length === 0) return null;

          // For each withdrawn student, get their session-by-session records
          const studentsWithRecords = await Promise.all(
            withdrawn.map(async (item) => {
              const aRes = await apiFetch(`/api/attendance/student/${item.student.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
              const aData = await aRes.json();
              const courseRecord = aData.success ? (aData.data || []).find(r => r.course.id === course._id || r.course._id === course._id) : null;
              return { ...item, courseRecord };
            })
          );

          return { course, withdrawnStudents: studentsWithRecords };
        })
      );

      setWithdrawnData(results.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch withdrawn data', err);
    } finally {
      setWithdrawnLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === 'withdrawn' && token) fetchWithdrawnStudents();
  }, [mainTab, token]);

  const sectionsForDept = useMemo(() => {
    const src = activeDept === 'All' ? students : students.filter(s => s.department === activeDept);
    const set = new Set(src.map(s => s.section).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [students, activeDept]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchDept    = activeDept     === 'All' || s.department === activeDept;
      const matchSection = activeSection  === 'All' || s.section    === activeSection;
      const matchSem     = activeSemester === 'All' || s.semester   === activeSemester;
      const matchSearch  =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.campusID || '').toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSection && matchSem && matchSearch;
    });
  }, [students, activeDept, activeSection, activeSemester, search]);

  const deptStats = useMemo(() => {
    const map = {};
    students.forEach(s => { map[s.department] = (map[s.department] || 0) + 1; });
    return map;
  }, [students]);

  const resetFilters = () => { setActiveDept('All'); setActiveSection('All'); setActiveSemester('All'); setSearch(''); };
  const filtersActive = activeDept !== 'All' || activeSection !== 'All' || activeSemester !== 'All' || search;

  const handleAddStudent = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    try {
      if (form.concessionType === 'academic_merit' && (!form.cgpa || Number(form.cgpa) < 3.5)) {
        throw new Error('Academic Merit concession requires a CGPA of 3.5 or higher.');
      }
      const submitData = { ...form, session: `${form.sessionSeason}${form.sessionYear}` };
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(submitData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add student');

      // Upload photo if selected
      if (photoFile && data.user?._id) {
        const fd = new FormData();
        fd.append('profilePicture', photoFile);
        await apiFetch(`/api/users/${data.user._id}/photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd
        });
      }

      setShowModal(false);
      setPhotoFile(null); setPhotoPreview(null);
      setForm({ name:'',fatherName:'',password:'password123',session:'',program:'',section:'',semester:1,department:'',gender:'male',dob:'',phone:'',address:'',role:'student',cgpa:0.0,concessionType:'none' });
      fetchStudents();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await apiFetch(`/api/users/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
      if (res.ok) fetchStudents();
    } catch { alert('Delete failed'); }
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setPhotoFile(null);
    setPhotoPreview(student.profilePicture ? `/uploads/profiles/${student.profilePicture}` : null);
    setForm({
      name:student.name||'', fatherName:student.fatherName||'', password:'',
      sessionSeason:student.session?.slice(0,2)||'FA',
      sessionYear:student.session?.slice(2)||new Date().getFullYear().toString().slice(-2),
      program:student.program||'', section:student.section||'', semester:student.semester||1,
      department:student.department||'', gender:student.gender||'male',
      dob:student.dob?student.dob.slice(0,10):'', phone:student.phone||'', address:student.address||'', role:'student',
      cgpa:student.cgpa||0.0, concessionType:student.concessionType||'none'
    });
    setFormError(''); setShowModal(true);
  };

  const handleEditStudent = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    try {
      if (form.concessionType === 'academic_merit' && (!form.cgpa || Number(form.cgpa) < 3.5)) {
        throw new Error('Academic Merit concession requires a CGPA of 3.5 or higher.');
      }
      const res = await apiFetch(`/api/users/${editStudent._id}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body:JSON.stringify({
          name:form.name,fatherName:form.fatherName,phone:form.phone,address:form.address,
          gender:form.gender,dob:form.dob,semester:form.semester,section:form.section,
          cgpa:form.cgpa,concessionType:form.concessionType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message||'Failed to update student');

      // Upload new photo if selected
      if (photoFile) {
        const fd = new FormData();
        fd.append('profilePicture', photoFile);
        await apiFetch(`/api/users/${editStudent._id}/photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd
        });
      }

      setShowModal(false); setEditStudent(null);
      setPhotoFile(null); setPhotoPreview(null);
      fetchStudents();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Reverse Withdrawal handler
  const handleReverseWithdrawal = async (courseId, studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to reverse withdrawal for ${studentName}? This will excuse 2 recent absents, restore the student to active standing, and unlock their attendance in Faculty Portal.`)) return;
    try {
      const res = await apiFetch('/api/attendance/reverse-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId, studentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reverse withdrawal');
      alert(`✔ ${data.message}`);
      fetchWithdrawnStudents();
    } catch (err) {
      alert(`✖ Error: ${err.message}`);
    }
  };

  // Toggle single date status for admin audit
  const handleUpdateRecord = async (courseId, studentId, date, newStatus) => {
    try {
      const res = await apiFetch('/api/attendance/update-record', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId, studentId, date, newStatus, remarks: '[Status updated by Admin]' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update record');
      fetchWithdrawnStudents();
    } catch (err) {
      alert(`✖ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ animation:'fadeIn 0.4s ease-out' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>Students Directory</h1>
          <p style={{ color:'#64748b', fontSize:14, marginTop:4 }}>
            {students.length} total students · Filter by department, section &amp; semester
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Tab Switcher */}
          <div style={{ display:'flex', background:'#f1f5f9', padding:4, borderRadius:12, gap:4 }}>
            <button
              onClick={() => setMainTab('students')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s', background: mainTab==='students' ? '#fff' : 'transparent', color: mainTab==='students' ? '#6366f1' : '#64748b', boxShadow: mainTab==='students' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
            >
              <Users size={15} /> All Students
            </button>
            <button
              onClick={() => setMainTab('withdrawn')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s', background: mainTab==='withdrawn' ? '#fff' : 'transparent', color: mainTab==='withdrawn' ? '#dc2626' : '#64748b', boxShadow: mainTab==='withdrawn' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
            >
              <ShieldAlert size={15} /> Withdrawn Students
            </button>
          </div>
          {mainTab === 'students' && (
            <button
              onClick={() => { setEditStudent(null); setForm({name:'',fatherName:'',password:'password123',sessionSeason:'FA',sessionYear:new Date().getFullYear().toString().slice(-2),program:'',section:'',semester:1,department:'',gender:'male',dob:'',phone:'',address:'',role:'student'}); setFormError(''); setShowModal(true); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:13.5, cursor:'pointer', boxShadow:'0 4px 12px rgba(99,102,241,0.20)', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform=''}
            >
              <UserPlus size={16}/> Enroll New Student
            </button>
          )}
        </div>
      </div>

      {/* ── WITHDRAWN STUDENTS TAB ── */}
      {mainTab === 'withdrawn' && (
        <div style={{ animation:'fadeIn 0.3s ease-out' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:700, color:'#dc2626' }}>⚠ Withdrawn Students &amp; Re-instatement Audit</h2>
              <p style={{ fontSize:13, color:'#64748b', marginTop:2 }}>Track when students were withdrawn per course and reverse withdrawals to restore active standing.</p>
            </div>
            <button
              onClick={fetchWithdrawnStudents}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, fontWeight:600, fontSize:13, cursor:'pointer', color:'#475569' }}
            >
              <RefreshCw size={14} /> Refresh Roster
            </button>
          </div>

          {withdrawnLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Loader2 className="animate-spin" color="#dc2626" size={28} /></div>
          ) : withdrawnData.length === 0 ? (
            <div style={{ textAlign:'center', padding:80, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0' }}>
              <ShieldAlert size={40} color="#94a3b8" style={{ margin:'0 auto 12px' }} />
              <p style={{ fontSize:16, fontWeight:600, color:'#64748b' }}>No withdrawn students found</p>
              <p style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>All enrolled students are within allowed attendance limits.</p>
            </div>
          ) : withdrawnData.map(({ course, withdrawnStudents }) => (
            <div key={course._id} style={{ marginBottom:28, background:'#fff', borderRadius:20, border:'1px solid rgba(220,38,38,0.2)', overflow:'hidden', boxShadow:'0 2px 8px rgba(220,38,38,0.05)' }}>
              {/* Course Header */}
              <div style={{ padding:'16px 24px', background:'linear-gradient(90deg,rgba(220,38,38,0.08),rgba(220,38,38,0.02))', borderBottom:'1px solid rgba(220,38,38,0.12)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <BookOpen size={18} color="#dc2626" />
                  <div>
                    <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>{course.code} — {course.title}</h3>
                    <p style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{withdrawnStudents.length} student(s) currently withdrawn in this subject</p>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
                <thead>
                  <tr style={{ background:'#fafafa', borderBottom:'1px solid #f1f5f9' }}>
                    <th style={{ padding:'12px 20px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Roll No.</th>
                    <th style={{ padding:'12px 20px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Student Name</th>
                    <th style={{ padding:'12px 20px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Withdrawn Date</th>
                    <th style={{ padding:'12px 20px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Absence Breakdown</th>
                    <th style={{ padding:'12px 20px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawnStudents.map((item) => (
                    <tr key={item.student.id} style={{ borderBottom:'1px solid #f8fafc', background:'rgba(220,38,38,0.015)' }}>
                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'#6366f1', fontFamily:'monospace', background:'rgba(99,102,241,0.06)', padding:'2px 8px', borderRadius:6 }}>
                          {item.student.campusID}
                        </span>
                      </td>
                      <td style={{ padding:'16px 20px' }}>
                        <p style={{ fontSize:14, fontWeight:700, color:'#dc2626' }}>{item.student.name}</p>
                        <p style={{ fontSize:11.5, color:'#94a3b8' }}>{item.student.email}</p>
                      </td>
                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:700, color:'#dc2626' }}>
                          <AlertTriangle size={13} />
                          {item.withdrawalDate ? `Withdrawn on ${item.withdrawalDate}` : 'Threshold Reached'}
                        </div>
                        <span style={{ fontSize:11, color:'#94a3b8', marginTop:2, display:'block' }}>
                          Triggered on 7th absent
                        </span>
                      </td>
                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                          <span style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:'rgba(14,165,233,0.1)', color:'#0ea5e9', border:'1px solid rgba(14,165,233,0.2)' }}>
                            Leave: {item.leave}/4
                          </span>
                          <span style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:'rgba(220,38,38,0.12)', color:'#dc2626', border:'1px solid rgba(220,38,38,0.25)' }}>
                            Real Absents: {item.absent}
                          </span>
                          <span style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700, background:'#f1f5f9', color:'#475569' }}>
                            Total: {item.totalAbsents}
                          </span>
                        </div>
                        {/* Dates Tooltip/Pills */}
                        <div style={{ fontSize:11, color:'#64748b', marginTop:6, display:'flex', gap:4, flexWrap:'wrap' }}>
                          <b>Absent Dates:</b>
                          {(item.absenceDates || []).slice(0, 5).map(d => (
                            <span key={d} style={{ background:'#fff', border:'1px solid #cbd5e1', borderRadius:4, padding:'0 5px', fontSize:10.5 }}>{d}</span>
                          ))}
                          {(item.absenceDates || []).length > 5 && (
                            <span style={{ fontSize:10.5, color:'#94a3b8' }}>+{item.absenceDates.length - 5} more</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding:'16px 20px', textAlign:'right' }}>
                        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                          <button
                            onClick={() => handleReverseWithdrawal(course._id, item.student.id, item.student.name)}
                            style={{
                              display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                              background:'#10b981', color:'#fff', border:'none', borderRadius:10,
                              fontWeight:700, fontSize:12.5, cursor:'pointer',
                              boxShadow:'0 2px 6px rgba(16,185,129,0.25)', transition:'all 0.15s'
                            }}
                          >
                            <RefreshCw size={13} /> Reverse Withdrawal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Note */}
              <div style={{ padding:'12px 24px', background:'rgba(16,185,129,0.04)', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
                <ShieldAlert size={14} color="#10b981" />
                <p style={{ fontSize:12, color:'#475569' }}>
                  Clicking <strong>Reverse Withdrawal</strong> will excuse recent absents to bring the student's real absents below 2. This instantly restores active standing and unlocks attendance in Faculty Portal.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN STUDENTS LIST ── */}
      {mainTab === 'students' && (
      <>

      {/* Department Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginBottom:24 }}>
        {/* All */}
        <div
          onClick={() => { setActiveDept('All'); setActiveSection('All'); }}
          style={{ padding:'16px 18px', borderRadius:14, cursor:'pointer', transition:'all 0.18s', background:activeDept==='All'?'#6366f1':'#fff', border:activeDept==='All'?'2px solid #6366f1':'1.5px solid #e2e8f0', boxShadow:activeDept==='All'?'0 6px 20px rgba(99,102,241,0.22)':'0 1px 3px rgba(0,0,0,0.04)', transform:activeDept==='All'?'translateY(-2px)':'' }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <span style={{ fontSize:11, fontWeight:700, color:activeDept==='All'?'rgba(255,255,255,0.8)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>All Depts</span>
            <div style={{ width:30, height:30, borderRadius:8, background:activeDept==='All'?'rgba(255,255,255,0.15)':'rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={14} color={activeDept==='All'?'#fff':'#6366f1'}/>
            </div>
          </div>
          <p style={{ fontSize:26, fontWeight:800, color:activeDept==='All'?'#fff':'#0f172a', marginTop:8 }}>{students.length}</p>
          <p style={{ fontSize:11, color:activeDept==='All'?'rgba(255,255,255,0.7)':'#94a3b8', marginTop:2 }}>Total Students</p>
        </div>

        {/* Per dept */}
        {Object.keys(DEPT_COLORS).map(dept => {
          const clr = DEPT_COLORS[dept];
          const count = deptStats[dept] || 0;
          const active = activeDept === dept;
          return (
            <div
              key={dept}
              onClick={() => { setActiveDept(dept); setActiveSection('All'); }}
              style={{ padding:'16px 18px', borderRadius:14, cursor:'pointer', transition:'all 0.18s', background:active?clr.text:'#fff', border:active?`2px solid ${clr.text}`:`1.5px solid ${clr.border}`, boxShadow:active?`0 6px 20px ${clr.bg.replace('0.09','0.35')}`:'0 1px 3px rgba(0,0,0,0.04)', transform:active?'translateY(-2px)':'' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{ fontSize:11, fontWeight:700, color:active?'rgba(255,255,255,0.8)':clr.text, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {dept.split(' ')[0]}
                </span>
                <div style={{ width:30, height:30, borderRadius:8, background:active?'rgba(255,255,255,0.18)':clr.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Building2 size={14} color={active?'#fff':clr.text}/>
                </div>
              </div>
              <p style={{ fontSize:26, fontWeight:800, color:active?'#fff':'#0f172a', marginTop:8 }}>{count}</p>
              <p style={{ fontSize:11, color:active?'rgba(255,255,255,0.7)':'#94a3b8', marginTop:2 }}>{dept}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ display:'flex', gap:10, marginBottom:16, padding:'10px 12px', background:'#fff', borderRadius:12, border:'1px solid rgba(99,102,241,0.08)', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:'1 1 220px', display:'flex', alignItems:'center', gap:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'0 12px' }}>
          <Search size={15} color="#94a3b8"/>
          <input
            placeholder="Search by name or Roll Number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', height:38, background:'none', border:'none', outline:'none', fontSize:13.5, color:'#0f172a' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}><X size={14}/></button>}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'0 12px', height:40 }}>
          <LayoutGrid size={13} color="#94a3b8"/>
          <label style={{ fontSize:12, fontWeight:700, color:'#94a3b8' }}>Section</label>
          <select value={activeSection} onChange={e => setActiveSection(e.target.value)} style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'#0f172a', fontWeight:600, cursor:'pointer' }}>
            {sectionsForDept.map(s => <option key={s} value={s}>{s==='All'?'All Sections':`Section ${s}`}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'0 12px', height:40 }}>
          <BookOpen size={13} color="#94a3b8"/>
          <label style={{ fontSize:12, fontWeight:700, color:'#94a3b8' }}>Semester</label>
          <select value={activeSemester} onChange={e => setActiveSemester(e.target.value==='All'?'All':Number(e.target.value))} style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'#0f172a', fontWeight:600, cursor:'pointer' }}>
            {SEMESTERS.map(s => <option key={s} value={s}>{s==='All'?'All Semesters':`Semester ${s}`}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
          <span style={{ fontSize:12.5, color:'#94a3b8', whiteSpace:'nowrap' }}>
            Showing <strong style={{ color:'#0f172a' }}>{filteredStudents.length}</strong> of {students.length}
          </span>
          {filtersActive && (
            <button onClick={resetFilters} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.15)', borderRadius:8, fontSize:12, fontWeight:700, color:'#f43f5e', cursor:'pointer' }}>
              <X size={12}/> Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {filtersActive && (
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {activeDept !== 'All' && <Chip label={activeDept} color={DEPT_COLORS[activeDept]?.text||'#6366f1'} onRemove={() => { setActiveDept('All'); setActiveSection('All'); }}/>}
          {activeSection !== 'All' && <Chip label={`Section ${activeSection}`} color="#0ea5e9" onRemove={() => setActiveSection('All')}/>}
          {activeSemester !== 'All' && <Chip label={`Semester ${activeSemester}`} color="#8b5cf6" onRemove={() => setActiveSemester('All')}/>}
          {search && <Chip label={`"${search}"`} color="#f59e0b" onRemove={() => setSearch('')}/>}
        </div>
      )}

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(99,102,241,0.10)', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
              <th style={thStyle}>Student Info</th>
              <th style={thStyle}>Roll Number</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Academic</th>
              <th style={thStyle}>Contact</th>
              <th style={{ ...thStyle, textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:40, textAlign:'center' }}><Loader2 className="animate-spin" style={{ margin:'0 auto', color:'#6366f1' }}/></td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding:60, textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div style={{ width:56, height:56, borderRadius:16, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Users size={24} color="#cbd5e1"/>
                    </div>
                    <p style={{ color:'#94a3b8', fontSize:14, fontWeight:600 }}>No students found</p>
                    <p style={{ color:'#cbd5e1', fontSize:12 }}>Try adjusting your filters</p>
                    {filtersActive && <button onClick={resetFilters} style={{ padding:'6px 16px', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, fontSize:12.5, fontWeight:700, color:'#6366f1', cursor:'pointer' }}>Clear Filters</button>}
                  </div>
                </td>
              </tr>
            ) : filteredStudents.map(student => {
              const clr = DEPT_COLORS[student.department] || DEPT_COLORS['Computer Science'];
              return (
                <tr key={student._id} style={{ borderBottom:'1px solid #f8fafc', transition:'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background=''}
                >
                  <td style={tdStyle}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {student.profilePicture ? (
                        <img
                          src={`/uploads/profiles/${student.profilePicture}`}
                          alt={student.name}
                          style={{ width:40, height:40, borderRadius:10, objectFit:'cover', flexShrink:0, border:`2px solid ${clr.border}` }}
                        />
                      ) : (
                        <div style={{ width:40, height:40, borderRadius:10, background:clr.bg, color:clr.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                        </div>
                      )}
                      <div>
                        <p
                          onClick={() => setViewStudent(student)}
                          style={{ fontSize:14, fontWeight:600, color:'#0f172a', cursor:'pointer' }}
                        >{student.name}</p>
                        <p style={{ fontSize:11.5, color:'#94a3b8' }}>{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize:13, fontWeight:700, color:clr.text, fontFamily:'monospace', background:clr.bg, padding:'3px 10px', borderRadius:6, display:'inline-block' }}>
                      {student.campusID}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11.5, fontWeight:700, background:clr.bg, color:clr.text, border:`1px solid ${clr.border}` }}>
                      <Building2 size={10}/>{student.department?.split(' ')[0]}
                    </span>
                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:4, paddingLeft:2 }}>{student.program}</p>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, background:'rgba(139,92,246,0.07)', color:'#7c3aed' }}>Sem {student.semester}</span>
                      <span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, background:'rgba(14,165,233,0.07)', color:'#0284c7' }}>Sec {student.section}</span>
                      <span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, background:'rgba(100,116,139,0.07)', color:'#64748b' }}>{student.session}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <p style={{ fontSize:12.5, color:'#475569', display:'flex', alignItems:'center', gap:4 }}><Phone size={12} color="#94a3b8"/> {student.phone||'N/A'}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8', display:'flex', alignItems:'center', gap:4, marginTop:2 }}><MapPin size={12} color="#cbd5e1"/> {student.address?.slice(0,22)||'N/A'}{(student.address?.length||0)>22?'...':''}</p>
                  </td>
                  <td style={{ ...tdStyle, textAlign:'right' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
                      <button onClick={() => openEditModal(student)} style={actionBtnStyle} onMouseEnter={e=>{e.currentTarget.style.color='#6366f1';e.currentTarget.style.background='rgba(99,102,241,0.07)';}} onMouseLeave={e=>{e.currentTarget.style.color='#cbd5e1';e.currentTarget.style.background='none';}} title="Edit"><Pencil size={15}/></button>
                      <button onClick={() => handleDelete(student._id)} style={actionBtnStyle} onMouseEnter={e=>{e.currentTarget.style.color='#f43f5e';e.currentTarget.style.background='rgba(244,63,94,0.05)';}} onMouseLeave={e=>{e.currentTarget.style.color='#cbd5e1';e.currentTarget.style.background='none';}} title="Delete"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }}>
          <div style={{ width:'100%', maxWidth:640, background:'#fff', borderRadius:24, padding:36, boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', position:'relative', animation:'modalSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)', maxHeight:'90dvh', overflowY:'auto' }}>
            <button onClick={() => setShowModal(false)} style={{ position:'absolute', top:24, right:24, background:'#f1f5f9', border:'none', borderRadius:'50%', padding:8, cursor:'pointer', color:'#64748b' }}><X size={18}/></button>
            <div style={{ marginBottom:32 }}>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:6 }}>{editStudent?'Edit Student':'Enroll New Student'}</h2>
              <p style={{ color:'#94a3b8', fontSize:14 }}>{editStudent?`Editing ${editStudent.name} — Roll No: ${editStudent.campusID}`:'Roll number and campus email will be generated automatically.'}</p>
            </div>

            <form onSubmit={editStudent?handleEditStudent:handleAddStudent} style={{ display:'flex', flexDirection:'column', gap:24 }}>

              {/* Photo Upload */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange}/>
                <div
                  onClick={() => photoInputRef.current?.click()}
                  style={{ width:90, height:90, borderRadius:'50%', border:'2.5px dashed #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <Camera size={20} color="#94a3b8"/>
                      <span style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>Add Photo</span>
                    </div>
                  )}
                </div>
                {photoPreview && (
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if(photoInputRef.current) photoInputRef.current.value=''; }} style={{ fontSize:11.5, color:'#f43f5e', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Remove Photo</button>
                )}
                <p style={{ fontSize:11, color:'#94a3b8' }}>JPG, PNG or WebP · Max 5MB</p>
              </div>

              <div>
                <h3 style={sectionHeadingStyle}><GraduationCap size={14}/> Academic Information</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                  <div>
                    <label style={labelStyle}>Season</label>
                    <select required style={inputStyle} value={form.sessionSeason} onChange={e=>setForm({...form,sessionSeason:e.target.value})}>
                      <option value="FA">Fall (FA)</option>
                      <option value="SP">Spring (SP)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <select required style={inputStyle} value={form.sessionYear} onChange={e=>setForm({...form,sessionYear:e.target.value})}>
                      {Array.from({length:11},(_,i)=>20+i).map(year=><option key={year} value={year}>{2000+year}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Program</label>
                    <select required style={inputStyle} value={form.program} onChange={e=>{const prog=e.target.value;setForm({...form,program:prog,department:PROGRAM_DEPT_MAP[prog]||''});}}>
                      <option value="">Select</option>
                      {Object.keys(PROGRAM_DEPT_MAP).map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Section</label>
                    <input required style={inputStyle} value={form.section} onChange={e=>setForm({...form,section:e.target.value.toUpperCase()})} placeholder="e.g. A" maxLength={1}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Semester</label>
                    <select style={inputStyle} value={form.semester} onChange={e=>setForm({...form,semester:Number(e.target.value)})}>
                      {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>CGPA</label>
                    <input type="number" step="0.01" min="0" max="4" style={inputStyle} value={form.cgpa} onChange={e=>setForm({...form,cgpa:Number(e.target.value)})} placeholder="e.g. 3.75"/>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
                  <div>
                    <label style={labelStyle}>Concession Type</label>
                    <select style={inputStyle} value={form.concessionType} onChange={e=>setForm({...form,concessionType:e.target.value})}>
                      <option value="none">None</option>
                      <option value="old_student">Old Student (25% discount)</option>
                      <option value="academic_merit">Academic Merit (50% discount · CGPA &ge; 3.5)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Department</label>
                    <input readOnly style={{...inputStyle,background:'#f1f5f9',cursor:'not-allowed',color:'#64748b'}} value={form.department} placeholder="Auto-filled based on program"/>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={sectionHeadingStyle}><UserIcon size={14}/> Personal Details</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div><label style={labelStyle}>Full Name</label><input required style={inputStyle} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Student's Name"/></div>
                  <div><label style={labelStyle}>Father's Name</label><input required style={inputStyle} value={form.fatherName} onChange={e=>setForm({...form,fatherName:e.target.value})} placeholder="Father's Name"/></div>
                  <div><label style={labelStyle}>Date of Birth</label><input required type="date" style={inputStyle} value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})}/></div>
                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select style={inputStyle} value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={sectionHeadingStyle}><Phone size={14}/> Contact Information</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>
                  <div><label style={labelStyle}>Phone Number</label><input required style={inputStyle} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+92 300 1234567"/></div>
                  <div><label style={labelStyle}>Home Address</label><textarea required style={{...inputStyle,height:80,paddingTop:10}} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Complete residential address..."/></div>
                </div>
              </div>

              {formError && <p style={{ fontSize:13, color:'#f43f5e', background:'rgba(244,63,94,0.06)', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(244,63,94,0.15)' }}>{formError}</p>}

              <div style={{ display:'flex', gap:12, marginTop:12 }}>
                <button type="button" onClick={()=>{setShowModal(false);setEditStudent(null);}} style={{ flex:1, padding:'12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontWeight:600, color:'#64748b', cursor:'pointer' }}>Cancel</button>
                <button disabled={formLoading} style={{ flex:2, padding:'12px', background:editStudent?'#0ea5e9':'#6366f1', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:formLoading?'not-allowed':'pointer', boxShadow:editStudent?'0 4px 12px rgba(14,165,233,0.25)':'0 4px 12px rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {formLoading?<Loader2 size={18} className="animate-spin"/>:editStudent?'Save Changes':'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Student Detail Modal ── */}
      {viewStudent && (
        <div
          onClick={() => setViewStudent(null)}
          style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.45)', backdropFilter:'blur(8px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:560, background:'#fff', borderRadius:24, boxShadow:'0 25px 60px rgba(0,0,0,0.18)', position:'relative', animation:'modalSlide 0.28s cubic-bezier(0.34,1.56,0.64,1)', maxHeight:'90dvh', overflowY:'auto' }}
          >
            {/* Coloured top banner */}
            {(() => {
              const clr = DEPT_COLORS[viewStudent.department] || DEPT_COLORS['Computer Science'];
              const initials = viewStudent.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
              return (
                <>
                  <div style={{ height:90, background:`linear-gradient(135deg, ${clr.text}22, ${clr.text}44)`, borderRadius:'24px 24px 0 0', position:'relative' }}>
                    <button
                      onClick={() => setViewStudent(null)}
                      style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.85)', border:'none', borderRadius:'50%', width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569' }}
                    ><X size={16}/></button>
                  </div>

                  {/* Avatar */}
                  <div style={{ display:'flex', justifyContent:'center' }}>
                    {viewStudent.profilePicture ? (
                      <img
                        src={`/uploads/profiles/${viewStudent.profilePicture}`}
                        alt={viewStudent.name}
                        style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', border:'4px solid #fff', marginTop:-45, boxShadow:'0 4px 14px rgba(0,0,0,0.12)' }}
                      />
                    ) : (
                      <div style={{ width:80, height:80, borderRadius:'50%', background:clr.bg, border:`4px solid #fff`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:clr.text, marginTop:-40, boxShadow:'0 4px 14px rgba(0,0,0,0.10)' }}>
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Name + ID */}
                  <div style={{ textAlign:'center', padding:'12px 32px 0' }}>
                    <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{viewStudent.name}</h2>
                    <span style={{ fontSize:13, fontWeight:700, color:clr.text, fontFamily:'monospace', background:clr.bg, padding:'3px 12px', borderRadius:20, display:'inline-block' }}>{viewStudent.campusID}</span>
                  </div>

                  {/* Detail Grid */}
                  <div style={{ padding:'24px 32px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

                    {/* Academic Info */}
                    <DetailCard label="Department" value={viewStudent.department || '—'} color={clr.text}/>
                    <DetailCard label="Program" value={viewStudent.program || '—'} color={clr.text}/>
                    <DetailCard label="Semester" value={viewStudent.semester ? `Semester ${viewStudent.semester}` : '—'} color="#7c3aed"/>
                    <DetailCard label="Section" value={viewStudent.section ? `Section ${viewStudent.section}` : '—'} color="#0284c7"/>
                    <DetailCard label="Session" value={viewStudent.session || '—'} color="#64748b"/>
                    <DetailCard label="Email" value={viewStudent.email || '—'} color="#64748b"/>
                    <DetailCard label="CGPA" value={viewStudent.cgpa !== undefined ? Number(viewStudent.cgpa).toFixed(2) : '0.00'} color="#db2777"/>
                    <DetailCard 
                      label="Concession" 
                      value={
                        viewStudent.concessionType === 'old_student' 
                          ? 'Old Student (25% off)' 
                          : viewStudent.concessionType === 'academic_merit' 
                          ? 'Academic Merit (50% off)' 
                          : 'None'
                      } 
                      color={viewStudent.concessionType && viewStudent.concessionType !== 'none' ? '#10b981' : '#64748b'}
                    />

                    {/* Personal Info */}
                    <DetailCard label="Father's Name" value={viewStudent.fatherName || '—'} color="#64748b"/>
                    <DetailCard label="Gender" value={viewStudent.gender ? (viewStudent.gender.charAt(0).toUpperCase() + viewStudent.gender.slice(1)) : '—'} color="#64748b"/>
                    <DetailCard label="Date of Birth" value={viewStudent.dob ? new Date(viewStudent.dob).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'}) : '—'} color="#64748b"/>
                    <DetailCard label="Phone" value={viewStudent.phone || '—'} color="#64748b"/>

                    {/* Address spans full width */}
                    <div style={{ gridColumn:'1/-1', background:'#f8fafc', borderRadius:12, padding:'12px 16px', border:'1px solid #f1f5f9' }}>
                      <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Address</p>
                      <p style={{ fontSize:13.5, color:'#1e293b', fontWeight:500 }}>{viewStudent.address || '—'}</p>
                    </div>

                  </div>

                  {/* Footer buttons */}
                  <div style={{ padding:'0 32px 28px', display:'flex', gap:10 }}>
                    <button
                      onClick={() => { setViewStudent(null); openEditModal(viewStudent); }}
                      style={{ flex:1, padding:'11px', background:'#6366f1', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 12px rgba(99,102,241,0.22)' }}
                    >Edit Student</button>
                    <button
                      onClick={() => setViewStudent(null)}
                      style={{ flex:1, padding:'11px', background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer' }}
                    >Close</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        @keyframes modalSlide { from{opacity:0;transform:translateY(20px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
        .animate-spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        textarea { resize:none; }
      `}</style>
      </>
      )}
    </div>
  );
}

function Chip({ label, color, onRemove }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px 4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:`${color}18`, color, border:`1px solid ${color}30` }}>
      {label}
      <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color, display:'flex', padding:0 }}><X size={11}/></button>
    </div>
  );
}

function DetailCard({ label, value, color }) {
  return (
    <div style={{ background:'#f8fafc', borderRadius:12, padding:'12px 16px', border:'1px solid #f1f5f9' }}>
      <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:13.5, color: color || '#1e293b', fontWeight:600 }}>{value}</p>
    </div>
  );
}

const thStyle = { padding:'16px 20px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' };
const tdStyle = { padding:'16px 20px', verticalAlign:'middle' };
const actionBtnStyle = { padding:8, borderRadius:8, border:'none', background:'none', cursor:'pointer', color:'#cbd5e1', transition:'all 0.15s' };
const labelStyle = { display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 };
const inputStyle = { width:'100%', height:44, padding:'0 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', transition:'all 0.2s', fontFamily:'inherit' };
const sectionHeadingStyle = { fontSize:12, fontWeight:800, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:16, display:'flex', alignItems:'center', gap:6, borderBottom:'1px solid #f1f5f9', paddingBottom:8 };
