/**
 * CreatorStudio.jsx
 * Modernized Creator, Educator & Academic Studio Workspace.
 * 
 * Features:
 * 1. Curate & Link YouTube Playlists & Courses (with automatic YouTube metadata curation)
 * 2. Upload Open Study Vault Materials (Notes, Formulas, PYQs, Code)
 * 3. Campus Broadcast & Notice Publishing (with custom author and resource attachments)
 * 4. Marketplace Lifecycle Listings (Buy, sell, exchange college essentials)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  useDatabase,
  extractYoutubePlaylistId,
  fetchYoutubePlaylistVideos,
  fetchYoutubeMetadata,
  getUserDesignation
} from '../../context/DatabaseContext';
import {
  Plus, BookOpen, Trash2, ChevronDown, Check, X, Copy,
  Video, Tag, ShoppingBag, Globe, Lock, Clock, RotateCw, ExternalLink,
  Sparkles, FileText, Megaphone, Loader2, Play, AlertCircle, ArrowLeft
} from 'lucide-react';
import {
  getUserStudioListings,
  addMarketplaceListing,
  relistMarketplaceListing,
  deleteMarketplaceListing
} from '../../utils/marketplaceStorage';

// ── Portal Dropdown Helper ──────────────────────────────────────────────────
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
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(20, 20, 19, 0.06)',
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
      {label && <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{label}</label>}
      <div
        ref={triggerRef}
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(o => !o)}
        style={{
          width: '100%',
          height: '38px',
          padding: '6px 12px',
          fontSize: '0.8rem',
          background: 'var(--bg-surface)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <span style={{ color: activeOption ? 'var(--text-primary)' : 'var(--text-muted)' }}>
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
              padding: '10px 16px',
              fontSize: '0.85rem',
              textAlign: 'left',
              background: String(value) === String(opt.value) ? 'var(--primary)' : 'transparent',
              color: String(value) === String(opt.value) ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: String(value) === String(opt.value) ? 600 : 400,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'background 0.15s',
              width: '100%'
            }}
          >
            {opt.label}
          </button>
        ))}
      </PortalDropdown>
    </div>
  );
}

// ── Error Boundary ───────────────────────────────────────────────────────────
class StudioErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Creator Studio caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-4xl mx-auto p-8 my-10 rounded-xl border border-border-subtle bg-surface text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-accent-forest/10 text-accent-forest flex items-center justify-center mx-auto font-bold">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-bold text-text-primary font-editorial">Studio Workspace</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            A temporary view update was caught cleanly. You can reload your studio or navigate back to courses.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-90 cursor-pointer"
            >
              Reload Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main Creator Studio Workspace ─────────────────────────────────────────────
function CreatorStudioInner({ setCurrentView, setSelectedPlaylistId }) {
  const {
    currentUser,
    courses,
    subjects,
    createCourseWithPlaylist,
    deleteCourseCatalogItem,
    deleteCourse,
    deleteSubject,
    deleteSubjectPlaylist,
    enrollInPlaylist,
    standaloneResources,
    addStandaloneResource,
    deleteStandaloneResource
  } = useDatabase();

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.isAdmin);

  // Active Studio Tab: 'courses' | 'resources' | 'marketplace'
  const [activeTab, setActiveTab] = useState('courses');

  // ── COURSES & PLAYLISTS STATE ──────────────────────────────────────────────
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseYtUrl, setCourseYtUrl] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseAuthor, setCourseAuthor] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseCategory, setCourseCategory] = useState('Computer Science & IT');
  const [courseCustomCategory, setCourseCustomCategory] = useState('');
  const [courseKeywords, setCourseKeywords] = useState('');
  const [courseBanner, setCourseBanner] = useState('');
  const [courseIsPublic, setCourseIsPublic] = useState(true);
  const [isCuratingYt, setIsCuratingYt] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [courseToast, setCourseToast] = useState('');

  // Auto-Curate Metadata when YouTube URL is pasted / typed
  const handleYoutubeUrlChange = async (url) => {
    setCourseYtUrl(url);
    setCourseError('');
    const trimmed = url.trim();
    if (!trimmed) return;

    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.startsWith('PL')) {
      setIsCuratingYt(true);
      try {
        const meta = await fetchYoutubeMetadata(trimmed);
        if (meta) {
          if (!courseTitle.trim() && meta.title) setCourseTitle(meta.title);
          if (!courseAuthor.trim() && meta.author) setCourseAuthor(meta.author);
          if (!courseDesc.trim() && meta.description) setCourseDesc(meta.description);
          if (meta.thumbnailUrl && !courseBanner) setCourseBanner(meta.thumbnailUrl);
        }
      } catch (err) {
        console.warn('Auto metadata curation notice:', err);
      } finally {
        setIsCuratingYt(false);
      }
    }
  };

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    setCourseError('');
    if (!courseTitle.trim() || !courseYtUrl.trim()) {
      setCourseError('Please provide a course title and a YouTube playlist or video link.');
      return;
    }

    let cleanPlId = extractYoutubePlaylistId(courseYtUrl);
    if (!cleanPlId) {
      // Also accept direct YouTube video link
      const vidMatch = courseYtUrl.match(/(?:watch\?v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
      if (vidMatch && vidMatch[1]) {
        cleanPlId = vidMatch[1];
      }
    }

    if (!cleanPlId) {
      setCourseError('Please provide a valid YouTube playlist URL (?list=...) or lecture video link.');
      return;
    }

    try {
      const finalCategory = courseCategory === 'Others' ? (courseCustomCategory.trim() || 'Others') : courseCategory;
      if (createCourseWithPlaylist) {
        const res = await createCourseWithPlaylist({
          title: courseTitle.trim(),
          author: courseAuthor.trim() || currentUser?.name || 'Faculty Educator',
          description: courseDesc.trim() || `Complete lecture series for ${courseTitle.trim()}.`,
          category: finalCategory,
          department: finalCategory,
          youtubePlaylistUrl: courseYtUrl.trim(),
          isPublic: courseIsPublic,
          bannerUrl: courseBanner.trim() || '',
          keywords: courseKeywords.trim()
        });

        if (res?.playlistId && typeof enrollInPlaylist === 'function') {
          enrollInPlaylist(res.playlistId);
        }
      }

      setCourseToast(`Published course "${courseTitle.trim()}" successfully!`);
      setCourseTitle('');
      setCourseAuthor('');
      setCourseDesc('');
      setCourseYtUrl('');
      setCourseBanner('');
      setCourseCustomCategory('');
      setCourseKeywords('');
      setCourseIsPublic(true);
      setShowCourseModal(false);
      setTimeout(() => setCourseToast(''), 4000);
    } catch (err) {
      setCourseError('Failed to publish course. Please check your internet connection.');
    }
  };

  const handleDeleteCourseItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}" from the catalog?`)) return;
    try {
      if (deleteCourseCatalogItem) {
        await deleteCourseCatalogItem({
          courseId: item.courseId || item.id,
          subjectId: item.subjectId,
          playlistId: item.playlistId || item.id
        });
      } else {
        if (item.playlistId) await deleteSubjectPlaylist(item.playlistId);
        if (item.subjectId) await deleteSubject(item.subjectId);
        if (item.id) await deleteCourse(item.id);
      }
      setCourseToast(`Removed "${item.title}".`);
      setTimeout(() => setCourseToast(''), 3000);
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  // Compile all courses & playlists for Studio display
  const allStudioCourses = useMemo(() => {
    const list = [];
    const seen = new Set();

    (subjects || []).forEach(sub => {
      (sub.playlists || []).forEach(pl => {
        if (!pl.id || seen.has(pl.id)) return;
        seen.add(pl.id);
        const isAuthored = (pl.author && pl.author.toLowerCase() === (currentUser?.name || '').toLowerCase()) ||
                           pl.author === 'Faculty Educator' ||
                           isAdmin;
        if (isAuthored) {
          list.push({
            id: pl.id,
            playlistId: pl.id,
            subjectId: sub.id,
            courseId: sub.courseId,
            title: pl.title,
            author: pl.author || 'Educator',
            description: pl.description || '',
            category: sub.title || 'University Course',
            lectureCount: pl.videos?.length || 0,
            isPublic: pl.isPublic !== false && pl.is_public !== false,
            youtubePlaylistId: pl.youtubePlaylistId || pl.youtube_playlist_id || '',
            bannerUrl: pl.bannerUrl || sub.bannerUrl || ''
          });
        }
      });
    });

    (courses || []).forEach(c => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        const isAuthored = (c.author && c.author.toLowerCase() === (currentUser?.name || '').toLowerCase()) ||
                           (c.creatorName && c.creatorName.toLowerCase() === (currentUser?.name || '').toLowerCase()) ||
                           (c.creatorId && c.creatorId === currentUser?.id) ||
                           (!currentUser && (c.creatorId === 'admin' || c.creatorId === 'guest' || !c.creatorId)) ||
                           isAdmin;
        if (isAuthored) {
          list.push({
            id: c.id,
            playlistId: c.youtubePlaylistId || c.id,
            courseId: c.id,
            title: c.title,
            author: c.author || c.creatorName || 'Instructor',
            description: c.description || '',
            category: c.department || 'Core Engineering',
            lectureCount: 24,
            isPublic: c.isPublic !== false && c.is_public !== false,
            youtubePlaylistId: c.youtubePlaylistId || '',
            bannerUrl: c.bannerUrl || '',
            keywords: c.keywords || ''
          });
        }
      }
    });

    return list;
  }, [subjects, courses, currentUser, isAdmin]);

  // ── STUDY VAULT & RESOURCES STATE ──────────────────────────────────────────
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState('pdf');
  const [resCategory, setResCategory] = useState('Formula Sheet & Quick Reference');
  const [resCustomCategory, setResCustomCategory] = useState('');
  const [resKeywords, setResKeywords] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resIsPublic, setResIsPublic] = useState(true);
  const [resToast, setResToast] = useState('');

  const handlePublishResource = (e) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;

    const finalCategory = resCategory === 'Others' ? (resCustomCategory.trim() || 'Others') : resCategory;
    if (typeof addStandaloneResource === 'function') {
      addStandaloneResource({
        title: resTitle.trim(),
        url: resUrl.trim(),
        type: resType,
        category: finalCategory,
        description: resDesc.trim(),
        author: currentUser?.name || 'Educator',
        isPublic: resIsPublic,
        keywords: resKeywords.trim()
      });
    }

    setResTitle('');
    setResUrl('');
    setResDesc('');
    setResCustomCategory('');
    setResKeywords('');
    setResIsPublic(true);
    setShowResourceModal(false);
    setResToast('Study resource published to Academic Vault!');
    setTimeout(() => setResToast(''), 3500);
  };

  const myVaultResources = useMemo(() => {
    return (standaloneResources || []).filter(res => {
      return (res.author && res.author.toLowerCase() === (currentUser?.name || '').toLowerCase()) ||
             res.uploaderId === currentUser?.id ||
             isAdmin;
    });
  }, [standaloneResources, currentUser, isAdmin]);

  // ── MARKETPLACE STATE ──────────────────────────────────────────────────────
  const [showSellModal, setShowSellModal] = useState(false);
  const [mktTitle, setMktTitle] = useState('');
  const [mktCategory, setMktCategory] = useState('Study Material');
  const [mktCustomCategory, setMktCustomCategory] = useState('');
  const [mktPrice, setMktPrice] = useState('');
  const [mktDesc, setMktDesc] = useState('');
  const [mktKeywords, setMktKeywords] = useState('');
  const [mktImageUrl, setMktImageUrl] = useState('');
  const [mktContactMethod, setMktContactMethod] = useState('whatsapp');
  const [mktContactDetail, setMktContactDetail] = useState('');
  const [mktSellerName, setMktSellerName] = useState(currentUser?.name || '');
  const [mktToast, setMktToast] = useState('');

  const [marketplaceListings, setMarketplaceListings] = useState(() => getUserStudioListings(currentUser));

  useEffect(() => {
    const refresh = () => setMarketplaceListings(getUserStudioListings(currentUser));
    refresh();
    window.addEventListener('learnopia_marketplace_updated', refresh);
    return () => window.removeEventListener('learnopia_marketplace_updated', refresh);
  }, [currentUser]);

  const handlePublishMarketplace = (e) => {
    e.preventDefault();
    if (!mktTitle.trim() || !mktPrice.trim()) return;

    const formattedPrice = mktPrice.startsWith('₹') || mktPrice.toLowerCase().includes('free')
      ? mktPrice
      : `₹${mktPrice}`;

    const finalMktCat = mktCategory === 'Others' ? (mktCustomCategory.trim() || 'Others') : mktCategory;

    addMarketplaceListing({
      title: mktTitle.trim(),
      category: finalMktCat,
      price: formattedPrice,
      author: mktSellerName.trim() || currentUser?.name || 'Campus Student',
      sellerId: currentUser?.id || 'guest',
      description: mktDesc.trim() || 'Verified student listing on campus exchange.',
      tag: finalMktCat,
      keywords: mktKeywords.trim(),
      contactMethod: mktContactMethod,
      contactDetail: mktContactDetail.trim() || '9876543210',
      imageUrl: mktImageUrl.trim() || null
    });

    setShowSellModal(false);
    setMktTitle('');
    setMktPrice('');
    setMktDesc('');
    setMktCustomCategory('');
    setMktKeywords('');
    setMktImageUrl('');
    setMktContactDetail('');
    setMktToast('Listing published! Live for 5 months (~150 days).');
    setTimeout(() => setMktToast(''), 4500);
  };

  const handleRelistItem = (id) => {
    relistMarketplaceListing(id);
    setMktToast('Listing renewed for 5 more months!');
    setTimeout(() => setMktToast(''), 3500);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Delete this listing permanently?')) {
      deleteMarketplaceListing(id);
      setMktToast('Listing deleted.');
      setTimeout(() => setMktToast(''), 3000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in text-left">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Creator & Academic Studio
            </h1>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-accent-forest/15 text-accent-forest uppercase">
                Admin Privileges
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Curate YouTube video series, share open study materials, and manage student marketplace listings.
          </p>
        </div>

        {/* Global Toast Alerts */}
        {(courseToast || resToast || mktToast) && (
          <div className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-accent-forest/10 border border-accent-forest/20 text-accent-forest animate-fade-in flex items-center gap-2">
            <Check size={14} />
            <span>{courseToast || resToast || mktToast}</span>
          </div>
        )}
      </div>

      {/* 3 Focused Studio Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('courses');
            setShowCourseModal(false);
            setShowResourceModal(false);
            setShowSellModal(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'courses'
              ? 'bg-accent-ink text-text-on-dark shadow-sm'
              : 'bg-surface text-text-secondary border border-border-subtle hover:bg-surface-hover hover:text-text-primary'
          }`}
        >
          <Video size={14} />
          <span>Courses ({allStudioCourses.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('resources');
            setShowCourseModal(false);
            setShowResourceModal(false);
            setShowSellModal(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'resources'
              ? 'bg-accent-ink text-text-on-dark shadow-sm'
              : 'bg-surface text-text-secondary border border-border-subtle hover:bg-surface-hover hover:text-text-primary'
          }`}
        >
          <FileText size={14} />
          <span>Resources ({myVaultResources.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('marketplace');
            setShowCourseModal(false);
            setShowResourceModal(false);
            setShowSellModal(false);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'marketplace'
              ? 'bg-accent-ink text-text-on-dark shadow-sm'
              : 'bg-surface text-text-secondary border border-border-subtle hover:bg-surface-hover hover:text-text-primary'
          }`}
        >
          <ShoppingBag size={14} />
          <span>Sell ({marketplaceListings.length})</span>
        </button>
      </div>

      {/* =================================================================
          TAB 1: COURSES & PLAYLISTS
      ================================================================= */}
      {activeTab === 'courses' && (
        showCourseModal ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 space-y-5 animate-fade-in max-w-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Courses</span>
              </button>
              <span className="text-[11px] font-mono-tabular text-text-muted">CURATE YOUTUBE PLAYLIST</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">Curate YouTube Course / Playlist</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Paste a YouTube playlist URL or lecture video. Learnopia automatically imports lecture chapters, titles, and syllabus structure.
              </p>
            </div>

            {courseError && (
              <div className="px-3.5 py-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/20 text-red-500 font-semibold">
                {courseError}
              </div>
            )}

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  YouTube Playlist or Video Link *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/playlist?list=PL... or video link"
                    value={courseYtUrl}
                    onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular pr-24"
                    required
                  />
                  {isCuratingYt && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-accent-forest font-semibold">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Fetching...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Course / Playlist Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures and Algorithms in C++"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Instructor / Channel Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MIT OpenCourseWare or Channel Name"
                    value={courseAuthor}
                    onChange={(e) => setCourseAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Category / Department
                  </label>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                  >
                    <option value="Computer Science & IT">Computer Science & IT</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Applied Sciences & Maths">Applied Sciences & Maths</option>
                    <option value="General & Foundational">General & Foundational</option>
                    <option value="Others">Others (Custom Category)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Visibility
                  </label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setCourseIsPublic(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        courseIsPublic
                          ? 'border-accent-forest bg-accent-forest/15 text-accent-forest font-bold'
                          : 'border-border-subtle bg-canvas text-text-secondary'
                      }`}
                    >
                      <Globe size={13} />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourseIsPublic(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        !courseIsPublic
                          ? 'border-accent-ink bg-accent-ink text-text-on-dark font-bold'
                          : 'border-border-subtle bg-canvas text-text-secondary'
                      }`}
                    >
                      <Lock size={13} />
                      <span>Private</span>
                    </button>
                  </div>
                </div>
              </div>

              {courseCategory === 'Others' && (
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Specify Custom Category *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Artificial Intelligence or Chemical Engineering"
                    value={courseCustomCategory}
                    onChange={(e) => setCourseCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Keywords / Tags (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. c++, trees, graphs, sorting"
                    value={courseKeywords}
                    onChange={(e) => setCourseKeywords(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Custom Thumbnail URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (auto-fetched from YouTube by default)"
                    value={courseBanner}
                    onChange={(e) => setCourseBanner(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Course Description / Syllabus
                </label>
                <textarea
                  rows={3}
                  placeholder="Overview of syllabus, prerequisites, and key topics covered..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong resize-vertical"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Publish Course</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Curated Courses & Lecture Series</h3>
              <p className="text-xs text-text-muted mt-0.5 font-mono-tabular">
                ALL PLAYLISTS ARE STREAMED DIRECTLY VIA YOUTUBE WITH SYLLABUS LECTURE CHAPTERS
              </p>
            </div>
            <button
              onClick={() => setShowCourseModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95"
            >
              <Plus size={14} />
              <span>Curate New Course / Playlist</span>
            </button>
          </div>

          {allStudioCourses.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-xl border border-border-subtle bg-surface space-y-3">
              <Video size={36} className="text-text-muted mx-auto" />
              <h4 className="text-base font-bold text-text-primary">No Courses or Playlists in Studio</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Add your first playlist link. Learn-O-Pia will automatically curate the channel credits, syllabus titles, and stream them inside the player.
              </p>
              <button
                onClick={() => setShowCourseModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add First Course</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allStudioCourses.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border-subtle bg-surface p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-border-strong transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-subtle text-text-secondary">
                        {c.category}
                      </span>
                      <span className={`text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        c.isPublic ? 'bg-accent-forest/15 text-accent-forest' : 'bg-subtle text-text-muted'
                      }`}>
                        {c.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                        <span>{c.isPublic ? 'Public' : 'Private'}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-text-primary line-clamp-1">{c.title}</h4>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {c.description || 'Comprehensive university course series.'}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-border-subtle">
                    <span className="text-[11px] font-mono-tabular text-text-muted truncate max-w-[130px]">
                      {c.author}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteCourseItem(c)}
                        className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 cursor-pointer transition-colors shadow-xs"
                        title="Delete Course from catalog"
                      >
                        <Trash2 size={12} />
                      </button>

                      {setSelectedPlaylistId && setCurrentView && (
                        <button
                          onClick={() => {
                            setSelectedPlaylistId(c.playlistId || c.id);
                            setCurrentView('learning-player');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-ink text-text-on-dark flex items-center gap-1.5 hover:opacity-95 cursor-pointer shadow-xs"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>Watch</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )
      )}

      {/* =================================================================
          TAB 2: OPEN STUDY VAULT
      ================================================================= */}
      {activeTab === 'resources' && (
        showResourceModal ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 space-y-5 animate-fade-in max-w-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <button
                type="button"
                onClick={() => setShowResourceModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Resources</span>
              </button>
              <span className="text-[11px] font-mono-tabular text-text-muted">PUBLISH STUDY DOCUMENT</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">Publish Study Vault Document</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Share high-yield formula sheets, handwritten lecture summaries, or semester PYQ packs with the campus.
              </p>
            </div>

            <form onSubmit={handlePublishResource} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering Mathematics 1-Page Formula Sheet"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  File URL or Link *
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://example.com/notes.pdf"
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Document Category
                  </label>
                  <select
                    value={resCategory}
                    onChange={(e) => setResCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                  >
                    <option value="Formula Sheet & Quick Reference">Formula Sheet & Quick Reference</option>
                    <option value="Semester Organizer & PYQ">Semester Organizer & PYQ</option>
                    <option value="Handwritten Lecture Notes">Handwritten Lecture Notes</option>
                    <option value="Lab Manual & Viva Code">Lab Manual & Viva Code</option>
                    <option value="Others">Others (Custom Category)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Visibility
                  </label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setResIsPublic(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        resIsPublic
                          ? 'border-accent-forest bg-accent-forest/15 text-accent-forest font-bold'
                          : 'border-border-subtle bg-canvas text-text-secondary'
                      }`}
                    >
                      <Globe size={13} />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResIsPublic(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        !resIsPublic
                          ? 'border-accent-ink bg-accent-ink text-text-on-dark font-bold'
                          : 'border-border-subtle bg-canvas text-text-secondary'
                      }`}
                    >
                      <Lock size={13} />
                      <span>Private</span>
                    </button>
                  </div>
                </div>
              </div>

              {resCategory === 'Others' && (
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Specify Custom Category *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Project Reports or Case Studies"
                    value={resCustomCategory}
                    onChange={(e) => setResCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Keywords / Tags (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. formulas, pyq, solved papers, unit 1"
                  value={resKeywords}
                  onChange={(e) => setResKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Description / Topic Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of what chapters or theorems are in this document..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong resize-vertical"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Publish to Vault</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Shared Academic Vault Documents</h3>
              <p className="text-xs text-text-muted mt-0.5 font-mono-tabular">
                UPLOAD FORMULA SHEETS, HANDWRITTEN NOTES, AND SEMESTER PYQS
              </p>
            </div>
            <button
              onClick={() => setShowResourceModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95"
            >
              <Plus size={14} />
              <span>Publish Study Document</span>
            </button>
          </div>

          {myVaultResources.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-xl border border-border-subtle bg-surface space-y-3">
              <FileText size={36} className="text-text-muted mx-auto" />
              <h4 className="text-base font-bold text-text-primary">No Documents in Your Vault</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Upload direct links to semester organizers, formula summaries, or handwritten notes for other learners.
              </p>
              <button
                onClick={() => setShowResourceModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Upload Document</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border-subtle bg-surface divide-y divide-border-subtle overflow-hidden">
              {myVaultResources.map((res) => (
                <div key={res.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-hover/60 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono-tabular font-bold px-1.5 py-0.2 rounded bg-subtle text-text-secondary">
                        {res.category || 'Reference'}
                      </span>
                      <span className="text-[10px] font-mono-tabular text-text-muted uppercase">
                        {res.type || 'PDF'}
                      </span>
                      <span className={`text-[10px] font-mono-tabular font-bold px-1.5 py-0.2 rounded ${
                        res.isPublic !== false ? 'bg-accent-forest/15 text-accent-forest' : 'bg-subtle text-text-muted'
                      }`}>
                        {res.isPublic !== false ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate">{res.title}</h4>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">{res.description || res.url}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-primary flex items-center gap-1.5 transition-colors"
                      >
                        <span>Open</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                    {deleteStandaloneResource && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${res.title}"?`)) {
                            deleteStandaloneResource(res.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-red-500 cursor-pointer transition-colors"
                        title="Delete Resource"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )
      )}

      {/* =================================================================
          TAB 3: MARKETPLACE / SELL
      ================================================================= */}
      {activeTab === 'marketplace' && (
        showSellModal ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 space-y-5 animate-fade-in max-w-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <button
                type="button"
                onClick={() => setShowSellModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back to Sell Listings</span>
              </button>
              <span className="text-[11px] font-mono-tabular text-text-muted">5-MONTH CAMPUS LISTING</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">Sell on Student Marketplace</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Listings remain active on campus for 5 months (150 days) with 1-click renewal.
              </p>
            </div>

            <form onSubmit={handlePublishMarketplace} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Item Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mini Drafter & Pine Drawing Board"
                    value={mktTitle}
                    onChange={(e) => setMktTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹450 or Free"
                    value={mktPrice}
                    onChange={(e) => setMktPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Category
                  </label>
                  <select
                    value={mktCategory}
                    onChange={(e) => setMktCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                  >
                    <option value="Study Material">Study Material</option>
                    <option value="Hardware Kits">Hardware Kits</option>
                    <option value="Tools & Gear">Tools & Gear</option>
                    <option value="Services">Services</option>
                    <option value="Others">Others (Custom Category)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Contact Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={mktContactDetail}
                    onChange={(e) => setMktContactDetail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular"
                    required
                  />
                </div>
              </div>

              {mktCategory === 'Others' && (
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Specify Custom Category *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Musical Instruments or Sports Gear"
                    value={mktCustomCategory}
                    onChange={(e) => setMktCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Keywords / Tags (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. drafter, engineering, first-year, graphics"
                    value={mktKeywords}
                    onChange={(e) => setMktKeywords(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1">
                    Item Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={mktImageUrl}
                    onChange={(e) => setMktImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">
                  Description & Condition
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe condition, semester used, or pickup location..."
                  value={mktDesc}
                  onChange={(e) => setMktDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-canvas text-text-primary text-xs focus:outline-none focus:border-border-strong resize-vertical"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <ShoppingBag size={14} />
                  <span>Publish Item</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl border border-border-subtle bg-surface-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono-tabular">
                Marketplace 5-Month Lifecycle Rules
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Listings stay active on campus for <strong>5 months (150 days)</strong> with a <strong>1-month grace period</strong> for 1-click renewal.
              </p>
            </div>
            <button
              onClick={() => setShowSellModal(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accent-ink text-text-on-dark flex items-center gap-1.5 shrink-0 hover:opacity-95 cursor-pointer shadow-xs"
            >
              <Plus size={13} />
              <span>Sell Something</span>
            </button>
          </div>

          {marketplaceListings.length === 0 ? (
            <div className="text-center py-14 p-6 rounded-xl border border-border-subtle bg-surface space-y-3">
              <ShoppingBag size={32} className="text-text-muted mx-auto" />
              <h4 className="text-sm font-bold text-text-primary">No Marketplace Items Listed</h4>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Sell used textbooks, mini drafters, engineering calculators, or offer student tutoring.
              </p>
              <button
                onClick={() => setShowSellModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>List Item on Marketplace</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceListings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border-subtle bg-surface hover:border-border-strong p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-xs transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
                      <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-subtle text-text-secondary">
                        {item.category}
                      </span>
                      <span className="text-sm font-bold text-accent-forest font-mono-tabular">
                        {item.price}
                      </span>
                    </div>

                    {item.imageUrl && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/5 border border-border-subtle">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-bold text-text-primary line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Lifecycle Status & Countdown */}
                    <div className="p-2.5 rounded-xl border border-border-subtle bg-surface-sunken space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                        {item.isMarketplaceActive ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live on Campus
                          </span>
                        ) : (
                          <span className="text-amber-500 font-bold flex items-center gap-1.5">
                            <Clock size={12} />
                            Grace Period
                          </span>
                        )}
                        <span className="text-text-muted font-bold">
                          {item.isMarketplaceActive
                            ? `${item.daysLeftOnMarketplace} days left`
                            : `${item.daysLeftInGrace} days remaining`}
                        </span>
                      </div>
                      <div className="w-full bg-border-subtle h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.isMarketplaceActive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{
                            width: item.isMarketplaceActive
                              ? `${Math.max(5, (item.daysLeftOnMarketplace / 150) * 100)}%`
                              : `${Math.max(5, (item.daysLeftInGrace / 30) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-border-subtle">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRelistItem(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-forest/10 text-accent-forest hover:bg-accent-forest/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Renew listing for 5 more months"
                      >
                        <RotateCw size={12} />
                        <span>Relist 5 Mos</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-xs text-text-muted hover:text-red-500 cursor-pointer transition-colors"
                        title="Delete listing permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {item.isMarketplaceActive && setCurrentView && (
                      <button
                        onClick={() => setCurrentView('marketplace')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )
      )}

    </div>
  );
}

export default function CreatorStudio(props) {
  return (
    <StudioErrorBoundary {...props}>
      <CreatorStudioInner {...props} />
    </StudioErrorBoundary>
  );
}
