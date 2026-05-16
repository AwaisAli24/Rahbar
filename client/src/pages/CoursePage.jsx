import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Trash2, GraduationCap, 
  User, Clock, Building2, Loader2, X, ChevronRight,
  UserPlus, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CoursePage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Enrollment State
  const [enrolledStudentIds, setEnrolledStudentIds] = useState([]);
  const [enrollSearch, setEnrollSearch] = useState('');

  // Form State
  const [form, setForm] = useState({
    title: '', code: '', creditHours: 3, 
    department: '', faculty: '', description: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes, facultyRes, studentsRes] = await Promise.all([
        fetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users?role=faculty', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users?role=student', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const courseData = await courseRes.json();
      const facultyData = await facultyRes.json();
      const studentsData = await studentsRes.json();
      
      if (courseData.success) setCourses(courseData.data);
      if (facultyData.success) setFacultyList(facultyData.data);
      if (studentsData.success) setStudentsList(studentsData.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create course');
      
      setShowModal(false);
      setForm({ title: '', code: '', creditHours: 3, department: '', faculty: '', description: '' });
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEnrollSubmit = async () => {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/courses/${selectedCourse._id}/enroll`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentIds: enrolledStudentIds })
      });
      if (res.ok) {
        setShowEnrollModal(false);
        fetchData();
      }
    } catch (err) {
      alert('Enrollment failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const openEnrollModal = (course) => {
    setSelectedCourse(course);
    setEnrolledStudentIds(course.students.map(s => s._id || s));
    setShowEnrollModal(true);
  };

  const toggleStudentSelection = (id) => {
    setEnrolledStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Course Catalog</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage academic subjects and student enrollments.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
            fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.20)'
          }}
        >
          <Plus size={16} /> Create Course
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Loader2 className="animate-spin" color="#6366f1" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {courses.map(course => (
            <div key={course._id} style={{ 
              background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)',
              padding: 24, position: 'relative', transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ 
                  padding: '6px 12px', background: 'rgba(99,102,241,0.06)', 
                  borderRadius: 8, color: '#6366f1', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' 
                }}>
                  {course.code}
                </div>
                <button 
                  onClick={() => handleDelete(course._id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{course.title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20, flex: 1 }}>{course.description || 'No description provided for this course.'}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={14} color="#64748b" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Instructor</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{course.faculty?.name || 'Unassigned'}</p>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12 }}>
                    <Clock size={14} /> {course.creditHours} Credits
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12 }}>
                    <GraduationCap size={14} /> {course.students?.length || 0} Enrolled
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => openEnrollModal(course)}
                  style={{ 
                    flex: 1, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', 
                    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <UserPlus size={14} /> Enroll
                </button>
                <button style={{ 
                  padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', 
                  borderRadius: 10, color: '#475569', cursor: 'pointer'
                }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enroll Students Modal */}
      {showEnrollModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 500, background: '#fff', borderRadius: 24,
            padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', animation: 'modalSlide 0.3s ease-out'
          }}>
            <button onClick={() => setShowEnrollModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Enroll Students</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Select students to enroll in <b>{selectedCourse?.code}</b></p>

            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 10, 
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, 
              padding: '0 12px', marginBottom: 16
            }}>
              <Search size={14} color="#94a3b8" />
              <input 
                placeholder="Search students..." 
                value={enrollSearch}
                onChange={e => setEnrollSearch(e.target.value)}
                style={{ width: '100%', height: 40, background: 'none', border: 'none', outline: 'none', fontSize: 13.5 }}
              />
            </div>

            <div style={{ 
              maxHeight: 300, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 12,
              padding: 4
            }}>
              {studentsList
                .filter(s => s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || s.campusID.toLowerCase().includes(enrollSearch.toLowerCase()))
                .map(student => {
                  const isSelected = enrolledStudentIds.includes(student._id);
                  return (
                    <div 
                      key={student._id}
                      onClick={() => toggleStudentSelection(student._id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                        background: isSelected ? 'rgba(99,102,241,0.05)' : 'transparent',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6366f1' }}>
                          {student.name[0]}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{student.name}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8' }}>{student.campusID}</p>
                        </div>
                      </div>
                      {isSelected ? <CheckCircle2 size={18} color="#6366f1" fill="rgba(99,102,241,0.1)" /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0' }} />}
                    </div>
                  );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}><b>{enrolledStudentIds.length}</b> students selected</p>
              <button 
                disabled={formLoading}
                onClick={handleEnrollSubmit}
                style={{
                  padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', 
                  borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
              >
                {formLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 500, background: '#fff', borderRadius: 24,
            padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', animation: 'modalSlide 0.3s ease-out'
          }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Create New Course</h2>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Code</label>
                  <input required style={inputStyle} value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="CS101" />
                </div>
                <div>
                  <label style={labelStyle}>Course Title</label>
                  <input required style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Introduction to Programming" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Credit Hours</label>
                  <select style={inputStyle} value={form.creditHours} onChange={e => setForm({...form, creditHours: parseInt(e.target.value)})}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select required style={inputStyle} value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="">Select Dept</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Business School">Business School</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Assigned Instructor</label>
                <select required style={inputStyle} value={form.faculty} onChange={e => setForm({...form, faculty: e.target.value})}>
                  <option value="">Select Faculty Member</option>
                  {facultyList.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.campusID})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, height: 80, paddingTop: 10, resize: 'none' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Course objectives and curriculum overview..." />
              </div>

              {formError && <p style={{ fontSize: 13, color: '#f43f5e', background: 'rgba(244,63,94,0.06)', padding: '12px 16px', borderRadius: 12 }}>{formError}</p>}

              <button disabled={formLoading} style={{
                marginTop: 8, padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: 15, cursor: formLoading ? 'not-allowed' : 'pointer'
              }}>
                {formLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create Subject'}
              </button>
            </form>
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

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', height: 44, padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'all 0.2s' };
