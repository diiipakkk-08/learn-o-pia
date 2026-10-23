import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search,
  BookOpen,
  Play,
  Check,
  Copy,
  Layers,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Filter,
  CheckCircle2,
  X
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

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setLocalSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const handleCopyPlId = (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedPlId(id);
    setTimeout(() => setCopiedPlId(null), 2000);
  };

  const query = (localSearch || '').trim().toLowerCase();

  // Unified Subject Courses: Drop nested curricula wrapper, expose each course/subject directly
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
        semester: sub.semester
      });

      if (primaryPl?.id) seen.add(primaryPl.id);
      seen.add(sub.id);
    });

    // 2. Ingest standalone professional courses
    (courses || []).forEach((c) => {
      if (!c.isDegree && !seen.has(c.id)) {
        const isEnrolled = (currentUser?.enrolledCourses || []).includes(c.id);
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
          semester: null
        });
      }
    });

    return list;
  }, [subjects, courses, currentUser]);

  // Filter by query and category
  const filteredCourses = useMemo(() => {
    return allSubjectCourses.filter((course) => {
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
        return course.department.toLowerCase().includes('computer') || course.department.toLowerCase().includes('cse');
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
  }, [allSubjectCourses, query, selectedCategory]);

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
    { id: 'enrolled', label: 'My Enrolled' },
    { id: 'cs', label: 'Computer Science' },
    { id: 'math-physics', label: 'Physics & Math' },
    { id: 'core', label: 'Engineering Core' }
  ];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-12 space-y-6">
      {/* Toast Notice */}
      {enrollNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shadow-modal animate-bounce-short">
          {enrollNotice}
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight font-editorial">
            Academic Courses & Subjects
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Independent university subjects and lecture series. Click any subject to begin learning immediately.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-ink text-text-on-dark border-accent-ink'
                    : 'bg-surface text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search / Result Status */}
      <div className="flex items-center justify-between text-xs text-text-muted font-mono-tabular">
        <span>
          {query ? `SEARCH RESULTS FOR "${query.toUpperCase()}" (${filteredCourses.length})` : `SHOWING ${filteredCourses.length} COURSES & SUBJECTS`}
        </span>
        <span className="hidden sm:inline">100% FREE • ZERO DISTRACTIONS</span>
      </div>

      {/* Responsive Grid of Standalone Subject Courses (Expanded Width) */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleOpenCourse(course)}
              className="rounded-xl p-4 border border-border-subtle bg-surface cursor-pointer transition-all hover:border-border-strong hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* 16:9 Thumbnail Frame */}
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border-subtle mb-3.5 bg-[#141413]">
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
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-[#141413]/85 text-[#F7F5F0]">
                    {course.category}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-medium bg-[#141413]/85 text-[#F7F5F0]">
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

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                <button
                  onClick={(e) => handleCopyPlId(course.playlistId, e)}
                  className="text-[11px] font-mono-tabular text-text-muted hover:text-text-primary flex items-center gap-1"
                  title="Copy Course ID"
                >
                  {copiedPlId === course.playlistId ? (
                    <>
                      <Check size={12} className="text-accent-forest" />
                      <span className="text-accent-forest">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>ID: {course.id.slice(0, 8)}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleQuickEnroll(course, e)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      course.isEnrolled
                        ? 'pill-safe border'
                        : 'border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary'
                    }`}
                  >
                    {course.isEnrolled ? 'Enrolled' : 'Enroll'}
                  </button>
                  <button
                    onClick={() => handleOpenCourse(course)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1 hover:opacity-95 cursor-pointer"
                  >
                    <Play size={11} fill="currentColor" />
                    <span>Watch</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
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
