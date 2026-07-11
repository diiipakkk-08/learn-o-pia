import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Plus, BookOpen, Trash2, Film, FolderPlus, ChevronDown,
  Pencil, Check, X, Users, AlertCircle
} from 'lucide-react';

// ── Portal Dropdown ─────────────────────────────────────────────────────────
// Renders the menu in document.body via portal so it escapes
// backdrop-filter / overflow / transform ancestors completely.
function PortalDropdown({ triggerRef, menuRef, isOpen, children }) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setStyle({
        position: 'absolute',
        top: r.bottom + window.scrollY + 4,
        left: r.left + window.scrollX,
        width: r.width,
        zIndex: 99999,
        background: '#11121c',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15)',
        padding: '6px 0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '260px',
        overflowY: 'auto'
      });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div ref={menuRef} style={style}>{children}</div>,
    document.body
  );
}

// ── Custom Dropdown Select ───────────────────────────────────────────────────
function CustomStudioSelect({ label, value, options, onChange, placeholder = 'Select Option' }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const clickedMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isOpen]);

  const activeOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div style={{ width: '100%' }}>
      {label && <label className="form-label" style={{ fontSize: '0.75rem' }}>{label}</label>}
      <div
        ref={triggerRef}
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(o => !o)}
        style={{ width: '100%', height: '38px', padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)' }}
      >
        <span style={{ color: activeOption ? '#fff' : 'var(--text-muted)' }}>
          {activeOption ? activeOption.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.6 }} />
      </div>
      <PortalDropdown triggerRef={triggerRef} menuRef={menuRef} isOpen={isOpen}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { onChange(opt.value); setIsOpen(false); }}
            style={{
              padding: '10px 16px', fontSize: '0.85rem', textAlign: 'left',
              background: String(value) === String(opt.value) ? 'var(--primary)' : 'transparent',
              color: String(value) === String(opt.value) ? '#fff' : 'var(--text-secondary)',
              fontWeight: String(value) === String(opt.value) ? 600 : 400,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'background 0.15s', width: '100%'
            }}
            onMouseEnter={e => { if (String(value) !== String(opt.value)) e.target.style.background = 'rgba(139,92,246,0.15)'; e.target.style.color = '#fff'; }}
            onMouseLeave={e => { if (String(value) !== String(opt.value)) e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            {opt.label}
          </button>
        ))}
      </PortalDropdown>
    </div>
  );
}

// ── Inline Edit Field ────────────────────────────────────────────────────────
function InlineEdit({ value, onSave, multiline = false, inputStyle = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => { if (draft.trim()) onSave(draft.trim()); setEditing(false); };
  const handleCancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', width: '100%' }}>
        {multiline ? (
          <textarea value={draft} onChange={e => setDraft(e.target.value)} className="form-input"
            style={{ fontSize: '0.85rem', padding: '6px 10px', minHeight: '60px', resize: 'vertical', flex: 1, ...inputStyle }} autoFocus />
        ) : (
          <input type="text" value={draft} onChange={e => setDraft(e.target.value)} className="form-input"
            style={{ fontSize: '0.85rem', padding: '6px 10px', flex: 1, ...inputStyle }} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }} />
        )}
        <button onClick={handleSave} style={styles.iconBtnGreen}><Check size={13} /></button>
        <button onClick={handleCancel} style={styles.iconBtnRed}><X size={13} /></button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'text', width: '100%' }} onClick={() => setEditing(true)}>
      <span style={{ flex: 1, ...inputStyle }}>{value}</span>
      <Pencil size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function CreatorStudio() {
  const {
    courses, subjects, users, currentUser,
    addCourse, editCourse, deleteCourse,
    addSubject, deleteSubject,
    addSubjectPlaylist, deleteSubjectPlaylist,
    addVideoToPlaylist, deleteVideoFromPlaylist,
    addSubjectMaterialSection, deleteSubjectMaterialSection,
    addSubjectMaterial, deleteSubjectMaterial,
    removeUserEnrollment
  } = useDatabase();

  const [activeCourseId, setActiveCourseId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [studioTab, setStudioTab] = useState('content');

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDept, setCourseDept] = useState('Computer Science');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseType, setCourseType] = useState('standard');
  const [coursePrice, setCoursePrice] = useState(0);

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectTitle, setSubjectTitle] = useState('');
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');

  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoError, setVideoError] = useState(null);

  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);

  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceSection, setResourceSection] = useState('');
  const [courseAuthor, setCourseAuthor] = useState('');
  const [playlistAuthor, setPlaylistAuthor] = useState('');
  const [resourceAuthor, setResourceAuthor] = useState('');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'owner';

  const myCourses = courses.filter(c => isAdmin ? true : (c.creatorId === currentUser.id && !c.isDegree));
  const activeCourse = courses.find(c => c.id === activeCourseId);
  const isDegree = activeCourse?.isDegree;
  const courseSubjects = activeCourse ? subjects.filter(s => s.courseId === activeCourse.id) : [];
  const semesterSubjects = courseSubjects.filter(s => s.semester === selectedSemester);
  const activeSubjectsList = isDegree ? semesterSubjects : courseSubjects;
  const activeSubject = subjects.find(s => s.id === activeSubjectId);

  const enrolledStudents = activeCourse
    ? users.filter(u => u.enrolledCourses?.includes(activeCourse.id))
    : [];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseDesc.trim()) return;
    addCourse(courseTitle, courseDept, courseDesc, coursePrice, isAdmin ? (courseType === 'degree') : false, courseAuthor);
    setCourseTitle(''); setCourseDesc(''); setCoursePrice(0); setCourseAuthor(''); setShowCourseForm(false);
  };
  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!subjectTitle.trim() || !activeCourse) return;
    addSubject(activeCourse.id, isDegree ? selectedSemester : 1, subjectTitle);
    setSubjectTitle(''); setShowSubjectForm(false);
  };
  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!playlistTitle.trim() || !activeSubject) return;
    addSubjectPlaylist(activeSubject.id, playlistTitle, playlistDesc, playlistAuthor);
    setPlaylistTitle(''); setPlaylistDesc(''); setPlaylistAuthor(''); setShowPlaylistForm(false);
  };
  const handleAddVideo = (e) => {
    e.preventDefault(); setVideoError(null);
    if (!videoTitle.trim() || !videoUrl.trim() || !activeSubject || !activePlaylistId) return;
    try {
      addVideoToPlaylist(activeSubject.id, activePlaylistId, videoTitle, videoDesc, videoUrl);
      setVideoTitle(''); setVideoDesc(''); setVideoUrl('');
    } catch (err) { setVideoError(err.message); }
  };
  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!resourceTitle.trim() || !resourceUrl.trim() || !activeSubject || !resourceSection) return;
    addSubjectMaterial(activeSubject.id, resourceTitle, resourceUrl, resourceSection, resourceAuthor);
    setResourceTitle(''); setResourceUrl(''); setResourceAuthor('');
  };
  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim() || !activeSubject) return;
    addSubjectMaterialSection(activeSubject.id, newSectionName.trim());
    setNewSectionName(''); setShowAddSectionForm(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={styles.container}>

      {/* Banner */}
      <section style={styles.studioBanner} className="glass-panel">
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }} className="primary-gradient-text">
            Syllabus Studio Workspace
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Build degree programs, design subjects, attach playlists, and upload reference materials.
          </p>
        </div>
        <button onClick={() => { setShowCourseForm(!showCourseForm); setActiveCourseId(null); }} className="btn btn-primary">
          <FolderPlus size={16} />
          {isAdmin ? 'Create Program / Course' : 'Create Course'}
        </button>
      </section>

      {/* Main Grid */}
      <div style={styles.mainGrid}>

        {/* LEFT: Course List */}
        <div style={styles.leftColumn} className="glass-panel">
          <h3 style={styles.subHeading}>Active Curricula ({myCourses.length})</h3>
          <div style={styles.playlistList}>
            {myCourses.length === 0 ? (
              <div style={styles.emptyList}>
                <BookOpen size={32} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No courses yet.</p>
              </div>
            ) : myCourses.map(c => (
              <div
                key={c.id}
                onClick={() => { setActiveCourseId(c.id); setShowCourseForm(false); setActiveSubjectId(null); setActivePlaylistId(null); setStudioTab('content'); }}
                style={{ ...styles.playlistItem, background: activeCourseId === c.id ? 'rgba(139,92,246,0.1)' : 'transparent', borderColor: activeCourseId === c.id ? 'var(--primary)' : 'transparent' }}
              >
                <div style={styles.playlistItemMain}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-creator" style={{ fontSize: '0.55rem' }}>{c.department}</span>
                    <span className={c.isDegree ? 'badge badge-learner' : 'badge badge-admin'} style={{ fontSize: '0.55rem' }}>
                      {c.isDegree ? 'Degree' : 'Course'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginTop: '6px' }}>{c.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '2px' }}>
                    {c.price > 0 ? `₹${c.price}` : 'Free'}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteCourse(c.id); if (activeCourseId === c.id) setActiveCourseId(null); }} style={styles.deleteBtn}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Workspace */}
        <div style={styles.rightColumn}>

          {/* A. Create Course Form */}
          {showCourseForm && (
            <div className="glass-panel" style={styles.formWorkspace}>
              <h3 style={styles.workspaceHeading}>{isAdmin ? 'Setup Program / Course' : 'Setup Standard Course'}</h3>
              <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {isAdmin && (
                  <CustomStudioSelect
                    label="Program Type"
                    value={courseType}
                    options={[
                      { label: 'Degree Program (Semester-wise)', value: 'degree' },
                      { label: 'Standard Course (Unified)', value: 'standard' }
                    ]}
                    onChange={val => setCourseType(val)}
                  />
                )}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{isAdmin && courseType === 'degree' ? 'Degree Title' : 'Course Title'}</label>
                  <input type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="e.g. B.Tech Computer Science" className="form-input" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <input type="text" value={courseDept} onChange={e => setCourseDept(e.target.value)} placeholder="e.g. Computer Science, Mechanical Engineering, Fine Arts" className="form-input" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Author / Organization Credits</label>
                  <input type="text" value={courseAuthor} onChange={e => setCourseAuthor(e.target.value)} placeholder="e.g. Training to Infinity, Prof. Sarah Miller" className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price (INR / 0 for Free)</label>
                  <input type="number" min="0" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} placeholder="499" className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description</label>
                  <textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} placeholder="Program description..." className="form-input" rows={3} style={{ resize: 'none' }} required />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {isAdmin && courseType === 'degree' ? 'Initialize Program' : 'Create Course'}
                  </button>
                  <button type="button" onClick={() => setShowCourseForm(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* B. Active Course Workspace */}
          {activeCourse && (
            <div style={styles.activeCourseWorkspace}>

              {/* Course meta — editable */}
              <div className="glass-panel" style={styles.activeCourseMeta}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge badge-creator">{activeCourse.department}</span>
                      <span className={isDegree ? 'badge badge-learner' : 'badge badge-admin'} style={{ fontSize: '0.65rem' }}>
                        {isDegree ? 'Degree Program' : 'Standard Course'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: activeCourse.price > 0 ? 'var(--primary)' : 'var(--success)', fontWeight: 600 }}>
                        {activeCourse.price > 0 ? `₹${activeCourse.price}` : 'Free'}
                      </span>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <InlineEdit value={activeCourse.title} onSave={v => editCourse(activeCourse.id, { title: v })} inputStyle={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }} />
                    </div>
                    <div style={{ marginBottom: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Credits: </span>
                      <InlineEdit value={activeCourse.author || activeCourse.creatorName || ''} onSave={v => editCourse(activeCourse.id, { author: v })} inputStyle={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }} />
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <InlineEdit value={activeCourse.description} onSave={v => editCourse(activeCourse.id, { description: v })} multiline inputStyle={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price (₹):</span>
                      <InlineEdit value={String(activeCourse.price)} onSave={v => editCourse(activeCourse.id, { price: parseFloat(v) || 0 })} inputStyle={{ fontSize: '0.85rem', color: 'var(--success)', width: '90px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setStudioTab('content')} className={`btn ${studioTab === 'content' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      <BookOpen size={12} /> Content
                    </button>
                    <button onClick={() => setStudioTab('enrollments')} className={`btn ${studioTab === 'enrollments' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      <Users size={12} /> Enrolled ({enrolledStudents.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab: Enrollments */}
              {studioTab === 'enrollments' && (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    Enrolled Students — {activeCourse.title}
                  </h3>
                  {enrolledStudents.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <Users size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students enrolled yet.</p>
                    </div>
                  ) : enrolledStudents.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge badge-${u.role}`} style={{ fontSize: '0.6rem' }}>{u.role}</span>
                        {(currentUser.role === 'admin' || currentUser.role === 'owner') && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${u.name} from this course?`)) {
                                removeUserEnrollment(u.id, activeCourse.id);
                              }
                            }}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.65rem', borderRadius: '4px' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Content */}
              {studioTab === 'content' && (
                <>
                  {/* Semester row */}
                  <div style={{ ...styles.semesterRowHeader, justifyContent: isDegree ? 'space-between' : 'flex-end' }}>
                    {isDegree && (
                      <div style={styles.semTabs}>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <button key={sem} onClick={() => { setSelectedSemester(sem); setActiveSubjectId(null); setActivePlaylistId(null); }}
                            className={`yt-chip ${selectedSemester === sem ? 'active' : ''}`}
                            style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
                            Sem {sem}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setShowSubjectForm(!showSubjectForm)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: 'var(--primary)' }}>
                      <Plus size={14} /> Add Subject
                    </button>
                  </div>

                  {showSubjectForm && (
                    <form onSubmit={handleCreateSubject} className="glass-panel animate-fade-in" style={{ ...styles.formWorkspace, display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject Name</label>
                        <input type="text" value={subjectTitle} onChange={e => setSubjectTitle(e.target.value)} placeholder="e.g. Discrete Mathematics" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} required />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>Create</button>
                      <button type="button" onClick={() => setShowSubjectForm(false)} className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>Cancel</button>
                    </form>
                  )}

                  {/* Subjects split */}
                  <div style={styles.subjectsWorkspaceGrid}>

                    {/* Subject sidebar */}
                    <div className="glass-panel" style={styles.subjectBox}>
                      <h4 style={styles.boxTitle}>Subjects ({activeSubjectsList.length})</h4>
                      <div style={styles.boxList}>
                        {activeSubjectsList.length === 0 ? (
                          <p style={styles.emptyText}>No subjects yet.</p>
                        ) : activeSubjectsList.map(sub => (
                          <div key={sub.id} onClick={() => { setActiveSubjectId(sub.id); setActivePlaylistId(null); }}
                            style={{ ...styles.subjectListItem, background: activeSubjectId === sub.id ? 'rgba(139,92,246,0.1)' : 'transparent', borderLeftColor: activeSubjectId === sub.id ? 'var(--primary)' : 'transparent' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{sub.title}</span>
                            <button onClick={e => { e.stopPropagation(); deleteSubject(sub.id); if (activeSubjectId === sub.id) setActiveSubjectId(null); }} style={styles.deleteIconBtn}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subject detail */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {activeSubject ? (
                        <>
                          {/* Subject header */}
                          <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Subject:</span>
                              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginTop: '2px' }}>{activeSubject.title}</h4>
                            </div>
                            <button onClick={() => setShowPlaylistForm(!showPlaylistForm)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                              <Plus size={12} /> Create Playlist
                            </button>
                          </div>

                          {showPlaylistForm && (
                            <form onSubmit={handleCreatePlaylist} className="glass-panel animate-fade-in" style={{ ...styles.formWorkspace, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>New Playlist</h4>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Playlist Title</label>
                                <input type="text" value={playlistTitle} onChange={e => setPlaylistTitle(e.target.value)} placeholder="e.g. Lecture Series" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} required />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Description (optional)</label>
                                <input type="text" value={playlistDesc} onChange={e => setPlaylistDesc(e.target.value)} placeholder="Brief description..." className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Playlist Author / Credits</label>
                                <input type="text" value={playlistAuthor} onChange={e => setPlaylistAuthor(e.target.value)} placeholder="e.g. Training to Infinity" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                              </div>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>Create</button>
                                <button type="button" onClick={() => setShowPlaylistForm(false)} className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>Cancel</button>
                              </div>
                            </form>
                          )}

                          {/* Upload forms row */}
                          <div style={styles.formsRow}>
                            {/* Video upload */}
                            <div className="glass-panel" style={styles.formCard}>
                              <h4 style={styles.formCardTitle}><Film size={14} color="var(--primary)" /> Add Video Chapter</h4>
                              <form onSubmit={handleAddVideo} style={styles.formBoxContent}>
                                {videoError && (
                                  <div style={styles.formError}><AlertCircle size={12} /><span>{videoError}</span></div>
                                )}
                                <div style={{ marginBottom: '8px' }}>
                                  <CustomStudioSelect
                                    label="Target Playlist"
                                    value={activePlaylistId || ''}
                                    options={(activeSubject.playlists || []).map(p => ({ label: p.title, value: p.id }))}
                                    onChange={val => setActivePlaylistId(val)}
                                    placeholder="Choose Playlist"
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Video Title</label>
                                  <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="01 - Introduction" className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>YouTube URL</label>
                                  <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtu.be/..." className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }} disabled={!activePlaylistId}>
                                  Publish Video
                                </button>
                              </form>
                            </div>

                            {/* Document upload */}
                            <div className="glass-panel" style={styles.formCard}>
                              <h4 style={styles.formCardTitle}><Plus size={14} color="var(--secondary)" /> Attach Reference Link</h4>
                              <form onSubmit={handleAddMaterial} style={styles.formBoxContent}>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Resource Title</label>
                                  <input type="text" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="Chapter Notes" className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Resource URL</label>
                                  <input type="text" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="Google Drive / any link..." className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Resource Author / Credits</label>
                                  <input type="text" value={resourceAuthor} onChange={e => setResourceAuthor(e.target.value)} placeholder="e.g. Prof. Sarah Miller" className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                  <CustomStudioSelect
                                    label="Upload to Section"
                                    value={resourceSection}
                                    options={(activeSubject.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers']).map(s => ({ label: s, value: s }))}
                                    onChange={val => setResourceSection(val)}
                                    placeholder="Choose Section"
                                  />
                                </div>
                                <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '6px', fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.1)' }} disabled={!resourceSection}>
                                  Attach Document
                                </button>
                              </form>
                            </div>
                          </div>

                          {/* Content lists */}
                          <div style={styles.enrolledListsGrid}>
                            {/* Playlists */}
                            <div className="glass-panel" style={{ ...styles.enrolledCard, gridColumn: 'span 2' }}>
                              <h4 style={styles.enrolledHeading}>Playlists & Videos ({activeSubject.playlists?.length || 0})</h4>
                              <div style={styles.enrolledListBody}>
                                {(!activeSubject.playlists || activeSubject.playlists.length === 0) ? (
                                  <p style={styles.emptyEnrolledText}>No playlists created yet.</p>
                                ) : activeSubject.playlists.map(pl => (
                                  <div key={pl.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '4px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>📁 {pl.title} ({pl.videos.length} videos)</span>
                                        {pl.description && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{pl.description}</span>}
                                      </div>
                                      <button onClick={() => deleteSubjectPlaylist(activeSubject.id, pl.id)} style={styles.deleteIconBtn}><Trash2 size={12} /></button>
                                    </div>
                                    <div style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {pl.videos.map((vid, idx) => (
                                        <div key={vid.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                          <span>📺 {idx + 1}. {vid.title}</span>
                                          <button onClick={() => deleteVideoFromPlaylist(activeSubject.id, pl.id, vid.id)} style={styles.deleteIconBtn}><Trash2 size={10} /></button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Custom material sections */}
                            <div className="glass-panel" style={{ ...styles.enrolledCard, gridColumn: 'span 2' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ ...styles.enrolledHeading, marginBottom: 0 }}>Material Sections & Files</h4>
                                <button onClick={() => setShowAddSectionForm(!showAddSectionForm)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                                  <Plus size={11} /> Add Section
                                </button>
                              </div>
                              {showAddSectionForm && (
                                <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'flex-end' }}>
                                  <input type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="e.g. Lab Manuals, PYQs, Assignments..." className="form-input" style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }} required />
                                  <button type="submit" className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Add</button>
                                  <button type="button" onClick={() => setShowAddSectionForm(false)} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Cancel</button>
                                </form>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '320px', overflowY: 'auto' }}>
                                {(activeSubject.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers']).map(section => {
                                  const sectionDocs = (activeSubject.materials || []).filter(m => m.sectionName === section);
                                  return (
                                    <div key={section}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                          📂 {section} ({sectionDocs.length})
                                        </span>
                                        <button onClick={() => deleteSubjectMaterialSection(activeSubject.id, section)} style={{ ...styles.deleteIconBtn, color: 'rgba(255,100,100,0.6)' }} title={`Delete "${section}"`}>
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                      {sectionDocs.length === 0 ? (
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '8px' }}>No files uploaded.</p>
                                      ) : sectionDocs.map(doc => (
                                        <div key={doc.id} style={styles.enrolledItem}>
                                          <span style={{ fontSize: '0.75rem' }}>📄 {doc.title}</span>
                                          <button onClick={() => deleteSubjectMaterial(activeSubject.id, doc.id)} style={styles.deleteIconBtn}><Trash2 size={11} /></button>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="glass-panel" style={styles.fallbackWorkspace}>
                          <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                          <h3>No Subject Selected</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Select a subject from the panel to manage content.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Fallback */}
          {!showCourseForm && !activeCourse && (
            <div className="glass-panel" style={styles.fallbackWorkspace}>
              <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h3>No Program Selected</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Select a curriculum on the left to configure its syllabus or view enrollments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  studioBanner: { padding: '24px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', textAlign: 'left' },
  mainGrid: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' },
  leftColumn: { padding: '20px', textAlign: 'left' },
  subHeading: { fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' },
  playlistList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' },
  emptyList: { padding: '40px 0', textAlign: 'center' },
  playlistItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', gap: '10px' },
  playlistItemMain: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', textAlign: 'left' },
  deleteBtn: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5', padding: '6px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rightColumn: { display: 'flex', flexDirection: 'column' },
  formWorkspace: { padding: '24px', textAlign: 'left' },
  workspaceHeading: { fontSize: '1.2rem', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' },
  fallbackWorkspace: { padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  activeCourseWorkspace: { display: 'flex', flexDirection: 'column', gap: '20px' },
  activeCourseMeta: { padding: '20px', textAlign: 'left' },
  semesterRowHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  semTabs: { display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flex: 1 },
  subjectsWorkspaceGrid: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' },
  subjectBox: { padding: '16px', textAlign: 'left' },
  boxTitle: { fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  boxList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  subjectListItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.04)', borderLeftWidth: '3px', borderLeftStyle: 'solid', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s', gap: '10px', textAlign: 'left' },
  deleteIconBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', borderRadius: '4px', transition: 'color 0.2s', display: 'flex', alignItems: 'center' },
  formsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formCard: { padding: '16px', textAlign: 'left' },
  formCardTitle: { fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' },
  formBoxContent: { display: 'flex', flexDirection: 'column' },
  formError: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.75rem', marginBottom: '8px' },
  enrolledListsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  enrolledCard: { padding: '16px', textAlign: 'left' },
  enrolledHeading: { fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' },
  enrolledListBody: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' },
  emptyEnrolledText: { fontSize: '0.75rem', color: 'var(--text-muted)', padding: '12px 0' },
  enrolledItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', marginTop: '4px' },
  emptyText: { fontSize: '0.75rem', color: 'var(--text-muted)', padding: '12px 0' },
  iconBtnGreen: { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '5px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconBtnRed: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', padding: '5px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
};
