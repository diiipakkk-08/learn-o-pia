import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search, FileText, Download, Copy, Check, Bookmark, BookmarkCheck,
  Video, Play, FolderKanban, Sparkles, ExternalLink, Clock, User, Filter, Layers,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function ResourcesView({ setCurrentView, setSelectedPlaylistId }) {
  const {
    standaloneResources,
    subjects,
    courses,
    globalSearchQuery,
    setGlobalSearchQuery,
    savedResourceIds,
    toggleSaveResource,
    isResourceSaved
  } = useDatabase();

  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'videos' | 'documents' | 'saved'
  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');

  // Pagination states
  const [videoPage, setVideoPage] = useState(1);
  const [docPage, setDocPage] = useState(1);

  // Reset pagination on search change
  useEffect(() => {
    setVideoPage(1);
    setDocPage(1);
  }, [localSearch, activeTab]);

  const handleCopy = (id, e) => {
    if (e) e.preventDefault();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compile all standalone resources and subject document materials
  const allDocResources = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Standalone open resources
    (standaloneResources || []).forEach((res) => {
      if (!res.id || seen.has(res.id)) return;
      seen.add(res.id);
      list.push({
        id: res.id,
        title: res.title,
        url: res.url,
        type: res.type || 'pdf',
        category: res.category || 'Study Guide',
        description: res.description || '',
        author: res.author || 'Educator',
        subjects: res.subjects || ['Open Study Resource']
      });
    });

    // 2. Subject materials
    (subjects || []).forEach((sub) => {
      (sub.materials || []).forEach((mat) => {
        const matId = mat.originalResourceId || mat.id;
        if (!matId || seen.has(matId)) return;
        seen.add(matId);
        list.push({
          id: matId,
          title: mat.title,
          url: mat.url,
          type: mat.type || 'pdf',
          category: mat.sectionName || 'Subject Material',
          description: `Resource from ${sub.title}`,
          author: mat.author || 'Faculty',
          subjects: [sub.title]
        });
      });
    });

    return list;
  }, [standaloneResources, subjects]);

  // Compile all video lectures across all playlists
  const allVideoLectures = useMemo(() => {
    const vids = [];
    const seen = new Set();

    (subjects || []).forEach((sub) => {
      (sub.playlists || []).forEach((pl) => {
        (pl.videos || []).forEach((v) => {
          const vKey = v.id || v.youtubeId;
          if (!vKey || seen.has(vKey)) return;
          seen.add(vKey);

          const yId = v.youtubeId || (v.url ? (v.url.match(/[?&]v=([^#&]+)/) || [])[1] : '');
          vids.push({
            id: v.id || `vid-${yId || Date.now()}`,
            title: v.title,
            youtubeId: yId,
            thumbnailUrl: yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : null,
            durationText: v.durationText || '15:00',
            subjectTitle: sub.title,
            playlistTitle: pl.title,
            courseId: sub.courseId,
            author: pl.author || 'Instructor'
          });
        });
      });
    });

    return vids;
  }, [subjects]);

  // Filter items by search query
  const query = (localSearch || '').trim().toLowerCase();

  const filteredDocs = useMemo(() => {
    return allDocResources.filter((res) => {
      if (!query) return true;
      return (
        res.title?.toLowerCase().includes(query) ||
        res.id?.toLowerCase().includes(query) ||
        res.category?.toLowerCase().includes(query) ||
        res.description?.toLowerCase().includes(query) ||
        res.author?.toLowerCase().includes(query)
      );
    });
  }, [allDocResources, query]);

  const filteredVideos = useMemo(() => {
    return allVideoLectures.filter((vid) => {
      if (!query) return true;
      return (
        vid.title?.toLowerCase().includes(query) ||
        vid.id?.toLowerCase().includes(query) ||
        vid.subjectTitle?.toLowerCase().includes(query) ||
        vid.playlistTitle?.toLowerCase().includes(query)
      );
    });
  }, [allVideoLectures, query]);

  // Paginated Video Items (10 per page)
  const totalVideoPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));
  const currentVideoPage = Math.min(videoPage, totalVideoPages);
  const paginatedVideos = useMemo(() => {
    const start = (currentVideoPage - 1) * ITEMS_PER_PAGE;
    return filteredVideos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVideos, currentVideoPage]);

  // Paginated Document Items (10 per page)
  const totalDocPages = Math.max(1, Math.ceil(filteredDocs.length / ITEMS_PER_PAGE));
  const currentDocPage = Math.min(docPage, totalDocPages);
  const paginatedDocs = useMemo(() => {
    const start = (currentDocPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocs, currentDocPage]);

  const savedDocs = useMemo(() => {
    return allDocResources.filter(r => savedResourceIds.includes(r.id));
  }, [allDocResources, savedResourceIds]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (setGlobalSearchQuery) setGlobalSearchQuery(localSearch);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', textAlign: 'left' }} className="animate-fade-in">
      
      {/* Search Header Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }} className="primary-gradient-text">
              <FolderKanban size={24} color="var(--primary)" /> Open Resources & Video Explorer
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Search topics, lecture videos, formula sheets, PDFs, and Google Drive resources across all courses.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('my-learning')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookmarkCheck size={16} color="#10b981" /> My Saved Resources ({savedResourceIds.length})
          </button>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (setGlobalSearchQuery) setGlobalSearchQuery(e.target.value);
              }}
              placeholder="Search by topic, keyword, subject name, or Resource ID (e.g. res-1, vid-123)..."
              style={{ width: '100%', paddingLeft: '42px', paddingRight: '12px', height: '44px', fontSize: '0.9rem', borderRadius: '10px', boxSizing: 'border-box' }}
            />
          </div>

          {localSearch && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setLocalSearch(''); if (setGlobalSearchQuery) setGlobalSearchQuery(''); }}
              style={{ padding: '0 16px', height: '44px', fontSize: '0.85rem' }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('all')}
          style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
        >
          <Layers size={14} /> All Results ({filteredDocs.length + filteredVideos.length})
        </button>

        <button
          className={`btn ${activeTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('videos')}
          style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
        >
          <Video size={14} /> Video Lectures ({filteredVideos.length})
        </button>

        <button
          className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('documents')}
          style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
        >
          <FileText size={14} /> PDFs & Drive Links ({filteredDocs.length})
        </button>

        <button
          className={`btn ${activeTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('saved')}
          style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
        >
          <Bookmark size={14} /> Saved Resources ({savedDocs.length})
        </button>
      </div>

      {/* SECTION 1: VIDEO LECTURES RESULTS */}
      {(activeTab === 'all' || activeTab === 'videos') && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color="var(--primary)" /> Video Lectures ({filteredVideos.length})
          </h3>

          {filteredVideos.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No video lectures found matching "{localSearch}".
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {paginatedVideos.map((vid) => (
                  <div key={vid.id} className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    
                    {/* YouTube Thumbnail Banner with Duration Badge */}
                    <div style={{ height: '140px', background: '#000', position: 'relative', overflow: 'hidden' }}>
                      {vid.thumbnailUrl ? (
                        <img src={vid.thumbnailUrl} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #311b92 100%)' }}>
                          <Play size={36} color="#a78bfa" />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
                      
                      {/* Duration Badge */}
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.85)', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {vid.durationText}
                      </span>

                      {/* Copyable Video ID */}
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>ID: <code style={{ color: '#a78bfa' }}>{vid.id}</code></span>
                        <button onClick={(e) => handleCopy(vid.id, e)} style={{ background: 'none', border: 'none', color: copiedId === vid.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                          {copiedId === vid.id ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.3' }}>{vid.title}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                          {vid.subjectTitle} • {vid.playlistTitle}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (vid.courseId && setSelectedPlaylistId) setSelectedPlaylistId(vid.courseId);
                          setCurrentView('learning-player');
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', fontSize: '0.78rem', gap: '6px' }}
                      >
                        <Play size={12} /> Watch Lecture
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Video Pagination Bar (10 results per page) */}
              {totalVideoPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                  <button
                    disabled={currentVideoPage <= 1}
                    onClick={() => setVideoPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentVideoPage <= 1 ? 0.5 : 1, gap: '4px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600 }}>
                    Page {currentVideoPage} of {totalVideoPages}
                  </span>

                  <button
                    disabled={currentVideoPage >= totalVideoPages}
                    onClick={() => setVideoPage(p => Math.min(totalVideoPages, p + 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentVideoPage >= totalVideoPages ? 0.5 : 1, gap: '4px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SECTION 2: DOCUMENTS & PDF RESOURCES RESULTS */}
      {(activeTab === 'all' || activeTab === 'documents') && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--secondary)" /> PDFs, Notes & Drive Resources ({filteredDocs.length})
          </h3>

          {filteredDocs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No PDF or Drive resources found matching "{localSearch}".
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {paginatedDocs.map((res) => {
                  const saved = isResourceSaved(res.id);
                  return (
                    <div key={res.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                            {res.category}
                          </span>

                          {/* Copyable Resource ID Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '6px' }}>
                            <span>ID: <code style={{ color: '#a78bfa' }}>{res.id}</code></span>
                            <button onClick={(e) => handleCopy(res.id, e)} style={{ background: 'none', border: 'none', color: copiedId === res.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                              {copiedId === res.id ? <Check size={10} /> : <Copy size={10} />}
                            </button>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                          {res.title}
                        </h4>

                        {res.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                            {res.description}
                          </p>
                        )}

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Credit: <strong>{res.author}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => toggleSaveResource(res.id)}
                          className={`btn ${saved ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: '0.75rem', gap: '4px', borderColor: saved ? undefined : 'rgba(255,255,255,0.1)' }}
                        >
                          {saved ? <BookmarkCheck size={13} color="#10b981" /> : <Bookmark size={13} />}
                          {saved ? 'Saved' : 'Save Resource'}
                        </button>

                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', gap: 4 }}
                        >
                          <Download size={13} /> Open Link
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Document Pagination Bar (10 results per page) */}
              {totalDocPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                  <button
                    disabled={currentDocPage <= 1}
                    onClick={() => setDocPage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentDocPage <= 1 ? 0.5 : 1, gap: '4px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 600 }}>
                    Page {currentDocPage} of {totalDocPages}
                  </span>

                  <button
                    disabled={currentDocPage >= totalDocPages}
                    onClick={() => setDocPage(p => Math.min(totalDocPages, p + 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: currentDocPage >= totalDocPages ? 0.5 : 1, gap: '4px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SECTION 3: SAVED RESOURCES VIEW */}
      {activeTab === 'saved' && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookmarkCheck size={18} color="#10b981" /> My Bookmarked Resources ({savedDocs.length})
          </h3>

          {savedDocs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Bookmark size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#ffffff' }}>No Saved Resources Yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Click the <strong>"Save Resource"</strong> button on any study guide or PDF to bookmark it for instant access anytime.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {savedDocs.map((res) => (
                <div key={res.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: '999px' }}>
                        {res.category}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#a78bfa' }}>ID: {res.id}</span>
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>{res.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{res.description}</p>
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
      )}

    </div>
  );
}
