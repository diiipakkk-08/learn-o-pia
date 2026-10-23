import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search,
  BookOpen,
  CheckCircle2,
  FileText,
  Download,
  Sparkles,
  Copy,
  Check,
  Heart,
  Filter,
  UserCheck,
  Play,
  Plus,
  X,
  Layers,
  Video,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

const ITEMS_PER_PAGE = 9;

export default function CoursesDashboard({ setSelectedPlaylistId, setSelectedVideoIndex, setCurrentView }) {
  const {
    courses,
    subjects,
    currentUser,
    enrollInCourse,
    enrollInPlaylist,
    removeUserPlaylistEnrollment,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useDatabase();

  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [viewTab, setViewTab] = useState('all'); // 'all' | 'degrees' | 'courses' | 'playlists'
  const [coursePage, setCoursePage] = useState(1);
  const [playlistPage, setPlaylistPage] = useState(1);
  const [copiedPlId, setCopiedPlId] = useState(null);
  const [enrollNotice, setEnrollNotice] = useState(null);

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setLocalSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  useEffect(() => {
    setCoursePage(1);
    setPlaylistPage(1);
  }, [localSearch, viewTab]);

  const handleCopyPlId = (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedPlId(id);
    setTimeout(() => setCopiedPlId(null), 2000);
  };

  const query = (localSearch || '').trim().toLowerCase();

  // 1. Degree Programs
  const processedDegrees = useMemo(() => {
    return (courses || []).filter(c => c.isDegree && (
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      (c.department && c.department.toLowerCase().includes(query)) ||
      (c.description && c.description.toLowerCase().includes(query))
    ));
  }, [courses, query]);

  // 2. Standard Courses
  const processedCourses = useMemo(() => {
    return (courses || []).filter(c => !c.isDegree && (
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      (c.department && c.department.toLowerCase().includes(query)) ||
      (c.description && c.description.toLowerCase().includes(query))
    ));
  }, [courses, query]);

  // 3. Playlists from subjects
  const processedPlaylists = useMemo(() => {
    const list = [];
    const seen = new Set();
    (subjects || []).forEach((sub) => {
      (sub.playlists || []).forEach((pl) => {
        if (!pl.id || seen.has(pl.id)) return;
        seen.add(pl.id);
        const firstVid = pl.videos && pl.videos[0];
        const yId =
          pl.youtubePlaylistId ||
          firstVid?.youtubeId ||
          (firstVid?.url ? (firstVid.url.match(/[?&]v=([^#&]+)/) || [])[1] : '');
        const thumb = pl.bannerUrl || (yId ? `https://i.ytimg.com/vi/${yId}/hqdefault.jpg` : null);

        list.push({
          id: pl.id,
          title: pl.title,
          description: pl.description || 'Curated university lecture series',
          subjectTitle: sub.title,
          courseId: sub.courseId,
          author: pl.author || 'Instructor',
          videoCount: pl.videos?.length || 0,
          thumbnailUrl: thumb,
          likesCount: pl.likes?.length || 0
        });
      });
    });

    return list.filter((pl) => {
      if (!query) return true;
      return (
        pl.title.toLowerCase().includes(query) ||
        pl.id.toLowerCase().includes(query) ||
        pl.subjectTitle.toLowerCase().includes(query) ||
        pl.author.toLowerCase().includes(query)
      );
    });
  }, [subjects, query]);

  const handleOpenPlaylist = (playlistId) => {
    if (setSelectedPlaylistId) setSelectedPlaylistId(playlistId);
    if (setSelectedVideoIndex) setSelectedVideoIndex(0);
    setCurrentView('learning-player');
  };

  const handleEnrollCourse = (course, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      setCurrentView('auth');
      return;
    }
    const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
    if (!isEnrolled) {
      if (enrollInCourse) enrollInCourse(course.id);
      setEnrollNotice(`Enrolled in "${course.title}"! Added to your dashboard.`);
      setTimeout(() => setEnrollNotice(null), 3000);
    } else {
      if (setSelectedPlaylistId) setSelectedPlaylistId(course.id);
      setCurrentView('learning-player');
    }
  };

  const TABS = [
    { id: 'all', label: 'All Catalog' },
    { id: 'degrees', label: `Degrees (${processedDegrees.length})` },
    { id: 'courses', label: `Courses (${processedCourses.length})` },
    { id: 'playlists', label: `Playlists (${processedPlaylists.length})` }
  ];

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 space-y-6">
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
            Academic Course Catalog
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Structured degree curricula, semester subjects, and curated YouTube lecture series.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {TABS.map((tab) => {
            const isSelected = viewTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewTab(tab.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all"
                style={{
                  backgroundColor: isSelected ? '#141413' : '#FFFFFF',
                  color: isSelected ? '#F7F5F0' : '#575550',
                  borderColor: isSelected ? '#141413' : '#E4E0D8'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter / Search Status */}
      <div className="flex items-center justify-between text-xs text-text-muted font-mono-tabular">
        <span>
          {query ? `SEARCH RESULTS FOR "${query}"` : 'ACADEMIC TRACKS & MODULES'}
        </span>
        <span>100% FREE & CURATED</span>
      </div>

      {/* 1. DEGREE PROGRAMS SECTION */}
      {(viewTab === 'all' || viewTab === 'degrees') && processedDegrees.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-accent-forest" />
            <h2 className="text-base font-bold text-text-primary">Degree Curricula</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedDegrees.map((degree) => {
              const isEnrolled = currentUser?.enrolledCourses?.includes(degree.id);
              return (
                <div
                  key={degree.id}
                  onClick={() => handleOpenPlaylist(degree.id)}
                  className="rounded-xl p-4 border border-border-subtle bg-surface cursor-pointer transition-all hover:border-border-strong flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border-subtle mb-3.5 bg-[#141413]">
                      <img
                        src={degree.bannerUrl || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=900&q=80'}
                        alt={degree.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 opacity-90"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-[#141413]/85 text-[#F7F5F0]">
                        DEGREE CURRICULUM
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-text-primary truncate">
                      {degree.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {degree.description || 'Comprehensive multi-semester degree syllabus and lecture modules.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-xs font-mono-tabular text-text-muted">
                      {degree.department || 'B.Tech / University'}
                    </span>
                    <button
                      onClick={(e) => handleEnrollCourse(degree, e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isEnrolled
                          ? 'bg-[#E6F0E9] text-accent-forest border border-[#C2DEC9]'
                          : 'bg-accent-ink text-text-on-dark hover:opacity-95'
                      }`}
                    >
                      {isEnrolled ? 'Enrolled Track' : 'Enroll Free'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. STANDARD COURSES SECTION */}
      {(viewTab === 'all' || viewTab === 'courses') && processedCourses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-text-primary" />
            <h2 className="text-base font-bold text-text-primary">Standard Courses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedCourses.map((course) => {
              const isEnrolled = currentUser?.enrolledCourses?.includes(course.id);
              return (
                <div
                  key={course.id}
                  onClick={() => handleOpenPlaylist(course.id)}
                  className="rounded-xl p-4 border border-border-subtle bg-surface cursor-pointer transition-all hover:border-border-strong flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border-subtle mb-3.5 bg-[#141413]">
                      <img
                        src={course.bannerUrl || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 opacity-90"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-[#141413]/85 text-[#F7F5F0]">
                        COURSE TRACK
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-text-primary truncate">
                      {course.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {course.description || 'Curated academic lectures and study resources.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-xs font-mono-tabular text-text-muted">
                      {course.department || 'Subject'}
                    </span>
                    <button
                      onClick={(e) => handleEnrollCourse(course, e)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isEnrolled
                          ? 'bg-[#E6F0E9] text-accent-forest border border-[#C2DEC9]'
                          : 'bg-accent-ink text-text-on-dark hover:opacity-95'
                      }`}
                    >
                      {isEnrolled ? 'Enrolled' : 'Enroll Free'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. LECTURE PLAYLISTS SECTION */}
      {(viewTab === 'all' || viewTab === 'playlists') && processedPlaylists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Video size={18} className="text-text-primary" />
            <h2 className="text-base font-bold text-text-primary">Curated Video Playlists</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => handleOpenPlaylist(pl.id)}
                className="rounded-xl p-4 border border-border-subtle bg-surface cursor-pointer transition-all hover:border-border-strong flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border-subtle mb-3.5 bg-[#141413]">
                    {pl.thumbnailUrl ? (
                      <img
                        src={pl.thumbnailUrl}
                        alt={pl.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 opacity-90"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#EFECE6]">
                        <Video size={32} className="text-text-muted" />
                      </div>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-mono-tabular font-medium bg-[#141413]/85 text-[#F7F5F0]">
                      {pl.videoCount} lectures
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary truncate">
                    {pl.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 truncate">
                    {pl.subjectTitle} • {pl.author}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                  <button
                    onClick={(e) => handleCopyPlId(pl.id, e)}
                    className="text-[11px] font-mono-tabular text-text-muted hover:text-text-primary flex items-center gap-1"
                    title="Copy Playlist Share Code"
                  >
                    {copiedPlId === pl.id ? (
                      <>
                        <Check size={12} className="text-accent-forest" />
                        <span className="text-accent-forest">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>ID: {pl.id.slice(0, 8)}...</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenPlaylist(pl.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1 hover:opacity-95"
                  >
                    <Play size={12} fill="#F7F5F0" />
                    <span>Watch Series</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {processedDegrees.length === 0 && processedCourses.length === 0 && processedPlaylists.length === 0 && (
        <div className="text-center py-16 p-8 rounded-xl border border-border-subtle bg-surface space-y-3">
          <BookOpen size={36} className="text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No academic tracks found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search query or reset the filter pills to browse all university offerings.
          </p>
          <button
            onClick={() => {
              setLocalSearch('');
              if (setGlobalSearchQuery) setGlobalSearchQuery('');
              setViewTab('all');
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
