import { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Trash2, AlertTriangle, Info, BellRing, 
  CheckCircle2, AlertCircle, Loader2, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NoticeBoardPage() {
  const { token, user } = useAuth();
  
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', audience: 'All', urgency: 'Normal' });

  useEffect(() => {
    fetchNotices();
  }, [token]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notices', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setNotices(data.data || []);
    } catch (err) {
      console.error('Failed to load notices', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish notice');
      
      setSuccess('Notice published successfully');
      setModalOpen(false);
      setFormData({ title: '', content: '', audience: 'All', urgency: 'Normal' });
      fetchNotices();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchNotices();
    } catch (err) {
      console.error('Failed to delete notice');
    }
  };

  const getUrgencyColor = (urgency) => {
    if (urgency === 'Urgent') return { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', icon: AlertTriangle };
    if (urgency === 'High') return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: BellRing };
    return { bg: 'rgba(56,189,248,0.1)', color: '#0ea5e9', icon: Info };
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Loader2 className="animate-spin" color="#6366f1" size={36} /></div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: 1080, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Campus Notice Board</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Broadcast important announcements to students and faculty.</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setModalOpen(true)} style={primaryBtnStyle}>
            <Plus size={16} /> Publish Notice
          </button>
        )}
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

      {/* Notices List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {notices.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0' }}>
            <Megaphone size={40} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>No notices have been published yet.</p>
          </div>
        ) : (
          notices.map(notice => {
            const urgencyProps = getUrgencyColor(notice.urgency);
            const UIcon = urgencyProps.icon;
            
            return (
              <div key={notice._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(99,102,241,0.12)', padding: 28, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative' }}>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(notice._id)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'} onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
                    <Trash2 size={18} />
                  </button>
                )}
                
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
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>Audience: {notice.audience}</span>
                    </div>
                  </div>
                </div>
                
                <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notice.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Publish Modal */}
      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Publish New Notice</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Announcement Title</label>
                <input style={inputStyle} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Midterm Examination Schedule" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Target Audience</label>
                  <select style={inputStyle} value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})}>
                    <option value="All">All Campus</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty Only</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Urgency Level</label>
                  <select style={inputStyle} value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notice Content</label>
                <textarea 
                  style={{ ...inputStyle, height: 120, padding: '12px 14px', resize: 'vertical' }} 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  required 
                  placeholder="Write your announcement here..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={saving} style={primaryBtnStyle}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />} Publish Notice
                </button>
              </div>
            </form>
          </div>
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

// Reusable Styles
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 };
const inputStyle = { width: '100%', height: 44, padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' };
const primaryBtnStyle = { height: 44, padding: '0 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.25)' };
const cancelBtnStyle = { height: 44, padding: '0 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 600, color: '#64748b', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)' };
const modalContentStyle = { width: '100%', maxWidth: 540, background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease-out' };
