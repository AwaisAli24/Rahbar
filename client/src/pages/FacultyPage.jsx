import { apiFetch } from '../api';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, UserPlus, Search, Trash2, Pencil,
  Building2, Loader2, X, Briefcase,
  Phone, User as UserIcon, BookOpen, Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Department colours (same palette as StudentsPage) ─── */
const DEPT_COLORS = {
  'Computer Science':       { bg: 'rgba(99,102,241,0.09)',  text: '#6366f1', border: 'rgba(99,102,241,0.18)' },
  'Electrical Engineering': { bg: 'rgba(245,158,11,0.09)', text: '#d97706', border: 'rgba(245,158,11,0.18)' },
  'Business School':        { bg: 'rgba(16,185,129,0.09)', text: '#059669', border: 'rgba(16,185,129,0.18)' },
  'Mathematics':            { bg: 'rgba(236,72,153,0.09)', text: '#db2777', border: 'rgba(236,72,153,0.18)' },
};

const DEPARTMENTS = Object.keys(DEPT_COLORS);

const DESIGNATIONS = [
  'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor',
];

const emptyForm = {
  name: '', email: '', password: 'password123',
  department: '', designation: '', specialization: '',
  gender: 'male', phone: '', address: '', role: 'faculty',
};

/* ════════════════════════════════════════════════════════════ */
export default function FacultyPage() {
  const { token } = useAuth();

  const [faculty,      setFaculty]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [activeDept,   setActiveDept]   = useState('All');

  const [showModal,    setShowModal]    = useState(false);
  const [editMember,   setEditMember]   = useState(null); // null = add mode
  const [viewMember,   setViewMember]   = useState(null); // detail view

  const [form,         setForm]         = useState(emptyForm);
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState('');

  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoInputRef = useRef(null);

  /* ─── Fetch ─── */
  const fetchFaculty = async () => {
    try {
      const res  = await apiFetch('/api/users?role=faculty', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setFaculty(data.data);
    } catch { console.error('Failed to fetch faculty'); }
    finally  { setLoading(false); }
  };
  useEffect(() => { fetchFaculty(); }, [token]);

  /* ─── Derived stats ─── */
  const deptStats = useMemo(() => {
    const map = {};
    faculty.forEach(f => { map[f.department] = (map[f.department] || 0) + 1; });
    return map;
  }, [faculty]);

  const filteredFaculty = useMemo(() => faculty.filter(f => {
    const matchDept   = activeDept === 'All' || f.department === activeDept;
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                        (f.campusID || '').toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  }), [faculty, activeDept, search]);

  /* ─── Photo handler ─── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (userId) => {
    if (!photoFile || !userId) return;
    const fd = new FormData();
    fd.append('profilePicture', photoFile);
    await apiFetch(`/api/users/${userId}/photo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd,
    });
  };

  /* ─── Add ─── */
  const handleAddFaculty = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    try {
      const res  = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add faculty');
      await uploadPhoto(data.user?._id);
      setShowModal(false); setPhotoFile(null); setPhotoPreview(null); setForm(emptyForm);
      fetchFaculty();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  /* ─── Edit ─── */
  const openEditModal = (member) => {
    setEditMember(member);
    setPhotoFile(null);
    setPhotoPreview(member.profilePicture ? `/uploads/profiles/${member.profilePicture}` : null);
    setForm({
      name: member.name || '', email: member.email || '', password: '',
      department: member.department || '', designation: member.designation || '',
      specialization: member.specialization || '', gender: member.gender || 'male',
      phone: member.phone || '', address: member.address || '', role: 'faculty',
    });
    setFormError(''); setShowModal(true);
  };

  const handleEditFaculty = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    try {
      const res  = await apiFetch(`/api/users/${editMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name, phone: form.phone, address: form.address,
          gender: form.gender, designation: form.designation, specialization: form.specialization,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      await uploadPhoto(editMember._id);
      setShowModal(false); setEditMember(null); setPhotoFile(null); setPhotoPreview(null);
      fetchFaculty();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  /* ─── Delete ─── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this faculty member?')) return;
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) fetchFaculty();
    } catch { alert('Delete failed'); }
  };

  const clrOf = (dept) => DEPT_COLORS[dept] || DEPT_COLORS['Computer Science'];

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em' }}>Faculty Directory</h1>
          <p style={{ color:'#64748b', fontSize:14, marginTop:4 }}>
            {faculty.length} faculty members · Filter by department
          </p>
        </div>
        <button
          onClick={() => { setEditMember(null); setForm(emptyForm); setPhotoFile(null); setPhotoPreview(null); setFormError(''); setShowModal(true); }}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#6366f1', color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:13.5, cursor:'pointer', boxShadow:'0 4px 12px rgba(99,102,241,0.20)', transition:'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform=''}
        >
          <UserPlus size={16}/> Add Faculty
        </button>
      </div>

      {/* ── Department Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginBottom:24 }}>
        {/* All */}
        <div
          onClick={() => setActiveDept('All')}
          style={{ padding:'16px 18px', borderRadius:14, cursor:'pointer', transition:'all 0.18s', background:activeDept==='All'?'#6366f1':'#fff', border:activeDept==='All'?'2px solid #6366f1':'1.5px solid #e2e8f0', boxShadow:activeDept==='All'?'0 6px 20px rgba(99,102,241,0.22)':'0 1px 3px rgba(0,0,0,0.04)', transform:activeDept==='All'?'translateY(-2px)':'' }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <span style={{ fontSize:11, fontWeight:700, color:activeDept==='All'?'rgba(255,255,255,0.8)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>All Depts</span>
            <div style={{ width:30, height:30, borderRadius:8, background:activeDept==='All'?'rgba(255,255,255,0.15)':'rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={14} color={activeDept==='All'?'#fff':'#6366f1'}/>
            </div>
          </div>
          <p style={{ fontSize:26, fontWeight:800, color:activeDept==='All'?'#fff':'#0f172a', marginTop:8 }}>{faculty.length}</p>
          <p style={{ fontSize:11, color:activeDept==='All'?'rgba(255,255,255,0.7)':'#94a3b8', marginTop:2 }}>Total Faculty</p>
        </div>

        {DEPARTMENTS.map(dept => {
          const clr    = DEPT_COLORS[dept];
          const count  = deptStats[dept] || 0;
          const active = activeDept === dept;
          return (
            <div
              key={dept}
              onClick={() => setActiveDept(dept)}
              style={{ padding:'16px 18px', borderRadius:14, cursor:'pointer', transition:'all 0.18s', background:active?clr.text:'#fff', border:active?`2px solid ${clr.text}`:`1.5px solid ${clr.border}`, boxShadow:active?`0 6px 20px rgba(0,0,0,0.15)`:'0 1px 3px rgba(0,0,0,0.04)', transform:active?'translateY(-2px)':'' }}
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

      {/* ── Search Bar ── */}
      <div style={{ display:'flex', gap:10, marginBottom:20, padding:'10px 12px', background:'#fff', borderRadius:12, border:'1px solid rgba(99,102,241,0.08)', alignItems:'center' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'0 12px' }}>
          <Search size={15} color="#94a3b8"/>
          <input
            placeholder="Search by name or Employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', height:38, background:'none', border:'none', outline:'none', fontSize:13.5, color:'#0f172a' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}><X size={14}/></button>}
        </div>
        <span style={{ fontSize:12.5, color:'#94a3b8', whiteSpace:'nowrap' }}>
          Showing <strong style={{ color:'#0f172a' }}>{filteredFaculty.length}</strong> of {faculty.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid rgba(99,102,241,0.10)', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
              <th style={thStyle}>Faculty Member</th>
              <th style={thStyle}>Employee ID</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Designation</th>
              <th style={thStyle}>Specialization</th>
              <th style={{ ...thStyle, textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:40, textAlign:'center' }}><Loader2 className="animate-spin" style={{ margin:'0 auto', color:'#6366f1' }}/></td></tr>
            ) : filteredFaculty.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding:60, textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div style={{ width:56, height:56, borderRadius:16, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center' }}><Users size={24} color="#cbd5e1"/></div>
                    <p style={{ color:'#94a3b8', fontSize:14, fontWeight:600 }}>No faculty members found</p>
                    {(activeDept !== 'All' || search) && (
                      <button onClick={() => { setActiveDept('All'); setSearch(''); }} style={{ padding:'6px 16px', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, fontSize:12.5, fontWeight:700, color:'#6366f1', cursor:'pointer' }}>Clear Filters</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : filteredFaculty.map(member => {
              const clr = clrOf(member.department);
              const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
              return (
                <tr key={member._id}
                  style={{ borderBottom:'1px solid #f8fafc', transition:'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background=''}
                >
                  {/* Faculty Member */}
                  <td style={tdStyle}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {member.profilePicture ? (
                        <img src={`/uploads/profiles/${member.profilePicture}`} alt={member.name}
                          style={{ width:40, height:40, borderRadius:10, objectFit:'cover', flexShrink:0, border:`2px solid ${clr.border}` }}/>
                      ) : (
                        <div style={{ width:40, height:40, borderRadius:10, background:clr.bg, color:clr.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, flexShrink:0 }}>
                          {initials}
                        </div>
                      )}
                      <div>
                        <p onClick={() => setViewMember(member)}
                          style={{ fontSize:14, fontWeight:600, color:'#0f172a', cursor:'pointer' }}>
                          {member.name}
                        </p>
                        <p style={{ fontSize:11.5, color:'#94a3b8' }}>{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Employee ID */}
                  <td style={tdStyle}>
                    <div style={{ fontSize:13, fontWeight:700, color:clr.text, fontFamily:'monospace', background:clr.bg, padding:'3px 10px', borderRadius:6, display:'inline-block' }}>
                      {member.campusID}
                    </div>
                  </td>

                  {/* Department */}
                  <td style={tdStyle}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11.5, fontWeight:700, background:clr.bg, color:clr.text, border:`1px solid ${clr.border}` }}>
                      <Building2 size={10}/>{member.department?.split(' ')[0]}
                    </span>
                  </td>

                  {/* Designation */}
                  <td style={tdStyle}>
                    <span style={{ padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:700, background:'rgba(99,102,241,0.07)', color:'#6366f1' }}>
                      {member.designation || '—'}
                    </span>
                  </td>

                  {/* Specialization */}
                  <td style={tdStyle}>
                    <p style={{ fontSize:12.5, color:'#475569', display:'flex', alignItems:'center', gap:4 }}>
                      <BookOpen size={12} color="#94a3b8"/> {member.specialization || 'General'}
                    </p>
                  </td>

                  {/* Actions */}
                  <td style={{ ...tdStyle, textAlign:'right' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
                      <button onClick={() => openEditModal(member)} style={actionBtnStyle}
                        onMouseEnter={e=>{e.currentTarget.style.color='#6366f1';e.currentTarget.style.background='rgba(99,102,241,0.07)';}}
                        onMouseLeave={e=>{e.currentTarget.style.color='#cbd5e1';e.currentTarget.style.background='none';}}
                        title="Edit"><Pencil size={15}/></button>
                      <button onClick={() => handleDelete(member._id)} style={actionBtnStyle}
                        onMouseEnter={e=>{e.currentTarget.style.color='#f43f5e';e.currentTarget.style.background='rgba(244,63,94,0.05)';}}
                        onMouseLeave={e=>{e.currentTarget.style.color='#cbd5e1';e.currentTarget.style.background='none';}}
                        title="Delete"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ══════════ Add / Edit Modal ══════════ */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.4)', backdropFilter:'blur(8px)' }}>
          <div style={{ width:'100%', maxWidth:620, background:'#fff', borderRadius:24, padding:36, boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', position:'relative', animation:'modalSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)', maxHeight:'90dvh', overflowY:'auto' }}>
            <button onClick={() => setShowModal(false)} style={{ position:'absolute', top:24, right:24, background:'#f1f5f9', border:'none', borderRadius:'50%', padding:8, cursor:'pointer', color:'#64748b' }}><X size={18}/></button>

            <div style={{ marginBottom:28 }}>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:6 }}>
                {editMember ? 'Edit Faculty Member' : 'Add Faculty Member'}
              </h2>
              <p style={{ color:'#94a3b8', fontSize:14 }}>
                {editMember ? `Editing ${editMember.name} — ID: ${editMember.campusID}` : 'Employee ID and email will be generated automatically.'}
              </p>
            </div>

            <form onSubmit={editMember ? handleEditFaculty : handleAddFaculty} style={{ display:'flex', flexDirection:'column', gap:22 }}>

              {/* Photo Upload */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange}/>
                <div
                  onClick={() => photoInputRef.current?.click()}
                  style={{ width:90, height:90, borderRadius:'50%', border:'2.5px dashed #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', transition:'border-color 0.2s' }}
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
                  <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if(photoInputRef.current) photoInputRef.current.value=''; }}
                    style={{ fontSize:11.5, color:'#f43f5e', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Remove Photo</button>
                )}
                <p style={{ fontSize:11, color:'#94a3b8' }}>JPG, PNG or WebP · Max 5MB</p>
              </div>

              {/* Professional Info */}
              <div>
                <h3 style={sectionHeadingStyle}><Briefcase size={14}/> Professional Information</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={labelStyle}>Department</label>
                    <select required={!editMember} style={inputStyle} value={form.department} onChange={e=>setForm({...form,department:e.target.value})} disabled={!!editMember}>
                      <option value="">Select</option>
                      {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Designation</label>
                    <select required style={inputStyle} value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})}>
                      <option value="">Select</option>
                      {DESIGNATIONS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop:16 }}>
                  <label style={labelStyle}>Specialization / Research Area</label>
                  <input required style={inputStyle} value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} placeholder="e.g. Artificial Intelligence, Power Systems"/>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h3 style={sectionHeadingStyle}><UserIcon size={14}/> Personal Details</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input required style={inputStyle} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full Name"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select style={inputStyle} value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {!editMember && (
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={labelStyle}>Email Address</label>
                      <input required type="email" style={inputStyle} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="faculty@university.edu.pk"/>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 style={sectionHeadingStyle}><Phone size={14}/> Contact Information</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input required style={inputStyle} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+92 300 1234567"/>
                  </div>
                </div>
              </div>

              {formError && <p style={{ fontSize:13, color:'#f43f5e', background:'rgba(244,63,94,0.06)', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(244,63,94,0.15)' }}>{formError}</p>}

              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="button" onClick={()=>{setShowModal(false);setEditMember(null);}} style={{ flex:1, padding:'12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, fontWeight:600, color:'#64748b', cursor:'pointer' }}>Cancel</button>
                <button disabled={formLoading} style={{ flex:2, padding:'12px', background:editMember?'#0ea5e9':'#6366f1', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:formLoading?'not-allowed':'pointer', boxShadow:editMember?'0 4px 12px rgba(14,165,233,0.25)':'0 4px 12px rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {formLoading?<Loader2 size={18} className="animate-spin"/>:editMember?'Save Changes':'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Detail View Modal ══════════ */}
      {viewMember && (
        <div onClick={() => setViewMember(null)} style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.45)', backdropFilter:'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:520, background:'#fff', borderRadius:24, boxShadow:'0 25px 60px rgba(0,0,0,0.18)', position:'relative', animation:'modalSlide 0.28s cubic-bezier(0.34,1.56,0.64,1)', maxHeight:'90dvh', overflowY:'auto' }}>
            {(() => {
              const clr      = clrOf(viewMember.department);
              const initials = viewMember.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
              return (
                <>
                  {/* Banner */}
                  <div style={{ height:90, background:`linear-gradient(135deg, ${clr.text}22, ${clr.text}44)`, borderRadius:'24px 24px 0 0', position:'relative' }}>
                    <button onClick={() => setViewMember(null)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.85)', border:'none', borderRadius:'50%', width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#475569' }}><X size={16}/></button>
                  </div>

                  {/* Avatar */}
                  <div style={{ display:'flex', justifyContent:'center' }}>
                    {viewMember.profilePicture ? (
                      <img src={`/uploads/profiles/${viewMember.profilePicture}`} alt={viewMember.name}
                        style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', border:'4px solid #fff', marginTop:-45, boxShadow:'0 4px 14px rgba(0,0,0,0.12)' }}/>
                    ) : (
                      <div style={{ width:80, height:80, borderRadius:'50%', background:clr.bg, border:'4px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:clr.text, marginTop:-40, boxShadow:'0 4px 14px rgba(0,0,0,0.10)' }}>
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Name + ID */}
                  <div style={{ textAlign:'center', padding:'12px 32px 0' }}>
                    <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{viewMember.name}</h2>
                    <span style={{ fontSize:13, fontWeight:700, color:clr.text, fontFamily:'monospace', background:clr.bg, padding:'3px 12px', borderRadius:20, display:'inline-block' }}>{viewMember.campusID}</span>
                  </div>

                  {/* Detail Grid */}
                  <div style={{ padding:'24px 32px 8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <DetailCard label="Department"     value={viewMember.department    || '—'} color={clr.text}/>
                    <DetailCard label="Designation"    value={viewMember.designation   || '—'} color="#6366f1"/>
                    <DetailCard label="Specialization" value={viewMember.specialization || '—'} color="#64748b"/>
                    <DetailCard label="Gender"         value={viewMember.gender ? (viewMember.gender.charAt(0).toUpperCase()+viewMember.gender.slice(1)) : '—'} color="#64748b"/>
                    <DetailCard label="Phone"          value={viewMember.phone         || '—'} color="#64748b"/>
                    <DetailCard label="Email"          value={viewMember.email         || '—'} color="#64748b"/>
                  </div>

                  {/* Footer */}
                  <div style={{ padding:'16px 32px 28px', display:'flex', gap:10 }}>
                    <button onClick={() => { setViewMember(null); openEditModal(viewMember); }}
                      style={{ flex:1, padding:'11px', background:'#6366f1', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 12px rgba(99,102,241,0.22)' }}>
                      Edit Member
                    </button>
                    <button onClick={() => setViewMember(null)}
                      style={{ flex:1, padding:'11px', background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer' }}>
                      Close
                    </button>
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
      `}</style>
    </div>
  );
}

/* ── Helpers ── */
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
