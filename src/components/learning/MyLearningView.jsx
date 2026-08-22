import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  BookOpen, BookmarkCheck, Play, Download, Copy, Check, Trash2,
  Sparkles, Compass, ArrowRight, FolderKanban, Plus, LogOut
} from 'lucide-react';

export default function MyLearningView({ setCurrentView, setSelectedPlaylistId }) {
  const {
    currentUser,
    courses,
    subjects,
    standaloneResources,
    savedResourceIds,
    toggleSaveResource,
    isResourceSaved,
    removeUserEnrollment
  } = useDatabase();

  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, e) => {
    if (e) e.preventDefault();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Enrolled Courses
  const enrolledCourseList = useMemo(() => {
    if (!currentUser || !currentUser.enrolledCourses) return [];
    return courses.filter(c => currentUser.enrolledCourses.includes(c.id));
  }, [currentUser, courses]);

  // Saved Resources
  const savedDocList = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Standalone
    (standaloneResources || []).forEach(res => {
      if (res.id && savedResourceIds.includes(res.id) && !seen.has(res.id)) {
        seen.add(res.id);
        list.push({
          id: res.id,
          title: res.title,
          url: res.url,
          category: res.category || 'Study Guide',
          description: res.description || '',
          author: res.author || 'Educator'
        });
      }
    });

    // 2. Subject Materials
    (subjects || []).forEach(sub => {
      (sub.materials || []).forEach(mat => {
        const mId = mat.originalResourceId || mat.id;
        if (mId && savedResourceIds.includes(mId) && !seen.has(mId)) {
          seen.add(mId);
          list.push({
            id: mId,
            title: mat.title,
            url: mat.url,
            category: mat.sectionName || 'Subject Material',
            description: `From ${sub.title}`,
            author: mat.author || 'Faculty'
          });
        }
      });
    });

    return list;
  }, [standaloneResources, subjects, savedResourceIds]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', textAlign: 'left' }} className="animate-fade-in">

      {/* SECTION 1: MY ENROLLED COURSES & PLAYLISTS */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--primary)" /> Enrolled Courses & Playlists ({enrolledCourseList.length})
          </h2>
          <button onClick={() => setCurrentView('learning')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
            + Explore All Courses
          </button>
        </div>

        {enrolledCourseList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderRadius: '14px' }}>
            <BookOpen size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 6px 0' }}>No Enrolled Courses Yet</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px auto' }}>
              You haven't enrolled in any degree curricula or courses yet. Browse available programs and click "Enroll Course" to get started!
            </p>
            <button onClick={() => setCurrentView('learning')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              Browse Degree Curricula
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {enrolledCourseList.map((course) => (
              <div key={course.id} className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                {/* Course Banner */}
                <div style={{ height: '130px', position: 'relative', overflow: 'hidden', background: '#000' }}>
                  <img
                    src={course.bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(13,14,24,0.85) 100%)' }} />
                  <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.68rem', fontWeight: 700, color: '#fff', background: 'rgba(139,92,246,0.85)', padding: '2px 8px', borderRadius: '6px' }}>
                    {course.department}
                  </span>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.3' }}>{course.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{course.description}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        if (setSelectedPlaylistId) setSelectedPlaylistId(course.id);
                        setCurrentView('learning-player');
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '0.82rem', gap: '6px' }}
                    >
                      <Play size={14} /> Open Course
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof removeUserEnrollment === 'function' && currentUser) {
                          removeUserEnrollment(currentUser.id, course.id);
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="Exit Course / Remove from My Learning"
                    >
                      <LogOut size={13} /> Exit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: MY SAVED RESOURCES */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookmarkCheck size={20} color="#10b981" /> My Saved Resources ({savedDocList.length})
          </h2>
          <button onClick={() => setCurrentView('resources')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
            + Search & Save Resources
          </button>
        </div>

        {savedDocList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderRadius: '14px' }}>
            <BookmarkCheck size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 6px 0' }}>No Saved Resources Yet</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
              Whenever you see a useful PDF, formula sheet, or Google Drive resource, click the <strong>"Save Resource"</strong> button so it appears here for instant offline access anytime!
            </p>
            <button onClick={() => setCurrentView('resources')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              Explore Public Resources
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {savedDocList.map((res) => (
              <div key={res.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                      {res.category}
                    </span>

                    {/* Copy ID Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '6px' }}>
                      <span>ID: <code style={{ color: '#a78bfa' }}>{res.id}</code></span>
                      <button onClick={(e) => handleCopy(res.id, e)} style={{ background: 'none', border: 'none', color: copiedId === res.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                        {copiedId === res.id ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.4' }}>{res.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>{res.description}</p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Credit: {res.author}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                  <button onClick={() => toggleSaveResource(res.id)} className="btn btn-secondary btn-sm" style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                    Remove
                  </button>

                  <a href={res.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', gap: 4 }}>
                    <Download size={13} /> Open File
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
