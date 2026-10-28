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
import { DEFAULT_ROUTINE, formatLocalDate } from '../AttendanceTracker';
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

  // Timetable Routine Management & Today's Schedule
  const [userRoutine, setUserRoutine] = useState(() => {
    try {
      const saved = localStorage.getItem(`learnopia_attendance_routine_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const merged = { ...DEFAULT_ROUTINE, ...parsed };
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day) => {
            if ((!merged[day] || merged[day].length === 0) && DEFAULT_ROUTINE[day]?.length > 0) {
              merged[day] = DEFAULT_ROUTINE[day];
            }
          });
          const hasClasses = Object.values(merged).some(arr => Array.isArray(arr) && arr.length > 0);
          if (hasClasses) return merged;
        }
      }
      if (userId !== 'guest') {
        const guestSaved = localStorage.getItem('learnopia_attendance_routine_guest');
        if (guestSaved) {
          const parsed = JSON.parse(guestSaved);
          if (parsed && typeof parsed === 'object') {
            const merged = { ...DEFAULT_ROUTINE, ...parsed };
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day) => {
              if ((!merged[day] || merged[day].length === 0) && DEFAULT_ROUTINE[day]?.length > 0) {
                merged[day] = DEFAULT_ROUTINE[day];
              }
            });
            const hasClasses = Object.values(merged).some(arr => Array.isArray(arr) && arr.length > 0);
            if (hasClasses) return merged;
          }
        }
      }
    } catch {}
    return DEFAULT_ROUTINE;
  });

  useEffect(() => {
    const syncRoutine = () => {
      try {
        const saved = localStorage.getItem(`learnopia_attendance_routine_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            const merged = { ...DEFAULT_ROUTINE, ...parsed };
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach((day) => {
              if ((!merged[day] || merged[day].length === 0) && DEFAULT_ROUTINE[day]?.length > 0) {
                merged[day] = DEFAULT_ROUTINE[day];
              }
            });
            const hasClasses = Object.values(merged).some(arr => Array.isArray(arr) && arr.length > 0);
            if (hasClasses) {
              setUserRoutine(merged);
              return;
            }
          }
        }
      } catch {}
      setUserRoutine(DEFAULT_ROUTINE);
    };

    const handleRoutineEvent = (e) => {
      if (e?.detail?.routine) {
        setUserRoutine(e.detail.routine);
      } else {
        syncRoutine();
      }
    };

    window.addEventListener('learnopia_routine_updated', handleRoutineEvent);
    window.addEventListener('storage', syncRoutine);
    return () => {
      window.removeEventListener('learnopia_routine_updated', handleRoutineEvent);
      window.removeEventListener('storage', syncRoutine);
    };
  }, [userId]);

  // Today's Routine Schedule with live status from Attendance logs
  const todayClasses = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const activeSchedule = userRoutine || DEFAULT_ROUTINE;
    let rawClasses = activeSchedule ? activeSchedule[currentDay] || [] : [];

    // Fallback to DEFAULT_ROUTINE for today if schedule is empty but default has classes
    if ((!rawClasses || rawClasses.length === 0) && DEFAULT_ROUTINE[currentDay]?.length > 0) {
      rawClasses = DEFAULT_ROUTINE[currentDay];
    }

    // Check today's marked status in attendance logs
    let todayLogMap = {};
    try {
      const todayDateStr = formatLocalDate(new Date());
      const logsRaw = localStorage.getItem(`learnopia_attendance_logs_${userId}`);
      if (logsRaw) {
        const parsedLogs = JSON.parse(logsRaw);
        if (parsedLogs[todayDateStr]?.classes) {
          todayLogMap = parsedLogs[todayDateStr].classes;
        }
      }
    } catch {}

    const classesWithStatus = rawClasses.map(cls => ({
      ...cls,
      status: todayLogMap[cls.id] || null
    }));

    return { currentDay, dayClasses: classesWithStatus };
  }, [userRoutine, userId, attendanceSyncVersion]);

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
                            <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
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
            <div className="rounded-xl border border-dashed border-border-strong bg-surface/50 p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-lg bg-subtle flex items-center justify-center text-text-muted mx-auto border border-border-subtle">
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
            VIEW CONDITION 2: HOME DASHBOARD VIEW (DE-BOXED EDITORIAL ARCHITECTURE)
        ================================================================= */
        <div className="w-full space-y-6">
          {/* 1. EDITORIAL ACTIVE STUDY BAR */}
          <div
            onClick={handleResumeHero}
            className="rounded-2xl border border-border-subtle bg-surface hover:border-border-strong hover:shadow-md p-3.5 sm:p-5 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* 16:9 Thumbnail Preview */}
                <div className="relative w-28 sm:w-44 md:w-48 aspect-video rounded-xl overflow-hidden shrink-0 bg-black border border-border-subtle shadow-xs">
                  <img
                    src={activeHero.thumbnail}
                    alt={activeHero.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/85 text-white shadow-md">
                      <Play size={13} fill="#FFFFFF" className="ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono-tabular bg-black/85 text-white">
                    {activeHero.duration}
                  </span>
                </div>

                {/* Module Details & Progress */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-forest animate-pulse" />
                    <span className="text-[10px] font-mono-tabular font-bold text-accent-forest uppercase tracking-wider">
                      ACTIVE STUDY TRACK
                    </span>
                    <span className="hidden sm:inline text-[11px] text-text-muted font-mono-tabular">
                      • {activeHero.progress}% Completed
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-text-primary truncate mt-1 group-hover:text-accent-forest transition-colors">
                    {activeHero.title}
                  </h3>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {activeHero.moduleTitle}
                  </p>

                  {/* Hairline Progress Track */}
                  <div className="mt-2.5 flex items-center gap-2.5 max-w-md">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-subtle">
                      <div
                        className="h-full rounded-full bg-accent-forest transition-all duration-300"
                        style={{ width: `${activeHero.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono-tabular text-text-muted font-bold shrink-0">
                      {activeHero.progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark shrink-0 transition-transform group-hover:translate-x-0.5 shadow-xs">
                <span>Resume Study</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>

          {/* 2. WORKSPACE DIRECTORY (OPEN SHELF - NO NESTED CONTAINER BOX) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <Folder size={15} className="text-text-primary" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                  Workspace Directory
                </h2>
                <span className="text-[11px] font-mono-tabular text-text-muted">
                  • 4 Core Hubs
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-text-muted">
                <span>Program:</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold flex items-center gap-1">
                  <Star size={9} className="fill-amber-500" />
                  {pinnedSemesterState ? `Sem ${pinnedSemesterState.replace('sem-', '')} Active` : 'Sem 1 Active'}
                </span>
              </div>
            </div>

            {/* 4 Multi-Gradient Tactical Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {folders.map((folder) => {
                const config = {
                  academic: {
                    title: 'Academic Vault',
                    badge: 'CURRICULUM',
                    bgGradient: 'bg-gradient-to-br from-emerald-500/15 via-teal-500/[0.06] to-surface dark:from-emerald-950/40 dark:via-teal-950/15 dark:to-[#121212]',
                    border: 'border-emerald-500/30 hover:border-emerald-500/60 border-t-2 border-t-emerald-500',
                    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                    iconBox: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                    icon: <GraduationCap size={18} />,
                    subtitle: pinnedSemesterState
                      ? `Sem ${pinnedSemesterState.replace('sem-', '')} (Pinned)`
                      : `${folder.subfolders?.length || 8} Semesters`
                  },
                  document: {
                    title: 'Study Documents',
                    badge: 'STUDY VAULT',
                    bgGradient: 'bg-gradient-to-br from-amber-500/15 via-orange-500/[0.06] to-surface dark:from-amber-950/40 dark:via-orange-950/15 dark:to-[#121212]',
                    border: 'border-amber-500/30 hover:border-amber-500/60 border-t-2 border-t-amber-500',
                    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                    iconBox: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
                    icon: <FileText size={18} />,
                    subtitle: `${(folder.subfolders?.length || 0) + (folder.items?.length || 0)} resources`
                  },
                  links: {
                    title: 'Important Links',
                    badge: 'PORTALS',
                    bgGradient: 'bg-gradient-to-br from-sky-500/15 via-blue-500/[0.06] to-surface dark:from-sky-950/40 dark:via-blue-950/15 dark:to-[#121212]',
                    border: 'border-sky-500/30 hover:border-sky-500/60 border-t-2 border-t-sky-500',
                    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
                    iconBox: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
                    icon: <Link2 size={18} />,
                    subtitle: `${folder.items?.length || 0} quick links`
                  },
                  personal: {
                    title: 'Personal Vault',
                    badge: 'PRIVATE',
                    bgGradient: 'bg-gradient-to-br from-purple-500/15 via-indigo-500/[0.06] to-surface dark:from-purple-950/40 dark:via-indigo-950/15 dark:to-[#121212]',
                    border: 'border-purple-500/30 hover:border-purple-500/60 border-t-2 border-t-purple-500',
                    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
                    iconBox: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
                    icon: <Lock size={18} />,
                    subtitle: `${folder.items?.length || 0} private items`
                  }
                }[folder.id] || {
                  title: folder.title,
                  badge: 'FOLDER',
                  bgGradient: 'bg-surface hover:bg-surface-hover/80',
                  border: 'border-border-subtle hover:border-border-strong',
                  badgeClass: 'bg-subtle text-text-muted border-border-subtle',
                  iconBox: 'bg-subtle text-text-primary border-border-subtle',
                  icon: <Folder size={18} />,
                  subtitle: `${folder.items?.length || 0} items`
                };

                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setActiveRootFolderId(folder.id);
                      setSubfolderPath([]);
                    }}
                    className={`p-4 rounded-xl border ${config.bgGradient} ${config.border} transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md active:scale-[0.98] min-h-[140px] relative overflow-hidden`}
                  >
                    {/* Top: Icon & Category Badge */}
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-9 h-9 rounded-xl border ${config.iconBox} flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs shrink-0`}>
                        {config.icon}
                      </div>
                      <span className={`text-[9px] font-mono-tabular font-bold tracking-wider px-2 py-0.5 rounded-full border ${config.badgeClass} shrink-0`}>
                        {config.badge}
                      </span>
                    </div>

                    {/* Title & Metadata */}
                    <div className="w-full min-w-0 mt-3">
                      <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-forest transition-colors truncate">
                        {config.title}
                      </h3>
                      <span className="text-[11px] font-mono-tabular text-text-muted block truncate mt-0.5">
                        {config.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. UNIFIED DAILY COMMAND CENTER: ATTENDANCE BUFFER + TODAY'S SCHEDULE */}
          <section className="rounded-2xl border border-border-subtle bg-surface shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
              {/* LEFT HALF (5 cols): ATTENDANCE BUFFER & METRICS */}
              <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-accent-forest" />
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
                  <div className="flex items-baseline justify-between mt-3.5">
                    <div>
                      <span className="text-3xl font-extrabold font-mono-tabular text-text-primary">
                        {attendanceMetrics.percentage}%
                      </span>
                      <span className="text-xs text-text-muted ml-2 font-mono-tabular">
                        ({attendanceMetrics.attended} / {attendanceMetrics.total} classes)
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

                  {/* Visual Progress Bar */}
                  <div className="mt-3 space-y-1.5">
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
                </div>

                <button
                  onClick={() => setCurrentView('attendance')}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border border-border-subtle bg-surface-hover hover:bg-subtle text-text-primary flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <CalendarDays size={14} />
                  <span>Log Attendance Records</span>
                </button>
              </div>

              {/* RIGHT HALF (7 cols): TODAY'S ROUTINE / TIMETABLE (FIXED HEIGHT SCROLLABLE) */}
              <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-text-primary" />
                      <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                        Today • {todayClasses.currentDay} {todayClasses.dayClasses.length > 0 && `(${todayClasses.dayClasses.length} Classes)`}
                      </h2>
                    </div>
                    <button
                      onClick={() => setCurrentView('attendance')}
                      className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                    >
                      Timetable &rarr;
                    </button>
                  </div>

                  {/* Scrollable Classes List (Fixed max-height to avoid dashboard distortion) */}
                  {todayClasses.dayClasses.length > 0 ? (
                    <div
                      className="overflow-y-auto max-h-[175px] divide-y divide-border-subtle mt-2 pr-1"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {todayClasses.dayClasses.map((item, idx) => {
                        const isAttended = item.status === 'attended';
                        const isAbsent = item.status === 'absent';
                        const isBunked = item.status === 'bunked';
                        const isCancelled = item.status === 'cancelled';

                        return (
                          <div
                            key={item.id || idx}
                            onClick={() => setCurrentView('attendance')}
                            className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-surface-hover/60 rounded-lg transition-colors cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-text-primary truncate flex items-center gap-1.5 group-hover:text-accent-forest transition-colors">
                                <span>{item.subject || item.subjectName || item.title || 'Lecture'}</span>
                                {item.isLab && (
                                  <span className="text-[9px] font-mono-tabular font-bold px-1 rounded bg-accent-forest/15 text-accent-forest border border-accent-forest/25 shrink-0">
                                    LAB
                                  </span>
                                )}
                              </h4>
                              <span className="text-[11px] text-text-muted font-mono-tabular block truncate mt-0.5">
                                {item.startTime || '10:00 AM'} - {item.endTime || '11:00 AM'} • {item.room || 'Room 101'}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-mono-tabular font-bold shrink-0 border ${
                                isAttended
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : isAbsent
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                  : isBunked
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : isCancelled
                                  ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/30'
                                  : 'bg-surface-hover text-text-secondary border-border-subtle'
                              }`}
                            >
                              {isAttended
                                ? 'ATTENDED'
                                : isAbsent
                                ? 'ABSENT'
                                : isBunked
                                ? 'BUNKED'
                                : isCancelled
                                ? 'CANCELLED'
                                : 'SCHEDULED'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-text-muted space-y-1">
                      <p className="font-bold text-text-primary text-sm">No lectures scheduled today</p>
                      <p className="text-xs text-text-muted max-w-xs mx-auto">
                        Enjoy your study day for {todayClasses.currentDay}. Review course notes or practice problem sets.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-right">
                  <span className="text-[10px] font-mono-tabular text-text-muted">
                    Syncs automatically with Attendance Ledger
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
