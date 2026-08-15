import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, FileText, CheckCircle2, 
  AlertCircle, Loader2, Plus, Users, GraduationCap, Clock,
  Eye, Printer, X, Zap, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePositiveNumber } from '../utils/validation';

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

  // Filter State
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [rollSearch, setRollSearch] = useState('');

  // Fee Modal State
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeModalType, setFeeModalType] = useState('single'); // 'single' | 'bulk'
  const [feeForm, setFeeForm] = useState({ studentId: '', semester: 'Fall 2025', amount: 50000, dueDate: '', remarks: '' });
  const [bulkFeeForm, setBulkFeeForm] = useState({ department: 'Computer Science', semester: 'Fall 2025', amount: 50000, dueDate: '', remarks: '' });
  const [feeSaving, setFeeSaving] = useState(false);

  // Edit Fee Modal State
  const [editFeeModalOpen, setEditFeeModalOpen] = useState(false);
  const [editFeeForm, setEditFeeForm] = useState({ id: '', studentName: '', studentID: '', semester: '', amount: 0, dueDate: '', status: 'Unpaid', remarks: '' });

  // Auto Generate Modal State
  const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
  const [autoGenForm, setAutoGenForm] = useState({ semester: 'Fall 2025', dueDate: '', department: '' });
  const [autoGenSaving, setAutoGenSaving] = useState(false);

  // Salary Modal State
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ facultyId: '', month: '', baseSalary: 80000, allowance: 0, deduction: 0, remarks: '' });
  const [salarySaving, setSalarySaving] = useState(false);

  // Preview Modal States
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedSalary, setSelectedSalary] = useState(null);

  useEffect(() => {
    fetchFinanceData();
  }, [token, activeTab]);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'fees') {
        const [feeRes, stdRes] = await Promise.all([
          apiFetch('/api/finance/fees', { headers: { 'Authorization': `Bearer ${token}` } }),
          apiFetch('/api/users?role=student', { headers: { 'Authorization': `Bearer ${token}` } })
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
          apiFetch('/api/finance/salaries', { headers: { 'Authorization': `Bearer ${token}` } }),
          apiFetch('/api/users?role=faculty', { headers: { 'Authorization': `Bearer ${token}` } })
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
      const isBulk = feeModalType === 'bulk';
      const endpoint = isBulk ? '/api/finance/fees/bulk' : '/api/finance/fees';
      const payload = isBulk ? bulkFeeForm : feeForm;

      if (!payload.semester || !payload.semester.trim()) throw new Error('Semester is required.');
      if (!payload.dueDate) throw new Error('Due Date is required.');
      const amountErr = validatePositiveNumber(payload.amount, 'Fee Amount');
      if (amountErr) throw new Error(amountErr);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate challan(s)');
      
      setSuccess(isBulk ? `Successfully generated bulk challans for ${bulkFeeForm.department}` : 'Fee challan generated successfully');
      setFeeModalOpen(false);
      fetchFinanceData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFeeSaving(false);
    }
  };

  const handleEditFeeSubmit = async (e) => {
    e.preventDefault();
    setFeeSaving(true);
    setError(null);
    try {
      if (!editFeeForm.semester || !editFeeForm.semester.trim()) throw new Error('Semester is required.');
      if (!editFeeForm.dueDate) throw new Error('Due Date is required.');
      const amountErr = validatePositiveNumber(editFeeForm.amount, 'Fee Amount');
      if (amountErr) throw new Error(amountErr);

      const res = await apiFetch(`/api/finance/fees/${editFeeForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          semester: editFeeForm.semester,
          amount: editFeeForm.amount,
          dueDate: editFeeForm.dueDate,
          status: editFeeForm.status,
          remarks: editFeeForm.remarks
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update fee record');

      setSuccess('Fee record updated successfully');
      setEditFeeModalOpen(false);
      fetchFinanceData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setFeeSaving(false);
    }
  };

  const openEditFeeModal = (fee) => {
    setEditFeeForm({
      id: fee._id,
      studentName: fee.student?.name || 'Unknown',
      studentID: fee.student?.campusID || 'N/A',
      semester: fee.semester,
      amount: fee.amount,
      dueDate: fee.dueDate,
      status: fee.status,
      remarks: fee.remarks || ''
    });
    setEditFeeModalOpen(true);
  };

  const handleUpdateFeeStatus = async (id, status) => {
    if (!window.confirm(`Mark this fee challan as ${status}?`)) return;
    try {
      const res = await apiFetch(`/api/finance/fees/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchFinanceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoGenerate = async (e) => {
    e.preventDefault();
    setAutoGenSaving(true);
    setError(null);
    try {
      if (!autoGenForm.semester || !autoGenForm.semester.trim()) throw new Error('Semester is required.');
      if (!autoGenForm.dueDate) throw new Error('Due Date is required.');

      const payload = { 
        semester: autoGenForm.semester, 
        dueDate: autoGenForm.dueDate,
        ...(autoGenForm.department && { department: autoGenForm.department })
      };
      const res = await apiFetch('/api/finance/fees/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to auto-generate challans');

      setSuccess(data.message || `Auto-generated ${data.count} fee challans!`);
      setAutoGenModalOpen(false);
      fetchFinanceData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAutoGenSaving(false);
    }
  };

  const handleCreateSalary = async (e) => {
    e.preventDefault();
    setSalarySaving(true);
    setError(null);
    try {
      if (!salaryForm.month || !salaryForm.month.trim()) throw new Error('Salary month is required.');
      const salaryErr = validatePositiveNumber(salaryForm.basicSalary, 'Basic Salary');
      if (salaryErr) throw new Error(salaryErr);

      const allowErr = validatePositiveNumber(salaryForm.allowances, 'Allowances', true);
      if (allowErr) throw new Error(allowErr);

      const dedErr = validatePositiveNumber(salaryForm.deductions, 'Deductions', true);
      if (dedErr) throw new Error(dedErr);

      const res = await apiFetch('/api/finance/salaries', {
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
      const res = await apiFetch(`/api/finance/salaries/${id}/status`, {
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
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Fee Challans</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Generate and track student tuition payments.</p>
              {/* Rate info */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {[{ cr: '1 Credit Hr', rate: 'PKR 2,000' }, { cr: '2 Credit Hrs', rate: 'PKR 3,000' }, { cr: '3+ Credit Hrs', rate: 'PKR 5,000' }].map(r => (
                  <span key={r.cr} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.06)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}>
                    {r.cr} = {r.rate}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => { setAutoGenForm({ semester: 'Fall 2025', dueDate: '', department: '' }); setAutoGenModalOpen(true); }}
                style={{ height: 44, padding: '0 20px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}
              >
                <Zap size={16} /> Auto Generate
              </button>
              <button onClick={() => setFeeModalOpen(true)} style={primaryBtnStyle}>
                <Plus size={16} /> Manual
              </button>
            </div>
          </div>

          {/* Filter Bar — Search + Department */}
          <div style={{ 
            display: 'flex', gap: 16, padding: '14px 24px', 
            background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
            alignItems: 'center', flexWrap: 'wrap'
          }}>

            {/* Roll Number Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: rollSearch ? '#6366f1' : '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                value={rollSearch}
                onChange={e => setRollSearch(e.target.value)}
                placeholder="Search by Roll No..."
                style={{
                  height: 38, paddingLeft: 36, paddingRight: rollSearch ? 32 : 14,
                  background: rollSearch ? 'rgba(99,102,241,0.05)' : '#fff',
                  border: `1.5px solid ${rollSearch ? '#6366f1' : '#e2e8f0'}`,
                  borderRadius: 10, fontSize: 13.5, outline: 'none',
                  width: 210, fontFamily: 'inherit', color: '#0f172a',
                  transition: 'all 0.2s', fontWeight: rollSearch ? 600 : 400
                }}
              />
              {rollSearch && (
                <button
                  onClick={() => setRollSearch('')}
                  style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ width: 1, height: 28, background: '#e2e8f0', flexShrink: 0 }} />

            {/* Department Filter */}
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>Department:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', 'Computer Science', 'Electrical Engineering', 'Business School', 'Mathematics'].map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDeptFilter(dept)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${selectedDeptFilter === dept ? '#6366f1' : '#e2e8f0'}`,
                    background: selectedDeptFilter === dept ? 'rgba(99,102,241,0.08)' : '#fff',
                    color: selectedDeptFilter === dept ? '#6366f1' : '#64748b',
                    transition: 'all 0.15s'
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
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
              {(() => {
                const rollQuery = rollSearch.trim().toLowerCase();
                const filteredFees = fees.filter(fee => {
                  const deptOk = selectedDeptFilter === 'All' || fee.student?.department === selectedDeptFilter;
                  const rollOk = !rollQuery ||
                    fee.student?.campusID?.toLowerCase().includes(rollQuery) ||
                    fee.student?.name?.toLowerCase().includes(rollQuery);
                  return deptOk && rollOk;
                });

                if (filteredFees.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                        {rollQuery
                          ? `No fee records found for "${rollSearch}".`
                          : `No fee records found for ${selectedDeptFilter === 'All' ? 'any department' : selectedDeptFilter}.`
                        }
                      </td>
                    </tr>
                  );
                }

                return filteredFees.map(fee => (
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
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        onClick={() => setSelectedFee(fee)} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', 
                          background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', 
                          borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }} 
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                      >
                        <Eye size={14} /> View
                      </button>
                      <button 
                        onClick={() => openEditFeeModal(fee)} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', 
                          background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)', 
                          borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
                        }}
                      >
                        Edit
                      </button>
                      {fee.status !== 'Paid' && (
                        <button onClick={() => handleUpdateFeeStatus(fee._id, 'Paid')} style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}>
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                ));
              })()}
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
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        onClick={() => setSelectedSalary(salary)} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', 
                          background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', 
                          borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }} 
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                      >
                        <Eye size={14} /> View
                      </button>
                      {salary.status !== 'Paid' && (
                        <button onClick={() => handleUpdateSalaryStatus(salary._id, 'Paid')} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.2)' }}>
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* ⚡ Auto Generate Fees Modal */}
      {autoGenModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: 480 }}>
            <button onClick={() => setAutoGenModalOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Auto Generate Fees</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>System automatically calculates fees per student</p>
              </div>
            </div>

            {/* Rate reference card */}
            <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14, padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee Rate Chart (per course)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: '1 Credit Hour', rate: 'PKR 2,000', color: '#10b981' },
                  { label: '2 Credit Hours', rate: 'PKR 3,000', color: '#f59e0b' },
                  { label: '3+ Credit Hours', rate: 'PKR 5,000', color: '#6366f1' },
                ].map(r => (
                  <div key={r.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', textAlign: 'center', border: `1px solid ${r.color}30` }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>{r.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: r.color, margin: 0 }}>{r.rate}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 10, marginBottom: 0 }}>
                Total fee = sum of all enrolled courses' rates for each student.
              </p>
            </div>

            <form onSubmit={handleAutoGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Semester Term</label>
                  <input style={inputStyle} value={autoGenForm.semester} onChange={e => setAutoGenForm({...autoGenForm, semester: e.target.value})} placeholder="e.g. Fall 2025" required />
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" style={inputStyle} value={autoGenForm.dueDate} onChange={e => setAutoGenForm({...autoGenForm, dueDate: e.target.value})} required />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Department Filter <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — leave blank for all)</span></label>
                <select style={inputStyle} value={autoGenForm.department} onChange={e => setAutoGenForm({...autoGenForm, department: e.target.value})}>
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Business School">Business School</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>

              {error && <p style={{ fontSize: 13, color: '#f43f5e', background: 'rgba(244,63,94,0.06)', padding: '10px 14px', borderRadius: 10, margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setAutoGenModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={autoGenSaving} style={{ ...primaryBtnStyle, flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
                  {autoGenSaving ? <Loader2 size={17} className="animate-spin" /> : <Zap size={17} />}
                  {autoGenSaving ? 'Generating...' : 'Generate All Challans'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Generation Modal */}
      {feeModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Generate Fee Challan</h2>

            {/* Modal Type Selector */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, gap: 4, marginBottom: 24 }}>
              <button 
                type="button"
                onClick={() => setFeeModalType('single')}
                style={{ flex: 1, padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: feeModalType === 'single' ? '#fff' : 'transparent', color: feeModalType === 'single' ? '#6366f1' : '#64748b', transition: 'all 0.2s', boxShadow: feeModalType === 'single' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
              >
                Single Student
              </button>
              <button 
                type="button"
                onClick={() => setFeeModalType('bulk')}
                style={{ flex: 1, padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: feeModalType === 'bulk' ? '#fff' : 'transparent', color: feeModalType === 'bulk' ? '#6366f1' : '#64748b', transition: 'all 0.2s', boxShadow: feeModalType === 'bulk' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none' }}
              >
                Bulk Department
              </button>
            </div>

            <form onSubmit={handleCreateFee} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {feeModalType === 'single' ? (
                <div>
                  <label style={labelStyle}>Select Student</label>
                  <select style={inputStyle} value={feeForm.studentId} onChange={e => setFeeForm({...feeForm, studentId: e.target.value})} required>
                    {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.campusID})</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Select Department</label>
                  <select style={inputStyle} value={bulkFeeForm.department} onChange={e => setBulkFeeForm({...bulkFeeForm, department: e.target.value})} required>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Business School">Business School</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Semester Term</label>
                  {feeModalType === 'single' ? (
                    <input style={inputStyle} value={feeForm.semester} onChange={e => setFeeForm({...feeForm, semester: e.target.value})} placeholder="e.g. Fall 2025" required />
                  ) : (
                    <input style={inputStyle} value={bulkFeeForm.semester} onChange={e => setBulkFeeForm({...bulkFeeForm, semester: e.target.value})} placeholder="e.g. Fall 2025" required />
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  {feeModalType === 'single' ? (
                    <input type="date" style={inputStyle} value={feeForm.dueDate} onChange={e => setFeeForm({...feeForm, dueDate: e.target.value})} required />
                  ) : (
                    <input type="date" style={inputStyle} value={bulkFeeForm.dueDate} onChange={e => setBulkFeeForm({...bulkFeeForm, dueDate: e.target.value})} required />
                  )}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Fee Amount (PKR)</label>
                {feeModalType === 'single' ? (
                  <input type="number" style={inputStyle} value={feeForm.amount} onChange={e => setFeeForm({...feeForm, amount: Number(e.target.value)})} required />
                ) : (
                  <input type="number" style={inputStyle} value={bulkFeeForm.amount} onChange={e => setBulkFeeForm({...bulkFeeForm, amount: Number(e.target.value)})} required />
                )}
              </div>

              <div>
                <label style={labelStyle}>Remarks / Description (Optional)</label>
                {feeModalType === 'single' ? (
                  <input style={inputStyle} value={feeForm.remarks} onChange={e => setFeeForm({...feeForm, remarks: e.target.value})} placeholder="e.g. Tuition fee + Lab charges" />
                ) : (
                  <input style={inputStyle} value={bulkFeeForm.remarks} onChange={e => setBulkFeeForm({...bulkFeeForm, remarks: e.target.value})} placeholder="e.g. Tuition fee + Lab charges" />
                )}
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

      {/* Edit Fee Modal */}
      {editFeeModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Edit Student Fee Details</h2>
            <form onSubmit={handleEditFeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Student</label>
                <input style={{ ...inputStyle, background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} value={`${editFeeForm.studentName} (${editFeeForm.studentID})`} disabled />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Semester Term</label>
                  <input style={inputStyle} value={editFeeForm.semester} onChange={e => setEditFeeForm({...editFeeForm, semester: e.target.value})} placeholder="e.g. Fall 2025" required />
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" style={inputStyle} value={editFeeForm.dueDate} onChange={e => setEditFeeForm({...editFeeForm, dueDate: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Fee Amount (PKR)</label>
                  <input type="number" style={inputStyle} value={editFeeForm.amount} onChange={e => setEditFeeForm({...editFeeForm, amount: Number(e.target.value)})} required />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={editFeeForm.status} onChange={e => setEditFeeForm({...editFeeForm, status: e.target.value})} required>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Remarks / Description (Optional)</label>
                <input style={inputStyle} value={editFeeForm.remarks} onChange={e => setEditFeeForm({...editFeeForm, remarks: e.target.value})} placeholder="e.g. Tuition fee + Lab charges" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setEditFeeModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={feeSaving} style={primaryBtnStyle}>
                  {feeSaving ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} Save Changes
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

      {/* Fee Challan Preview Modal */}
      {selectedFee && (
        <div style={modalOverlayStyle}>
          <div style={previewModalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Fee Challan Preview</h2>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Review or print student's multi-copy tuition challan.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => triggerPrint(generateFeeChallanHtml(selectedFee), `Fee_Challan_${selectedFee.student?.campusID || 'Student'}`)} 
                  style={primaryBtnStyle}
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button 
                  onClick={() => setSelectedFee(null)} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Document Preview Container (Screen representation of print layout) */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, background: '#f1f5f9', borderRadius: 16, border: '1px solid #cbd5e1', padding: 24 }}>
              <div 
                style={{ 
                  background: '#fff', 
                  padding: 24, 
                  borderRadius: 12, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 16, 
                  maxWidth: 720, 
                  margin: '0 auto' 
                }}
                dangerouslySetInnerHTML={{ __html: generateFeeChallanHtml(selectedFee) }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Salary Slip Preview Modal */}
      {selectedSalary && (
        <div style={modalOverlayStyle}>
          <div style={previewModalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Salary Slip Preview</h2>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Review or print employee salary details.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => triggerPrint(generateSalarySlipHtml(selectedSalary), `Salary_Slip_${selectedSalary.faculty?.campusID || 'Faculty'}`)} 
                  style={primaryBtnStyle}
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button 
                  onClick={() => setSelectedSalary(null)} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Document Preview Container */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, background: '#f1f5f9', borderRadius: 16, border: '1px solid #cbd5e1', padding: 24 }}>
              <div 
                style={{ 
                  background: '#fff', 
                  padding: '24px 36px', 
                  borderRadius: 12, 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', 
                  maxWidth: 680, 
                  margin: '0 auto' 
                }}
                dangerouslySetInnerHTML={{ __html: generateSalarySlipHtml(selectedSalary) }}
              />
            </div>
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
const modalContentStyle = { position: 'relative', width: '100%', maxWidth: 540, background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease-out' };
const previewModalContentStyle = { width: '90%', maxWidth: 820, background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', maxHeight: '90vh' };

// Standalone helpers
const formatCurrencyHelper = (amount) => {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
};

const convertNumberToWords = (amount) => {
  if (amount === 0) return 'Zero PKR Only';
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion'];

  const convertHundreds = (num) => {
    let str = '';
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += units[num] + ' ';
    }
    return str.trim();
  };

  let num = Math.floor(amount);
  let words = '';
  let scaleIndex = 0;

  while (num > 0) {
    let chunk = num % 1000;
    if (chunk > 0) {
      const chunkWords = convertHundreds(chunk);
      words = chunkWords + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + ' ' + words;
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return words.trim() + ' PKR Only';
};

const triggerPrint = (htmlContent, title = 'Document') => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document || iframe.contentDocument;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() {
              window.parent.document.body.removeChild(window.frameElement);
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
};

const generateFeeChallanHtml = (fee) => {
  const shortId = `RU-${fee._id.substring(fee._id.length - 6).toUpperCase()}`;
  const original = fee.originalAmount || fee.amount || 0;
  const discount = fee.discountAmount || 0;
  const final = fee.amount || 0;

  const breakdown = {
    tuition: Math.round(original * 0.85),
    lab: Math.round(original * 0.10),
    library: Math.round(original * 0.05)
  };
  const totalAfterDue = final + 500;
  
  const singleCopy = (copyName) => `
    <div style="padding: 16px; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; position: relative; box-sizing: border-box; height: 82mm; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 6px; margin-bottom: 6px;">
        <div>
          <h2 style="margin: 0; font-size: 13px; font-weight: 800; color: #1e1b4b; letter-spacing: 0.5px;">RAHBAR UNIVERSITY</h2>
          <p style="margin: 1px 0 0; font-size: 8px; color: #64748b;">MERN Campus, Islamabad. HBL A/C No: 1234-567890-03</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 9px; font-weight: 700; background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${copyName}</span>
          <p style="margin: 2px 0 0; font-size: 8px; color: #64748b; font-family: monospace; font-weight: bold;">Challan No: ${shortId}</p>
        </div>
      </div>

      <!-- Info Row -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9.5px; margin-bottom: 6px; background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #f1f5f9;">
        <div>
          <p style="margin: 1px 0;"><strong>Student Name:</strong> ${fee.student?.name}</p>
          <p style="margin: 1px 0;"><strong>Campus ID:</strong> ${fee.student?.campusID}</p>
          <p style="margin: 1px 0;"><strong>Department:</strong> ${fee.student?.department || 'N/A'}</p>
        </div>
        <div>
          <p style="margin: 1px 0;"><strong>Semester Term:</strong> ${fee.semester}</p>
          <p style="margin: 1px 0;"><strong>Due Date:</strong> <span style="color: #ef4444; font-weight: bold;">${fee.dueDate}</span></p>
          <p style="margin: 1px 0;"><strong>Status:</strong> <span style="color: ${fee.status === 'Paid' ? '#10b981' : '#f59e0b'}; font-weight: bold;">${fee.status}</span></p>
        </div>
      </div>

      <!-- Table Details -->
      <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 6px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 3px 6px; border: 1px solid #e2e8f0; font-weight: 700; width: 70%;">Particulars</th>
            <th style="padding: 3px 6px; border: 1px solid #e2e8f0; font-weight: 700; text-align: right; width: 30%;">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0;">Tuition Fee (85%)</td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrencyHelper(breakdown.tuition)}</td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0;">Lab & Technology Charges (10%)</td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrencyHelper(breakdown.lab)}</td>
          </tr>
          <tr>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0;">Library Fund & Insurance (5%)</td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrencyHelper(breakdown.library)}</td>
          </tr>
          
          <tr style="background: #f8fafc; font-weight: bold; border-top: 1.5px solid #cbd5e1;">
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0;">Total Base Tuition Fee</td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrencyHelper(original)}</td>
          </tr>

          ${discount > 0 ? `
          <tr style="background: rgba(16,185,129,0.06); font-weight: bold; color: #10b981;">
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 4px;">
              <span>Concession Deduction (${fee.concessionType === 'old_student' ? 'Old Student 25%' : 'Academic Merit 50%'})</span>
            </td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right; color: #10b981;">
              - ${formatCurrencyHelper(discount)}
            </td>
          </tr>
          ` : ''}

          <tr style="background: #faf5ff; font-weight: bold; border-top: 1.5px solid #cbd5e1;">
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0;">Net Payable (Within Due Date)</td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right; color: #6366f1; font-size: 10px;">${formatCurrencyHelper(final)}</td>
          </tr>
          <tr style="color: #ef4444; font-size: 8px;">
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0;">Late Payment Fine (After Due Date)</td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right;">${formatCurrencyHelper(500)}</td>
          </tr>
          <tr style="background: #fef2f2; font-weight: bold; color: #ef4444;">
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0;">Total Payable (After Due Date)</td>
            <td style="padding: 3px 6px; border: 1px solid #e2e8f0; text-align: right; font-size: 10px;">${formatCurrencyHelper(totalAfterDue)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 8px; margin-top: 2px;">
        <div style="width: 100px; border-top: 1px solid #cbd5e1; text-align: center; padding-top: 2px;">
          Depositor Signature
        </div>
        <div style="font-size: 7px; color: #94a3b8; text-align: center;">
          * Non-refundable / Non-transferable
        </div>
        <div style="width: 100px; border-top: 1px solid #cbd5e1; text-align: center; padding-top: 2px; font-weight: bold; color: #1e1b4b;">
          Authorized Stamp & Sign
        </div>
      </div>
    </div>
  `;

  return `
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 190mm; margin: 0 auto; box-sizing: border-box;">
      ${singleCopy('Bank Copy')}
      
      <div style="display: flex; align-items: center; justify-content: center; font-size: 8px; color: #cbd5e1; margin: 1px 0; border-top: 1px dashed #cbd5e1; height: 10px; position: relative;">
        <span style="background: #fff; padding: 0 6px; position: absolute; top: -6px; font-family: monospace;">✂ Fold & Cut Here</span>
      </div>
      
      ${singleCopy('University Copy')}
      
      <div style="display: flex; align-items: center; justify-content: center; font-size: 8px; color: #cbd5e1; margin: 1px 0; border-top: 1px dashed #cbd5e1; height: 10px; position: relative;">
        <span style="background: #fff; padding: 0 6px; position: absolute; top: -6px; font-family: monospace;">✂ Fold & Cut Here</span>
      </div>
      
      ${singleCopy('Student Copy')}
    </div>
  `;
};

const generateSalarySlipHtml = (salary) => {
  const shortId = `PAY-${salary._id.substring(salary._id.length - 6).toUpperCase()}`;
  const netSalaryWords = convertNumberToWords(salary.netSalary);
  
  return `
    <div style="max-width: 170mm; margin: 20px auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; font-size: 12px; line-height: 1.5; color: #334155; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
      <!-- Header / Letterhead -->
      <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #1e1b4b; letter-spacing: 0.5px;">RAHBAR UNIVERSITY</h1>
        <p style="margin: 4px 0 0; font-size: 11px; color: #64748b; font-weight: 500;">MERN Campus, Islamabad | Human Resources Department</p>
        <h2 style="margin: 12px 0 0; font-size: 14px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">EMPLOYEE SALARY SLIP</h2>
      </div>

      <!-- Slip Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
        <div>
          <p style="margin: 4px 0;"><strong>Employee Name:</strong> ${salary.faculty?.name}</p>
          <p style="margin: 4px 0;"><strong>Employee ID:</strong> ${salary.faculty?.campusID}</p>
          <p style="margin: 4px 0;"><strong>Designation:</strong> ${salary.faculty?.designation || 'Faculty Member'}</p>
          <p style="margin: 4px 0;"><strong>Department:</strong> ${salary.faculty?.department || 'N/A'}</p>
        </div>
        <div>
          <p style="margin: 4px 0;"><strong>Slip Reference:</strong> <span style="font-family: monospace; font-weight: bold;">${shortId}</span></p>
          <p style="margin: 4px 0;"><strong>Payroll Month:</strong> ${salary.month}</p>
          <p style="margin: 4px 0;"><strong>Payment Status:</strong> <span style="padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; background: ${salary.status === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${salary.status === 'Paid' ? '#10b981' : '#f59e0b'};">${salary.status}</span></p>
          <p style="margin: 4px 0;"><strong>Payment Date:</strong> ${salary.paidDate || 'Pending'}</p>
        </div>
      </div>

      <!-- Financial Breakdown Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 10px 12px; border: 1px solid #cbd5e1; font-weight: 700;">Description</th>
            <th style="padding: 10px 12px; border: 1px solid #cbd5e1; font-weight: 700; text-align: right; width: 40%;">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #cbd5e1; font-weight: 600;">Basic Salary</td>
            <td style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: right;">${formatCurrencyHelper(salary.baseSalary)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #cbd5e1; color: #10b981; font-weight: 600;">Allowances</td>
            <td style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: right; color: #10b981;">+ ${formatCurrencyHelper(salary.allowance)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border: 1px solid #cbd5e1; color: #ef4444; font-weight: 600;">Deductions & Income Tax</td>
            <td style="padding: 10px 12px; border: 1px solid #cbd5e1; text-align: right; color: #ef4444;">- ${formatCurrencyHelper(salary.deduction)}</td>
          </tr>
          <tr style="background: #e0e7ff; font-weight: 800; font-size: 13px;">
            <td style="padding: 12px 12px; border: 2px solid #6366f1; color: #1e1b4b;">Net Salary Paid</td>
            <td style="padding: 12px 12px; border: 2px solid #6366f1; text-align: right; color: #4338ca;">${formatCurrencyHelper(salary.netSalary)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Words Row -->
      <div style="margin-bottom: 30px; padding: 12px 16px; background: #faf5ff; border-radius: 8px; border: 1px solid #f3e8ff;">
        <span style="font-weight: 700; color: #6b21a8; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 2px;">Net Salary in Words:</span>
        <span style="font-size: 13px; font-weight: 600; color: #581c87;">${netSalaryWords}</span>
      </div>

      <!-- Remarks (if any) -->
      ${salary.remarks ? `
      <div style="margin-bottom: 30px; font-size: 11px; color: #64748b;">
        <strong>Remarks:</strong> ${salary.remarks}
      </div>
      ` : ''}

      <!-- Signatures footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; font-size: 11px;">
        <div style="width: 180px; border-top: 1px solid #cbd5e1; text-align: center; padding-top: 6px;">
          Employee Signature
        </div>
        <div style="width: 180px; border-top: 1px solid #cbd5e1; text-align: center; padding-top: 6px; font-weight: bold; color: #1e1b4b;">
          Authorized Treasurer Signature
        </div>
      </div>
    </div>
  `;
};
