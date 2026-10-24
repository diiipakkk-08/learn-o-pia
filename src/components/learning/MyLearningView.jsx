import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Play,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  BookmarkCheck,
  Download,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Folder,
  FolderPlus,
  FolderOpen,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Link2,
  Share2
} from 'lucide-react';
import { calculateAttendanceMetrics } from '../../utils/attendanceMath';

export default function MyLearningView({
  setCurrentView,
  setSelectedPlaylistId,
  setSelectedVideoIndex,
  isSidebarCollapsed = false
}) {
  const {
    currentUser,
    courses,
    subjects,
    lastPlayed,
    savedResourceIds,
    standaloneResources,
    routine,
    addStandaloneResource
  } = useDatabase();

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
            pl.youtubePlaylistId ||
            firstVid?.youtubeId ||
            (firstVid?.url ? (firstVid.url.match(/[?&]v=([^#&]+)/) || [])[1] : '');
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

  // Continue Learning Hero Item
  const activeHero = useMemo(() => {
    if (lastPlayed && (lastPlayed.playlistId || lastPlayed.courseId)) {
      return {
        id: lastPlayed.playlistId || lastPlayed.courseId,
        title: lastPlayed.playlistTitle || lastPlayed.courseTitle || 'University Study Track',
        moduleTitle: lastPlayed.videoTitle || 'Lecture 1: Core Fundamentals',
        videoIndex: lastPlayed.videoIndex || 0,
        thumbnail:
          lastPlayed.thumbnail ||
          'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
        progress: lastPlayed.progress || 35,
        duration: lastPlayed.duration || '42m'
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

  // User Attendance Metrics (Calculated from user's logs in localStorage)
  const attendanceMetrics = useMemo(() => {
    const userId = currentUser?.id || 'guest';
    let attended = 28;
    let total = 34;

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
              } else if (st === 'absent') {
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
  }, [currentUser]);

  // User Recent Notes (Collected from localStorage video notes)
  const userRecentNotes = useMemo(() => {
    const list = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('learnopia_notes_')) {
          const playlistId = key.replace('learnopia_notes_', '');
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((n) => {
                list.push({ ...n, playlistId });
              });
            }
          }
        }
      }
    } catch {}

    if (list.length === 0) {
      return [
        {
          id: 'sample-1',
          text: 'Verify continuity at x=0 before applying L\'Hopital\'s Rule in limits problems.',
          timestamp: '08:24',
          playlistId: 'pl-1',
          courseTitle: 'Engineering Mathematics I'
        },
        {
          id: 'sample-2',
          text: 'Wave equation solution: Ψ(x,t) = A sin(kx - ωt + φ). Phase velocity v = ω/k.',
          timestamp: '14:10',
          playlistId: 'pl-2',
          courseTitle: 'Engineering Physics'
        }
      ];
    }

    return list.slice(0, 4);
  }, []);

  // Saved Academic Vault Resources (Top 3)
  const topVaultResources = useMemo(() => {
    const saved = (standaloneResources || []).filter((r) =>
      (savedResourceIds || []).includes(r.id)
    );
    if (saved.length > 0) return saved.slice(0, 3);
    return (standaloneResources || []).slice(0, 3);
  }, [standaloneResources, savedResourceIds]);

  // Today's Routine Schedule
  const todayClasses = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const dayClasses = routine ? routine[currentDay] || [] : [];
    return { currentDay, dayClasses };
  }, [routine]);

  // =================================================================
  // ACADEMIC STUDY FOLDERS SYSTEM
  // =================================================================
  const userId = currentUser?.id || 'guest';
  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(`learnopia_folders_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'folder-degree',
        title: currentUser?.department ? `${currentUser.department} Core Track` : 'MAKAUT B.Tech Computer Science',
        description: 'Official university curriculum syllabus, theory playlists, and lab modules.',
        isSystem: true,
        icon: 'degree',
        items: []
      },
      {
        id: 'folder-vault',
        title: 'My Saved Notes & Vault',
        description: 'Personal study guides, formula sheets, and past year question papers.',
        isSystem: true,
        icon: 'vault',
        items: []
      },
      {
        id: 'folder-gate',
        title: 'GATE & Competitive Prep',
        description: 'Algorithms, Data Structures, Operating Systems, and Aptitude.',
        isSystem: false,
        icon: 'code',
        items: [
          {
            id: 'item-1',
            title: 'Dynamic Programming & Graph Algorithms',
            url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
            type: 'playlist',
            author: 'Take U Forward',
            count: '42 lectures'
          },
          {
            id: 'item-2',
            title: 'Engineering Mathematics & Calculus Quick Formulae',
            url: 'https://www.makautexam.net/pdf/syllabus.pdf',
            type: 'document',
            author: 'MAKAUT Faculty',
            count: 'PDF Guide'
          }
        ]
      }
    ];
  });

  const [activeFolderId, setActiveFolderId] = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemType, setItemType] = useState('playlist');
  const [publishPublicly, setPublishPublicly] = useState(false);
  const [folderNotice, setFolderNotice] = useState('');

  const saveFolders = (newFolders) => {
    setFolders(newFolders);
    try {
      localStorage.setItem(`learnopia_folders_${userId}`, JSON.stringify(newFolders));
    } catch {}
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: `folder-${Date.now()}`,
      title: newFolderName.trim(),
      description: newFolderDesc.trim() || 'Custom academic study folder.',
      isSystem: false,
      icon: 'custom',
      items: []
    };
    const updated = [...folders, newFolder];
    saveFolders(updated);
    setNewFolderName('');
    setNewFolderDesc('');
    setShowCreateFolderModal(false);
    setFolderNotice(`Folder "${newFolder.title}" created!`);
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleDeleteFolder = (folderId, e) => {
    if (e) e.stopPropagation();
    const folder = folders.find(f => f.id === folderId);
    if (folder?.isSystem) return;
    const updated = folders.filter(f => f.id !== folderId);
    saveFolders(updated);
    if (activeFolderId === folderId) setActiveFolderId(null);
  };

  const handleAddItemToFolder = (e) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemUrl.trim() || !activeFolderId) return;

    const newItem = {
      id: `item-${Date.now()}`,
      title: itemTitle.trim(),
      url: itemUrl.trim(),
      type: itemType,
      author: currentUser?.name || 'Scholar',
      count: itemType === 'playlist' ? 'Video Series' : 'Document'
    };

    if (publishPublicly && typeof addStandaloneResource === 'function' && itemType === 'document') {
      addStandaloneResource({
        title: itemTitle.trim(),
        url: itemUrl.trim(),
        type: 'pdf',
        category: 'Community Notes',
        description: `Shared by ${currentUser?.name || 'Scholar'}`,
        author: currentUser?.name || 'Scholar',
        keywords: ['makaut', 'student notes', itemTitle.toLowerCase()]
      });
    }

    const updated = folders.map(f => {
      if (f.id === activeFolderId) {
        return {
          ...f,
          items: [newItem, ...(f.items || [])]
        };
      }
      return f;
    });

    saveFolders(updated);
    setItemTitle('');
    setItemUrl('');
    setPublishPublicly(false);
    setShowAddItemModal(false);
    setFolderNotice(`Added "${newItem.title}" to folder${publishPublicly ? ' & published publicly!' : '!'}`);
    setTimeout(() => setFolderNotice(''), 3500);
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 space-y-5">
      {/* Editorial Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-subtle pb-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight font-editorial text-text-primary">
            Study Workspace
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Welcome back, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Scholar'}. Track your courses, attendance, and notes.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono-tabular text-text-muted bg-subtle px-2.5 py-1 rounded-md border border-border-subtle">
            {currentUser?.semester ? `SEM ${currentUser.semester}` : 'ACTIVE TERM'} • 75% MINIMUM TARGET
          </span>
        </div>
      </div>

      {/* =================================================================
          TOP HERO: COMPACT CONTINUE LEARNING BAR
          Mobile: Sleek horizontal row (~84px height) so it doesn't swallow the phone screen!
          Desktop: Compact horizontal banner (~120px)
      ================================================================= */}
      <div
        onClick={handleResumeHero}
        className="rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover/80 p-3 sm:p-4 transition-all cursor-pointer group shadow-sm"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          {/* 16:9 Thumbnail (Compact & Proportional) */}
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

      {/* =================================================================
          MAIN BALANCED 2-COLUMN STUDIO GRID
          No Asymmetric Bento Holes • Clear Visual Hierarchy • No Box-in-Box
      ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ===============================================================
            LEFT COLUMN (7 cols): Enrolled Courses & Timestamped Notes
        =============================================================== */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-5">
          {/* SECTION 1: ACADEMIC FOLDERS SYSTEM */}
          <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4">
            {/* Folder Navigation Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Folder size={16} className="text-text-primary" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                  {activeFolder ? `Folder: ${activeFolder.title}` : `Academic Study Folders (${folders.length})`}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {activeFolder ? (
                  <>
                    <button
                      onClick={() => setActiveFolderId(null)}
                      className="px-2.5 py-1 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                    >
                      <ArrowLeft size={12} />
                      <span>All Folders</span>
                    </button>
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-accent-ink text-text-on-dark text-xs font-semibold flex items-center gap-1 hover:opacity-95 cursor-pointer shadow-xs"
                    >
                      <Plus size={12} />
                      <span>Add Item</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowCreateFolderModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-accent-ink text-text-on-dark text-xs font-semibold flex items-center gap-1 hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    <FolderPlus size={12} />
                    <span>New Folder</span>
                  </button>
                )}
              </div>
            </div>

            {/* A. FOLDERS OVERVIEW GRID (When activeFolderId === null) */}
            {!activeFolder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {folders.map((folder) => {
                  let itemCountText = '';
                  if (folder.id === 'folder-degree') {
                    itemCountText = `${enrolledSubjectCourses.length} Subjects enrolled`;
                  } else if (folder.id === 'folder-vault') {
                    itemCountText = `${topVaultResources.length} Saved documents`;
                  } else {
                    itemCountText = `${(folder.items || []).length} Study items`;
                  }

                  return (
                    <div
                      key={folder.id}
                      onClick={() => setActiveFolderId(folder.id)}
                      className="p-3.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover/70 hover:border-border-strong transition-all cursor-pointer flex flex-col justify-between group shadow-xs space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-text-primary group-hover:bg-accent-ink group-hover:text-text-on-dark transition-colors">
                            {folder.id === 'folder-degree' ? (
                              <BookOpen size={15} />
                            ) : folder.id === 'folder-vault' ? (
                              <BookmarkCheck size={15} />
                            ) : (
                              <Folder size={15} />
                            )}
                          </div>
                          {!folder.isSystem && (
                            <button
                              onClick={(e) => handleDeleteFolder(folder.id, e)}
                              className="p-1 text-text-muted hover:text-red-500 cursor-pointer transition-colors"
                              title="Delete folder"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-forest transition-colors truncate">
                          {folder.title}
                        </h3>
                        <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                          {folder.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono-tabular">
                        <span className="text-text-muted truncate">{itemCountText}</span>
                        <span className="font-semibold text-accent-forest flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          <span>Open</span>
                          <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* B. FOLDER DETAILS VIEW (When activeFolderId !== null) */}
            {activeFolder && (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary leading-relaxed">
                  {activeFolder.description}
                </p>

                {/* Contained Items List */}
                <div className="divide-y divide-border-subtle pt-1">
                  {activeFolder.id === 'folder-degree' && (
                    enrolledSubjectCourses.length > 0 ? (
                      enrolledSubjectCourses.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (setSelectedPlaylistId) setSelectedPlaylistId(item.playlistId);
                            if (setSelectedVideoIndex) setSelectedVideoIndex(0);
                            setCurrentView('learning-player');
                          }}
                          className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-hover/60 px-2 -mx-2 rounded-lg transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-md overflow-hidden bg-black shrink-0 flex items-center justify-center border border-border-subtle">
                              {item.thumbnailUrl ? (
                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-90" />
                              ) : (
                                <BookOpen size={14} className="text-white" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-accent-forest transition-colors">
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-text-muted font-mono-tabular truncate block mt-0.5">
                                {item.subjectTitle} • {item.videoCount} Lectures
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:inline text-[10px] font-mono-tabular text-text-muted">
                              {item.progress}%
                            </span>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-subtle group-hover:bg-accent-ink group-hover:text-text-on-dark transition-colors">
                              <Play size={10} fill="currentColor" className="ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-text-muted space-y-2">
                        <p>No curriculum subjects enrolled yet.</p>
                        <button
                          onClick={() => setCurrentView('learning')}
                          className="text-xs font-semibold text-accent-forest hover:underline cursor-pointer"
                        >
                          Browse Course Catalog &rarr;
                        </button>
                      </div>
                    )
                  )}

                  {activeFolder.id === 'folder-vault' && (
                    topVaultResources.length > 0 ? (
                      topVaultResources.map((res) => (
                        <div
                          key={res.id}
                          className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-hover/60 px-2 -mx-2 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-subtle flex items-center justify-center text-text-primary shrink-0 border border-border-subtle">
                              <FileText size={15} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-text-primary truncate">
                                {res.title}
                              </h4>
                              <span className="text-[10px] text-text-muted font-mono-tabular truncate block mt-0.5">
                                {res.category || 'Study Material'} • {res.author || 'University Faculty'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {res.url && (
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded text-[11px] font-semibold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-1 cursor-pointer"
                              >
                                <ExternalLink size={11} />
                                <span>Open</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-text-muted space-y-2">
                        <p>No saved notes or vault documents yet.</p>
                        <button
                          onClick={() => setCurrentView('resources')}
                          className="text-xs font-semibold text-accent-forest hover:underline cursor-pointer"
                        >
                          Explore Academic Vault &rarr;
                        </button>
                      </div>
                    )
                  )}

                  {!activeFolder.isSystem && (
                    (activeFolder.items && activeFolder.items.length > 0) ? (
                      activeFolder.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-hover/60 px-2 -mx-2 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-subtle flex items-center justify-center text-text-primary shrink-0 border border-border-subtle">
                              {item.type === 'playlist' ? <Play size={13} fill="currentColor" /> : <FileText size={13} />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-text-primary truncate">
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-text-muted font-mono-tabular truncate block mt-0.5">
                                {item.count} • {item.author}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-accent-ink text-text-on-dark hover:opacity-90 flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <span>{item.type === 'playlist' ? 'Watch' : 'View'}</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-text-muted space-y-2">
                        <p>This folder is empty.</p>
                        <button
                          onClick={() => setShowAddItemModal(true)}
                          className="text-xs font-semibold text-accent-forest hover:underline cursor-pointer"
                        >
                          + Add a lecture series or study document
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: TIMESTAMPED LECTURE NOTES */}
          <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent-amber" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                  Recent Lecture Notes
                </h2>
              </div>
              <button
                onClick={() => setCurrentView('resources')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                Vault &rarr;
              </button>
            </div>

            {/* Clean Timeline List Rows */}
            <div className="divide-y divide-border-subtle">
              {userRecentNotes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    if (setSelectedPlaylistId && note.playlistId) {
                      setSelectedPlaylistId(note.playlistId);
                    }
                    setCurrentView('learning-player');
                  }}
                  className="py-3 hover:bg-surface-hover/60 px-2 -mx-2 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular mb-1">
                    <span className="font-semibold text-accent-forest">
                      [{note.timestamp}]
                    </span>
                    <span className="text-text-muted truncate max-w-[200px]">
                      {note.courseTitle || 'Lecture'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed group-hover:text-text-primary transition-colors">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ===============================================================
            RIGHT COLUMN (5 cols): Attendance, Timetable, Vault
        =============================================================== */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-5">
          {/* WIDGET 1: ATTENDANCE SNAPSHOT */}
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

          {/* WIDGET 2: TODAY'S TIMETABLE / CLASSES */}
          <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-3">
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
              <div className="divide-y divide-border-subtle">
                {todayClasses.dayClasses.slice(0, 3).map((item, idx) => (
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
              <div className="py-4 text-center text-xs text-text-muted">
                <p>No classes scheduled for today.</p>
                <button
                  onClick={() => setCurrentView('attendance')}
                  className="mt-1 text-xs font-semibold text-accent-forest hover:underline cursor-pointer"
                >
                  Configure Routine &rarr;
                </button>
              </div>
            )}
          </section>

          {/* WIDGET 3: ACADEMIC VAULT QUICK LINKS */}
          <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <BookmarkCheck size={16} className="text-accent-forest" />
                <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                  Academic Vault
                </h2>
              </div>
              <button
                onClick={() => setCurrentView('resources')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                All ({standaloneResources?.length || 0}) &rarr;
              </button>
            </div>

            <div className="divide-y divide-border-subtle">
              {topVaultResources.map((res) => (
                <div key={res.id} className="py-2.5 flex items-center justify-between gap-3 group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-tabular font-bold bg-subtle text-text-primary uppercase border border-border-subtle">
                        {res.type || 'PDF'}
                      </span>
                      <h4 className="text-xs font-bold text-text-primary truncate">
                        {res.title}
                      </h4>
                    </div>
                    <span className="text-[11px] text-text-muted mt-0.5 block truncate">
                      {res.category}
                    </span>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-hover text-text-secondary hover:text-text-primary shrink-0 transition-colors"
                    title="Download / View Resource"
                  >
                    <Download size={13} />
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Toast Notice */}
      {folderNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shadow-modal animate-bounce-short">
          {folderNotice}
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 space-y-4 shadow-modal">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-text-primary" />
                <h3 className="text-base font-bold text-text-primary">Create Academic Folder</h3>
              </div>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GATE Prep 2026, Semester 3 Labs, DSA Notes"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Description / Topic Focus
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Study syllabus, algorithms, and past year question sets."
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ITEM TO FOLDER MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 space-y-4 shadow-modal">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-text-primary" />
                <h3 className="text-base font-bold text-text-primary">Add Study Resource to Folder</h3>
              </div>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
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
                  placeholder="e.g. Operating Systems Lecture Series"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  URL / Web Link (YouTube or PDF)
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

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Resource Type
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                >
                  <option value="playlist">YouTube Lecture Series / Video</option>
                  <option value="document">PDF / Study Material Document</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary select-none">
                  <input
                    type="checkbox"
                    checked={publishPublicly}
                    onChange={(e) => setPublishPublicly(e.target.checked)}
                    className="w-4 h-4 rounded border-border-strong accent-accent-ink cursor-pointer"
                  />
                  <span>Publish publicly to Learn-O-Pia Catalog</span>
                </label>
                <p className="text-[11px] text-text-muted ml-6.5 mt-0.5">
                  Allow other university students to discover this material in search.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Add to Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
