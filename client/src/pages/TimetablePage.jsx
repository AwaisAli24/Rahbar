import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Plus, Trash2, 
  Building2, Loader2, X, User, BookOpen, 
  AlertCircle, CheckCircle2, Grid, List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { start: '08:30', end: '10:00' },
  { start: '10:00', end: '11:30' },
  { start: '11:30', end: '13:00' },
  { start: '13:30', end: '15:00' },
  { start: '15:00', end: '16:30' },
];

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Business School',
  'Mathematics',
];

export default function TimetablePage() {
  const { token, user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('Computer Science');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    courseId: '', day: 'Monday', startTime: '08:30', endTime: '10:00', room: '', department: 'Computer Science'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?department=${encodeURIComponent(selectedDept)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setSlots(data.data || []);
    } catch (err) {
      console.error('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/courses?department=${encodeURIComponent(selectedDept)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCourses(data.data || []);
        if (data.data.length > 0 && !form.courseId) {
          setForm(prev => ({ ...prev, courseId: data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses');
    }
  };

  useEffect(() => {
    if (token) {
      fetchTimetable();
      fetchCourses();
    }
  }, [selectedDept, token]);

  // Handle Start Time Change (Auto-assign End Time)
  const handleStartTimeChange = (start) => {
    const matchedSlot = TIME_SLOTS.find(ts => ts.start === start);
    const end = matchedSlot ? matchedSlot.end : '10:00';
    setForm(prev => ({ ...prev, startTime: start, endTime: end }));
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create timetable slot');

      setSuccessMsg('Timetable slot scheduled successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowModal(false);
      fetchTimetable();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      const res = await fetch(`/api/timetable/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchTimetable();
    } catch (err) {
      alert('Failed to delete slot');
    }
  };

  // Helper to find slot in grid view
  const getSlotForGrid = (day, startTime) => {
    return slots.find(s => s.day === day && s.startTime === startTime);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Academic Timetable</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Schedule lectures, manage room allocations, and prevent double-booking.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 4 }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ ...toggleButtonStyle, background: viewMode === 'grid' ? '#fff' : 'transparent', color: viewMode === 'grid' ? '#6366f1' : '#64748b', boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
            >
              <Grid size={15} /> Grid View
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{ ...toggleButtonStyle, background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#6366f1' : '#64748b', boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
            >
              <List size={15} /> List View
            </button>
          </div>

          <button 
            onClick={() => {
              setFormError(null);
              setForm(prev => ({ ...prev, department: selectedDept }));
              setShowModal(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10,
              fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.20)'
            }}
          >
            <Plus size={16} /> Schedule Slot
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ 
        display: 'flex', gap: 16, marginBottom: 24, padding: '16px 20px', 
        background: '#fff', borderRadius: 16, border: '1px solid rgba(99,102,241,0.08)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <Building2 size={18} color="#6366f1" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Filter Department:</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${selectedDept === dept ? '#6366f1' : '#e2e8f0'}`,
                  background: selectedDept === dept ? 'rgba(99,102,241,0.08)' : '#f8fafc',
                  color: selectedDept === dept ? '#6366f1' : '#64748b',
                  transition: 'all 0.15s'
                }}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600, fontSize: 14, animation: 'fadeIn 0.3s ease-out' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* ── VIEW 1: WEEKLY GRID VIEW ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Loader2 className="animate-spin" color="#6366f1" size={32} /></div>
      ) : viewMode === 'grid' ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ ...thStyle, width: 140 }}>Time Slot</th>
                {DAYS.map(day => (
                  <th key={day} style={{ ...thStyle, textAlign: 'center' }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(ts => (
                <tr key={ts.start} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px', background: '#f8fafc', borderRight: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 700, fontSize: 13.5 }}>
                      <Clock size={15} color="#6366f1" /> {ts.start}
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, marginLeft: 23 }}>to {ts.end}</p>
                  </td>
                  {DAYS.map(day => {
                    const slot = getSlotForGrid(day, ts.start);
                    return (
                      <td key={day} style={{ padding: 12, verticalAlign: 'top', width: `${100 / DAYS.length}%` }}>
                        {slot ? (
                          <div style={{
                            background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)',
                            borderRadius: 14, padding: 16, position: 'relative', transition: 'all 0.15s',
                            boxShadow: '0 2px 4px rgba(99,102,241,0.02)', display: 'flex', flexDirection: 'column', gap: 8
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#6366f1', background: '#fff', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.2)' }}>
                                {slot.course?.code || 'CODE'}
                              </span>
                              <button 
                                onClick={() => handleDeleteSlot(slot._id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 2 }}
                                onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            
                            <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                              {slot.course?.title || 'Course Title'}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748b' }}>
                                <MapPin size={13} color="#94a3b8" /> <b style={{ color: '#475569' }}>{slot.room}</b>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748b' }}>
                                <User size={13} color="#94a3b8" /> <span>{slot.course?.faculty?.name || 'Staff'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e2e8f0', borderRadius: 14, background: '#fcfcfd' }}>
                            <span style={{ fontSize: 12, color: '#cbd5e1' }}>Available</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── VIEW 2: LIST VIEW ── */
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.08)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={thStyle}>Day & Time</th>
                <th style={thStyle}>Course Details</th>
                <th style={thStyle}>Instructor</th>
                <th style={thStyle}>Room / Venue</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No timetable slots scheduled for {selectedDept}.</td></tr>
              ) : slots.map(slot => (
                <tr key={slot._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{slot.day}</p>
                    <p style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={13} color="#6366f1" /> {slot.startTime} - {slot.endTime}
                    </p>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: 6 }}>
                        {slot.course?.code}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{slot.course?.title}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                      <User size={14} color="#94a3b8" /> {slot.course?.faculty?.name || 'Unassigned'}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      <MapPin size={14} color="#6366f1" /> {slot.room}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeleteSlot(slot._id)}
                      style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#cbd5e1', transition: 'all 0.15s' }}
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
      )}

      {/* Schedule Slot Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 520, background: '#fff', borderRadius: 24,
            padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative', animation: 'modalSlide 0.3s ease-out'
          }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Schedule Lecture Slot</h2>

            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div>
                <label style={labelStyle}>Department</label>
                <select 
                  style={inputStyle} 
                  value={form.department} 
                  onChange={e => {
                    const dept = e.target.value;
                    setForm(prev => ({ ...prev, department: dept }));
                    // Fetch courses for selected dept
                    fetch(`/api/courses?department=${encodeURIComponent(dept)}`, { headers: { 'Authorization': `Bearer ${token}` } })
                      .then(r => r.json())
                      .then(d => { if (d.success) { setCourses(d.data); if (d.data.length > 0) setForm(prev => ({ ...prev, courseId: d.data[0]._id })); } });
                  }}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Select Course</label>
                <select required style={inputStyle} value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})}>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.code} - {c.title} ({c.faculty?.name || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Day of Week</label>
                  <select required style={inputStyle} value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Time Slot</label>
                  <select required style={inputStyle} value={form.startTime} onChange={e => handleStartTimeChange(e.target.value)}>
                    {TIME_SLOTS.map(ts => (
                      <option key={ts.start} value={ts.start}>{ts.start} - {ts.end}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Room / Venue</label>
                <input required style={inputStyle} value={form.room} onChange={e => setForm({...form, room: e.target.value})} placeholder="e.g. Room 101, Lab 3, Auditorium" />
              </div>

              {formError && (
                <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={18} flexShrink={0} /> {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                <button disabled={formLoading} style={{
                  flex: 2, padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12,
                  fontWeight: 700, fontSize: 15, cursor: formLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  {formLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Slot'}
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
      `}</style>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 };
const inputStyle = { width: '100%', height: 44, padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' };
const thStyle = { padding: '16px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' };
const tdStyle = { padding: '18px 20px', verticalAlign: 'middle' };
const toggleButtonStyle = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' };
