/**
 * MyLearningView.jsx
 * Unified student command center dashboard displaying:
 * - Resume study card (last played video/playlist)
 * - 4 Fixed root folders file manager (Academic, Document, Important Links, Personal)
 * - Attendance quick buffer & status
 * - Timetable routine schedule
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Play,
  ArrowRight,
  ArrowLeft,
  Calendar,
  FileText,
  Clock,
  CalendarDays,
  ChevronRight,
  Folder,
  FolderPlus,
  FolderOpen,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Link2,
  Code2,
  GraduationCap,
  Lock,
  Globe,
  Copy,
  Pin,
  Star
} from 'lucide-react';
import { calculateAttendanceMetrics, getLiveAttendanceSummary } from '../../utils/attendanceMath';
import {
  getWorkspaceFolders,
  saveWorkspaceFolders,
  getPinnedSemester,
  setPinnedSemester,
  setAcademicSemestersCount
} from '../../utils/workspaceFolders';

export default function MyLearningView({
  setCurrentView,
  setSelectedPlaylistId,
  setSelectedVideoIndex
}) {
  const {
    currentUser,
    courses,
    subjects,
    lastPlayed,
    routine,
    addStandaloneResource,
    saveUserFoldersToDb
  } = useDatabase();

  const userId = currentUser?.id || 'guest';

  // Enrolled subjects & courses from DB
  const enrolledSubjectCourses = useMemo(() => {
    const list = [];
    const seen = new Set();
    const enrolledPlIds = currentUser?.enrolledPlaylists || [];
    const enrolledCourseIds = currentUser?.enrolledCourses || [];

    // Subjects with playlists
    (subjects || []).forEach((sub) => {
      (sub.playlists || []).forEach((pl) => {
        if (!pl.id || seen.has(pl.id)) return;
        const isEnrolled = enrolledPlIds.includes(pl.id) || enrolledCourseIds.includes(sub.courseId);
        if (isEnrolled) {
          seen.add(pl.id);
          const firstVid = pl.videos && pl.videos[0];
          const yId =
            (firstVid?.youtubeId && !firstVid.youtubeId.startsWith('PL'))
              ? firstVid.youtubeId
              : (firstVid?.url ? (firstVid.url.match(/[?&]v=([^#&]+)/) || [])[1] : null);
          const thumb = pl.bannerUrl || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : null);

          list.push({
            id: pl.id,
            playlistId: pl.id,
            title: pl.title,
            subjectTitle: sub.title,
            author: pl.author || 'Faculty',
            videoCount: pl.videos?.length || 0,
            thumbnailUrl: thumb,
            progress: 35
          });
        }
      });
    });

    // Standalone courses
    (courses || []).forEach((c) => {
      if (!c.isDegree && enrolledCourseIds.includes(c.id) && !seen.has(c.id)) {
        list.push({
          id: c.id,
          playlistId: c.id,
          title: c.title,
          subjectTitle: c.department || 'Computer Science',
          author: c.creatorName || 'Instructor',
          videoCount: 24,
          thumbnailUrl: c.bannerUrl,
          progress: 40
        });
      }
    });

    return list;
  }, [subjects, courses, currentUser]);

  const [lastPlayedState, setLastPlayedState] = useState(lastPlayed);

  useEffect(() => {
    setLastPlayedState(lastPlayed);
  }, [lastPlayed]);

  useEffect(() => {
    const handleLastPlayed = (e) => {
      if (e && e.detail) {
        setLastPlayedState(e.detail);
      }
    };
    window.addEventListener('learnopia_last_played_updated', handleLastPlayed);
    return () => window.removeEventListener('learnopia_last_played_updated', handleLastPlayed);
  }, []);

  // Continue Learning Hero Item
  const activeHero = useMemo(() => {
    if (lastPlayedState && (lastPlayedState.playlistId || lastPlayedState.courseId)) {
      return {
        id: lastPlayedState.playlistId || lastPlayedState.courseId,
        title: lastPlayedState.playlistTitle || lastPlayedState.courseTitle || 'University Study Track',
        moduleTitle: lastPlayedState.videoTitle || 'Lecture 1: Core Fundamentals',
        videoIndex: lastPlayedState.videoIndex || 0,
        thumbnail:
          lastPlayedState.thumbnail ||
          lastPlayedState.videoThumbnail ||
          'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
        progress: lastPlayedState.progress || 35,
        duration: lastPlayedState.duration || '42m'
      };
    }

    if (enrolledSubjectCourses.length > 0) {
      const first = enrolledSubjectCourses[0];
      return {
        id: first.id,
        title: first.title,
        moduleTitle: `${first.subjectTitle} • Lecture Series`,
        videoIndex: 0,
        thumbnail:
          first.thumbnailUrl ||
          'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
        progress: 25,
        duration: `${first.videoCount} lectures`
      };
    }

    return {
      id: 'pl-1',
      title: 'Engineering Mathematics I: Calculus & Linear Systems',
      moduleTitle: 'Lecture 1: Limits, Continuity & Series Expansions',
      videoIndex: 0,
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
      progress: 60,
      duration: '14h 20m'
    };
  }, [lastPlayed, enrolledSubjectCourses]);

  const handleResumeHero = () => {
    if (setSelectedPlaylistId) setSelectedPlaylistId(activeHero.id);
    if (setSelectedVideoIndex) setSelectedVideoIndex(activeHero.videoIndex || 0);
    setCurrentView('learning-player');
  };

  const [attendanceSyncVersion, setAttendanceSyncVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setAttendanceSyncVersion(v => v + 1);
    window.addEventListener('learnopia_attendance_updated', handleUpdate);
    return () => window.removeEventListener('learnopia_attendance_updated', handleUpdate);
  }, []);

  // User Attendance Metrics (100% synchronized with AttendanceTracker analytics)
  const attendanceMetrics = useMemo(() => {
    // 1. First, check if AttendanceTracker has broadcasted its official analytics
    const liveSummary = getLiveAttendanceSummary(userId);
    if (liveSummary) {
      return liveSummary;
    }

    // 2. If not yet broadcasted, compute from local logs
    let attended = 0;
    let total = 0;

    try {
      const logsRaw = localStorage.getItem(`learnopia_attendance_logs_${userId}`);
      if (logsRaw) {
        const parsed = JSON.parse(logsRaw);
        let calcAttended = 0;
        let calcTotal = 0;
        Object.values(parsed).forEach((day) => {
          if (!day || day.isHoliday) return;
          if (day.classes) {
            Object.values(day.classes).forEach((st) => {
              if (st === 'attended') {
                calcAttended++;
                calcTotal++;
              } else if (st === 'absent' || st === 'bunked') {
                calcTotal++;
              }
            });
          }
        });
        if (calcTotal > 0) {
          attended = calcAttended;
          total = calcTotal;
        }
      }
    } catch {}

    const math = calculateAttendanceMetrics(attended, total, 0.75);
    return {
      ...math,
      attended,
      total
    };
  }, [userId, attendanceSyncVersion]);

  // Today's Routine Schedule
  const todayClasses = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const dayClasses = routine ? routine[currentDay] || [] : [];
    return { currentDay, dayClasses };
  }, [routine]);

  // =================================================================
  // 4 FIXED ROOT FOLDERS SYSTEM: Academic, Docs, Links, Personal
  // =================================================================
  const [folders, setFolders] = useState(() => getWorkspaceFolders(userId));
  const [pinnedSemesterState, setPinnedSemesterState] = useState(() => getPinnedSemester(userId));

  useEffect(() => {
    setFolders(getWorkspaceFolders(userId));
    setPinnedSemesterState(getPinnedSemester(userId));
  }, [userId]);

  useEffect(() => {
    const handlePinned = (e) => {
      if (e?.detail?.pinnedSemester) {
        setPinnedSemesterState(e.detail.pinnedSemester);
      }
    };
    window.addEventListener('learnopia_pinned_semester_updated', handlePinned);
    return () => window.removeEventListener('learnopia_pinned_semester_updated', handlePinned);
  }, []);

  // Explorer Navigation State
  const [activeRootFolderId, setActiveRootFolderId] = useState(null); // 'academic' | 'document' | 'links' | 'personal' | null
  const [subfolderPath, setSubfolderPath] = useState([]); // Array of subfolder IDs
  // Inline Add Form State ('subfolder' | 'item' | null)
  const [inlineAddType, setInlineAddType] = useState(null);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [subfolderIsPublic, setSubfolderIsPublic] = useState(true); // Default Public
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemType, setItemType] = useState('playlist');
  const [itemAuthor, setItemAuthor] = useState('');
  const [publishPublicly, setPublishPublicly] = useState(true); // Default Public
  const [folderNotice, setFolderNotice] = useState('');

  const saveFolders = (newFolders) => {
    setFolders(newFolders);
    saveWorkspaceFolders(userId, newFolders);
    if (saveUserFoldersToDb && userId && userId !== 'guest') {
      saveUserFoldersToDb(userId, newFolders);
    }
  };

  // Helper: recursively update a node at given subfolderPath
  const updateFolderNode = (folderList, rootId, path, updateFn) => {
    return folderList.map(root => {
      if (root.id !== rootId) return root;

      const recurse = (node, depth) => {
        if (depth === path.length) {
          return updateFn(node);
        }
        const targetSeg = path[depth];
        return {
          ...node,
          subfolders: (node.subfolders || []).map(sf =>
            sf.id === targetSeg ? recurse(sf, depth + 1) : sf
          )
        };
      };

      return recurse(root, 0);
    });
  };

  // Active root folder object
  const activeRootFolder = useMemo(() => {
    return folders.find(f => f.id === activeRootFolderId) || null;
  }, [folders, activeRootFolderId]);

  // Current active node (subfolder or root)
  const activeNode = useMemo(() => {
    if (!activeRootFolder) return null;
    let curr = activeRootFolder;
    for (const segId of subfolderPath) {
      const next = (curr.subfolders || []).find(sf => sf.id === segId);
      if (next) {
        curr = next;
      } else {
        break;
      }
    }
    return curr;
  }, [activeRootFolder, subfolderPath]);

  // Breadcrumb path title segments
  const currentPathDetails = useMemo(() => {
    if (!activeRootFolder) return [];
    const crumbs = [];
    let curr = activeRootFolder;
    for (const segId of subfolderPath) {
      const next = (curr.subfolders || []).find(sf => sf.id === segId);
      if (next) {
        crumbs.push({ id: next.id, title: next.title });
        curr = next;
      }
    }
    return crumbs;
  }, [activeRootFolder, subfolderPath]);

  // Subfolders & items inside current active node
  const filteredSubfolders = useMemo(() => {
    return activeNode?.subfolders || [];
  }, [activeNode]);

  const filteredItems = useMemo(() => {
    return activeNode?.items || [];
  }, [activeNode]);

  // Explorer Handlers
  const handleSemesterCountChange = (e) => {
    const newCount = parseInt(e.target.value, 10);
    const updated = setAcademicSemestersCount(userId, newCount);
    setFolders(updated);
    if (saveUserFoldersToDb && userId && userId !== 'guest') {
      saveUserFoldersToDb(userId, updated);
    }
    setFolderNotice(`Academic program set to ${newCount} Semesters.`);
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handlePinSemester = (semId, semTitle) => {
    setPinnedSemester(userId, semId);
    setPinnedSemesterState(semId);
    setFolderNotice(`Pinned ${semTitle} as your Current Semester!`);
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleCreateSubfolder = (e) => {
    e.preventDefault();
    if (!newSubfolderName.trim() || !activeRootFolderId) return;
    // Subfolders are ONLY allowed at root level of Docs and Personal (max 1 level depth)
    // Academic uses fixed semesters; Links is strictly flat.
    if (activeRootFolderId === 'academic' || activeRootFolderId === 'links') return;
    if (subfolderPath.length >= 1) return;

    const newSub = {
      id: `sub-${Date.now()}`,
      title: newSubfolderName.trim(),
      isPublic: subfolderIsPublic,
      subfolders: [],
      items: []
    };

    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      subfolders: [...(node.subfolders || []), newSub]
    }));

    saveFolders(updated);
    setNewSubfolderName('');
    setSubfolderIsPublic(true);
    setInlineAddType(null);
    setFolderNotice(`Subfolder "${newSub.title}" created (${subfolderIsPublic ? 'Public' : 'Private'})!`);
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleDeleteSubfolder = (subfolderId) => {
    // Semesters in Academic cannot be deleted manually
    if (activeRootFolderId === 'academic') return;

    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      subfolders: (node.subfolders || []).filter(sf => sf.id !== subfolderId)
    }));
    saveFolders(updated);
    setFolderNotice('Subfolder removed.');
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleAddItemToFolder = (e) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemUrl.trim() || !activeRootFolderId) return;
    // Direct root items not allowed in Academic — must be inside a semester
    if (activeRootFolderId === 'academic' && subfolderPath.length === 0) {
      setFolderNotice('Please open a Semester folder first to add academic materials.');
      setTimeout(() => setFolderNotice(''), 3500);
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      title: itemTitle.trim(),
      url: itemUrl.trim(),
      type: itemType,
      isPublic: publishPublicly,
      author: itemAuthor.trim() || currentUser?.name || 'Scholar',
      count:
        itemType === 'playlist'
          ? 'Video Series'
          : itemType === 'source'
          ? 'Code Repository'
          : itemType === 'document'
          ? 'Document'
          : 'Web Resource',
      date: 'Added recently'
    };

    // If YouTube playlist URL, extract playlistId
    const listMatch = itemUrl.match(/[?&]list=([^#&]+)/);
    if (listMatch && listMatch[1]) {
      newItem.playlistId = listMatch[1];
    }

    if (publishPublicly && typeof addStandaloneResource === 'function') {
      addStandaloneResource({
        title: itemTitle.trim(),
        url: itemUrl.trim(),
        type: itemType === 'document' ? 'pdf' : 'link',
        category: activeRootFolderId === 'academic' ? 'Academic Vault Course Resource' : 'Community Shared Resource',
        description: `Shared by ${currentUser?.name || 'Scholar'} from ${activeNode?.title || 'Academics'}`,
        author: itemAuthor.trim() || currentUser?.name || 'Scholar',
        keywords: ['campus', 'academic', itemTitle.toLowerCase()]
      });
    }

    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      items: [newItem, ...(node.items || [])]
    }));

    saveFolders(updated);
    setItemTitle('');
    setItemUrl('');
    setItemAuthor('');
    setItemType('playlist');
    setPublishPublicly(true);
    setInlineAddType(null);
    setFolderNotice(`Added "${newItem.title}" (${publishPublicly ? 'Public' : 'Private'})!`);
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleDeleteItem = (itemId) => {
    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      items: (node.items || []).filter(item => item.id !== itemId)
    }));
    saveFolders(updated);
    setFolderNotice('Resource removed.');
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handlePlayItem = (item) => {
    if (item.playlistId) {
      if (setSelectedPlaylistId) setSelectedPlaylistId(item.playlistId);
      if (setSelectedVideoIndex) setSelectedVideoIndex(0);
      setCurrentView('learning-player');
      return;
    }

    if (item.url) {
      const listMatch = item.url.match(/[?&]list=([^#&]+)/);
      if (listMatch && listMatch[1]) {
        if (setSelectedPlaylistId) setSelectedPlaylistId(listMatch[1]);
        if (setSelectedVideoIndex) setSelectedVideoIndex(0);
        setCurrentView('learning-player');
        return;
      }
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setFolderNotice('Link copied to clipboard!');
    setTimeout(() => setFolderNotice(''), 3000);
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 space-y-5 animate-fade-in">
      {/* Toast Notice */}
      {folderNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shadow-modal animate-bounce-short">
          {folderNotice}
        </div>
      )}

      {/* =================================================================
          VIEW CONDITION 1: FULL-SCREEN FILE EXPLORER VIEW
      ================================================================= */}
      {activeRootFolderId && activeRootFolder ? (
        <div className="w-full space-y-6">
          {/* Top Header & Breadcrumb Toolbar */}
          <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Breadcrumb Navigation Trail */}
                <nav className="flex items-center gap-1.5 text-xs font-mono-tabular overflow-x-auto py-1">
                  <button
                    onClick={() => {
                      setActiveRootFolderId(null);
                      setSubfolderPath([]);
                    }}
                    className="text-text-muted hover:text-text-primary transition-colors cursor-pointer font-medium"
                  >
                    Workspace
                  </button>

                  <ChevronRight size={12} className="text-text-muted shrink-0" />

                  <button
                    onClick={() => setSubfolderPath([])}
                    className={`transition-colors cursor-pointer ${
                      subfolderPath.length === 0
                        ? 'text-text-primary font-bold'
                        : 'text-text-muted hover:text-text-primary font-medium'
                    }`}
                  >
                    {activeRootFolder.title}
                  </button>

                  {currentPathDetails.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                      <ChevronRight size={12} className="text-text-muted shrink-0" />
                      <button
                        onClick={() => setSubfolderPath(subfolderPath.slice(0, idx + 1))}
                        className={`transition-colors cursor-pointer ${
                          idx === currentPathDetails.length - 1
                            ? 'text-text-primary font-bold'
                            : 'text-text-muted hover:text-text-primary font-medium'
                        }`}
                      >
                        {crumb.title}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
              </div>
            </div>

            {/* Current Folder Heading Banner with Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-subtle flex items-center justify-center text-text-primary border border-border-subtle shadow-2xs">
                  {activeRootFolder.id === 'academic' ? (
                    <GraduationCap size={20} />
                  ) : activeRootFolder.id === 'document' ? (
                    <FileText size={20} />
                  ) : activeRootFolder.id === 'links' ? (
                    <Link2 size={20} />
                  ) : (
                    <Lock size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                    {activeNode?.title}
                  </h2>
                  <span className="text-[11px] font-mono-tabular text-text-muted">
                    {activeRootFolder.id === 'links'
                      ? `${filteredItems.length} Saved Links`
                      : activeRootFolder.id === 'academic' && subfolderPath.length === 0
                      ? `${filteredSubfolders.length} Semesters`
                      : subfolderPath.length === 0
                      ? `${filteredSubfolders.length} Subfolders • ${filteredItems.length} Items`
                      : `${filteredItems.length} Items`}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Semesters Count / Subfolder / Item */}
              <div className="flex items-center gap-2">
                {/* Academic Root: Degree Semesters Count Selector */}
                {activeRootFolder.id === 'academic' && subfolderPath.length === 0 && (
                  <div className="flex items-center gap-1.5 bg-subtle px-2.5 py-1.5 rounded-lg border border-border-subtle">
                    <span className="text-xs font-medium text-text-muted">Semesters:</span>
                    <select
                      value={filteredSubfolders.length || 8}
                      onChange={handleSemesterCountChange}
                      className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
                      title="Set number of semesters in your degree program"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                        <option key={num} value={num} className="bg-surface text-text-primary">
                          {num} Semesters
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subfolders can only be created at root level of Docs and Personal (max 1 level depth) */}
                {subfolderPath.length === 0 && (activeRootFolder.id === 'document' || activeRootFolder.id === 'personal') && (
                  <button
                    onClick={() => setInlineAddType(prev => prev === 'subfolder' ? null : 'subfolder')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                      inlineAddType === 'subfolder'
                        ? 'bg-accent-ink text-text-on-dark border-accent-ink'
                        : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-primary'
                    }`}
                    title="Create new subfolder in this section"
                  >
                    <FolderPlus size={13} />
                    <span>Subfolder</span>
                  </button>
                )}

                {/* Items can be added anywhere EXCEPT root of Academic (must save into a Semester) */}
                {!(activeRootFolder.id === 'academic' && subfolderPath.length === 0) && (
                  <button
                    onClick={() => setInlineAddType(prev => prev === 'item' ? null : 'item')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                      inlineAddType === 'item'
                        ? 'bg-accent-ink text-text-on-dark border-accent-ink'
                        : 'bg-accent-ink text-text-on-dark hover:opacity-95'
                    }`}
                    title="Add resource in this section"
                  >
                    <Plus size={13} />
                    <span>{activeRootFolder.id === 'links' ? 'Add Link' : 'Item'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* INLINE SECTION: CREATE NEW SUBFOLDER (Only allowed at root level of Docs and Personal) */}
          {inlineAddType === 'subfolder' && subfolderPath.length === 0 && (activeRootFolder.id === 'document' || activeRootFolder.id === 'personal') && (
            <div className="rounded-xl border border-border-strong bg-surface p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <FolderPlus size={15} className="text-accent-forest" />
                  <span>New Subfolder inside {activeNode?.title}</span>
                </div>
                <button
                  onClick={() => setInlineAddType(null)}
                  className="p-1 rounded text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleCreateSubfolder} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Subfolder Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 2: Quantum Physics, Lab Assignments, Cheat Sheets"
                    value={newSubfolderName}
                    onChange={(e) => setNewSubfolderName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Folder Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSubfolderIsPublic(true)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        subfolderIsPublic
                          ? 'border-accent-forest bg-accent-forest/10 text-accent-forest font-semibold'
                          : 'border-border-subtle bg-canvas text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Globe size={13} />
                      <span className="text-left">Public (Campus)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubfolderIsPublic(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        !subfolderIsPublic
                          ? 'border-accent-ink bg-surface-hover text-text-primary font-semibold'
                          : 'border-border-subtle bg-canvas text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Lock size={13} />
                      <span className="text-left">Private (Workspace)</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddType(null);
                      setNewSubfolderName('');
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    Create Subfolder
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* INLINE SECTION: ADD ITEM / RESOURCE */}
          {inlineAddType === 'item' && (
            <div className="rounded-xl border border-border-strong bg-surface p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2 font-bold text-xs text-text-primary">
                  <Plus size={15} className="text-accent-forest" />
                  <span>Add Resource to {activeNode?.title}</span>
                </div>
                <button
                  onClick={() => setInlineAddType(null)}
                  className="p-1 rounded text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddItemToFolder} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Title / Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems Lecture Series or DSA Master Notes"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Resource URL / Link
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/playlist?list=... or https://..."
                    value={itemUrl}
                    onChange={(e) => setItemUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Resource Type
                    </label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                    >
                      <option value="playlist">YouTube Video / Playlist</option>
                      <option value="document">Document / PDF Note</option>
                      <option value="source">Code Repository / Source</option>
                      <option value="link">Web Link / Article</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Author / Professor Credits
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NPTEL / MIT OpenCourseWare"
                      value={itemAuthor}
                      onChange={(e) => setItemAuthor(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs bg-canvas focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Visibility & Academic Sharing
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPublishPublicly(true)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        publishPublicly
                          ? 'border-accent-forest bg-accent-forest/10 text-accent-forest font-semibold'
                          : 'border-border-subtle bg-canvas text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Globe size={15} className="shrink-0 text-accent-forest" />
                      <div className="text-left">
                        <div className="font-semibold text-text-primary">Public (Default)</div>
                        <div className="text-[10px] text-text-muted">Available to all scholars across campus</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPublishPublicly(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        !publishPublicly
                          ? 'border-accent-ink bg-surface-hover text-text-primary font-semibold'
                          : 'border-border-subtle bg-canvas text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Lock size={15} className="shrink-0 text-text-secondary" />
                      <div className="text-left">
                        <div className="font-semibold text-text-primary">Private</div>
                        <div className="text-[10px] text-text-muted">Only visible in your personal folder</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddType(null);
                      setItemTitle('');
                      setItemUrl('');
                      setItemAuthor('');
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    Save to Folder
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 1: Subfolders Grid (Academic Semesters, Docs Subfolders, Personal Subfolders) */}
          {filteredSubfolders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <FolderOpen size={14} className="text-text-primary" />
                  <span>
                    {activeRootFolder.id === 'academic' && subfolderPath.length === 0
                      ? `Semesters (${filteredSubfolders.length})`
                      : `Subfolders (${filteredSubfolders.length})`}
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredSubfolders.map((sf) => {
                  const isAcademic = activeRootFolder.id === 'academic';
                  const isPinned = isAcademic && sf.id === pinnedSemesterState;

                  return (
                    <div
                      key={sf.id}
                      onClick={() => {
                        setInlineAddType(null);
                        setSubfolderPath(prev => [...prev, sf.id]);
                      }}
                      className={`p-3.5 sm:p-4 rounded-xl border bg-surface hover:bg-surface-hover/80 hover:border-border-strong transition-all cursor-pointer flex flex-col justify-between group shadow-xs space-y-2.5 active:scale-[0.99] relative ${
                        isPinned
                          ? 'border-amber-500/50 bg-amber-500/[0.03] ring-1 ring-amber-500/30'
                          : 'border-border-subtle'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-text-primary group-hover:bg-accent-ink group-hover:text-text-on-dark transition-colors">
                          <Folder size={16} />
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Pin / Star Button for Academic Semesters */}
                          {isAcademic && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinSemester(sf.id, sf.title);
                              }}
                              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                                isPinned
                                  ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                                  : 'text-text-muted hover:text-text-primary hover:bg-subtle'
                              }`}
                              title={isPinned ? 'Current pinned semester' : 'Pin as current semester'}
                            >
                              <Pin size={13} className={isPinned ? 'fill-amber-500' : ''} />
                            </button>
                          )}

                          {/* Delete button: strictly disallowed on Academic semesters and system folders */}
                          {!sf.isSystem && !isAcademic && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubfolder(sf.id);
                              }}
                              className="p-1 text-text-muted hover:text-red-500 cursor-pointer transition-colors"
                              title="Delete subfolder"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-forest transition-colors truncate">
                            {sf.title}
                          </h4>
                          {isPinned && (
                            <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                              <Star size={8} className="fill-amber-500" /> Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] sm:text-[11px] font-mono-tabular text-text-muted">
                            {(sf.items?.length || 0)} items
                          </span>
                          {sf.isPublic === false ? (
                            <span className="inline-flex items-center text-[9px] px-1 py-0.2 rounded bg-surface-hover text-text-muted border border-border-subtle" title="Private Subfolder">
                              <Lock size={8} />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Items / Files List (if any) */}
          {filteredItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <FileText size={14} className="text-text-primary" />
                  <span>Resources & Items ({filteredItems.length})</span>
                </h3>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm divide-y divide-border-subtle">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-hover/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center text-text-primary shrink-0 border border-border-subtle">
                        {item.type === 'playlist' ? (
                          <Play size={14} className="text-red-500 fill-red-500" />
                        ) : item.type === 'source' ? (
                          <Code2 size={14} className="text-indigo-500" />
                        ) : item.type === 'document' ? (
                          <FileText size={14} className="text-amber-500" />
                        ) : (
                          <Link2 size={14} className="text-emerald-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono-tabular text-text-muted mt-0.5 flex-wrap">
                          <span>{item.author || 'University Resource'}</span>
                          <span>•</span>
                          <span>{item.count || (item.type === 'playlist' ? 'Video Series' : 'Resource')}</span>
                          {item.isPublic === false ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-surface-hover text-text-muted border border-border-subtle">
                              <Lock size={9} /> Private
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-accent-forest/10 text-accent-forest font-medium">
                              <Globe size={9} /> Public
                            </span>
                          )}
                          {item.date && (
                            <>
                              <span>•</span>
                              <span>{item.date}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {item.type === 'playlist' || item.playlistId ? (
                        <button
                          onClick={() => handlePlayItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 hover:opacity-95 cursor-pointer shadow-xs"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>Watch</span>
                        </button>
                      ) : item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Open</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : null}

                      {item.url && (
                        <button
                          onClick={() => handleCopyLink(item.url)}
                          className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Copy resource URL"
                        >
                          <Copy size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove from folder"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Clean Empty State (When both empty) */}
          {filteredSubfolders.length === 0 && filteredItems.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-border-strong bg-surface/50 p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-subtle flex items-center justify-center text-text-muted mx-auto border border-border-subtle">
                <FolderOpen size={24} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-text-primary">
                  {subfolderPath.length === 0 ? 'This folder is currently empty' : `No items in ${activeNode?.title || 'this section'}`}
                </h4>
                <p className="text-xs text-text-secondary">
                  {subfolderPath.length === 0
                    ? 'Organize your subjects by creating subfolders, or add resources directly.'
                    : 'Add lecture playlists, course syllabus PDFs, or study notes to this subfolder.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {subfolderPath.length === 0 && (activeRootFolder?.id === 'document' || activeRootFolder?.id === 'personal') && (
                  <button
                    onClick={() => setInlineAddType('subfolder')}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FolderPlus size={13} />
                    <span>Subfolder</span>
                  </button>
                )}
                {!(activeRootFolder?.id === 'academic' && subfolderPath.length === 0) && (
                  <button
                    onClick={() => setInlineAddType('item')}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    <Plus size={13} />
                    <span>{activeRootFolder?.id === 'links' ? 'Add Link' : 'Item'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =================================================================
            VIEW CONDITION 2: HOME DASHBOARD VIEW
        ================================================================= */
        <div className="w-full space-y-5">
          {/* TOP HERO: COMPACT CONTINUE LEARNING BAR */}
          <div
            onClick={handleResumeHero}
            className="rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover/80 p-3 sm:p-4 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {/* 16:9 Thumbnail */}
              <div className="relative w-24 sm:w-44 md:w-52 aspect-video rounded-lg overflow-hidden shrink-0 bg-black border border-border-subtle">
                <img
                  src={activeHero.thumbnail}
                  alt={activeHero.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-black/80 text-white shadow-md">
                    <Play size={13} fill="#FFFFFF" className="ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono-tabular bg-black/85 text-white">
                  {activeHero.duration}
                </span>
              </div>

              {/* Module Information & Progress */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-tabular font-bold text-accent-forest uppercase tracking-wider">
                      CONTINUE LEARNING
                    </span>
                    <span className="hidden sm:inline text-[11px] text-text-muted font-mono-tabular">
                      • {activeHero.progress}% Completed
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-text-primary truncate mt-0.5 group-hover:text-accent-forest transition-colors">
                    {activeHero.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-text-muted truncate mt-0.5">
                    {activeHero.moduleTitle}
                  </p>
                </div>

                {/* Hairline Progress Track */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-subtle">
                    <div
                      className="h-full rounded-full bg-accent-forest transition-all duration-300"
                      style={{ width: `${activeHero.progress}%` }}
                    />
                  </div>
                  <span className="sm:hidden text-[10px] font-mono-tabular text-text-muted shrink-0">
                    {activeHero.progress}%
                  </span>
                </div>
              </div>

              {/* Desktop Right CTA Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shrink-0 transition-transform group-hover:translate-x-0.5">
                <span>Resume</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>

          {/* MAIN BALANCED 2-COLUMN STUDIO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT COLUMN (7 cols): Workspace Folders on top, Attendance Buffer below */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-5">
              {/* SECTION: WORKSPACE 4-FOLDERS BLOCK */}
              <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Folder size={16} className="text-text-primary" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                      Workspace Folders
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono-tabular text-text-muted">
                    4 Core Folders
                  </span>
                </div>

                {/* Mobile 2x2 grid (Academic & Document, then Important Links & Personal), Desktop 4 in a row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {folders.map((folder) => {
                    const icon =
                      folder.id === 'academic' ? (
                        <GraduationCap size={18} />
                      ) : folder.id === 'document' ? (
                        <FileText size={18} />
                      ) : folder.id === 'links' ? (
                        <Link2 size={18} />
                      ) : (
                        <Lock size={18} />
                      );

                    return (
                      <div
                        key={folder.id}
                        onClick={() => {
                          setActiveRootFolderId(folder.id);
                          setSubfolderPath([]);
                        }}
                        className="p-3.5 sm:p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover/80 hover:border-border-strong transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 group shadow-xs active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-subtle flex items-center justify-center text-text-primary group-hover:bg-accent-ink group-hover:text-text-on-dark transition-colors shadow-2xs">
                          {icon}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-forest transition-colors truncate w-full">
                          {folder.id === 'document' ? 'Docs' : folder.id === 'links' ? 'Links' : folder.title}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION: ATTENDANCE BUFFER (DIRECTLY BELOW WORKSPACE FOLDERS) */}
              <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-accent-forest" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                      Attendance Buffer
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('attendance')}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                  >
                    Full Ledger &rarr;
                  </button>
                </div>

                {/* Attendance Percentage & Metric */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold font-mono-tabular text-text-primary">
                      {attendanceMetrics.percentage}%
                    </span>
                    <span className="text-xs text-text-muted ml-2 font-mono-tabular">
                      ({attendanceMetrics.attended}/{attendanceMetrics.total} classes)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono-tabular border ${
                      attendanceMetrics.isSafe ? 'pill-safe' : 'pill-alert'
                    }`}
                  >
                    {attendanceMetrics.isSafe ? 'SAFE' : 'ALERT'}
                  </span>
                </div>

                {/* Target Visual Indicator */}
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-subtle">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        attendanceMetrics.isSafe ? 'bg-accent-forest' : 'bg-accent-danger'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, parseFloat(attendanceMetrics.percentage)))}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {attendanceMetrics.pillText}
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView('attendance')}
                  className="w-full py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-surface-hover hover:bg-subtle text-text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CalendarDays size={13} />
                  <span>Log Today's Classes</span>
                </button>
              </section>
            </div>

            {/* RIGHT COLUMN (5 cols): TODAY'S ROUTINE / TIMETABLE TAKING COMPLETE HEIGHT */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
              <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4 flex flex-col h-full min-h-[340px]">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-text-primary" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                      Today • {todayClasses.currentDay}
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('attendance')}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                  >
                    Timetable &rarr;
                  </button>
                </div>

                {todayClasses.dayClasses.length > 0 ? (
                  <div className="divide-y divide-border-subtle flex-1">
                    {todayClasses.dayClasses.slice(0, 5).map((item, idx) => (
                      <div key={item.id || idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-text-primary truncate">
                            {item.subjectName || item.title || 'Lecture'}
                          </h4>
                          <span className="text-[11px] text-text-muted font-mono-tabular">
                            {item.startTime || '10:00 AM'} - {item.endTime || '11:00 AM'} • {item.room || 'Room 101'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold pill-safe shrink-0 border">
                          SCHEDULED
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-text-muted">
                    <div className="w-11 h-11 rounded-2xl bg-surface-sunken border border-border-subtle flex items-center justify-center text-text-muted mb-3 shadow-2xs">
                      <Clock size={20} />
                    </div>
                    <p className="font-bold text-text-primary text-sm">No classes scheduled today</p>
                    <p className="text-xs text-text-muted max-w-xs mt-1">
                      No routine lectures scheduled for {todayClasses.currentDay}. Take time to study or review your coursework.
                    </p>
                    <button
                      onClick={() => setCurrentView('attendance')}
                      className="mt-4 px-3.5 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold text-text-primary hover:text-accent-forest cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Configure Routine</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
