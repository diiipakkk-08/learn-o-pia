/**
 * CoursesDashboard.jsx
 * Browse, search, filter, and enroll into university course subjects and playlist lecture series.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDatabase, cleanCourseTitle } from '../../context/DatabaseContext';
import { getWorkspaceFolders, saveWorkspaceFolders, getPinnedSemester } from '../../utils/workspaceFolders';
import {
  FileText,
  Search,
  BookOpen,
  Play,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  Heart,
  X,
  ArrowRight,
  FolderPlus,
  SlidersHorizontal,
  GraduationCap,
  Link2,
  Lock,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const getCuratedCourseThumbnail = (title = '', department = '') => {
  const t = (title + ' ' + department).toLowerCase();
  if (t.includes('physic')) return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=900&q=80'; // Physics & Optics
  if (t.includes('math') || t.includes('calculus') || t.includes('algebra')) return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80'; // Mathematics & Geometry
  if (t.includes('chem')) return 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=900&q=80'; // Chemistry Lab
  if (t.includes('electr') || t.includes('circuit') || t.includes('analog') || t.includes('digital') || t.includes('microprocessor') || t.includes('iot')) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'; // Microchip & Circuits
  if (t.includes('mechanic') || t.includes('graphics') || t.includes('drawing') || t.includes('cad') || t.includes('draft')) return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'; // Mechanical & Drafter
  if (t.includes('civil') || t.includes('survey') || t.includes('structure')) return 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80'; // Civil Engineering & Architecture
  if (t.includes('web') || t.includes('sigma') || t.includes('frontend') || t.includes('fullstack') || t.includes('full-stack') || t.includes('javascript') || t.includes('react')) return 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=900&q=80'; // Modern Web Development
  if (t.includes('data structure') || t.includes('algorithm') || t.includes('dsa') || t.includes('c++') || t.includes('java')) return 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80'; // Algorithms & Code
  if (t.includes('network') || t.includes('cloud') || t.includes('security') || t.includes('os') || t.includes('operating')) return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80'; // Cloud & Networks
  return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80'; // University Study Library
};

class CoursesDashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('CoursesDashboard error caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-4xl mx-auto p-8 my-10 rounded-2xl border border-border-subtle bg-surface text-center space-y-4 shadow-sm animate-fade-in">
          <h2 className="text-xl font-bold text-text-primary font-editorial">Course Catalog</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            The course catalog was updated. Click below to reload.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-90 cursor-pointer"
          >
            Reload Catalog
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CoursesDashboardInner({
  setSelectedPlaylistId,
  setSelectedVideoIndex,
  setCurrentView
}) {
  const {
    courses,
    subjects,
    currentUser,
    enrollInCourse,
    enrollInPlaylist,
    globalSearchQuery,
    setGlobalSearchQuery,
    deleteCourseCatalogItem,
    deleteSubject,
    deleteCourse,
    saveUserFoldersToDb
  } = useDatabase();

  const userId = currentUser?.id || 'guest';
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.isAdmin);

  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [copiedPlId, setCopiedPlId] = useState(null);
  const [enrollNotice, setEnrollNotice] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const sliderRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Folder assignment modal state
  const [courseToAddToFolder, setCourseToAddToFolder] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState('academic');
  const [targetSubfolderId, setTargetSubfolderId] = useState('');

  // Load explorer folders to know if courses are assigned
  // Explorer workspace folders
  const [userFolders, setUserFolders] = useState(() => getWorkspaceFolders(userId));

  // Sync user folders whenever the active user account changes
  useEffect(() => {
    setUserFolders(getWorkspaceFolders(userId));
  }, [userId]);

  // Listen for folder updates across components
  useEffect(() => {
    const handleFoldersUpdated = (e) => {
      if (!e.detail?.userId || e.detail.userId === userId) {
        setUserFolders(getWorkspaceFolders(userId));
      }
    };
    window.addEventListener('learnopia_workspace_folders_updated', handleFoldersUpdated);
    return () => window.removeEventListener('learnopia_workspace_folders_updated', handleFoldersUpdated);
  }, [userId]);

  useEffect(() => {
    if (courseToAddToFolder) {
      setUserFolders(getWorkspaceFolders(userId));
      setTargetFolderId('academic');
      setTargetSubfolderId('');
    }
  }, [courseToAddToFolder, userId]);

  const handleSelectFolder = (folderId) => {
    setTargetFolderId(folderId);
    if (folderId === 'academic') {
      setTargetSubfolderId(getPinnedSemester(userId));
    } else {
      setTargetSubfolderId('');
    }
  };

  // Persistent user course likes (all values start at 0!)
  const [likedCourses, setLikedCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('learnopia_liked_courses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setLocalSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Click outside to close filter menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLike = (courseId, e) => {
    if (e) e.stopPropagation();
    setLikedCourses((prev) => {
      const next = { ...prev, [courseId]: !prev[courseId] };
      try {
        localStorage.setItem('learnopia_liked_courses', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCopyCourseLink = (course, e) => {
    if (e) e.stopPropagation();
    const ytLink = `https://www.youtube.com/playlist?list=${(course.playlistId || course.id).replace('pl-', '')}`;
    navigator.clipboard.writeText(ytLink);
    setCopiedPlId(course.id);
    setEnrollNotice(`Copied direct link for "${course.title}"!`);
    setTimeout(() => {
      setCopiedPlId(null);
      setEnrollNotice(null);
    }, 2500);
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const query = (localSearch || '').trim().toLowerCase();

  // Unified Subject Courses (Base likes are strictly 0!)
  const allSubjectCourses = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Ingest all semester subjects from DatabaseContext as first-class courses
    (subjects || []).forEach((sub) => {
      const parentCourse = (courses || []).find((c) => c.id === sub.courseId);
      const primaryPl = (sub.playlists && sub.playlists[0]) || null;
      const firstVid = primaryPl?.videos && primaryPl.videos[0];
      const videoId = (firstVid?.youtubeId && !firstVid.youtubeId.startsWith('PL'))
        ? firstVid.youtubeId
        : (firstVid?.url ? (firstVid.url.match(/[?&]v=([^#&]+)/) || [])[1] : null);

      const thumb =
        primaryPl?.bannerUrl ||
        sub?.bannerUrl ||
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null) ||
        getCuratedCourseThumbnail(sub.title, parentCourse?.department);

      const totalVideos = (sub.playlists || []).reduce((acc, pl) => acc + (pl.videos?.length || 0), 0);

      const isEnrolled =
        (currentUser?.enrolledPlaylists || []).includes(primaryPl?.id) ||
        (currentUser?.enrolledCourses || []).includes(sub.courseId);

      const targetPlaylistId = primaryPl?.id || sub.id;

      // Base likes are strictly 0!
      const baseLikes = 0;

      list.push({
        id: targetPlaylistId,
        subjectId: sub.id,
        playlistId: targetPlaylistId,
        title: cleanCourseTitle(sub.title),
        description:
          primaryPl?.description ||
          `Comprehensive university lecture series and curriculum syllabus for ${sub.title}.`,
        category: sub.semester ? `Semester ${sub.semester}` : (parentCourse?.department || 'Core Engineering'),
        department: parentCourse?.department || (sub.title.toLowerCase().includes('physics') || sub.title.toLowerCase().includes('math') ? 'Physics & Math' : 'Engineering Core'),
        author: primaryPl?.author || parentCourse?.creatorName || 'Faculty Instructor',
        lectureCount: totalVideos || (primaryPl?.videos?.length || 16),
        thumbnailUrl: thumb,
        isEnrolled,
        semester: sub.semester,
        baseLikes,
        keywords: [
          'makaut', 'wbut', 'btech', 'b.tech', 'engineering',
          sub.title.toLowerCase(),
          sub.semester ? `semester ${sub.semester}` : 'core',
          sub.semester ? `sem ${sub.semester}` : 'core',
          parentCourse?.title?.toLowerCase() || '',
          parentCourse?.department?.toLowerCase() || '',
          ...(Array.isArray(sub.keywords) ? sub.keywords : (sub.keywords ? String(sub.keywords).split(',').map(s => s.trim().toLowerCase()) : []))
        ].filter(Boolean)
      });

      if (primaryPl?.id) seen.add(primaryPl.id);
      seen.add(sub.id);
    });

    // 2. Ingest standalone professional courses
    (courses || []).forEach((c) => {
      if (!c.isDegree && !seen.has(c.id)) {
        const isEnrolled = (currentUser?.enrolledCourses || []).includes(c.id);
        const baseLikes = 0; // Strictly 0!

        list.push({
          id: c.id,
          subjectId: c.id,
          playlistId: c.youtubePlaylistId || c.id,
          title: cleanCourseTitle(c.title),
          description: c.description || 'Comprehensive university subject course.',
          category: c.department || 'Computer Science',
          department: c.department || 'Computer Science',
          author: c.author || c.creatorName || 'Instructor',
          lectureCount: 24,
          thumbnailUrl:
            c.bannerUrl ||
            getCuratedCourseThumbnail(c.title, c.department),
          isEnrolled,
          semester: null,
          baseLikes,
          keywords: [
            'makaut', 'course', 'certification', 'programming',
            c.title.toLowerCase(),
            (c.department || '').toLowerCase(),
            (c.creatorName || '').toLowerCase(),
            ...(Array.isArray(c.keywords) ? c.keywords : (c.keywords ? String(c.keywords).split(',').map(s => s.trim().toLowerCase()) : []))
          ].filter(Boolean)
        });
      }
    });

    return list;
  }, [subjects, courses, currentUser]);

  // Map courses to folder presence
  const isCourseInFolders = useMemo(() => {
    const map = {};
    const scan = (node) => {
      (node.items || []).forEach((item) => {
        if (item.playlistId) map[item.playlistId] = true;
        if (item.id) map[item.id] = true;
      });
      (node.subfolders || []).forEach(scan);
    };
    (userFolders || []).forEach(scan);
    return map;
  }, [userFolders]);

  // List of enrolled courses for the horizontal top slider
  const enrolledCoursesList = useMemo(() => {
    return allSubjectCourses.filter((c) => c.isEnrolled);
  }, [allSubjectCourses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    const list = allSubjectCourses.filter((course) => {
      // Query filter
      if (query) {
        const matchTitle = course.title.toLowerCase().includes(query);
        const matchAuthor = course.author.toLowerCase().includes(query);
        const matchDesc = course.description.toLowerCase().includes(query);
        const matchCategory = course.category.toLowerCase().includes(query);
        const matchDept = (course.department || '').toLowerCase().includes(query);
        const matchKeywords = (course.keywords || []).some(k => k.includes(query));
        if (!matchTitle && !matchAuthor && !matchDesc && !matchCategory && !matchDept && !matchKeywords) return false;
      }

      // Category filter
      if (selectedCategory === 'enrolled') {
        return course.isEnrolled;
      }
      if (selectedCategory === 'cs') {
        return (
          course.department.toLowerCase().includes('computer') ||
          course.category.toLowerCase().includes('computer') ||
          course.title.toLowerCase().includes('data') ||
          course.title.toLowerCase().includes('algorithm') ||
          course.title.toLowerCase().includes('programming')
        );
      }
      if (selectedCategory === 'math-physics') {
        return (
          course.department.toLowerCase().includes('physics') ||
          course.department.toLowerCase().includes('math') ||
          course.title.toLowerCase().includes('physics') ||
          course.title.toLowerCase().includes('mathematics')
        );
      }
      if (selectedCategory === 'core') {
        return course.department.toLowerCase().includes('engineering') || course.category.toLowerCase().includes('semester');
      }

      return true;
    });

    return list.sort((a, b) => {
      const aLikes = (likedCourses[a.id] ? 1 : 0);
      const bLikes = (likedCourses[b.id] ? 1 : 0);
      return bLikes - aLikes;
    });
  }, [allSubjectCourses, query, selectedCategory, likedCourses]);

  const handleOpenCourse = (course) => {
    if (setSelectedPlaylistId) setSelectedPlaylistId(course.playlistId);
    if (setSelectedVideoIndex) setSelectedVideoIndex(0);
    setCurrentView('learning-player');
  };

  const handleDeleteItem = (course, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirmItem(course);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      if (deleteCourseCatalogItem) {
        await deleteCourseCatalogItem({
          courseId: deleteConfirmItem.id,
          subjectId: deleteConfirmItem.subjectId,
          playlistId: deleteConfirmItem.playlistId
        });
      } else {
        if (deleteSubject && deleteConfirmItem.subjectId) {
          await deleteSubject(deleteConfirmItem.subjectId);
        }
        if (deleteCourse && deleteConfirmItem.id) {
          await deleteCourse(deleteConfirmItem.id);
        }
      }
      setEnrollNotice(`Removed "${deleteConfirmItem.title}" from catalog.`);
      setTimeout(() => setEnrollNotice(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmItem(null);
    }
  };

  // Open "Add to Folder" modal
  const handleOpenAddToFolder = (course, e) => {
    if (e) e.stopPropagation();
    setUserFolders(getWorkspaceFolders(userId));
    setCourseToAddToFolder(course);
    setTargetFolderId('academic');
    setTargetSubfolderId(getPinnedSemester(userId));
  };

  // Confirm adding course to folder
  const handleSaveToFolder = (e) => {
    e.preventDefault();
    if (!courseToAddToFolder) return;

    const currentFolders = getWorkspaceFolders(userId);
    const ytPlaylistUrl = `https://www.youtube.com/playlist?list=${(courseToAddToFolder.playlistId || courseToAddToFolder.id).replace('pl-', '')}`;

    const newItem = {
      id: `item-${Date.now()}`,
      title: courseToAddToFolder.title,
      url: ytPlaylistUrl,
      playlistId: courseToAddToFolder.playlistId,
      type: 'playlist',
      author: courseToAddToFolder.author || 'University Faculty',
      count: `${courseToAddToFolder.lectureCount} Lectures`,
      date: 'Added from Catalog'
    };

    // For Academic, items must always reside in a semester
    const effectiveSubfolderId = (targetFolderId === 'academic' && !targetSubfolderId)
      ? getPinnedSemester(userId)
      : targetSubfolderId;

    // Update folder tree
    const updated = currentFolders.map((root) => {
      if (root.id !== targetFolderId) return root;

      if (effectiveSubfolderId && root.subfolders?.length > 0) {
        let matched = false;
        const newSubfolders = root.subfolders.map((sf) => {
          if (sf.id === effectiveSubfolderId) {
            matched = true;
            return {
              ...sf,
              items: [newItem, ...(sf.items || [])]
            };
          }
          return sf;
        });
        if (matched) {
          return {
            ...root,
            subfolders: newSubfolders
          };
        }
      }

      // Default: Direct to root items
      return {
        ...root,
        items: [newItem, ...(root.items || [])]
      };
    });

    saveWorkspaceFolders(userId, updated);
    if (saveUserFoldersToDb && userId && userId !== 'guest') {
      saveUserFoldersToDb(userId, updated);
    }
    setUserFolders(updated);

    // Auto-enroll user in course
    if (courseToAddToFolder.playlistId && enrollInPlaylist) {
      enrollInPlaylist(courseToAddToFolder.playlistId);
    } else if (courseToAddToFolder.id && enrollInCourse) {
      enrollInCourse(courseToAddToFolder.id);
    }

    const activeFolderObj = updated.find(f => f.id === targetFolderId);
    const activeSubfolderObj = targetSubfolderId ? activeFolderObj?.subfolders?.find(sf => sf.id === targetSubfolderId) : null;
    const folderName = activeSubfolderObj
      ? `${activeFolderObj?.title || 'Academic'} / ${activeSubfolderObj.title}`
      : (activeFolderObj?.title || 'Academic');

    setEnrollNotice(`Saved "${courseToAddToFolder.title}" to ${folderName}!`);
    setTimeout(() => setEnrollNotice(null), 3000);
    setCourseToAddToFolder(null);
  };

  const CATEGORIES = [
    { id: 'all', label: `All Courses (${allSubjectCourses.length})` },
    { id: 'enrolled', label: `Enrolled (${enrolledCoursesList.length})` },
    { id: 'cs', label: 'Computer Science' },
    { id: 'math-physics', label: 'Physics & Math' },
    { id: 'core', label: 'Engineering Core' }
  ];

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 space-y-6 animate-fade-in">
      {/* Toast Notice */}
      {enrollNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shadow-modal animate-bounce-short">
          {enrollNotice}
        </div>
      )}

      {/* =================================================================
          1. TOP ENROLLED COURSES SLIDER (Spacious & Generous Length)
      ================================================================= */}
      {enrolledCoursesList.length > 0 && (
        <section className="space-y-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-forest animate-pulse" />
              <h2 className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-text-primary">
                My Enrolled Subjects ({enrolledCoursesList.length})
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollSlider('left')}
                className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer shadow-xs"
                title="Scroll Left"
                aria-label="Scroll left"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => scrollSlider('right')}
                className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer shadow-xs"
                title="Scroll Right"
                aria-label="Scroll right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Generous Length Horizontal Slider */}
          <div
            ref={sliderRef}
            className="flex items-center gap-4 overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {enrolledCoursesList.map((course) => (
              <div
                key={`slider-${course.id}`}
                onClick={() => handleOpenCourse(course)}
                className="w-[320px] sm:w-[420px] md:w-[460px] shrink-0 p-3.5 sm:p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover hover:border-border-strong transition-all cursor-pointer flex items-center gap-4 group shadow-xs"
              >
                <div className="relative w-32 sm:w-40 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-border-subtle">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 flex items-center justify-center text-white shadow-md">
                      <Play size={11} fill="#FFFFFF" className="ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-mono-tabular bg-black/85 text-white">
                    {course.lectureCount} Lectures
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono-tabular font-bold text-accent-forest uppercase tracking-wider block truncate">
                    {course.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate mt-0.5 group-hover:text-accent-forest transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-[11px] text-text-muted font-mono-tabular truncate mt-0.5">
                    {course.author}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-forest group-hover:translate-x-0.5 transition-transform">
                    <span>Resume Lecture</span>
                    <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =================================================================
          2. SEARCH BAR: MOBILE BELOW ENROLLED SUBJECTS, NAVBAR ON DESKTOP
      ================================================================= */}
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-4">
        {/* Mobile-Only Search Box (Desktop has search in top navigation bar) */}
        <div className="relative flex-1 max-w-lg md:hidden">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search courses & university subjects..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (setGlobalSearchQuery) setGlobalSearchQuery(e.target.value);
            }}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border-subtle bg-surface text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-border-strong font-mono-tabular"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                if (setGlobalSearchQuery) setGlobalSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Desktop View: Catalog status and active search pill (Search input is in navbar) */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono-tabular text-text-muted">
          <span className="font-bold text-text-secondary tracking-wider uppercase text-[11px]">
            Academic Catalog
          </span>
          <span>•</span>
          <span>{filteredCourses.length} Courses Available</span>
          {query && (
            <>
              <span>•</span>
              <span className="text-accent-forest font-semibold">
                Searching for "{query}"
              </span>
              <button
                onClick={() => {
                  setLocalSearch('');
                  if (setGlobalSearchQuery) setGlobalSearchQuery('');
                }}
                className="hover:text-text-primary underline cursor-pointer ml-1"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Clean Filter Button with Dropdown Popover */}
        <div className="relative" ref={filterMenuRef}>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              selectedCategory !== 'all'
                ? 'bg-accent-ink text-text-on-dark border-transparent'
                : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
            {selectedCategory !== 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-forest ml-0.5" />
            )}
          </button>

          {/* Filter Popover Dropdown */}
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border-strong bg-surface p-2 shadow-modal z-30 space-y-1 animate-fade-in">
              <div className="px-2.5 py-1 text-[10px] font-mono-tabular font-bold uppercase tracking-wider text-text-muted">
                Filter by Category
              </div>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-subtle text-text-primary font-bold'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <span>{cat.label}</span>
                  {selectedCategory === cat.id && <Check size={12} className="text-accent-forest" />}
                </button>
              ))}
              {selectedCategory !== 'all' && (
                <div className="pt-1 border-t border-border-subtle">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setShowFilterMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1 rounded text-[11px] text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Reset to All Courses
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Status Line */}
      <div className="flex items-center justify-between text-xs text-text-muted font-mono-tabular">
        <span>
          {query
            ? `SEARCH RESULTS FOR "${query.toUpperCase()}" (${filteredCourses.length})`
            : `SHOWING ${filteredCourses.length} COURSES & SUBJECTS`}
        </span>
        <span className="hidden sm:inline">100% FREE ACADEMIC WORKSPACE</span>
      </div>

      {/* =================================================================
          3. RESPONSIVE GRID OF SUBJECT COURSES
          - No buttons overflow or spill out
          - Likes start strictly at 0
          - Folder assignment button replaces repetitive "Enrolled" text
          - YouTube button removed in favor of direct copy link
      ================================================================= */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredCourses.map((course) => {
            const isLiked = !!likedCourses[course.id];
            const likeCount = isLiked ? 1 : 0; // Strictly 0 baseline!
            const isInFolder = !!isCourseInFolders[course.playlistId] || !!isCourseInFolders[course.id];

            return (
              <div
                key={course.id}
                onClick={() => handleOpenCourse(course)}
                className="rounded-xl p-3.5 sm:p-4 border border-border-subtle bg-surface cursor-pointer transition-all hover:border-border-strong hover:shadow-md flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* Compact 16:9 Thumbnail Frame */}
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border-subtle mb-2.5 bg-black">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-black/85 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 shadow-md">
                        <Play size={15} fill="#FFFFFF" className="ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-black/85 text-white">
                      {course.category}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-medium bg-black/85 text-white">
                      {course.lectureCount} Lectures
                    </span>
                  </div>

                  {/* Course Title & Author */}
                  <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent-forest transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5 font-mono-tabular truncate">
                    {course.author}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-1 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Bottom Card Footer: Like, Copy Link, Folder, Watch (Guaranteed Fit) */}
                <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between gap-1.5">
                  {/* Left: Like & Copy Link */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => toggleLike(course.id, e)}
                      className={`px-2 py-1 rounded-lg border transition-all flex items-center gap-1 text-xs cursor-pointer ${
                        isLiked
                          ? 'border-red-500/30 bg-red-500/10 text-red-500'
                          : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-muted hover:text-red-500'
                      }`}
                      title={isLiked ? 'Liked! Click to unlike' : 'Like this course'}
                    >
                      <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} />
                      <span className="text-[10px] font-mono-tabular font-semibold">{likeCount}</span>
                    </button>

                    <button
                      onClick={(e) => handleCopyCourseLink(course, e)}
                      className="p-1 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors flex items-center cursor-pointer shadow-xs"
                      title="Copy direct YouTube playlist link"
                    >
                      {copiedPlId === course.id ? (
                        <Check size={12} className="text-accent-forest" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>

                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeleteItem(course, e)}
                        className="p-1 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center cursor-pointer shadow-xs"
                        title="Delete course from public catalog (Admin only)"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  {/* Right: Save to Folder & Watch */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleOpenAddToFolder(course, e)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                        isInFolder
                          ? 'border-accent-forest/30 bg-accent-forest/10 text-accent-forest font-bold'
                          : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-primary'
                      }`}
                      title={isInFolder ? 'Saved in Folder' : 'Add to Workspace Folder'}
                    >
                      {isInFolder ? <Check size={12} className="text-accent-forest" /> : <FolderPlus size={12} />}
                    </button>

                    <button
                      onClick={() => handleOpenCourse(course)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1 hover:opacity-95 cursor-pointer shadow-xs"
                    >
                      <Play size={10} fill="currentColor" />
                      <span>Watch</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 p-8 rounded-xl border border-border-subtle bg-surface space-y-3">
          <BookOpen size={36} className="text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No matching courses found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search query or reset the filter to browse all university offerings.
          </p>
          <button
            onClick={() => {
              setLocalSearch('');
              if (setGlobalSearchQuery) setGlobalSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* =================================================================
          ADD COURSE TO STUDY FOLDER MODAL (Centered, Full Dimming)
      ================================================================= */}
      {courseToAddToFolder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-8 sm:pt-12 p-4 overflow-y-auto animate-fade-in"
          onClick={() => setCourseToAddToFolder(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 space-y-4 shadow-modal mb-8 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-text-primary" />
                <h3 className="text-base font-bold text-text-primary">Add to Study Folder</h3>
              </div>
              <button
                onClick={() => setCourseToAddToFolder(null)}
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl border border-border-subtle bg-subtle space-y-1">
              <span className="text-[10px] font-mono-tabular font-bold text-accent-forest uppercase">
                {courseToAddToFolder.category}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-1">
                {courseToAddToFolder.title}
              </h4>
              <p className="text-[11px] text-text-muted font-mono-tabular truncate">
                {courseToAddToFolder.author} • {courseToAddToFolder.lectureCount} Lectures
              </p>
            </div>

            <form onSubmit={handleSaveToFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Workspace
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'academic', title: 'Academic', icon: <GraduationCap size={15} /> },
                    { id: 'document', title: 'Docs', icon: <FileText size={15} /> },
                    { id: 'links', title: 'Links', icon: <Link2 size={15} /> },
                    { id: 'personal', title: 'Personal', icon: <Lock size={15} /> }
                  ].map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => handleSelectFolder(f.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        targetFolderId === f.id
                          ? 'border-border-strong bg-accent-ink text-text-on-dark shadow-xs'
                          : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-primary'
                      }`}
                    >
                      {f.icon}
                      <span>{f.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Subfolder Picker */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {targetFolderId === 'academic' ? 'Select Semester' : 'Subfolder'}
                </label>
                {(() => {
                  const activeRoot = userFolders.find(f => f.id === targetFolderId);
                  const availableSubfolders = activeRoot?.subfolders || [];
                  const pinnedSem = getPinnedSemester(userId);

                  if (targetFolderId === 'academic') {
                    return (
                      <select
                        value={targetSubfolderId || pinnedSem}
                        onChange={(e) => setTargetSubfolderId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      >
                        {availableSubfolders.map((sf) => (
                          <option key={sf.id} value={sf.id}>
                            {sf.title} {sf.id === pinnedSem ? '⭐ (Current Semester)' : ''}
                          </option>
                        ))}
                      </select>
                    );
                  }

                  if (availableSubfolders.length > 0) {
                    return (
                      <select
                        value={targetSubfolderId}
                        onChange={(e) => setTargetSubfolderId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      >
                        <option value="">-- Direct to {activeRoot?.title || 'Root'} (Root) --</option>
                        {availableSubfolders.map((sf) => (
                          <option key={sf.id} value={sf.id}>
                            {sf.title}
                          </option>
                        ))}
                      </select>
                    );
                  }

                  return (
                    <div className="text-[11px] text-text-muted bg-surface-sunken p-2.5 rounded-lg border border-border-subtle flex items-center justify-between">
                      <span>Directly saves inside <strong>{targetFolderId === 'links' ? 'Links' : (activeRoot?.title || 'Root')}</strong></span>
                      <span className="text-[10px] text-text-tertiary font-mono-tabular">No subfolders</span>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setCourseToAddToFolder(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <FolderPlus size={13} />
                  <span>Save to Folder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =================================================================
          ADMIN CONFIRM DELETE MODAL
      ================================================================= */}
      {deleteConfirmItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-8 sm:pt-12 p-4 overflow-y-auto animate-fade-in"
          onClick={() => setDeleteConfirmItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-red-500/30 bg-surface p-6 space-y-4 shadow-modal mb-8 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-2 border-b border-border-subtle">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Delete Course from Catalog</h3>
                <p className="text-[11px] text-text-muted font-mono-tabular">ADMIN MODERATION ACTION</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently remove <strong>"{deleteConfirmItem.title}"</strong> from the public catalog?
              This action will remove the course from the university index and delete its attached playlist records.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoursesDashboard(props) {
  return (
    <CoursesDashboardErrorBoundary>
      <CoursesDashboardInner {...props} />
    </CoursesDashboardErrorBoundary>
  );
}
