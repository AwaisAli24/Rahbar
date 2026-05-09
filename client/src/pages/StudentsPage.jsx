import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Filter, Trash2, 
  Building2, Loader2, X, GraduationCap, MapPin, 
  Phone, Calendar, User as UserIcon
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

export default function StudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    name: '', fatherName: '', password: 'password123', 
    sessionSeason: 'FA', sessionYear: new Date().getFullYear().toString().slice(-2),
    program: '', section: '', semester: 1,
    department: '', gender: 'male', dob: '', 
    phone: '', address: '', role: 'student'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/users?role=student', {
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

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      // Combine Season and Year into session (e.g., FA + 24 = FA24)
      const submitData = {
        ...form,
        session: `${form.sessionSeason}${form.sessionYear}`
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add student');
      
      setShowModal(false);
      setForm({
        name: '', fatherName: '', password: 'password123', 
        session: '', program: '', section: '', semester: 1,
        department: '', gender: 'male', dob: '', 
        phone: '', address: '', role: 'student'
      });
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchStudents();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.campusID.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Students Directory</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Auto-generating roll numbers and campus emails for all new enrollments.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
            fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.20)', transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
        >
          <UserPlus size={16} /> Enroll New Student
        </button>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', gap: 12, marginBottom: 20, 
        padding: '12px', background: '#fff', borderRadius: 12, 
        border: '1px solid rgba(99,102,241,0.08)' 
      }}>
        <div style={{ 
          flex: 1, display: 'flex', alignItems: 'center', gap: 10, 
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px' 
        }}>
          <Search size={15} color="#94a3b8" />
          <input 
            placeholder="Search by name or Roll Number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', height: 38, background: 'none', border: 'none', 
              outline: 'none', fontSize: 13.5, color: '#0f172a' 
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        background: '#fff', borderRadius: 16, border: '1px solid rgba(99,102,241,0.10)', 
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' 
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={thStyle}>Student Info</th>
              <th style={thStyle}>Roll Number</th>
              <th style={thStyle}>Academic</th>
              <th style={thStyle}>Contact</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#6366f1' }} /></td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No students found.</td></tr>
            ) : filteredStudents.map(student => (
              <tr key={student._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, 
                      background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700
                    }}>{student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{student.name}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>{student.email}</p>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                    {student.campusID}
                  </div>
                </td>
                <td style={tdStyle}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{student.program} - {student.session}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>{student.department} • Sec {student.section}</p>
                </td>
                <td style={tdStyle}>
                  <p style={{ fontSize: 12.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} color="#94a3b8" /> {student.phone || 'N/A'}
                  </p>
                  <p style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={12} color="#cbd5e1" /> {student.address?.slice(0, 20)}...
                  </p>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDelete(student._id)}
                    style={{ 
                      padding: 8, borderRadius: 8, border: 'none', background: 'none', 
                      cursor: 'pointer', color: '#cbd5e1', transition: 'all 0.15s' 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.background = 'rgba(244,63,94,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expandable Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 640, background: '#fff', borderRadius: 24,
            padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', animation: 'modalSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            maxHeight: '90dvh', overflowY: 'auto'
          }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Enroll New Student</h2>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Roll number and campus email will be generated automatically.</p>
            </div>

            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Section: Academic Identity */}
              <div>
                <h3 style={sectionHeadingStyle}><GraduationCap size={14} /> Academic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Season</label>
                    <select required style={inputStyle} value={form.sessionSeason} onChange={e => setForm({...form, sessionSeason: e.target.value})}>
                      <option value="FA">Fall (FA)</option>
                      <option value="SP">Spring (SP)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <select required style={inputStyle} value={form.sessionYear} onChange={e => setForm({...form, sessionYear: e.target.value})}>
                      {Array.from({ length: 11 }, (_, i) => 20 + i).map(year => (
                        <option key={year} value={year}>{2000 + year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Program</label>
                    <select 
                      required 
                      style={inputStyle} 
                      value={form.program} 
                      onChange={e => {
                        const prog = e.target.value;
                        setForm({
                          ...form, 
                          program: prog, 
                          department: PROGRAM_DEPT_MAP[prog] || ''
                        });
                      }}
                    >
                      <option value="">Select</option>
                      {Object.keys(PROGRAM_DEPT_MAP).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Section</label>
                    <input required style={inputStyle} value={form.section} onChange={e => setForm({...form, section: e.target.value.toUpperCase()})} placeholder="e.g. A" maxLength={1} />
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Department</label>
                  <input 
                    readOnly 
                    style={{ ...inputStyle, background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} 
                    value={form.department} 
                    placeholder="Auto-filled based on program" 
                  />
                </div>
              </div>

              {/* Section: Personal Info */}
              <div>
                <h3 style={sectionHeadingStyle}><UserIcon size={14} /> Personal Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input required style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Student's Name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Father's Name</label>
                    <input required style={inputStyle} value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} placeholder="Father's Name" />
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input required type="date" style={inputStyle} value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select style={inputStyle} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Contact */}
              <div>
                <h3 style={sectionHeadingStyle}><Phone size={14} /> Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input required style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+92 300 1234567" />
                  </div>
                  <div>
                    <label style={labelStyle}>Home Address</label>
                    <textarea required style={{ ...inputStyle, height: 80, paddingTop: 10 }} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Complete residential address..." />
                  </div>
                </div>
              </div>

              {formError && <p style={{ fontSize: 13, color: '#f43f5e', background: 'rgba(244,63,94,0.06)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(244,63,94,0.15)' }}>{formError}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                <button disabled={formLoading} style={{
                  flex: 2, padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12,
                  fontWeight: 700, fontSize: 15, cursor: formLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  {formLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea { resize: none; }
      `}</style>
    </div>
  );
}

const thStyle = { padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' };
const tdStyle = { padding: '18px 20px', verticalAlign: 'middle' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', height: 44, padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' };
const sectionHeadingStyle = { fontSize: 12, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 };
