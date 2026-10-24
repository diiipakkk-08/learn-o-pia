import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search,
  BookOpen,
  Play,
  Check,
  Copy,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Heart,
  X,
  ArrowRight
} from 'lucide-react';

export default function CoursesDashboard({
  setSelectedPlaylistId,
  setSelectedVideoIndex,
  setCurrentView,
  isSidebarCollapsed = false
}) {
  const {
    courses,
    subjects,
    currentUser,
    enrollInCourse,
    enrollInPlaylist,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useDatabase();

  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedPlId, setCopiedPlId] = useState(null);
  const [enrollNotice, setEnrollNotice] = useState(null);
  const sliderRef = useRef(null);

  // Persistent user course likes
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
    setEnrollNotice(`Copied direct YouTube link for "${course.title}"!`);
    setTimeout(() => {
      setCopiedPlId(null);
      setEnrollNotice(null);
    }, 2500);
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const query = (localSearch || '').trim().toLowerCase();

  // Unified Subject Courses with dynamic like scores
  const allSubjectCourses = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Ingest all semester subjects from DatabaseContext as first-class courses
    (subjects || []).forEach((sub) => {
      const primaryPl = (sub.playlists && sub.playlists[0]) || null;
      const firstVid = primaryPl?.videos && primaryPl.videos[0];
      const yId =
        primaryPl?.youtubePlaylistId ||
        firstVid?.youtubeId ||
        (firstVid?.url ? (firstVid.url.match(/[?&]v=([^#&]+)/) || [])[1] : '');
      const thumb =
        primaryPl?.bannerUrl ||
        (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : null) ||
        'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80';

      const totalVideos = (sub.playlists || []).reduce((acc, pl) => acc + (pl.videos?.length || 0), 0);
      const parentCourse = (courses || []).find((c) => c.id === sub.courseId);

      const isEnrolled =
        (currentUser?.enrolledPlaylists || []).includes(primaryPl?.id) ||
        (currentUser?.enrolledCourses || []).includes(sub.courseId);

      const targetPlaylistId = primaryPl?.id || sub.id;

      // Seed baseline likes based on string hash
      const baseLikes = Math.abs(sub.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 85) + 32;

      list.push({
        id: targetPlaylistId,
        subjectId: sub.id,
        playlistId: targetPlaylistId,
        title: sub.title,
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
        baseLikes
      });

      if (primaryPl?.id) seen.add(primaryPl.id);
      seen.add(sub.id);
    });

    // 2. Ingest standalone professional courses
    (courses || []).forEach((c) => {
      if (!c.isDegree && !seen.has(c.id)) {
        const isEnrolled = (currentUser?.enrolledCourses || []).includes(c.id);
        const baseLikes = Math.abs(c.title.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 90) + 40;

        list.push({
          id: c.id,
          subjectId: c.id,
          playlistId: c.id,
          title: c.title,
          description: c.description || 'Comprehensive university subject course.',
          category: c.department || 'Computer Science',
          department: c.department || 'Computer Science',
          author: c.creatorName || 'Instructor',
          lectureCount: 24,
          thumbnailUrl:
            c.bannerUrl ||
            'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
          isEnrolled,
          semester: null,
          baseLikes
        });
      }
    });

    return list;
  }, [subjects, courses, currentUser]);

  // List of enrolled courses for the horizontal top slider
  const enrolledCoursesList = useMemo(() => {
    return allSubjectCourses.filter((c) => c.isEnrolled);
  }, [allSubjectCourses]);

  // Filter and sort courses (courses with more likes rank higher)
  const filteredCourses = useMemo(() => {
    const list = allSubjectCourses.filter((course) => {
      // Query filter
      if (query) {
        const matchTitle = course.title.toLowerCase().includes(query);
        const matchAuthor = course.author.toLowerCase().includes(query);
        const matchDesc = course.description.toLowerCase().includes(query);
        const matchCategory = course.category.toLowerCase().includes(query);
        if (!matchTitle && !matchAuthor && !matchDesc && !matchCategory) return false;
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

    // Rank courses with higher likes at the top
    return list.sort((a, b) => {
      const aLikes = (a.baseLikes || 0) + (likedCourses[a.id] ? 100 : 0);
      const bLikes = (b.baseLikes || 0) + (likedCourses[b.id] ? 100 : 0);
      return bLikes - aLikes;
    });
  }, [allSubjectCourses, query, selectedCategory, likedCourses]);

  const handleOpenCourse = (course) => {
    if (setSelectedPlaylistId) setSelectedPlaylistId(course.playlistId);
    if (setSelectedVideoIndex) setSelectedVideoIndex(0);
    setCurrentView('learning-player');
  };

  const handleQuickEnroll = (course, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setCurrentView('auth');
      return;
    }
    if (course.playlistId && enrollInPlaylist) {
      enrollInPlaylist(course.playlistId);
      setEnrollNotice(`Added "${course.title}" to your study track!`);
      setTimeout(() => setEnrollNotice(null), 3000);
    } else if (course.id && enrollInCourse) {
      enrollInCourse(course.id);
      setEnrollNotice(`Enrolled in "${course.title}"!`);
      setTimeout(() => setEnrollNotice(null), 3000);
    }
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
          1. TOP ENROLLED COURSES SLIDER (Horizontal Carousel)
      ================================================================= */}
      {enrolledCoursesList.length > 0 && (
        <div className="p-4 rounded-xl border border-border-subtle bg-surface space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-forest animate-pulse" />
              <span className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-text-primary">
                My Enrolled Subjects ({enrolledCoursesList.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollSlider('left')}
                className="p-1.5 rounded-lg border border-border-subtle bg-subtle hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Scroll Left"
                aria-label="Scroll left"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => scrollSlider('right')}
                className="p-1.5 rounded-lg border border-border-subtle bg-subtle hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Scroll Right"
                aria-label="Scroll right"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="flex items-center gap-3 overflow-x-auto pb-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {enrolledCoursesList.map((course) => (
              <div
                key={`slider-${course.id}`}
                onClick={() => handleOpenCourse(course)}
                className="w-64 sm:w-72 shrink-0 p-2.5 rounded-lg border border-border-subtle bg-subtle/50 hover:bg-surface-hover/80 transition-all cursor-pointer flex items-center gap-3 group"
              >
                <div className="relative w-20 aspect-video rounded-md overflow-hidden bg-black shrink-0 border border-border-subtle">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <Play size={11} fill="#FFFFFF" className="text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-accent-forest transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-[10px] text-text-muted font-mono-tabular truncate mt-0.5">
                    {course.category} • {course.lectureCount} Lectures
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-accent-forest">
                    <span>Resume</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================
          2. COMPACT SEARCH BAR & CATEGORY FILTER CONTROLS
      ================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-border-subtle pb-4">
        {/* Integrated Course Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search all subjects, professors, or engineering topics..."
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-accent-ink text-text-on-dark font-bold'
                    : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover font-medium'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Status Line */}
      <div className="flex items-center justify-between text-xs text-text-muted font-mono-tabular">
        <span>
          {query ? `SEARCH RESULTS FOR "${query.toUpperCase()}" (${filteredCourses.length})` : `SHOWING ${filteredCourses.length} COURSES & SUBJECTS • RANKED BY POPULARITY`}
        </span>
        <span className="hidden sm:inline">100% FREE • DIRECT YOUTUBE SYNC</span>
      </div>

      {/* =================================================================
          3. RESPONSIVE GRID OF SUBJECT COURSES
      ================================================================= */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((course) => {
            const isLiked = !!likedCourses[course.id];
            const likeCount = (course.baseLikes || 28) + (isLiked ? 1 : 0);
            const ytPlaylistUrl = `https://www.youtube.com/playlist?list=${(course.playlistId || course.id).replace('pl-', '')}`;

            return (
              <div
                key={course.id}
                onClick={() => handleOpenCourse(course)}
                className="rounded-xl p-4 border border-border-subtle bg-surface cursor-pointer transition-all hover:border-border-strong hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  {/* 16:9 Thumbnail Frame */}
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border-subtle mb-3 bg-[#141413]">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#141413]/80 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
                        <Play size={18} fill="#FFFFFF" className="ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-[#141413]/85 text-[#F7F5F0]">
                      {course.category}
                    </span>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-medium bg-[#141413]/85 text-[#F7F5F0]">
                      {course.lectureCount} Lectures
                    </span>
                  </div>

                  {/* Course Title & Author */}
                  <h3 className="text-base font-bold text-text-primary group-hover:text-accent-forest transition-colors line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5 font-mono-tabular">
                    {course.author}
                  </p>
                  <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Bottom Card Footer with YouTube, Share, Like, and Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-1.5">
                  {/* Left: Like & Copy Link Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Like / Heart Button (ranks course higher) */}
                    <button
                      onClick={(e) => toggleLike(course.id, e)}
                      className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs cursor-pointer ${
                        isLiked
                          ? 'border-red-500/30 bg-red-500/10 text-red-500'
                          : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-muted hover:text-red-500'
                      }`}
                      title={isLiked ? 'Liked! Click to unlike' : 'Like this course (ranks higher)'}
                    >
                      <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                      <span className="text-[11px] font-mono-tabular font-semibold">{likeCount}</span>
                    </button>

                    {/* YouTube Playlist Direct Link */}
                    <a
                      href={ytPlaylistUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-red-600 hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer"
                      title="Open YouTube playlist in new tab"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>

                    {/* Direct Copy Playlist Link Button */}
                    <button
                      onClick={(e) => handleCopyCourseLink(course, e)}
                      className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy YouTube Playlist Link"
                    >
                      {copiedPlId === course.id ? (
                        <Check size={13} className="text-accent-forest" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>

                  {/* Right: Enroll & Watch */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleQuickEnroll(course, e)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        course.isEnrolled
                          ? 'pill-safe border'
                          : 'border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary'
                      }`}
                    >
                      {course.isEnrolled ? 'Enrolled' : 'Enroll'}
                    </button>
                    <button
                      onClick={() => handleOpenCourse(course)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1 hover:opacity-95 cursor-pointer shadow-xs"
                    >
                      <Play size={11} fill="currentColor" />
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
            Try adjusting your search query or reset the filter pills to browse all university offerings.
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
    </div>
  );
}
