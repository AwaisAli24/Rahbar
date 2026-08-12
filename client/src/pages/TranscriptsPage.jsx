import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Search, GraduationCap, User, BookOpen,
  ChevronRight, X, Loader2, Award, BarChart2, FileText,
  Building2, Hash, Star, AlertTriangle, CheckCircle2,
  ChevronDown, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['All', 'Computer Science', 'Electrical Engineering', 'Business School', 'Mathematics'];

const DEPT_COLORS = {
  'Computer Science':       { bg: 'rgba(99,102,241,0.08)',  text: '#6366f1',  border: 'rgba(99,102,241,0.2)',  accent: '#6366f1'  },
  'Electrical Engineering': { bg: 'rgba(245,158,11,0.08)', text: '#d97706',  border: 'rgba(245,158,11,0.2)',  accent: '#f59e0b'  },
  'Business School':        { bg: 'rgba(16,185,129,0.08)', text: '#059669',  border: 'rgba(16,185,129,0.2)',  accent: '#10b981'  },
  'Mathematics':            { bg: 'rgba(236,72,153,0.08)', text: '#db2777',  border: 'rgba(236,72,153,0.2)',  accent: '#ec4899'  },
};

const GRADE_COLORS = {
  'A+': '#10b981', 'A': '#10b981', 'A-': '#34d399',
  'B+': '#6366f1', 'B': '#6366f1', 'B-': '#818cf8',
  'C+': '#f59e0b', 'C': '#f59e0b', 'C-': '#fbbf24',
  'D':  '#f97316',
  'F':  '#ef4444',
  'N/A': '#94a3b8',
};

function GradeBadge({ grade }) {
  const color = GRADE_COLORS[grade] || '#94a3b8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: 10,
      background: color + '18', color,
      fontSize: 13, fontWeight: 800, border: `1.5px solid ${color}30`,
    }}>{grade}</span>
  );
}

function GPABar({ percentage }) {
  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#6366f1' : percentage >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(percentage || 0, 100)}%`, height: '100%',
        background: color, borderRadius: 999,
        transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </div>
  );
}

export default function TranscriptsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeDept, setActiveDept] = useState('All');
  const [activeProgram, setActiveProgram] = useState('All');
  const [activeSemester, setActiveSemester] = useState('All');

  // Transcript modal
  const [transcriptStudent, setTranscriptStudent] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/transcripts?';
      if (activeDept !== 'All') url += `department=${encodeURIComponent(activeDept)}&`;
      if (activeProgram !== 'All') url += `program=${activeProgram}&`;
      if (activeSemester !== 'All') url += `semester=${activeSemester}&`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStudents(data.data || []);
    } catch (err) {
      console.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [token, activeDept, activeProgram, activeSemester]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openTranscript = async (student) => {
    setTranscriptStudent(student);
    setTranscript(null);
    setExpandedCourse(null);
    setTranscriptLoading(true);
    try {
      const res = await fetch(`/api/transcripts/${student._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTranscript(data);
    } catch (err) {
      console.error('Failed to fetch transcript');
    } finally {
      setTranscriptLoading(false);
    }
  };

  const filtered = students.filter(s =>
    search === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.campusID?.toLowerCase().includes(search.toLowerCase()) ||
    s.program?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by department
  const grouped = DEPARTMENTS.filter(d => d !== 'All').reduce((acc, dept) => {
    acc[dept] = filtered.filter(s => s.department === dept);
    return acc;
  }, {});

  const programs = ['All', ...new Set(students.map(s => s.program).filter(Boolean))];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: 24, padding: '32px 36px', marginBottom: 28,
        color: '#fff', boxShadow: '0 12px 40px rgba(99,102,241,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: 80,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}>
            <ScrollText size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Transcripts & Degrees
            </h1>
            <p style={{ fontSize: 14, opacity: 0.8, margin: 0, marginTop: 2 }}>
              Department-wise student academic records
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap', position: 'relative' }}>
          {[
            { label: 'Total Students', value: students.length, icon: '🎓' },
            { label: 'Departments', value: DEPARTMENTS.length - 1, icon: '🏛️' },
            { label: 'Programs', value: programs.length - 1, icon: '📚' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
              borderRadius: 14, padding: '12px 20px', border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{icon} {label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, margin: 0, marginTop: 2 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 18, border: '1px solid rgba(99,102,241,0.1)',
        padding: '20px 24px', marginBottom: 24,
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name, ID, program..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 13, outline: 'none',
              color: '#0f172a', background: '#f8fafc',
            }}
          />
        </div>

        {/* Department Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEPARTMENTS.map(dept => {
            const isActive = activeDept === dept;
            const colors = dept !== 'All' ? DEPT_COLORS[dept] : null;
            return (
              <button key={dept} onClick={() => setActiveDept(dept)} style={{
                padding: '8px 14px', borderRadius: 10, border: '1.5px solid',
                borderColor: isActive ? (colors?.border || 'rgba(99,102,241,0.3)') : '#e2e8f0',
                background: isActive ? (colors?.bg || 'rgba(99,102,241,0.06)') : 'transparent',
                color: isActive ? (colors?.text || '#6366f1') : '#64748b',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>
                {dept === 'All' ? 'All Departments' : dept.replace(' Engineering', ' Eng.').replace(' School', '')}
              </button>
            );
          })}
        </div>

        {/* Semester filter */}
        <select
          value={activeSemester}
          onChange={e => setActiveSemester(e.target.value)}
          style={{
            padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12,
            fontSize: 13, color: '#475569', background: '#f8fafc', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="All">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Loader2 className="animate-spin" color="#6366f1" size={36} />
        </div>
      ) : activeDept === 'All' ? (
        // Show all departments grouped
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {DEPARTMENTS.filter(d => d !== 'All').map(dept => {
            const deptStudents = grouped[dept] || [];
            if (deptStudents.length === 0) return null;
            const colors = DEPT_COLORS[dept] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', accent: '#64748b' };
            return (
              <DeptSection
                key={dept}
                dept={dept}
                students={deptStudents}
                colors={colors}
                onOpenTranscript={openTranscript}
              />
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <ScrollText size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>No students found</p>
            </div>
          )}
        </div>
      ) : (
        // Show single department
        <DeptSection
          dept={activeDept}
          students={filtered.filter(s => s.department === activeDept)}
          colors={DEPT_COLORS[activeDept] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', accent: '#64748b' }}
          onOpenTranscript={openTranscript}
          expanded
        />
      )}

      {/* Transcript Modal */}
      {transcriptStudent && (
        <TranscriptModal
          student={transcriptStudent}
          transcript={transcript}
          loading={transcriptLoading}
          expandedCourse={expandedCourse}
          setExpandedCourse={setExpandedCourse}
          onClose={() => { setTranscriptStudent(null); setTranscript(null); }}
        />
      )}
    </div>
  );
}

// ── Department Section ───────────────────────────────────────────────────────
function DeptSection({ dept, students, colors, onOpenTranscript, expanded }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
    }}>
      {/* Dept Header */}
      <div style={{
        padding: '18px 24px',
        background: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Building2 size={18} color={colors.text} />
        <h2 style={{ fontSize: 16, fontWeight: 800, color: colors.text, flex: 1 }}>{dept}</h2>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
          background: colors.text + '18', color: colors.text,
        }}>
          {students.length} Student{students.length !== 1 ? 's' : ''}
        </span>
      </div>

      {students.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          No students in this department.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Student', 'Campus ID', 'Program', 'Semester', 'Section', 'Session', 'CGPA', ''].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', fontSize: 11, fontWeight: 700,
                    color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
                    textAlign: 'left', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student._id} style={{
                  borderBottom: idx < students.length - 1 ? '1px solid #f8fafc' : 'none',
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: colors.bg, color: colors.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800,
                      }}>
                        {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{student.name}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, marginTop: 1 }}>{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      padding: '3px 8px', borderRadius: 6, color: '#475569',
                    }}>{student.campusID}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      background: colors.bg, color: colors.text,
                      padding: '3px 10px', borderRadius: 8,
                    }}>{student.program || '—'}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>
                    Sem {student.semester || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                    {student.section || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                    {student.session || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 14, fontWeight: 800,
                        color: student.cgpa >= 3.5 ? '#10b981' : student.cgpa >= 2.5 ? '#6366f1' : student.cgpa >= 1.5 ? '#f59e0b' : '#ef4444',
                      }}>{student.cgpa?.toFixed(2) || '0.00'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => onOpenTranscript(student)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10,
                        border: `1.5px solid ${colors.border}`,
                        background: colors.bg, color: colors.text,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = colors.text; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.text; }}
                    >
                      <FileText size={13} /> View Transcript
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Transcript Modal ─────────────────────────────────────────────────────────
function TranscriptModal({ student, transcript, loading, expandedCourse, setExpandedCourse, onClose }) {
  const dept = student.department;
  const colors = DEPT_COLORS[dept] || { bg: '#f8fafc', text: '#6366f1', border: '#e2e8f0' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 860,
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Modal Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.text}ee 0%, ${colors.text}bb 100%)`,
          padding: '28px 32px', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800,
            }}>
              {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{student.name}</h2>
              <p style={{ margin: 0, marginTop: 3, opacity: 0.85, fontSize: 13 }}>
                {student.campusID} · {student.program} · Semester {student.semester} · {student.department}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Loader2 className="animate-spin" color={colors.text} size={32} />
          </div>
        ) : transcript ? (
          <div style={{ padding: '28px 32px' }}>
            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'GPA (Calculated)', value: transcript.gpa?.toFixed(2) || '0.00', icon: Star, color: '#6366f1' },
                { label: 'Total Courses', value: transcript.totalCourses || 0, icon: BookOpen, color: '#10b981' },
                { label: 'Credit Hours', value: transcript.totalCreditHours || 0, icon: Hash, color: '#f59e0b' },
                { label: 'Semester', value: `Sem ${student.semester}`, icon: Award, color: '#8b5cf6' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14,
                  padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, margin: '0 auto 8px',
                    background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={color} />
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, marginTop: 2 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Course-wise Grades */}
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
              📋 Course-wise Transcript
            </h3>
            {transcript.transcript?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 14 }}>
                No assessment data available for this student yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {transcript.transcript?.map((entry) => {
                  const isExpanded = expandedCourse === entry.course.id;
                  const { summary, course } = entry;
                  const gradeColor = GRADE_COLORS[summary.letterGrade] || '#94a3b8';

                  return (
                    <div key={course.id} style={{
                      border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden',
                      transition: 'border-color 0.15s',
                      ...(isExpanded ? { borderColor: colors.border } : {}),
                    }}>
                      {/* Course Row */}
                      <div
                        onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '16px 20px', cursor: 'pointer',
                          background: isExpanded ? colors.bg : '#fff',
                          transition: 'background 0.15s',
                        }}
                      >
                        <span style={{
                          fontSize: 11, fontWeight: 800, color: colors.text,
                          background: colors.bg, padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                        }}>{course.code}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{course.title}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, marginTop: 2 }}>
                            {course.creditHours} Credit Hrs · {summary.assessmentsCount} Assessment{summary.assessmentsCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {/* Progress bar */}
                        <div style={{ width: 100, flexShrink: 0 }}>
                          <GPABar percentage={summary.finalPercentage} />
                          <p style={{ fontSize: 11, color: '#64748b', margin: 0, marginTop: 4, textAlign: 'center' }}>
                            {summary.finalPercentage !== null ? `${summary.finalPercentage}%` : 'No Data'}
                          </p>
                        </div>
                        <GradeBadge grade={summary.letterGrade} />
                        <ChevronDown size={16} color="#94a3b8" style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s', flexShrink: 0,
                        }} />
                      </div>

                      {/* Expanded: assessment breakdown */}
                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '16px 20px', background: '#fafbff' }}>
                          {entry.assessments.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No assessments recorded yet.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {['Assessment', 'Type', 'Date', 'Marks', 'Percentage'].map(h => (
                                    <th key={h} style={{
                                      fontSize: 11, fontWeight: 700, color: '#94a3b8',
                                      textTransform: 'uppercase', letterSpacing: '0.05em',
                                      textAlign: 'left', padding: '6px 10px',
                                    }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {entry.assessments.map((a, i) => (
                                  <tr key={i} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.title}</td>
                                    <td style={{ padding: '9px 10px' }}>
                                      <span style={{
                                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                        background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                                      }}>{a.type}</span>
                                    </td>
                                    <td style={{ padding: '9px 10px', fontSize: 12, color: '#64748b' }}>{a.date || '—'}</td>
                                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                      {a.marksObtained} / {a.totalMarks}
                                    </td>
                                    <td style={{ padding: '9px 10px' }}>
                                      <span style={{
                                        fontSize: 12, fontWeight: 700,
                                        color: a.percentage >= 80 ? '#10b981' : a.percentage >= 60 ? '#6366f1' : a.percentage >= 50 ? '#f59e0b' : '#ef4444',
                                      }}>{a.percentage}%</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {/* Summary row */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 16, marginTop: 12,
                            padding: '10px 10px', background: colors.bg, borderRadius: 10,
                          }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>Course Total:</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                              {summary.totalMarksEarned} / {summary.totalMarksConfigured}
                            </span>
                            <span style={{ fontSize: 12, color: '#64748b' }}>
                              Weightage: {summary.totalWeightageEarned.toFixed(1)} / {summary.totalWeightageConfigured}%
                            </span>
                            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: gradeColor }}>
                              Final: {summary.finalPercentage !== null ? `${summary.finalPercentage}%` : 'N/A'} ({summary.letterGrade})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Failed to load transcript.</div>
        )}
      </div>
    </div>
  );
}
