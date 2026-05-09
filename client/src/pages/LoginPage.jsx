import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, register, loading } = useAuth();

  const [form,      setForm]      = useState({ email: '', password: '' });
  const [showPass,  setShowPass]  = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const result = await login(form.email, form.password);
    if (!result.success) setFormError(result.message);
  };

  const inputStyle = {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 14,
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const labelStyle = {
    fontSize: 12.5,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f4f6fb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
        background: '#ffffff',
        border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: 22,
        boxShadow: '0 8px 32px rgba(99,102,241,0.06)',
        padding: '40px 36px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>Rahbar</p>
            <p style={{ fontSize: 11.5, color: '#94a3b8' }}>Smart Campus</p>
          </div>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: 6 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13.5, color: '#94a3b8', marginBottom: 28 }}>
          Sign in to your campus portal.
        </p>



        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>



          <div>
            <label style={labelStyle}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="you@university.edu" style={inputStyle} required
              onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
              onBlur={e  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 42 }} required
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                onBlur={e  => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex',
              }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>



          {formError && (
            <div style={{
              padding: '10px 14px', borderRadius: 9, fontSize: 13,
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#f43f5e',
            }}>
              {formError}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '12px', borderRadius: 11, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1',
            color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 4,
            boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.35)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.25)'; }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : <>Sign In <ArrowRight size={15} /></>
            }
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#cbd5e1', textAlign: 'center', marginTop: 24 }}>
          By continuing, you agree to Rahbar&apos;s terms of service.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
