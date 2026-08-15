import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import { 
  Building2, GraduationCap, ShieldCheck, Sliders, 
  CheckCircle2, AlertCircle, Loader2, Save, Mail, Phone, MapPin, Calendar, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePhone, validateName, validateNumberRange, validateDateRange } from '../utils/validation';

export default function SettingsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'academic' | 'policies' | 'system'
  
  const [settings, setSettings] = useState({
    universityName: 'Rahbar Smart Campus',
    academicYear: '2025-2026',
    currentSemester: 'Fall 2025',
    semesterStartDate: '2025-09-01',
    semesterEndDate: '2026-01-15',
    attendanceThreshold: 75,
    maxCreditHoursPerSemester: 18,
    gradingScale: 'Absolute',
    allowStudentEnrollment: true,
    allowFacultyGrading: true,
    maintenanceMode: false,
    contactEmail: 'admin@rahbar.edu',
    contactPhone: '+1 (555) 123-4567',
    address: '100 Smart Campus Blvd, Tech City',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      } catch (err) {
        setError('Failed to load campus configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const nameErr = validateName(settings.universityName, 'University Name');
      if (nameErr) throw new Error(nameErr);

      const emailErr = validateEmail(settings.contactEmail);
      if (emailErr) throw new Error(emailErr);

      const phoneErr = validatePhone(settings.contactPhone);
      if (phoneErr) throw new Error(phoneErr);

      const dateErr = validateDateRange(settings.semesterStartDate, settings.semesterEndDate, 'Semester Start Date', 'Semester End Date');
      if (dateErr) throw new Error(dateErr);

      const creditErr = validateNumberRange(settings.maxCreditHoursPerSemester, 3, 24, 'Max Credit Hours');
      if (creditErr) throw new Error(creditErr);

      const attErr = validateNumberRange(settings.attendanceThreshold, 50, 100, 'Attendance Threshold');
      if (attErr) throw new Error(attErr);

      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update settings');

      setSettings(data.data);
      setSuccess('Campus configuration updated successfully!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Loader2 className="animate-spin" color="#6366f1" size={36} /></div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: 1080, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Campus Configuration</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Manage university-wide academic rules, semester schedules, and administrative toggles.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 44, padding: '0 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12,
            fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
          }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
        </button>
      </div>

      {/* Status Messages */}
      {success && (
        <div style={{ padding: '16px 20px', borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600, fontSize: 14 }}>
          <CheckCircle2 size={20} /> {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '16px 20px', borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', fontWeight: 600, fontSize: 14 }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Layout Grid: Left Sidebar Tabs + Right Form Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'flex-start' }}>
        
        {/* Navigation Sidebar Tabs */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.12)', padding: 16, boxShadow: '0 10px 30px -10px rgba(99,102,241,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'general',  label: 'General Info',   icon: Building2, desc: 'Name & Contact' },
            { id: 'academic', label: 'Academic Term',  icon: GraduationCap, desc: 'Dates & Semesters' },
            { id: 'policies', label: 'Rules & Policies', icon: ShieldCheck, desc: 'Attendance & Grades' },
            { id: 'system',   label: 'System Controls', icon: Sliders, desc: 'Enrollment & Maintenance' },
          ].map(({ id, label, icon: Icon, desc }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16,
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                  background: isActive ? '#6366f1' : 'transparent',
                  color: isActive ? '#fff' : '#64748b',
                  boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.25)' : 'none'
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 12, background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: isActive ? '#fff' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : '#0f172a' }}>{label}</p>
                  <p style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.8)' : '#94a3b8', marginTop: 2 }}>{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Content Area */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.12)', padding: 36, boxShadow: '0 10px 30px -10px rgba(99,102,241,0.05)' }}>
          
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>General Campus Information</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Official identity and central communication coordinates.</p>
              </div>

              <div>
                <label style={labelStyle}>University Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8' }}><Building2 size={18} /></span>
                  <input style={{ ...inputStyle, paddingLeft: 44 }} value={settings.universityName} onChange={e => handleChange('universityName', e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Official Contact Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8' }}><Mail size={18} /></span>
                    <input style={{ ...inputStyle, paddingLeft: 44 }} value={settings.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Contact Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8' }}><Phone size={18} /></span>
                    <input style={{ ...inputStyle, paddingLeft: 44 }} value={settings.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} required />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Campus Physical Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8' }}><MapPin size={18} /></span>
                  <input style={{ ...inputStyle, paddingLeft: 44 }} value={settings.address} onChange={e => handleChange('address', e.target.value)} required />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC TERM */}
          {activeTab === 'academic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Academic Term & Calendar</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Define active semester periods and academic year boundaries.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Academic Year</label>
                  <input style={inputStyle} value={settings.academicYear} onChange={e => handleChange('academicYear', e.target.value)} placeholder="e.g. 2025-2026" required />
                </div>
                <div>
                  <label style={labelStyle}>Current Semester Name</label>
                  <input style={inputStyle} value={settings.currentSemester} onChange={e => handleChange('currentSemester', e.target.value)} placeholder="e.g. Fall 2025" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Semester Start Date</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8' }}><Calendar size={18} /></span>
                    <input type="date" style={{ ...inputStyle, paddingLeft: 44 }} value={settings.semesterStartDate} onChange={e => handleChange('semesterStartDate', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Semester End Date</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: 12, color: '#94a3b8' }}><Calendar size={18} /></span>
                    <input type="date" style={{ ...inputStyle, paddingLeft: 44 }} value={settings.semesterEndDate} onChange={e => handleChange('semesterEndDate', e.target.value)} required />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Maximum Credit Hours Allowed Per Student</label>
                <input type="number" min="3" max="24" style={{ ...inputStyle, width: 200 }} value={settings.maxCreditHoursPerSemester} onChange={e => handleChange('maxCreditHoursPerSemester', Number(e.target.value))} required />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Caps the total credits a student can enroll in during a single term.</p>
              </div>
            </div>
          )}

          {/* TAB 3: RULES & POLICIES */}
          {activeTab === 'policies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Campus Rules & Policies</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Set global thresholds for attendance and grading methodologies.</p>
              </div>

              <div>
                <label style={labelStyle}>Minimum Attendance Requirement (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" min="50" max="100" style={{ ...inputStyle, width: 140, fontSize: 16, fontWeight: 700, color: '#6366f1' }} value={settings.attendanceThreshold} onChange={e => handleChange('attendanceThreshold', Number(e.target.value))} required />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>% required to appear in final examinations</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Students falling below this threshold receive automatic short-attendance warnings.</p>
              </div>

              <div>
                <label style={labelStyle}>University Grading Scale</label>
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  {['Absolute', 'Relative'].map(mode => (
                    <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', background: settings.gradingScale === mode ? 'rgba(99,102,241,0.08)' : '#f8fafc', border: `1px solid ${settings.gradingScale === mode ? '#6366f1' : '#e2e8f0'}`, borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: settings.gradingScale === mode ? '#6366f1' : '#0f172a' }}>
                      <input 
                        type="radio" 
                        name="gradingScale" 
                        value={mode} 
                        checked={settings.gradingScale === mode} 
                        onChange={e => handleChange('gradingScale', e.target.value)} 
                        style={{ accentColor: '#6366f1', width: 18, height: 18 }}
                      />
                      {mode} Grading System
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>Absolute assigns fixed letter grades (e.g. 85+ = A). Relative curves grades based on class average.</p>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM CONTROLS */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Administrative & System Controls</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Toggle portal access, course registration locks, and maintenance downtime.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Toggle 1: Student Enrollment */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Allow Student Course Enrollment</p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Unlocks the student portal course registration interface for the active semester.</p>
                  </div>
                  <label style={switchContainerStyle}>
                    <input type="checkbox" checked={settings.allowStudentEnrollment} onChange={e => handleChange('allowStudentEnrollment', e.target.checked)} style={{ display: 'none' }} />
                    <div style={{ ...switchTrackStyle, background: settings.allowStudentEnrollment ? '#10b981' : '#cbd5e1' }}>
                      <div style={{ ...switchThumbStyle, transform: settings.allowStudentEnrollment ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </div>
                  </label>
                </div>

                {/* Toggle 2: Faculty Grading */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Allow Faculty Marks Entry & Grading</p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Enables professors to input exam scores and publish assessment grades.</p>
                  </div>
                  <label style={switchContainerStyle}>
                    <input type="checkbox" checked={settings.allowFacultyGrading} onChange={e => handleChange('allowFacultyGrading', e.target.checked)} style={{ display: 'none' }} />
                    <div style={{ ...switchTrackStyle, background: settings.allowFacultyGrading ? '#6366f1' : '#cbd5e1' }}>
                      <div style={{ ...switchThumbStyle, transform: settings.allowFacultyGrading ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </div>
                  </label>
                </div>

                {/* Toggle 3: Maintenance Mode */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: settings.maintenanceMode ? 'rgba(244,63,94,0.06)' : '#f8fafc', borderRadius: 16, border: `1px solid ${settings.maintenanceMode ? 'rgba(244,63,94,0.3)' : '#e2e8f0'}` }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: settings.maintenanceMode ? '#f43f5e' : '#0f172a' }}>System Maintenance Mode</p>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Restricts portal login for students and faculty while administrators perform system upgrades.</p>
                  </div>
                  <label style={switchContainerStyle}>
                    <input type="checkbox" checked={settings.maintenanceMode} onChange={e => handleChange('maintenanceMode', e.target.checked)} style={{ display: 'none' }} />
                    <div style={{ ...switchTrackStyle, background: settings.maintenanceMode ? '#f43f5e' : '#cbd5e1' }}>
                      <div style={{ ...switchThumbStyle, transform: settings.maintenanceMode ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { width: '100%', height: 44, padding: '0 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', color: '#0f172a', fontWeight: 500 };
const switchContainerStyle = { cursor: 'pointer', display: 'inline-block' };
const switchTrackStyle = { width: 48, height: 26, borderRadius: 13, transition: 'background 0.2s', position: 'relative' };
const switchThumbStyle = { width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: 0, transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };
