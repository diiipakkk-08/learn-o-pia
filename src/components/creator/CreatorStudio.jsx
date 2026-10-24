/**
 * CreatorStudio.jsx
 * Instructor & Educator studio for creating subjects, importing YouTube playlists,
 * managing video curriculum, reordering lectures, and monitoring enrolled students.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDatabase, extractYoutubePlaylistId, fetchYoutubePlaylistVideos, getUserDesignation } from '../../context/DatabaseContext';
import {
  Plus, BookOpen, Trash2, Film, FolderPlus, ChevronDown,
  Pencil, Check, X, Users, AlertCircle, ArrowUp, ArrowDown, Copy,
  Video, Link, Tag, ShoppingBag, Globe, Lock, Clock, RotateCw, ExternalLink,
  Sparkles, FileText, Share2, Layers, Play
} from 'lucide-react';
import {
  getUserStudioListings,
  addMarketplaceListing,
  relistMarketplaceListing,
  deleteMarketplaceListing
} from '../../utils/marketplaceStorage';

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
        border: '1px solid rgba(20, 20, 19, 0.06)',
        borderRadius: '10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(20, 20, 19, 0.06)',
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
        style={{ width: '100%', height: '38px', padding: '6px 12px', fontSize: '0.8rem', background: 'var(--bg-surface)' }}
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
              padding: '10px 16px', fontSize: '0.85rem', textAlign: 'left',
              background: String(value) === String(opt.value) ? 'var(--primary)' : 'transparent',
              color: String(value) === String(opt.value) ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: String(value) === String(opt.value) ? 600 : 400,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'background 0.15s', width: '100%'
            }}
            onMouseEnter={e => { if (String(value) !== String(opt.value)) e.target.style.background = 'rgba(20, 20, 19, 0.06)'; e.target.style.color = 'var(--text-primary)'; }}
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
export default function CreatorStudio({ setCurrentView, setSelectedPlaylistId }) {
  const {
    currentUser, courses, subjects, users,
    addCourse, editCourse, deleteCourse,
    addSubject, updateSubjectDetails, deleteSubject,
    addSubjectPlaylist, deleteSubjectPlaylist,
    addVideoToPlaylist, deleteVideoFromPlaylist,
    addSubjectMaterialSection, deleteSubjectMaterialSection,
    addSubjectMaterial, deleteSubjectMaterial,
    removeUserEnrollment, enrollInPlaylist,
    reorderSubject, reorderPlaylist, reorderVideo, reorderMaterialSection,
    importVideosToExistingPlaylist, addStandaloneResource,
    standaloneResources, deleteStandaloneResource
  } = useDatabase();

  const [activeCourseId, setActiveCourseId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [studioTab, setStudioTab] = useState('content');

  // Studio navigation mode: 'creations' (default) vs 'curriculum'
  const [studioMode, setStudioMode] = useState('creations');
  const [creationsSubTab, setCreationsSubTab] = useState('marketplace'); // 'marketplace' | 'courses' | 'resources'

  // Marketplace Sell Form State
  const [showSellForm, setShowSellForm] = useState(false);
  const [mktTitle, setMktTitle] = useState('');
  const [mktCategory, setMktCategory] = useState('Books & Notes');
  const [mktPrice, setMktPrice] = useState('');
  const [mktDesc, setMktDesc] = useState('');
  const [mktKeywords, setMktKeywords] = useState('');
  const [mktImageUrl, setMktImageUrl] = useState('');
  const [mktContactMethod, setMktContactMethod] = useState('whatsapp');
  const [mktContactDetail, setMktContactDetail] = useState('');
  const [mktSellerName, setMktSellerName] = useState(currentUser?.name || '');
  const [mktNotice, setMktNotice] = useState('');

  // User Marketplace Listings (with 5-month active + 1-month grace period)
  const [marketplaceListings, setMarketplaceListings] = useState(() => getUserStudioListings(currentUser));

  useEffect(() => {
    const refresh = () => setMarketplaceListings(getUserStudioListings(currentUser));
    refresh();
    window.addEventListener('learnopia_marketplace_updated', refresh);
    return () => window.removeEventListener('learnopia_marketplace_updated', refresh);
  }, [currentUser]);

  // Public / Private visibility states (Default Public: true)
  const [stIsPublic, setStIsPublic] = useState(true);
  const [resIsPublic, setResIsPublic] = useState(true);

  // Standalone Resource Form State
  const [showStandaloneForm, setShowStandaloneForm] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState('pdf');
  const [resCategory, setResCategory] = useState('Formula Sheet & Quick Reference');
  const [resDesc, setResDesc] = useState('');
  const [resSuccess, setResSuccess] = useState('');

  const handlePublishStandaloneResource = (e) => {
    e.preventDefault();
    if (!resTitle.trim() || !resUrl.trim()) return;

    if (typeof addStandaloneResource === 'function') {
      addStandaloneResource({
        title: resTitle.trim(),
        url: resUrl.trim(),
        type: resType,
        category: resCategory,
        description: resDesc.trim(),
        author: getUserDesignation(currentUser),
        isPublic: resIsPublic
      });
    }

    setResTitle('');
    setResUrl('');
    setResDesc('');
    setResIsPublic(true);
    setShowStandaloneForm(false);
    setResSuccess('Standalone resource published to the Open Learning Feed!');
    setTimeout(() => setResSuccess(''), 3500);
  };

  const handlePublishMarketplaceListing = (e) => {
    e.preventDefault();
    if (!mktTitle.trim() || !mktPrice.trim()) return;

    const formattedPrice = mktPrice.startsWith('₹') || mktPrice.toLowerCase().includes('free')
      ? mktPrice
      : `₹${mktPrice}`;

    addMarketplaceListing({
      title: mktTitle.trim(),
      category: mktCategory,
      price: formattedPrice,
      author: mktSellerName.trim() || currentUser?.name || 'Campus Student',
      sellerId: currentUser?.id || 'guest',
      description: mktDesc.trim() || 'Verified student listing on campus exchange.',
      tag: mktCategory,
      keywords: mktKeywords.trim(),
      contactMethod: mktContactMethod,
      contactDetail: mktContactDetail.trim() || '9876543210',
      imageUrl: mktImageUrl.trim() || null
    });

    setShowSellForm(false);
    setMktTitle('');
    setMktPrice('');
    setMktDesc('');
    setMktKeywords('');
    setMktImageUrl('');
    setMktContactDetail('');
    setMktNotice('Listing published! It is now active on the Marketplace for 5 months (~150 days).');
    setTimeout(() => setMktNotice(''), 4500);
  };

  const handleRelistMarketplace = (itemId) => {
    relistMarketplaceListing(itemId);
    setMktNotice('Listing renewed! It is now live on the Marketplace for another 5 months.');
    setTimeout(() => setMktNotice(''), 4000);
  };

  const handleDeleteMarketplace = (itemId) => {
    if (window.confirm('Are you sure you want to delete this listing from the database?')) {
      deleteMarketplaceListing(itemId);
      setMktNotice('Listing removed from database.');
      setTimeout(() => setMktNotice(''), 3000);
    }
  };

  // Edit Subject Details state
  const [showSubjectEditForm, setShowSubjectEditForm] = useState(false);
  const [editSubjectCode, setEditSubjectCode] = useState('');
  const [editSubjectCredits, setEditSubjectCredits] = useState('');
  const [editSubjectAuthor, setEditSubjectAuthor] = useState('');
  const [editSubjectDept, setEditSubjectDept] = useState('');
  const [editSubjectOverviewInfo, setEditSubjectOverviewInfo] = useState('');

  const [importingPlId, setImportingPlId] = useState(null);
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState(null);

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDept, setCourseDept] = useState('Computer Science');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseType, setCourseType] = useState('standard');
  const [coursePrice, setCoursePrice] = useState(0);
  const [courseBannerUrl, setCourseBannerUrl] = useState('');
  const [courseKeywords, setCourseKeywords] = useState('');

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectTitle, setSubjectTitle] = useState('');
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistType, setPlaylistType] = useState('embed'); // 'embed' | 'custom'
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState('');
  const [playlistBannerUrl, setPlaylistBannerUrl] = useState('');
  const [playlistError, setPlaylistError] = useState('');

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

  // Standalone Playlist Form State
  const [showStandalonePlaylistForm, setShowStandalonePlaylistForm] = useState(false);
  const [stTitle, setStTitle] = useState('');
  const [stDesc, setStDesc] = useState('');
  const [stAuthor, setStAuthor] = useState('');
  const [stYtUrl, setStYtUrl] = useState('');
  const [stError, setStError] = useState('');

  const handleCreateStandalonePlaylist = async (e) => {
    e.preventDefault();
    setStError('');
    if (!stTitle.trim() || !stYtUrl.trim()) return;

    const ytId = extractYoutubePlaylistId(stYtUrl);
    if (!ytId) {
      setStError('Please provide a valid YouTube Playlist URL (e.g. https://www.youtube.com/playlist?list=PLr6-S4ER...)');
      return;
    }

    // Check duplicate playlist
    let existingPlaylist = null;
    (subjects || []).forEach(sub => {
      (sub.playlists || []).forEach(pl => {
        if (pl.youtubePlaylistId && (pl.youtubePlaylistId === ytId || pl.id === `pl-${ytId}`)) {
          existingPlaylist = { id: pl.id, title: pl.title, subjectTitle: sub.title };
        }
      });
    });

    if (existingPlaylist) {
      setStError(`Notice: This YouTube playlist already exists in our database under Subject "${existingPlaylist.subjectTitle}" (ID: ${existingPlaylist.id}) as "${existingPlaylist.title}".`);
      return;
    }

    let fetchedVideos = [];
    try {
      fetchedVideos = await fetchYoutubePlaylistVideos(ytId);
    } catch (err) {
      console.warn("Auto-fetch error:", err);
    }

    const defaultSubId = (subjects && subjects[0]?.id) || 'sub-1';
    const newPlId = await addSubjectPlaylist(
      defaultSubId,
      stTitle.trim(),
      stDesc.trim() || 'Standalone YouTube Playlist Series',
      stAuthor.trim() || currentUser?.name || 'Educator',
      ytId,
      fetchedVideos
    );
    if (newPlId && typeof enrollInPlaylist === 'function') {
      enrollInPlaylist(newPlId);
    }

    setStTitle(''); setStDesc(''); setStAuthor(''); setStYtUrl('');
    setStIsPublic(true);
    setShowStandalonePlaylistForm(false);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const myPlaylists = useMemo(() => {
    const list = [];
    (subjects || []).forEach(sub => {
      (sub.playlists || []).forEach(pl => {
        const isAuthored = (pl.author && pl.author.toLowerCase() === (currentUser?.name || '').toLowerCase()) ||
                           pl.author === 'Educator' ||
                           pl.isUserCreated;
        if (isAuthored || isAdmin) {
          list.push({ ...pl, subjectTitle: sub.title });
        }
      });
    });
    return list;
  }, [subjects, currentUser, isAdmin]);

  const myResources = useMemo(() => {
    return (standaloneResources || []).filter(r => {
      return (r.author && r.author.toLowerCase() === (currentUser?.name || '').toLowerCase()) ||
             r.isUserCreated ||
             isAdmin;
    });
  }, [standaloneResources, currentUser, isAdmin]);

  const myCourses = (courses || []).filter(c => isAdmin ? true : (c.creatorId === currentUser?.id && !c.isDegree));
  const activeCourse = (courses || []).find(c => c.id === activeCourseId);
  const isDegree = activeCourse?.isDegree;
  const courseSubjects = activeCourse 
    ? (subjects || [])
        .filter(s => s.courseId === activeCourse.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
    : [];
  const semesterSubjects = courseSubjects.filter(s => Number(s.semester) === Number(selectedSemester));
  const activeSubjectsList = isDegree ? semesterSubjects : courseSubjects;
  const activeSubject = (subjects || []).find(s => s.id === activeSubjectId);

  const enrolledStudents = activeCourse
    ? (users || []).filter(u => u.enrolledCourses?.includes(activeCourse.id))
    : [];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseDesc.trim()) return;
    addCourse(courseTitle, courseDept, courseDesc, coursePrice, isAdmin ? (courseType === 'degree') : false, courseAuthor, courseBannerUrl, courseKeywords);
    setCourseTitle(''); setCourseDesc(''); setCoursePrice(0); setCourseAuthor(''); setCourseBannerUrl(''); setCourseKeywords(''); setShowCourseForm(false);

  };
  const handleCreateSubject = (e) => {
    e.preventDefault();
    if (!subjectTitle.trim() || !activeCourse) return;
    addSubject(activeCourse.id, isDegree ? selectedSemester : 1, subjectTitle);
    setSubjectTitle(''); setShowSubjectForm(false);
  };
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    setPlaylistError('');
    if (!playlistTitle.trim() || !activeSubject) return;

    let ytPlaylistId = '';
    let fetchedVideos = [];
    if (playlistType === 'embed') {
      ytPlaylistId = extractYoutubePlaylistId(youtubePlaylistUrl);
      if (!ytPlaylistId) {
        setPlaylistError('Please provide a valid YouTube Playlist link or ID (e.g. https://www.youtube.com/playlist?list=PLr6-S4ER...)');
        return;
      }

      // Check if YouTube Playlist ID already exists in the database
      let existingPlaylist = null;
      (subjects || []).forEach(sub => {
        (sub.playlists || []).forEach(pl => {
          if (pl.youtubePlaylistId && (pl.youtubePlaylistId === ytPlaylistId || pl.id === `pl-${ytPlaylistId}`)) {
            existingPlaylist = { id: pl.id, title: pl.title, subjectTitle: sub.title };
          }
        });
      });

      if (existingPlaylist) {
        setPlaylistError(`Notice: This YouTube playlist already exists in our database under Subject "${existingPlaylist.subjectTitle}" (ID: ${existingPlaylist.id}) as "${existingPlaylist.title}".`);
        return;
      }

      setIsCreatingPlaylist(true);
      try {
        fetchedVideos = await fetchYoutubePlaylistVideos(ytPlaylistId);
      } catch (err) {
        console.warn("Auto-fetch error:", err);
      } finally {
        setIsCreatingPlaylist(false);
      }
    }

    const newPlId = await addSubjectPlaylist(activeSubject.id, playlistTitle.trim(), playlistDesc.trim(), playlistAuthor.trim(), ytPlaylistId, fetchedVideos);
    if (newPlId && typeof enrollInPlaylist === 'function') {
      enrollInPlaylist(newPlId);
    }
    setPlaylistTitle('');
    setPlaylistDesc('');
    setPlaylistAuthor('');
    setYoutubePlaylistUrl('');
    setShowPlaylistForm(false);
  };

  const handleOpenEditSubject = () => {
    if (!activeSubject) return;
    setEditSubjectCode(activeSubject.code || '');
    setEditSubjectCredits(activeSubject.credits || '4 Credits');
    setEditSubjectAuthor(activeSubject.author || 'designed by team OpenSeas');
    setEditSubjectDept(activeSubject.department || 'CSE/IT');
    setEditSubjectOverviewInfo(activeSubject.overviewInfo || '');
    setShowSubjectEditForm(true);
  };

  const handleSaveSubjectDetails = (e) => {
    e.preventDefault();
    if (!activeSubject) return;
    updateSubjectDetails(activeSubject.id, {
      code: editSubjectCode,
      credits: editSubjectCredits,
      author: editSubjectAuthor,
      department: editSubjectDept,
      overviewInfo: editSubjectOverviewInfo
    });
    setShowSubjectEditForm(false);
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
    if (!resourceUrl.trim() || !activeSubject || !resourceSection) return;
    addSubjectMaterial(
      activeSubject.id,
      resourceTitle.trim() || 'Reference Material',
      resourceUrl.trim(),
      resourceSection,
      resourceAuthor.trim() || getUserDesignation(currentUser)
    );
    setResourceTitle('');
    setResourceUrl('');
    setResourceAuthor('');
    setResourceSection('');
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim() || !activeSubject) return;
    addSubjectMaterialSection(activeSubject.id, newSectionName.trim());
    setNewSectionName('');
    setShowAddSectionForm(false);
  };
  const [linkResId, setLinkResId] = useState('');
  const [linkResSection, setLinkResSection] = useState('');
  const [showLinkResForm, setShowLinkResForm] = useState(false);

  const handleLinkMaterialById = (e) => {
    e.preventDefault();
    if (!linkResId.trim() || !linkResSection || !activeSubject) return;

    let foundRes = null;
    (standaloneResources || []).forEach(r => {
      if (r.id === linkResId.trim()) foundRes = r;
    });

    if (!foundRes) {
      (subjects || []).forEach(sub => {
        (sub.materials || []).forEach(mat => {
          if (mat.id === linkResId.trim() || mat.originalResourceId === linkResId.trim()) {
            foundRes = mat;
          }
        });
      });
    }

    if (foundRes) {
      addSubjectMaterial(
        activeSubject.id,
        foundRes.title,
        foundRes.url,
        linkResSection,
        foundRes.author || 'Educator',
        foundRes.id
      );
      setLinkResId(''); setLinkResSection(''); setShowLinkResForm(false);
    } else {
      alert(`Resource ID "${linkResId.trim()}" not found in database.`);
    }
  };

  const [linkPlId, setLinkPlId] = useState('');
  const [showLinkPlaylistForm, setShowLinkPlaylistForm] = useState(false);

  const handleLinkPlaylistById = async (e) => {
    e.preventDefault();
    if (!linkPlId.trim() || !activeSubject) return;

    let foundPl = null;
    (subjects || []).forEach(sub => {
      (sub.playlists || []).forEach(pl => {
        if (pl.id === linkPlId.trim()) foundPl = pl;
      });
    });

    if (foundPl) {
      await addSubjectPlaylist(
        activeSubject.id,
        foundPl.title,
        foundPl.description || '',
        foundPl.author || 'Educator',
        foundPl.youtubePlaylistId || '',
        foundPl.videos || []
      );
      setLinkPlId(''); setShowLinkPlaylistForm(false);
    } else {
      alert(`Playlist ID "${linkPlId.trim()}" not found in database.`);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="w-full max-w-lg mx-auto my-16 p-8 rounded-2xl border border-border-subtle bg-surface text-center space-y-4 shadow-modal animate-fade-in">
        <h2 className="text-xl font-bold font-editorial">Studio Sign In Required</h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Please sign in to access your Creator & Campus Marketplace Studio.
        </p>
        <button
          onClick={() => setCurrentView ? setCurrentView('auth') : null}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark cursor-pointer shadow-xs hover:opacity-95"
        >
          Sign In to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 animate-fade-in" style={styles.container}>

      {/* Banner */}
      <section style={styles.studioBanner} className="glass-panel">
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }} className="primary-gradient-text">
            Studio Workspace
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Campus Academic & Marketplace Hub. Share course playlists, upload open study resources, and list items for sale.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setShowStandalonePlaylistForm(!showStandalonePlaylistForm);
              setShowStandaloneForm(false);
              setShowSellForm(false);
              setShowCourseForm(false);
            }}
            className="btn btn-primary"
            style={{ gap: '6px' }}
          >
            <Plus size={16} /> Share Course / Playlist Link
          </button>
          <button
            onClick={() => {
              setShowStandaloneForm(!showStandaloneForm);
              setShowStandalonePlaylistForm(false);
              setShowSellForm(false);
              setShowCourseForm(false);
            }}
            className="btn btn-secondary"
            style={{ gap: '6px' }}
          >
            <Plus size={16} /> Share Open Resource
          </button>
          <button
            onClick={() => {
              setShowSellForm(!showSellForm);
              setShowStandalonePlaylistForm(false);
              setShowStandaloneForm(false);
              setShowCourseForm(false);
            }}
            className="btn btn-secondary"
            style={{ gap: '6px' }}
          >
            <Tag size={16} /> Sell on Marketplace
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setShowCourseForm(!showCourseForm);
                setShowStandalonePlaylistForm(false);
                setShowStandaloneForm(false);
                setShowSellForm(false);
                setStudioMode('curriculum');
              }}
              className="btn btn-secondary"
              style={{ gap: '6px' }}
            >
              <FolderPlus size={16} /> Degree Program Architect
            </button>
          )}
        </div>
      </section>

      {/* STANDALONE PLAYLIST FORM */}
      {showStandalonePlaylistForm && (
        <form onSubmit={handleCreateStandalonePlaylist} className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '20px', textAlign: 'left', borderRadius: '14px', border: '1px solid rgba(20, 20, 19, 0.06)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color="var(--primary)" /> Create Standalone YouTube Playlist Series
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Paste any YouTube Playlist link to create a standalone playlist. It will be indexed with a unique ID and accessible across the platform!
          </p>

          {stError && (
            <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.8rem', marginBottom: '12px' }}>
              ⚠️ {stError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Playlist Title</label>
              <input type="text" className="form-input" placeholder="e.g. Physics-I Complete Lecture Series" value={stTitle} onChange={(e) => setStTitle(e.target.value)} required />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>YouTube Playlist Link or ID</label>
              <input type="text" className="form-input" placeholder="https://www.youtube.com/playlist?list=PLr6-S4ER..." value={stYtUrl} onChange={(e) => setStYtUrl(e.target.value)} required />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Author / Credits</label>
              <input type="text" className="form-input" placeholder="e.g. TAKE IT EASY (MAKAUT)" value={stAuthor} onChange={(e) => setStAuthor(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Playlist Description (optional)</label>
            <textarea className="form-input" rows={2} placeholder="Brief details about what this playlist series covers..." value={stDesc} onChange={(e) => setStDesc(e.target.value)} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Visibility & Academic Sharing</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStIsPublic(true)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: stIsPublic ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  background: stIsPublic ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color: stIsPublic ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left'
                }}
              >
                <Globe size={15} color={stIsPublic ? '#10b981' : 'currentColor'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Public (Default)</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Campus scholars can find this in Courses & Vault</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setStIsPublic(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: !stIsPublic ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                  background: !stIsPublic ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  color: !stIsPublic ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left'
                }}
              >
                <Lock size={15} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Private</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Only in your personal workspace</div>
                </div>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowStandalonePlaylistForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Standalone Playlist</button>
          </div>
        </form>
      )}

      {/* STANDALONE RESOURCE FORM */}
      {showStandaloneForm && (
        <form onSubmit={handlePublishStandaloneResource} className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Publish Standalone Open Study Resource</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Share a public PDF, formula sheet, or reference guide directly without nesting it inside a degree course or playlist series.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Resource Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MAKAUT Engineering Mathematics Complete Formula Sheet"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Resource Type</label>
              <select
                className="form-input"
                value={resType}
                onChange={(e) => setResType(e.target.value)}
              >
                <option value="drive">Google Drive Folder / Link</option>
                <option value="pdf">PDF Document</option>
                <option value="link">External Web Link / Note</option>
                <option value="formula">Formula Sheet & Quick Reference</option>
                <option value="lab">Lab Manual & Viva Guide</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Resource URL / Link</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://drive.google.com/file/d/... or any PDF link"
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Resource Category</label>
              <select
                className="form-input"
                value={resCategory}
                onChange={(e) => setResCategory(e.target.value)}
              >
                <option value="Formula Sheet & Quick Reference">Formula Sheet & Quick Reference</option>
                <option value="Lab Manual">Lab Manual</option>
                <option value="PYQ Solutions">Past Year Paper (PYQ) Solutions</option>
                <option value="Official Syllabus Guide">Official Syllabus Guide</option>
                <option value="Handwritten Notes">Handwritten Notes</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Short Description / Overview</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Provide a quick overview of what is included in this open resource..."
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Visibility & Academic Sharing</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setResIsPublic(true)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: resIsPublic ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  background: resIsPublic ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color: resIsPublic ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left'
                }}
              >
                <Globe size={15} color={resIsPublic ? '#10b981' : 'currentColor'} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Public (Default)</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Campus scholars can find this in Academic Vault</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setResIsPublic(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: !resIsPublic ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                  background: !resIsPublic ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  color: !resIsPublic ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left'
                }}
              >
                <Lock size={15} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>Private</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Only in your personal workspace</div>
                </div>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowStandaloneForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Open Resource</button>
          </div>
        </form>
      )}

      {/* SELL ON MARKETPLACE FORM */}
      {showSellForm && (
        <form onSubmit={handlePublishMarketplaceListing} className="glass-panel animate-fade-in" style={{ padding: '22px', marginBottom: '22px', textAlign: 'left', borderRadius: '14px', border: '1px solid rgba(20, 20, 19, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color="var(--primary)" /> Sell on Campus Marketplace
            </h3>
            <button type="button" onClick={() => setShowSellForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            List your textbooks, notes, lab kits, drawing drafters, or peer mentoring gear. Your item remains active on the Marketplace for <strong>5 months (~150 days)</strong>. After 5 months, it stays in your Studio for <strong>1 month grace period</strong> where you can relist or renew it anytime.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Item Title / Heading *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Omega Mini Drafter with Board, ESP32 Dev Kit..."
                value={mktTitle}
                onChange={(e) => setMktTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Category *</label>
              <select
                className="form-input"
                value={mktCategory}
                onChange={(e) => setMktCategory(e.target.value)}
              >
                <option value="Books & Notes">Books & Notes</option>
                <option value="Hardware Kits">Hardware Kits</option>
                <option value="Tools & Gear">Tools & Gear</option>
                <option value="Services">Services</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Price (₹ or Free) *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 450 or Free"
                value={mktPrice}
                onChange={(e) => setMktPrice(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Your Display Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul (CSE, 3rd Year)"
                value={mktSellerName}
                onChange={(e) => setMktSellerName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Condition & Description *</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Describe condition, semester used, included accessories or meetup location on campus..."
              value={mktDesc}
              onChange={(e) => setMktDesc(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Contact Channel *</label>
              <select
                className="form-input"
                value={mktContactMethod}
                onChange={(e) => setMktContactMethod(e.target.value)}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="phone">Direct Phone Call</option>
                <option value="linkedin">LinkedIn Profile</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>
                {mktContactMethod === 'whatsapp' ? 'WhatsApp Number (10 digits) *' :
                 mktContactMethod === 'telegram' ? 'Telegram Handle *' :
                 mktContactMethod === 'phone' ? 'Phone Number *' : 'Profile Link *'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={mktContactMethod === 'whatsapp' ? 'e.g. 9876543210' : 'Contact detail'}
                value={mktContactDetail}
                onChange={(e) => setMktContactDetail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Keywords / Search Tags</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. drafter, mechanical, drawing (comma-separated)"
                value={mktKeywords}
                onChange={(e) => setMktKeywords(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Product Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={mktImageUrl}
                onChange={(e) => setMktImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSellForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <Tag size={15} /> Publish Listing (Active for 5 Months)
            </button>
          </div>
        </form>
      )}

      {/* CREATE PROGRAM / COURSE FORM (Inline Card) */}
      {showCourseForm && (
        <form onSubmit={handleCreateCourse} className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '20px', textAlign: 'left', borderRadius: '14px', border: '1px solid rgba(20, 20, 19, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={18} color="var(--primary)" /> {isAdmin ? 'Setup Program / Course' : 'Setup Standard Course'}
            </h3>
            <button type="button" onClick={() => setShowCourseForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Create a structured curriculum or degree program with semester modules, subjects, and study tracks.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
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
              <input type="text" value={courseDept} onChange={e => setCourseDept(e.target.value)} placeholder="e.g. Computer Science, Mechanical Engineering" className="form-input" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Author / Organization Credits</label>
              <input type="text" value={courseAuthor} onChange={e => setCourseAuthor(e.target.value)} placeholder="e.g. Training to Infinity, Prof. Sarah Miller" className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Price (INR / 0 for Free)</label>
              <input type="number" min="0" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} placeholder="0" className="form-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Course Banner Image URL (Optional)</label>
              <input type="url" value={courseBannerUrl} onChange={e => setCourseBannerUrl(e.target.value)} placeholder="https://images.unsplash.com/photo-..." className="form-input" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Search Keywords / College Tags (comma-separated)</label>
            <input type="text" value={courseKeywords} onChange={e => setCourseKeywords(e.target.value)} placeholder="e.g. MAKAUT, B.Tech, Calculus, Python, Semester 1" className="form-input" />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Description</label>
            <textarea value={courseDesc} onChange={e => setCourseDesc(e.target.value)} placeholder="Program description and objectives..." className="form-input" rows={2} style={{ resize: 'vertical' }} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setShowCourseForm(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">
              {isAdmin && courseType === 'degree' ? 'Initialize Program' : 'Create Course'}
            </button>
          </div>
        </form>
      )}

      {/* SUCCESS / NOTICE BANNERS */}
      {resSuccess && (
        <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', marginBottom: '16px', textAlign: 'left', fontSize: '0.85rem' }}>
          ✔ {resSuccess}
        </div>
      )}
      {mktNotice && (
        <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#34d399', marginBottom: '16px', textAlign: 'left', fontSize: '0.85rem' }}>
          ✔ {mktNotice}
        </div>
      )}

      {/* STUDIO MODE SWITCHER TABS */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStudioMode('creations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              studioMode === 'creations'
                ? 'bg-accent-ink text-text-on-dark shadow-sm'
                : 'bg-surface text-text-secondary border border-border-subtle hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <Sparkles size={14} />
            <span>My Studio Creations & Listings</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent-forest/20 text-accent-forest font-mono-tabular">
              {marketplaceListings.length + myPlaylists.length + myResources.length}
            </span>
          </button>

          {(isAdmin || activeCourse) && (
            <button
              onClick={() => setStudioMode('curriculum')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                studioMode === 'curriculum'
                  ? 'bg-accent-ink text-text-on-dark shadow-sm'
                  : 'bg-surface text-text-secondary border border-border-subtle hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              <Layers size={14} />
              <span>Degree Curriculum Architect</span>
            </button>
          )}
        </div>

        {studioMode === 'creations' && (
          <div className="text-[11px] font-mono-tabular text-text-muted">
            STUDIO CENTRAL DASHBOARD
          </div>
        )}
      </div>

      {/* =================================================================
          STUDIO MODE 1: MY CREATIONS & LISTINGS DASHBOARD
      ================================================================= */}
      {studioMode === 'creations' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Sub-tab Switcher Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCreationsSubTab('marketplace')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                creationsSubTab === 'marketplace'
                  ? 'bg-accent-ink text-text-on-dark shadow-xs'
                  : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Tag size={13} />
              <span>Marketplace Listings ({marketplaceListings.length})</span>
            </button>

            <button
              onClick={() => setCreationsSubTab('courses')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                creationsSubTab === 'courses'
                  ? 'bg-accent-ink text-text-on-dark shadow-xs'
                  : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Video size={13} />
              <span>Courses & Playlists ({myPlaylists.length})</span>
            </button>

            <button
              onClick={() => setCreationsSubTab('resources')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                creationsSubTab === 'resources'
                  ? 'bg-accent-ink text-text-on-dark shadow-xs'
                  : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <FileText size={13} />
              <span>Open Study Resources ({myResources.length})</span>
            </button>
          </div>

          {/* SUB-TAB 1: MARKETPLACE LISTINGS */}
          {creationsSubTab === 'marketplace' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border-subtle bg-surface-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono-tabular">
                    Marketplace Lifecycle Terms
                  </h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Items remain active on campus Marketplace for <strong>5 months (150 days)</strong>. After 5 months, items stay in your Studio for a <strong>1-month grace period</strong> where you can relist or renew anytime before permanent database deletion.
                  </p>
                </div>
                <button
                  onClick={() => setShowSellForm(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-accent-ink text-text-on-dark flex items-center gap-1.5 shrink-0 hover:opacity-95 cursor-pointer shadow-xs"
                >
                  <Plus size={13} />
                  <span>Sell Something</span>
                </button>
              </div>

              {marketplaceListings.length === 0 ? (
                <div className="text-center py-12 p-6 rounded-2xl border border-border-subtle bg-surface space-y-3">
                  <ShoppingBag size={32} className="text-text-muted mx-auto" />
                  <h4 className="text-sm font-bold text-text-primary">No Marketplace Items Listed Yet</h4>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto">
                    Sell your used semester textbooks, drawing drafters, lab aprons, or offer 1-on-1 tutoring services to peers across campus.
                  </p>
                  <button
                    onClick={() => setShowSellForm(true)}
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
                      className="rounded-2xl border border-border-subtle bg-surface hover:border-border-strong p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-xs transition-all"
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
                          <h4 className="text-sm font-bold text-text-primary line-clamp-1">
                            {item.title}
                          </h4>
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
                                Live on Marketplace
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold flex items-center gap-1.5">
                                <Clock size={12} />
                                In Studio Grace Period
                              </span>
                            )}
                            <span className="text-text-muted font-bold">
                              {item.isMarketplaceActive
                                ? `${item.daysLeftOnMarketplace} days left`
                                : `${item.daysLeftInGrace} days before purge`}
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

                      {/* Card Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-border-subtle">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRelistMarketplace(item.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-forest/10 text-accent-forest hover:bg-accent-forest/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Renew or relist for another 5 months on Marketplace"
                          >
                            <RotateCw size={12} />
                            <span>Relist 5 Mos</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMarketplace(item.id)}
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
                            <span>Marketplace</span>
                            <ExternalLink size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: COURSES & PLAYLISTS */}
          {creationsSubTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono-tabular font-bold text-text-muted uppercase">
                  My Authored & Uploaded Playlists ({myPlaylists.length})
                </span>
                <button
                  onClick={() => setShowStandalonePlaylistForm(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-ink text-text-on-dark flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={13} />
                  <span>Share New Playlist</span>
                </button>
              </div>

              {myPlaylists.length === 0 ? (
                <div className="text-center py-12 p-6 rounded-2xl border border-border-subtle bg-surface space-y-3">
                  <Video size={32} className="text-text-muted mx-auto" />
                  <h4 className="text-sm font-bold text-text-primary">No Playlists Shared Yet</h4>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto">
                    Paste any YouTube playlist link to index a high-yield lecture series with chaptered playback.
                  </p>
                  <button
                    onClick={() => setShowStandalonePlaylistForm(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    Share Playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      className="rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-subtle text-text-secondary">
                            {pl.subjectTitle || 'Course Playlist'}
                          </span>
                          <span className="text-[10px] font-mono-tabular text-accent-forest font-semibold">
                            {pl.videos?.length || 0} Lectures
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-text-primary line-clamp-1">{pl.title}</h4>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{pl.description || 'Curated academic video series.'}</p>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-border-subtle">
                        <span className="text-[10px] font-mono-tabular text-text-muted truncate max-w-[140px]">
                          By {pl.author || 'Educator'}
                        </span>
                        {setSelectedPlaylistId && setCurrentView && (
                          <button
                            onClick={() => {
                              setSelectedPlaylistId(pl.id);
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: STUDY RESOURCES */}
          {creationsSubTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-mono-tabular font-bold text-text-muted uppercase">
                  My Shared Documents & Notes ({myResources.length})
                </span>
                <button
                  onClick={() => setShowStandaloneForm(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-ink text-text-on-dark flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={13} />
                  <span>Publish New Resource</span>
                </button>
              </div>

              {myResources.length === 0 ? (
                <div className="text-center py-12 p-6 rounded-2xl border border-border-subtle bg-surface space-y-3">
                  <FileText size={32} className="text-text-muted mx-auto" />
                  <h4 className="text-sm font-bold text-text-primary">No Study Resources Shared Yet</h4>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto">
                    Upload or link semester formula sheets, handwritten notes, lab manuals, or PYQ solutions.
                  </p>
                  <button
                    onClick={() => setShowStandaloneForm(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    Publish Resource
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-surface divide-y divide-border-subtle overflow-hidden">
                  {myResources.map((res) => (
                    <div key={res.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-hover/60 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono-tabular font-bold px-1.5 py-0.2 rounded bg-subtle text-text-secondary">
                            {res.category || 'Reference'}
                          </span>
                          <span className="text-[10px] font-mono-tabular text-text-muted uppercase">
                            {res.type || 'PDF'}
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
                        {typeof deleteStandaloneResource === 'function' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete resource "${res.title}"?`)) {
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
          )}
        </div>
      )}

      {/* =================================================================
          STUDIO MODE 2: DEGREE CURRICULUM ARCHITECT (Existing Engine)
      ================================================================= */}
      {studioMode === 'curriculum' && (
        <div className="studio-main-grid animate-fade-in">

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
                style={{ ...styles.playlistItem, background: activeCourseId === c.id ? 'rgba(20, 20, 19, 0.06)' : 'transparent', borderColor: activeCourseId === c.id ? 'var(--primary)' : 'transparent' }}
              >
                <div style={styles.playlistItemMain}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-creator" style={{ fontSize: '0.55rem' }}>{c.department}</span>
                    <span className={c.isDegree ? 'badge badge-learner' : 'badge badge-admin'} style={{ fontSize: '0.55rem' }}>
                      {c.isDegree ? 'Degree' : 'Course'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '6px' }}>{c.title}</div>
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
                      <InlineEdit value={activeCourse.title} onSave={v => editCourse(activeCourse.id, { title: v })} inputStyle={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ marginBottom: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Credits: </span>
                      <InlineEdit value={activeCourse.author || activeCourse.creatorName || ''} onSave={v => editCourse(activeCourse.id, { author: v })} inputStyle={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }} />
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <InlineEdit value={activeCourse.description} onSave={v => editCourse(activeCourse.id, { description: v })} multiline inputStyle={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price (₹):</span>
                      <InlineEdit value={String(activeCourse.price)} onSave={v => editCourse(activeCourse.id, { price: parseFloat(v) || 0 })} inputStyle={{ fontSize: '0.85rem', color: 'var(--success)', width: '90px' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '12px' }}>Banner Image URL:</span>
                      <InlineEdit value={activeCourse.bannerUrl || ''} onSave={v => editCourse(activeCourse.id, { bannerUrl: v })} placeholder="Paste Banner Image URL..." inputStyle={{ fontSize: '0.78rem', color: '#a78bfa', maxWidth: '280px' }} />
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
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#DFDBD2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge badge-${u.role}`} style={{ fontSize: '0.6rem' }}>{u.role}</span>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && (
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
                            className={`yt-chip ${selectedSemester === sem ? 'active' : ''}`}>
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
                    <form onSubmit={handleCreateSubject} className="glass-panel animate-fade-in" style={{ padding: '18px', borderRadius: '16px', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', marginBottom: '18px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Plus size={16} color="var(--primary)" /> Add Subject to Semester {selectedSemester}
                        </h3>
                        <button type="button" onClick={() => setShowSubjectForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <X size={18} />
                        </button>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Subject Name</label>
                        <input
                          type="text"
                          value={subjectTitle}
                          onChange={e => setSubjectTitle(e.target.value)}
                          placeholder="e.g. Discrete Mathematics"
                          className="form-input"
                          required
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setShowSubjectForm(false)} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Subject</button>
                      </div>
                    </form>
                  )}

                  {/* Subjects split */}
                  <div className="subjects-workspace-grid">

                    {/* Subject sidebar */}
                    <div className="glass-panel" style={styles.subjectBox}>
                      <h4 style={styles.boxTitle}>Subjects ({activeSubjectsList.length})</h4>
                      <div style={styles.boxList}>
                        {activeSubjectsList.length === 0 ? (
                          <p style={styles.emptyText}>No subjects yet.</p>
                        ) : activeSubjectsList.map((sub, index) => (
                          <div key={sub.id} onClick={() => { setActiveSubjectId(sub.id); setActivePlaylistId(null); }}
                            style={{ ...styles.subjectListItem, background: activeSubjectId === sub.id ? 'rgba(20, 20, 19, 0.06)' : 'transparent', borderLeftColor: activeSubjectId === sub.id ? 'var(--primary)' : 'transparent' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sub.title}</span>
                            
                            <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', marginRight: '6px' }}>
                              <button 
                                disabled={index === 0} 
                                onClick={e => { e.stopPropagation(); reorderSubject(sub.id, 'up'); }}
                                style={{ background: 'transparent', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? 'var(--text-muted)' : 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Move Up"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button 
                                disabled={index === activeSubjectsList.length - 1} 
                                onClick={e => { e.stopPropagation(); reorderSubject(sub.id, 'down'); }}
                                style={{ background: 'transparent', border: 'none', cursor: index === activeSubjectsList.length - 1 ? 'not-allowed' : 'pointer', color: index === activeSubjectsList.length - 1 ? 'var(--text-muted)' : 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                title="Move Down"
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>

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
                          <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Subject:</span>
                              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '2px' }}>{activeSubject.title}</h4>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button onClick={handleOpenEditSubject} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                <Pencil size={12} /> Edit Overview & Metadata
                              </button>
                              <button onClick={() => setShowLinkPlaylistForm(!showLinkPlaylistForm)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}>
                                <Link size={12} /> Link Existing Playlist by ID
                              </button>
                              <button onClick={() => setShowPlaylistForm(!showPlaylistForm)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}>
                                <Plus size={12} /> Create Playlist
                              </button>
                            </div>
                          </div>

                          {showLinkPlaylistForm && (
                            <form onSubmit={handleLinkPlaylistById} className="glass-panel animate-fade-in" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', border: '1px solid rgba(20, 20, 19, 0.06)' }}>
                              <h4 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Link size={15} color="var(--primary)" /> Link Existing Playlist by ID
                              </h4>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Paste the Playlist ID from the database (e.g. <code>pl-101</code>) to instantly link it to <strong>{activeSubject.title}</strong>:
                              </p>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="e.g. pl-101 or pl-f2941b02-..."
                                  value={linkPlId}
                                  onChange={(e) => setLinkPlId(e.target.value)}
                                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                                  required
                                />
                                <button type="submit" className="btn btn-primary btn-sm">
                                  Connect Playlist
                                </button>
                                <button type="button" onClick={() => setShowLinkPlaylistForm(false)} className="btn btn-secondary btn-sm">
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          {showSubjectEditForm && (
                            <form onSubmit={handleSaveSubjectDetails} className="glass-panel animate-fade-in" style={{ ...styles.formWorkspace, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>Edit Subject Overview & Metadata</h4>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject Code</label>
                                  <input type="text" value={editSubjectCode} onChange={e => setEditSubjectCode(e.target.value)} placeholder="e.g. BS-PH101" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Academic Credits</label>
                                  <input type="text" value={editSubjectCredits} onChange={e => setEditSubjectCredits(e.target.value)} placeholder="e.g. 4 Credits" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Playlist Owner / Educator</label>
                                  <input type="text" value={editSubjectAuthor} onChange={e => setEditSubjectAuthor(e.target.value)} placeholder="e.g. designed by team OpenSeas" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Department</label>
                                  <input type="text" value={editSubjectDept} onChange={e => setEditSubjectDept(e.target.value)} placeholder="e.g. CSE/IT" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                                </div>
                              </div>

                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Custom Overview Notes & Details (Displays in Overview Section)</label>
                                <textarea value={editSubjectOverviewInfo} onChange={e => setEditSubjectOverviewInfo(e.target.value)} rows={3} placeholder="Add custom notes, prerequisites, course outcomes, or formatting details..." className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                              </div>

                              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                  Save Overview Details
                                </button>
                                <button type="button" onClick={() => setShowSubjectEditForm(false)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          {showPlaylistForm && (
                            <form onSubmit={handleCreatePlaylist} className="glass-panel animate-fade-in" style={{ ...styles.formWorkspace, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>New Playlist</h4>
                              
                              {playlistError && (
                                <div style={styles.formError}>
                                  <AlertCircle size={14} />
                                  <span>{playlistError}</span>
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setPlaylistType('embed')}
                                  className={`btn ${playlistType === 'embed' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.78rem' }}
                                >
                                  Embed YouTube Playlist
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPlaylistType('custom')}
                                  className={`btn ${playlistType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.78rem' }}
                                >
                                  Custom Playlist
                                </button>
                              </div>

                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Playlist Title</label>
                                <input type="text" value={playlistTitle} onChange={e => setPlaylistTitle(e.target.value)} placeholder="e.g. Full Lecture Series" className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} required />
                              </div>

                              {playlistType === 'embed' && (
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>YouTube Playlist Link or ID</label>
                                  <input 
                                    type="text" 
                                    value={youtubePlaylistUrl} 
                                    onChange={e => setYoutubePlaylistUrl(e.target.value)} 
                                    placeholder="https://www.youtube.com/playlist?list=PLr6-S4ER..." 
                                    className="form-input" 
                                    style={{ padding: '8px 12px', fontSize: '0.85rem' }} 
                                    required 
                                  />
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                                    Embeds the full YouTube playlist directly via YouTube player.
                                  </span>
                                </div>
                              )}

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Playlist Banner Image URL (optional)</label>
                                  <input type="url" value={playlistBannerUrl} onChange={e => setPlaylistBannerUrl(e.target.value)} placeholder="https://images.unsplash.com/photo-..." className="form-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
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
                                <button 
                                   type="submit" 
                                   disabled={isCreatingPlaylist}
                                   className="btn btn-primary" 
                                   style={{ padding: '9px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: isCreatingPlaylist ? 0.7 : 1 }}
                                 >
                                   {isCreatingPlaylist ? (
                                     <>
                                       <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                                       Saving Playlist & Videos...
                                     </>
                                   ) : (
                                     'Create Playlist'
                                   )}
                                 </button>
                                <button type="button" onClick={() => { setShowPlaylistForm(false); setPlaylistError(''); }} className="btn btn-secondary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>Cancel</button>
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
                              <h4 style={styles.formCardTitle}><Plus size={14} color="var(--secondary)" /> Attach Reference Link or Existing Resource ID</h4>
                              <form onSubmit={handleAddMaterial} style={styles.formBoxContent}>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Resource Title (Optional if linking by ID)</label>
                                  <input type="text" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="Chapter Notes / Formula Sheet" className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '8px' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Resource URL or Existing Resource ID / UUID</label>
                                  <input type="text" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="URL or paste Resource ID (e.g. res-1724...)" className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} required />
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
                          <div className="enrolled-lists-grid">
                            {/* Playlists */}
                            <div className="glass-panel" style={{ ...styles.enrolledCard, gridColumn: 'span 2' }}>
                              <h4 style={styles.enrolledHeading}>Playlists & Videos ({activeSubject.playlists?.length || 0})</h4>
                              <div style={styles.enrolledListBody}>
                                {(!activeSubject.playlists || activeSubject.playlists.length === 0) ? (
                                  <p style={styles.emptyEnrolledText}>No playlists created yet.</p>
                                ) : activeSubject.playlists.map((pl, plIdx) => (
                                  <div key={pl.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '4px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                          📁 {pl.title} {pl.youtubePlaylistId ? '(YouTube Embed Playlist)' : `(${pl.videos?.length || 0} videos)`}
                                        </span>
                                        {pl.description && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{pl.description}</span>}
                                      </div>
                                      
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginRight: '8px', marginLeft: 'auto' }}>
                                        <button 
                                          type="button"
                                          onClick={() => { setImportingPlId(importingPlId === pl.id ? null : pl.id); setImportUrl(''); setImportStatus(''); }}
                                          className="btn btn-secondary"
                                          style={{ padding: '3px 8px', fontSize: '0.68rem', borderColor: 'rgba(20, 20, 19, 0.06)', color: 'var(--primary)' }}
                                          title="Import all videos from a YouTube Playlist link directly into database once"
                                        >
                                          + Import YT Playlist
                                        </button>

                                        <button 
                                          disabled={plIdx === 0}
                                          onClick={() => reorderPlaylist(activeSubject.id, pl.id, 'up')}
                                          style={{ background: 'transparent', border: 'none', cursor: plIdx === 0 ? 'not-allowed' : 'pointer', color: plIdx === 0 ? 'var(--text-muted)' : 'var(--primary)', padding: '2px' }}
                                          title="Move Playlist Up"
                                        >
                                          <ArrowUp size={12} />
                                        </button>
                                        <button 
                                          disabled={plIdx === activeSubject.playlists.length - 1}
                                          onClick={() => reorderPlaylist(activeSubject.id, pl.id, 'down')}
                                          style={{ background: 'transparent', border: 'none', cursor: plIdx === activeSubject.playlists.length - 1 ? 'not-allowed' : 'pointer', color: plIdx === activeSubject.playlists.length - 1 ? 'var(--text-muted)' : 'var(--primary)', padding: '2px' }}
                                          title="Move Playlist Down"
                                        >
                                          <ArrowDown size={12} />
                                        </button>
                                      </div>

                                      <button onClick={() => deleteSubjectPlaylist(activeSubject.id, pl.id)} style={styles.deleteIconBtn}><Trash2 size={12} /></button>
                                    </div>

                                    {/* Inline YouTube Playlist Bulk Importer */}
                                    {importingPlId === pl.id && (
                                      <div style={{ margin: '8px 0 8px 12px', padding: '10px 14px', background: 'rgba(20, 20, 19, 0.06)', border: '1px solid rgba(20, 20, 19, 0.06)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                                          Import & Save All Videos from YouTube Playlist into Database (Once in a Lifetime)
                                        </span>
                                        {importStatus && <span style={{ fontSize: '0.72rem', color: '#10b981' }}>{importStatus}</span>}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <input 
                                            type="text" 
                                            placeholder="https://www.youtube.com/playlist?list=PLr6-S4ER..." 
                                            value={importUrl} 
                                            onChange={e => setImportUrl(e.target.value)} 
                                            className="form-input" 
                                            style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem' }} 
                                          />
                                          <button 
                                            type="button"
                                            disabled={isImporting}
                                            onClick={async () => {
                                              if (!importUrl.trim()) return;
                                              setIsImporting(true);
                                              setImportStatus('Fetching videos from YouTube & saving to database...');
                                              try {
                                                const count = await importVideosToExistingPlaylist(activeSubject.id, pl.id, importUrl.trim());
                                                alert(`Success! Saved ${count} videos into "${pl.title}" in database.`);
                                                setImportingPlId(null);
                                                setImportUrl('');
                                                setImportStatus('');
                                              } catch (err) {
                                                alert(err.message);
                                                setImportStatus('');
                                              } finally {
                                                setIsImporting(false);
                                              }
                                            }}
                                            className="btn btn-primary"
                                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                          >
                                            {isImporting ? 'Saving...' : 'Save Videos to DB'}
                                          </button>
                                          <button type="button" onClick={() => { setImportingPlId(null); setImportUrl(''); setImportStatus(''); }} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    <div style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {pl.videos.map((vid, vidIdx) => (
                                        <div key={vid.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '2px 0' }}>
                                          <span style={{ textAlign: 'left' }}>📺 {vidIdx + 1}. {vid.title}</span>
                                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto', marginRight: '6px' }}>
                                            <button 
                                              disabled={vidIdx === 0}
                                              onClick={() => reorderVideo(activeSubject.id, pl.id, vid.id, 'up')}
                                              style={{ background: 'transparent', border: 'none', cursor: vidIdx === 0 ? 'not-allowed' : 'pointer', color: vidIdx === 0 ? 'var(--text-muted)' : 'var(--primary)', padding: '1px' }}
                                              title="Move Video Up"
                                            >
                                              <ArrowUp size={10} />
                                            </button>
                                            <button 
                                              disabled={vidIdx === pl.videos.length - 1}
                                              onClick={() => reorderVideo(activeSubject.id, pl.id, vid.id, 'down')}
                                              style={{ background: 'transparent', border: 'none', cursor: vidIdx === pl.videos.length - 1 ? 'not-allowed' : 'pointer', color: vidIdx === pl.videos.length - 1 ? 'var(--text-muted)' : 'var(--primary)', padding: '1px' }}
                                              title="Move Video Down"
                                            >
                                              <ArrowDown size={10} />
                                            </button>
                                          </div>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                                <h4 style={{ ...styles.enrolledHeading, marginBottom: 0 }}>Material Sections & Files</h4>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => setShowLinkResForm(!showLinkResForm)} className={`btn ${showLinkResForm ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 12px', fontSize: '0.75rem', gap: '5px', color: showLinkResForm ? 'var(--text-on-dark)' : 'var(--text-primary)' }}>
                                    <Link size={11} /> Link Resource by ID
                                  </button>
                                  <button onClick={() => setShowAddSectionForm(!showAddSectionForm)} className={`btn ${showAddSectionForm ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 12px', fontSize: '0.75rem', gap: '5px', color: showAddSectionForm ? 'var(--text-on-dark)' : 'var(--text-primary)' }}>
                                    <Plus size={11} /> Add Section
                                  </button>
                                </div>
                              </div>

                              {showLinkResForm && (
                                <form onSubmit={handleLinkMaterialById} style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'flex-end', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(20, 20, 19, 0.06)' }}>
                                  <div style={{ flex: 1, minWidth: '160px' }}>
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Resource ID</label>
                                    <input type="text" value={linkResId} onChange={e => setLinkResId(e.target.value)} placeholder="e.g. res-1 or mat-101" className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} required />
                                  </div>

                                  <div style={{ flex: 1, minWidth: '160px' }}>
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Target Section</label>
                                    <select value={linkResSection} onChange={e => setLinkResSection(e.target.value)} className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }} required>
                                      <option value="">Select Section...</option>
                                      {(activeSubject.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers']).map(sec => (
                                        <option key={sec} value={sec}>{sec}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <button type="submit" className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Attach Resource</button>
                                  <button type="button" onClick={() => setShowLinkResForm(false)} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Cancel</button>
                                </form>
                              )}

                              {showAddSectionForm && (
                                <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'flex-end' }}>
                                  <input type="text" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="e.g. Lab Manuals, PYQs, Assignments..." className="form-input" style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }} required />
                                  <button type="submit" className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Add</button>
                                  <button type="button" onClick={() => setShowAddSectionForm(false)} className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>Cancel</button>
                                </form>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '320px', overflowY: 'auto' }}>
                                {(activeSubject.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers']).map((section, secIdx, secArr) => {
                                  const sectionDocs = (activeSubject.materials || []).filter(m => m.sectionName === section);
                                  return (
                                    <div key={section}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                          📂 {section} ({sectionDocs.length})
                                        </span>
                                        
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto', marginRight: '8px' }}>
                                          <button 
                                            disabled={secIdx === 0}
                                            onClick={() => reorderMaterialSection(activeSubject.id, section, 'up')}
                                            style={{ background: 'transparent', border: 'none', cursor: secIdx === 0 ? 'not-allowed' : 'pointer', color: secIdx === 0 ? 'var(--text-muted)' : 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                            title="Move Section Up"
                                          >
                                            <ArrowUp size={11} />
                                          </button>
                                          <button 
                                            disabled={secIdx === secArr.length - 1}
                                            onClick={() => reorderMaterialSection(activeSubject.id, section, 'down')}
                                            style={{ background: 'transparent', border: 'none', cursor: secIdx === secArr.length - 1 ? 'not-allowed' : 'pointer', color: secIdx === secArr.length - 1 ? 'var(--text-muted)' : 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                            title="Move Section Down"
                                          >
                                            <ArrowDown size={11} />
                                          </button>
                                        </div>

                                        <button onClick={() => deleteSubjectMaterialSection(activeSubject.id, section)} style={{ ...styles.deleteIconBtn, color: 'rgba(255,100,100,0.6)' }} title={`Delete "${section}"`}>
                                          <Trash2 size={10} />
                                        </button>
                                      </div>
                                      {sectionDocs.length === 0 ? (
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '8px' }}>No files uploaded.</p>
                                      ) : sectionDocs.map(doc => (
                                        <div key={doc.id} style={styles.enrolledItem}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, textAlign: 'left' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>📄 {doc.title}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                              ID: <code style={{ color: '#a78bfa' }}>{doc.id}</code>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (doc.id) {
                                                    navigator.clipboard.writeText(doc.id);
                                                    setCopiedDocId(doc.id);
                                                    setTimeout(() => setCopiedDocId(null), 2000);
                                                  }
                                                }}
                                                style={{ background: 'none', border: 'none', color: copiedDocId === doc.id ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2, padding: 0 }}
                                                title="Copy Resource ID to paste into other subjects"
                                              >
                                                {copiedDocId === doc.id ? <Check size={10} /> : <Copy size={10} />}
                                                {copiedDocId === doc.id && <span style={{ fontSize: '0.6rem', color: '#10b981' }}>Copied</span>}
                                              </button>
                                            </span>
                                          </div>
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
      )}
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
  playlistItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--border-subtle)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', gap: '10px' },
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
  subjectListItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border-subtle)', borderLeftWidth: '3px', borderLeftStyle: 'solid', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s', gap: '10px', textAlign: 'left' },
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
  enrolledItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', marginTop: '4px' },
  emptyText: { fontSize: '0.75rem', color: 'var(--text-muted)', padding: '12px 0' },
  iconBtnGreen: { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '5px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconBtnRed: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', padding: '5px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
};
