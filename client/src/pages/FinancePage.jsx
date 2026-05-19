import { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, FileText, CheckCircle2, 
  AlertCircle, Loader2, Plus, Users, GraduationCap, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FinancePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('fees'); // 'fees' | 'salaries'
  
  // Data State
  const [fees, setFees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Modals
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fee Modal State
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({ studentId: '', semester: 'Fall 2025', amount: 50000, dueDate: '', remarks: '' });
  const [feeSaving, setFeeSaving] = useState(false);

  // Salary Modal State
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ facultyId: '', month: '', baseSalary: 80000, allowance: 0, deduction: 0, remarks: '' });
  const [salarySaving, setSalarySaving] = useState(false);

  useEffect(() => {
    fetchFinanceData();
  }, [token, activeTab]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'fees') {
        const [feeRes, stdRes] = await Promise.all([
          fetch('/api/finance/fees', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/users?role=student', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const feeData = await feeRes.json();
        const stdData = await stdRes.json();
        if (feeData.success) setFees(feeData.data || []);
        if (stdData.success) {
          setStudents(stdData.data || []);
          if (stdData.data.length > 0 && !feeForm.studentId) setFeeForm(prev => ({ ...prev, studentId: stdData.data[0]._id }));
        }
      } else {
        const [salRes, facRes] = await Promise.all([
          fetch('/api/finance/salaries', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/users?role=faculty', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const salData = await salRes.json();
        const facData = await facRes.json();
        if (salData.success) setSalaries(salData.data || []);
        if (facData.success) {
          setFaculty(facData.data || []);
          if (facData.data.length > 0 && !salaryForm.facultyId) setSalaryForm(prev => ({ ...prev, facultyId: facData.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    setFeeSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/finance/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(feeForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create fee challan');
      
      setSuccess('Fee challan generated successfully');
      setFeeModalOpen(false);
      fetchFinanceData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFeeSaving(false);
    }
  };

  const handleUpdateFeeStatus = async (id, status) => {
    if (!window.confirm(`Mark this fee challan as ${status}?`)) return;
    try {
      const res = await fetch(`/api/finance/fees/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSalary = async (e) => {
    e.preventDefault();
    setSalarySaving(true);
    setError(null);
    try {
      const res = await fetch('/api/finance/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(salaryForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate salary slip');
      
      setSuccess('Salary slip generated successfully');
      setSalaryModalOpen(false);
      fetchFinanceData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSalarySaving(false);
    }
  };

  const handleUpdateSalaryStatus = async (id, status) => {
    if (!window.confirm(`Mark this salary slip as ${status}?`)) return;
    try {
      const res = await fetch(`/api/finance/salaries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Loader2 className="animate-spin" color="#6366f1" size={36} /></div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', maxWidth: 1080, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Financial Operations</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Manage student tuition fees and faculty payroll processing.</p>
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

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        {[
          { id: 'fees', label: 'Student Fees', icon: GraduationCap },
          { id: 'salaries', label: 'Faculty Payroll', icon: Users }
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: isActive ? '#6366f1' : 'transparent', color: isActive ? '#fff' : '#64748b',
                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.25)' : 'none'
              }}
            >
              <Icon size={16} /> {label}
            </button>
          );
        })}
      </div>

      {/* ── STUDENT FEES TAB ── */}
      {activeTab === 'fees' && (
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 10px 30px -10px rgba(99,102,241,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Fee Challans</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Generate and track student tuition payments.</p>
            </div>
            <button onClick={() => setFeeModalOpen(true)} style={primaryBtnStyle}>
              <Plus size={16} /> Generate Challan
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={thStyle}>Student Details</th>
                <th style={thStyle}>Semester</th>
                <th style={thStyle}>Due Date</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No fee records generated yet.</td></tr>
              ) : fees.map(fee => (
                <tr key={fee._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{fee.student?.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{fee.student?.campusID}</p>
                  </td>
                  <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{fee.semester}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}><Clock size={14} /> {fee.dueDate}</div>
                  </td>
                  <td style={tdStyle}><span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{formatCurrency(fee.amount)}</span></td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: fee.status === 'Paid' ? 'rgba(16,185,129,0.1)' : fee.status === 'Overdue' ? 'rgba(244,63,94,0.1)' : '#f1f5f9',
                      color: fee.status === 'Paid' ? '#10b981' : fee.status === 'Overdue' ? '#f43f5e' : '#64748b'
                    }}>
                      {fee.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {fee.status !== 'Paid' && (
                      <button onClick={() => handleUpdateFeeStatus(fee._id, 'Paid')} style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}>
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FACULTY PAYROLL TAB ── */}
      {activeTab === 'salaries' && (
        <div style={{ background: '#fff', borderRadius: 24, border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 10px 30px -10px rgba(99,102,241,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Faculty Payroll</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Generate and track monthly salary slips for academic staff.</p>
            </div>
            <button onClick={() => setSalaryModalOpen(true)} style={primaryBtnStyle}>
              <Plus size={16} /> Generate Salary Slip
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={thStyle}>Faculty Member</th>
                <th style={thStyle}>Month</th>
                <th style={thStyle}>Base + Allowances</th>
                <th style={thStyle}>Net Salary</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No salary records generated yet.</td></tr>
              ) : salaries.map(salary => (
                <tr key={salary._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{salary.faculty?.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{salary.faculty?.campusID} • {salary.faculty?.designation}</p>
                  </td>
                  <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{salary.month}</span></td>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 13, color: '#64748b' }}>Base: {formatCurrency(salary.baseSalary)}</p>
                    <p style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>+ {formatCurrency(salary.allowance)}</p>
                    <p style={{ fontSize: 12, color: '#f43f5e' }}>- {formatCurrency(salary.deduction)}</p>
                  </td>
                  <td style={tdStyle}><span style={{ fontSize: 15, fontWeight: 800, color: '#6366f1' }}>{formatCurrency(salary.netSalary)}</span></td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: salary.status === 'Paid' ? 'rgba(16,185,129,0.1)' : '#f1f5f9',
                      color: salary.status === 'Paid' ? '#10b981' : '#64748b'
                    }}>
                      {salary.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {salary.status !== 'Paid' && (
                      <button onClick={() => handleUpdateSalaryStatus(salary._id, 'Paid')} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Fee Generation Modal */}
      {feeModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Generate Fee Challan</h2>
            <form onSubmit={handleCreateFee} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Select Student</label>
                <select style={inputStyle} value={feeForm.studentId} onChange={e => setFeeForm({...feeForm, studentId: e.target.value})} required>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.campusID})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Semester Term</label>
                  <input style={inputStyle} value={feeForm.semester} onChange={e => setFeeForm({...feeForm, semester: e.target.value})} placeholder="e.g. Fall 2025" required />
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" style={inputStyle} value={feeForm.dueDate} onChange={e => setFeeForm({...feeForm, dueDate: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Fee Amount (PKR)</label>
                <input type="number" style={inputStyle} value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: Number(e.target.value)})} required />
              </div>
              <div>
                <label style={labelStyle}>Remarks / Description (Optional)</label>
                <input style={inputStyle} value={feeForm.remarks} onChange={e => setFeeForm({...feeForm, remarks: e.target.value})} placeholder="e.g. Tuition fee + Lab charges" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setFeeModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={feeSaving} style={primaryBtnStyle}>
                  {feeSaving ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Generation Modal */}
      {salaryModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Generate Salary Slip</h2>
            <form onSubmit={handleCreateSalary} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Select Faculty Member</label>
                <select style={inputStyle} value={salaryForm.facultyId} onChange={e => setSalaryForm({...salaryForm, facultyId: e.target.value})} required>
                  {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.campusID})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Payroll Month & Year</label>
                <input style={inputStyle} value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: e.target.value})} placeholder="e.g. September 2025" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Base Salary</label>
                  <input type="number" style={inputStyle} value={salaryForm.baseSalary} onChange={e => setSalaryForm({...salaryForm, baseSalary: Number(e.target.value)})} required />
                </div>
                <div>
                  <label style={labelStyle}>Allowances</label>
                  <input type="number" style={inputStyle} value={salaryForm.allowance} onChange={e => setSalaryForm({...salaryForm, allowance: Number(e.target.value)})} />
                </div>
                <div>
                  <label style={labelStyle}>Deductions</label>
                  <input type="number" style={inputStyle} value={salaryForm.deduction} onChange={e => setSalaryForm({...salaryForm, deduction: Number(e.target.value)})} />
                </div>
              </div>
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Calculated Net Salary:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{formatCurrency((salaryForm.baseSalary || 0) + (salaryForm.allowance || 0) - (salaryForm.deduction || 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setSalaryModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={salarySaving} style={primaryBtnStyle}>
                  {salarySaving ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />} Generate
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
const thStyle = { padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' };
const tdStyle = { padding: '16px 24px', verticalAlign: 'middle' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 };
const inputStyle = { width: '100%', height: 44, padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' };
const primaryBtnStyle = { height: 44, padding: '0 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99,102,241,0.25)' };
const cancelBtnStyle = { height: 44, padding: '0 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 600, color: '#64748b', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)' };
const modalContentStyle = { width: '100%', maxWidth: 540, background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease-out' };
