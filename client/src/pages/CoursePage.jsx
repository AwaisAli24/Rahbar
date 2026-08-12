import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Trash2, GraduationCap, 
  Users, Clock, Building2, Loader2, X,
  UserPlus, CheckCircle2, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CoursePage() {
  const { token } = useAuth();
  const [courses, setCourses]         = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading]         = useState(true);

  // Create course modal
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ title:'', code:'', creditHours:3, department:'', faculty:[], description:'' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState('');
  const [facultySearch, setFacultySearch] = useState('');

  // Enroll students modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse]   = useState(null);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState([]);
  const [enrollSearch, setEnrollSearch]       = useState('');
  const [enrollLoading, setEnrollLoading]     = useState(false);

  // Faculty assign modal (for existing courses)
  const [showFacultyModal, setShowFacultyModal]   = useState(false);
  const [facultyCourseTarget, setFacultyCourseTarget] = useState(null);
  const [selectedFacultyIds, setSelectedFacultyIds]   = useState([]);
  const [facAssignSearch, setFacAssignSearch]     = useState('');
  const [facAssignLoading, setFacAssignLoading]   = useState(false);

  /* ─── Fetch ─── */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, fRes, sRes] = await Promise.all([
        fetch('/api/courses',           { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users?role=faculty', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users?role=student', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      const [cd, fd, sd] = await Promise.all([cRes.json(), fRes.json(), sRes.json()]);
      if (cd.success) setCourses(cd.data);
      if (fd.success) setFacultyList(fd.data);
      if (sd.success) setStudentsList(sd.data);
    } catch { console.error('Failed to fetch data'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [token]);

  /* ─── Create course ─── */
  const handleCreateCourse = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    try {
      const res  = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create course');
      setShowModal(false); setForm({ title:'', code:'', creditHours:3, department:'', faculty:[], description:'' }); setFacultySearch('');
      fetchData();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  /* ─── Toggle faculty in create-form list ─── */
  const toggleFacultyInForm = (id) => {
    setForm(prev => ({
      ...prev,
      faculty: prev.faculty.includes(id) ? prev.faculty.filter(f => f !== id) : [...prev.faculty, id],
    }));
  };

  /* ─── Faculty assign modal (edit) ─── */
  const openFacultyModal = (course) => {
    setFacultyCourseTarget(course);
    setSelectedFacultyIds((course.faculty || []).map(f => f._id || f));
    setFacAssignSearch('');
    setShowFacultyModal(true);
  };

  const handleFacultyAssignSave = async () => {
    setFacAssignLoading(true);
    try {
      const res = await fetch(`/api/courses/${facultyCourseTarget._id}/faculty`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ facultyIds: selectedFacultyIds }),
      });
      if (res.ok) { setShowFacultyModal(false); fetchData(); }
      else { const d = await res.json(); alert(d.message || 'Update failed'); }
    } catch { alert('Update failed'); }
    finally { setFacAssignLoading(false); }
  };

  const toggleFacultyAssign = (id) =>
    setSelectedFacultyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  /* ─── Enroll students ─── */
  const openEnrollModal = (course) => {
    setSelectedCourse(course);
    setEnrolledStudentIds(course.students.map(s => s._id || s));
    setEnrollSearch(''); setShowEnrollModal(true);
  };

  const handleEnrollSubmit = async () => {
    setEnrollLoading(true);
    try {
      const res = await fetch(`/api/courses/${selectedCourse._id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ studentIds: enrolledStudentIds }),
      });
      if (res.ok) { setShowEnrollModal(false); fetchData(); }
    } catch { alert('Enrollment failed'); }
    finally { setEnrollLoading(false); }
  };

  const toggleStudent = (id) =>
    setEnrolledStudentIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  /* ─── Delete ─── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
      if (res.ok) fetchData();
    } catch { alert('Delete failed'); }
  };

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div style={{ animation:'fadeIn 0.4s ease-out' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>Course Catalog</h1>
          <p style={{ color:'#64748b', fontSize:14, marginTop:4 }}>Manage academic subjects and student enrollments.</p>
        </div>
        <button
          onClick={() => { setForm({ title:'', code:'', creditHours:3, department:'', faculty:[], description:'' }); setFacultySearch(''); setFormError(''); setShowModal(true); }}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:13.5, cursor:'pointer', boxShadow:'0 4px 12px rgba(99,102,241,0.20)' }}
        >
          <Plus size={16}/> Create Course
        </button>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:100 }}><Loader2 className="animate-spin" color="#6366f1"/></div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign:'center', padding:80, color:'#94a3b8' }}>No courses yet. Create one!</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:24 }}>
          {courses.map(course => {
            const assignedFaculty = Array.isArray(course.faculty) ? course.faculty : (course.faculty ? [course.faculty] : []);
            return (
              <div key={course._id} style={{ background:'#fff', borderRadius:20, border:'1px solid rgba(99,102,241,0.08)', padding:24, position:'relative', boxShadow:'0 1px 3px rgba(0,0,0,0.02)', display:'flex', flexDirection:'column' }}>
                {/* Top row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ padding:'6px 12px', background:'rgba(99,102,241,0.06)', borderRadius:8, color:'#6366f1', fontSize:12, fontWeight:700, fontFamily:'monospace' }}>
                    {course.code}
                  </div>
                  <button onClick={() => handleDelete(course._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1' }}
                    onMouseEnter={e => e.currentTarget.style.color='#f43f5e'}
                    onMouseLeave={e => e.currentTarget.style.color='#cbd5e1'}>
                    <Trash2 size={16}/>
                  </button>
                </div>

                <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:6 }}>{course.title}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.5, marginBottom:16, flex:1 }}>{course.description || 'No description provided.'}</p>

                {/* Faculty section */}
                <div style={{ background:'#f8fafc', borderRadius:12, padding:'12px 14px', marginBottom:14, border:'1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: assignedFaculty.length ? 10 : 0 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      Instructors ({assignedFaculty.length})
                    </p>
                    <button
                      onClick={() => openFacultyModal(course)}
                      style={{ fontSize:11, fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}
                    >
                      Manage
                    </button>
                  </div>
                  {assignedFaculty.length === 0 ? (
                    <p style={{ fontSize:12, color:'#cbd5e1', fontStyle:'italic' }}>No faculty assigned</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {assignedFaculty.map(f => (
                        <div key={f._id || f} style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:26, height:26, borderRadius:8, background:'rgba(99,102,241,0.08)', color:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>
                            {(f.name || '?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                          <div>
                            <p style={{ fontSize:12.5, fontWeight:600, color:'#1e293b' }}>{f.name || f}</p>
                            {f.designation && <p style={{ fontSize:11, color:'#94a3b8' }}>{f.designation}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', fontSize:12 }}>
                    <Clock size={14}/> {course.creditHours} Credits
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'#64748b', fontSize:12 }}>
                    <GraduationCap size={14}/> {course.students?.length || 0} Enrolled
                  </div>
                </div>

                {/* Action button */}
                <button onClick={() => openEnrollModal(course)}
                  style={{ width:'100%', padding:'10px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <UserPlus size={14}/> Enroll Students
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ Create Course Modal ══════════ */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }}>
          <div style={{ width:'100%', maxWidth:560, background:'#fff', borderRadius:24, padding:36, boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', position:'relative', animation:'modalSlide 0.3s ease-out', maxHeight:'90dvh', overflowY:'auto' }}>
            <button onClick={() => setShowModal(false)} style={{ position:'absolute', top:24, right:24, background:'#f1f5f9', border:'none', borderRadius:'50%', padding:8, cursor:'pointer', color:'#64748b' }}><X size={18}/></button>
            <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:24 }}>Create New Course</h2>

            <form onSubmit={handleCreateCourse} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Code + Title */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Code</label>
                  <input required style={inputStyle} value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="CS101"/>
                </div>
                <div>
                  <label style={labelStyle}>Course Title</label>
                  <input required style={inputStyle} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Introduction to Programming"/>
                </div>
              </div>

              {/* Credits + Dept */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={labelStyle}>Credit Hours</label>
                  <select style={inputStyle} value={form.creditHours} onChange={e=>setForm({...form,creditHours:parseInt(e.target.value)})}>
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select required style={inputStyle} value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>
                    <option value="">Select Dept</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Business School">Business School</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              </div>

              {/* Faculty multi-select */}
              <div>
                <label style={labelStyle}>
                  Assign Instructors
                  {form.faculty.length > 0 && (
                    <span style={{ marginLeft:8, fontSize:11, fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.08)', padding:'1px 8px', borderRadius:10 }}>
                      {form.faculty.length} selected
                    </span>
                  )}
                </label>
                <div style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 12px', borderBottom:'1px solid #f1f5f9' }}>
                    <Search size={13} color="#94a3b8"/>
                    <input placeholder="Search faculty..." value={facultySearch} onChange={e=>setFacultySearch(e.target.value)}
                      style={{ width:'100%', height:36, background:'none', border:'none', outline:'none', fontSize:13 }}/>
                  </div>
                  <div style={{ maxHeight:180, overflowY:'auto', padding:4 }}>
                    {facultyList
                      .filter(f=>f.name.toLowerCase().includes(facultySearch.toLowerCase()))
                      .map(f => {
                        const sel = form.faculty.includes(f._id);
                        return (
                          <div key={f._id} onClick={()=>toggleFacultyInForm(f._id)}
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, cursor:'pointer', background:sel?'rgba(99,102,241,0.05)':'transparent', transition:'all 0.12s' }}
                          >
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:30, height:30, borderRadius:8, background:'rgba(99,102,241,0.08)', color:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>
                                {f.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                              </div>
                              <div>
                                <p style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{f.name}</p>
                                <p style={{ fontSize:11, color:'#94a3b8' }}>{f.designation || f.campusID}</p>
                              </div>
                            </div>
                            {sel ? <CheckCircle2 size={17} color="#6366f1" fill="rgba(99,102,241,0.1)"/> : <div style={{ width:17, height:17, borderRadius:'50%', border:'2px solid #e2e8f0' }}/>}
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{...inputStyle,height:80,paddingTop:10,resize:'none'}} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Course objectives and curriculum overview..."/>
              </div>

              {formError && <p style={{ fontSize:13, color:'#f43f5e', background:'rgba(244,63,94,0.06)', padding:'12px 16px', borderRadius:12 }}>{formError}</p>}

              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="button" onClick={()=>setShowModal(false)} style={{ flex:1, padding:'12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontWeight:600, color:'#64748b', cursor:'pointer' }}>Cancel</button>
                <button disabled={formLoading} style={{ flex:2, padding:'12px', background:'#6366f1', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:formLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {formLoading?<Loader2 size={18} className="animate-spin"/>:'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Manage Faculty Modal ══════════ */}
      {showFacultyModal && (
        <div style={{ position:'fixed', inset:0, zIndex:110, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }}>
          <div style={{ width:'100%', maxWidth:460, background:'#fff', borderRadius:24, padding:32, boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', position:'relative', animation:'modalSlide 0.3s ease-out', maxHeight:'80dvh', overflowY:'auto' }}>
            <button onClick={()=>setShowFacultyModal(false)} style={{ position:'absolute', top:20, right:20, background:'#f1f5f9', border:'none', borderRadius:'50%', padding:8, cursor:'pointer', color:'#64748b' }}><X size={16}/></button>
            <h2 style={{ fontSize:19, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Manage Instructors</h2>
            <p style={{ color:'#64748b', fontSize:13.5, marginBottom:20 }}>
              Assign faculty to <strong>{facultyCourseTarget?.code} — {facultyCourseTarget?.title}</strong>
            </p>

            <div style={{ border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 12px', borderBottom:'1px solid #f1f5f9' }}>
                <Search size={13} color="#94a3b8"/>
                <input placeholder="Search faculty..." value={facAssignSearch} onChange={e=>setFacAssignSearch(e.target.value)}
                  style={{ width:'100%', height:36, background:'none', border:'none', outline:'none', fontSize:13 }}/>
              </div>
              <div style={{ maxHeight:260, overflowY:'auto', padding:4 }}>
                {facultyList
                  .filter(f=>f.name.toLowerCase().includes(facAssignSearch.toLowerCase()))
                  .map(f => {
                    const sel = selectedFacultyIds.includes(f._id);
                    return (
                      <div key={f._id} onClick={()=>toggleFacultyAssign(f._id)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:8, cursor:'pointer', background:sel?'rgba(99,102,241,0.05)':'transparent', transition:'all 0.12s' }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:'rgba(99,102,241,0.08)', color:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>
                            {f.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                          <div>
                            <p style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{f.name}</p>
                            <p style={{ fontSize:11, color:'#94a3b8' }}>{f.designation || f.department}</p>
                          </div>
                        </div>
                        {sel ? <CheckCircle2 size={18} color="#6366f1" fill="rgba(99,102,241,0.1)"/> : <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid #e2e8f0' }}/>}
                      </div>
                    );
                  })
                }
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:13, color:'#64748b' }}><b>{selectedFacultyIds.length}</b> instructor(s) selected</p>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setShowFacultyModal(false)} style={{ padding:'9px 18px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, fontWeight:600, color:'#64748b', cursor:'pointer' }}>Cancel</button>
                <button disabled={facAssignLoading} onClick={handleFacultyAssignSave}
                  style={{ padding:'9px 22px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:facAssignLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  {facAssignLoading?<Loader2 size={16} className="animate-spin"/>:'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ Enroll Students Modal ══════════ */}
      {showEnrollModal && (
        <div style={{ position:'fixed', inset:0, zIndex:110, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }}>
          <div style={{ width:'100%', maxWidth:500, background:'#fff', borderRadius:24, padding:32, boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', position:'relative', animation:'modalSlide 0.3s ease-out' }}>
            <button onClick={()=>setShowEnrollModal(false)} style={{ position:'absolute', top:24, right:24, background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={20}/></button>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Enroll Students</h2>
            <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>Select students for <b>{selectedCourse?.code}</b></p>

            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'0 12px', marginBottom:16 }}>
              <Search size={14} color="#94a3b8"/>
              <input placeholder="Search students..." value={enrollSearch} onChange={e=>setEnrollSearch(e.target.value)}
                style={{ width:'100%', height:40, background:'none', border:'none', outline:'none', fontSize:13.5 }}/>
            </div>

            <div style={{ maxHeight:300, overflowY:'auto', border:'1px solid #f1f5f9', borderRadius:12, padding:4 }}>
              {studentsList
                .filter(s => s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || s.campusID.toLowerCase().includes(enrollSearch.toLowerCase()))
                .map(student => {
                  const sel = enrolledStudentIds.includes(student._id);
                  return (
                    <div key={student._id} onClick={()=>toggleStudent(student._id)}
                      style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, cursor:'pointer', background:sel?'rgba(99,102,241,0.05)':'transparent', transition:'all 0.15s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#6366f1' }}>{student.name[0]}</div>
                        <div>
                          <p style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{student.name}</p>
                          <p style={{ fontSize:11, color:'#94a3b8' }}>{student.campusID}</p>
                        </div>
                      </div>
                      {sel ? <CheckCircle2 size={18} color="#6366f1" fill="rgba(99,102,241,0.1)"/> : <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid #e2e8f0' }}/>}
                    </div>
                  );
                })}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:24 }}>
              <p style={{ fontSize:13, color:'#64748b' }}><b>{enrolledStudentIds.length}</b> students selected</p>
              <button disabled={enrollLoading} onClick={handleEnrollSubmit}
                style={{ padding:'10px 24px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                {enrollLoading?<Loader2 size={16} className="animate-spin"/>:'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        @keyframes modalSlide { from{opacity:0;transform:translateY(20px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);} }
        .animate-spin { animation:spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
      `}</style>
    </div>
  );
}

const labelStyle = { display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:6 };
const inputStyle = { width:'100%', height:44, padding:'0 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', transition:'all 0.2s', fontFamily:'inherit' };
