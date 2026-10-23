import React, { useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Play,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  BookmarkCheck,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import { calculateAttendanceMetrics } from '../../utils/attendanceMath';

export default function MyLearningView({
  setCurrentView,
  setSelectedPlaylistId,
  setSelectedVideoIndex
}) {
  const {
    currentUser,
    courses,
    subjects,
    enrolledCourses,
    lastPlayed,
    savedResourceIds,
    standaloneResources,
    attendanceLogs,
    routine
  } = useDatabase();

  // Enrolled Courses from DB
  const enrolledCourseList = useMemo(() => {
    if (!currentUser || !currentUser.enrolledCourses) return [];
    return (courses || []).filter(c => currentUser.enrolledCourses.includes(c.id));
  }, [currentUser, courses]);

  // Enrolled Playlists from DB
  const enrolledPlaylistList = useMemo(() => {
    const list = [];
    const seen = new Set();
    const enrolledIds = currentUser?.enrolledPlaylists || [];
    const currentUserId = currentUser?.id;
    const currentUserName = currentUser?.name;

    (subjects || []).forEach(sub => {
      (sub.playlists || []).forEach(pl => {
        if (!pl.id || seen.has(pl.id)) return;
        const isEnrolled = enrolledIds.includes(pl.id);
        const isCreated =
          (pl.creatorId && pl.creatorId === currentUserId) ||
          (currentUserName && pl.author === currentUserName);

        if (isEnrolled || isCreated) {
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
            description: pl.description || 'Subject lecture track',
            subjectTitle: sub.title,
            courseId: sub.courseId,
            author: pl.author || 'Instructor',
            videoCount: pl.videos?.length || 0,
            thumbnailUrl: thumb,
            firstVidId: firstVid?.youtubeId,
            isCreated
          });
        }
      });
    });

    return list;
  }, [subjects, currentUser]);

  // Continue Learning Primary Item
  const activeHero = useMemo(() => {
    if (lastPlayed && (lastPlayed.playlistId || lastPlayed.courseId)) {
      return {
        id: lastPlayed.playlistId || lastPlayed.courseId,
        title: lastPlayed.playlistTitle || lastPlayed.courseTitle || 'Curated University Track',
        moduleTitle: lastPlayed.videoTitle || 'Lecture 1: Course Overview',
        videoIndex: lastPlayed.videoIndex || 0,
        thumbnail: lastPlayed.thumbnail || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
        progress: lastPlayed.progress || 35,
        duration: lastPlayed.duration || '42m'
      };
    }

    if (enrolledPlaylistList.length > 0) {
      const pl = enrolledPlaylistList[0];
      return {
        id: pl.id,
        title: pl.title,
        moduleTitle: pl.subjectTitle ? `${pl.subjectTitle} • Lecture Series` : 'Active Lecture Track',
        videoIndex: 0,
        thumbnail: pl.thumbnailUrl || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
        progress: 25,
        duration: `${pl.videoCount} lectures`
      };
    }

    if (enrolledCourseList.length > 0) {
      const c = enrolledCourseList[0];
      return {
        id: c.id,
        title: c.title,
        moduleTitle: c.department || 'Curriculum Course',
        videoIndex: 0,
        thumbnail: c.bannerUrl || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
        progress: 15,
        duration: 'Semester Track'
      };
    }

    return {
      id: 'default-track',
      title: 'Computer Science & Engineering Core Track',
      moduleTitle: 'Data Structures & Algorithms: Balanced Search Trees',
      videoIndex: 0,
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80',
      progress: 65,
      duration: '14h 20m'
    };
  }, [lastPlayed, enrolledPlaylistList, enrolledCourseList]);

  const handleResume = (hero) => {
    if (setSelectedPlaylistId) setSelectedPlaylistId(hero.id);
    if (setSelectedVideoIndex) setSelectedVideoIndex(hero.videoIndex || 0);
    setCurrentView('learning-player');
  };

  // Saved resources summary
  const savedResources = useMemo(() => {
    if (!savedResourceIds || savedResourceIds.length === 0) return [];
    return (standaloneResources || []).filter(r => savedResourceIds.includes(r.id)).slice(0, 4);
  }, [savedResourceIds, standaloneResources]);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8 space-y-6">
      {/* Top Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight font-editorial">
            Study Workspace
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Welcome back, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Scholar'}. Here is your study desk for today.
          </p>
        </div>
        <div className="text-xs font-mono-tabular text-text-muted bg-[#EFECE6] px-3 py-1.5 rounded-lg border border-border-subtle self-start sm:self-auto">
          {currentUser?.semester ? `SEMESTER ${currentUser.semester}` : 'ACTIVE TERM'} • 75% MINIMUM TARGET
        </div>
      </div>

      {/* 12-Column Responsive Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================
            LEFT 7 COLUMNS: Continue Learning + Enrolled Rails
        ================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* CONTINUE LEARNING HERO CARD */}
          <section className="rounded-xl p-5 border border-border-subtle bg-surface shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-mono-tabular">
                Continue Learning
              </h2>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-[#EFECE6] text-text-secondary">
                In Progress
              </span>
            </div>

            {/* 16:9 Video Frame */}
            <div
              onClick={() => handleResume(activeHero)}
              className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group border border-border-subtle bg-[#141413]"
            >
              <img
                src={activeHero.thumbnail}
                alt={activeHero.title}
                className="w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 bg-[#141413]/85 text-white shadow-lg">
                  <Play size={22} fill="#FFFFFF" className="ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-mono-tabular font-medium bg-[#141413]/85 text-[#F7F5F0]">
                {activeHero.duration}
              </span>
            </div>

            {/* Title & Resume CTA */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-snug truncate">
                  {activeHero.title}
                </h3>
                <p className="text-sm text-text-secondary truncate mt-0.5">
                  {activeHero.moduleTitle}
                </p>
              </div>
              <button
                onClick={() => handleResume(activeHero)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 shrink-0 transition-all hover:opacity-95 active:scale-95"
              >
                <span>Resume Lecture</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Subtle Progress Track */}
            <div className="mt-3.5 space-y-1">
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#EFECE6]">
                <div
                  className="h-full rounded-full bg-accent-forest transition-all duration-300"
                  style={{ width: `${activeHero.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-text-muted font-mono-tabular">
                <span>PROGRESS</span>
                <span>{activeHero.progress}% COMPLETED</span>
              </div>
            </div>
          </section>

          {/* ENROLLED TRACKS RAIL */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-mono-tabular">
                My Enrolled Courses & Playlists
              </h2>
              <button
                onClick={() => setCurrentView('learning')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Browse Catalog &rarr;
              </button>
            </div>

            {enrolledPlaylistList.length > 0 || enrolledCourseList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enrolledPlaylistList.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => {
                      if (setSelectedPlaylistId) setSelectedPlaylistId(pl.id);
                      if (setSelectedVideoIndex) setSelectedVideoIndex(0);
                      setCurrentView('learning-player');
                    }}
                    className="p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-[#141413] relative border border-border-subtle">
                      {pl.thumbnailUrl && (
                        <img
                          src={pl.thumbnailUrl}
                          alt={pl.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono-tabular bg-black/80 text-white">
                        {pl.videoCount} lectures
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {pl.title}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {pl.subjectTitle || pl.author}
                      </p>
                    </div>
                  </div>
                ))}

                {enrolledCourseList.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCurrentView('learning')}
                    className="p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover cursor-pointer transition-all space-y-3"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-[#EFECE6] flex items-center justify-center border border-border-subtle">
                      <BookOpen size={32} className="text-text-muted" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary truncate">
                        {c.title}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {c.department || 'Degree Program'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-border-subtle bg-surface text-center space-y-3">
                <BookOpen size={28} className="text-text-muted mx-auto" />
                <h4 className="text-sm font-bold text-text-primary">No courses enrolled yet</h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Explore our curriculum catalog to find university video lecture series and structured degree playlists.
                </p>
                <button
                  onClick={() => setCurrentView('learning')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95"
                >
                  Explore Course Catalog
                </button>
              </div>
            )}
          </section>
        </div>

        {/* =================================================================
            RIGHT 5 COLUMNS: Attendance Quick-Log & Bookmarks
        ================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* TODAY'S ATTENDANCE QUICK LOG */}
          <section className="rounded-xl p-5 border border-border-subtle bg-surface space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-accent-forest" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-mono-tabular">
                  Attendance Buffer
                </h2>
              </div>
              <button
                onClick={() => setCurrentView('attendance')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Full Ledger &rarr;
              </button>
            </div>

            {/* Quick Math Demonstration Card */}
            <div className="p-3.5 rounded-lg border border-border-subtle bg-canvas space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Calculated Buffer (75% Rule)</span>
                <span className="font-mono-tabular text-accent-forest font-bold">Safe Zone</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Log your attendance daily to know your exact skippable lecture allowance without falling below the 75% college criterion.
              </p>
              <button
                onClick={() => setCurrentView('attendance')}
                className="w-full py-2 rounded-lg text-xs font-semibold border border-border-strong bg-surface hover:bg-surface-hover flex items-center justify-center gap-1.5"
              >
                <Calendar size={13} />
                <span>Open Timetable Ledger</span>
              </button>
            </div>
          </section>

          {/* SAVED RESOURCES & STUDY VAULT */}
          <section className="rounded-xl p-5 border border-border-subtle bg-surface space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-mono-tabular">
                  Study Vault Quick Jump
                </h2>
              </div>
              <button
                onClick={() => setCurrentView('resources')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                All Documents &rarr;
              </button>
            </div>

            {savedResources.length > 0 ? (
              <div className="space-y-2 text-xs">
                {savedResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-2.5 rounded-lg border border-border-subtle bg-canvas flex items-center justify-between hover:bg-surface-hover"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-text-primary truncate">{res.title}</div>
                      <div className="text-[11px] text-text-muted font-mono-tabular">
                        {res.type || 'PDF'} • {res.author || 'Academic'}
                      </div>
                    </div>
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-accent-forest hover:underline shrink-0"
                      >
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-text-muted space-y-2">
                <p>No documents pinned yet.</p>
                <button
                  onClick={() => setCurrentView('resources')}
                  className="px-3 py-1.5 rounded border border-border-subtle bg-surface hover:bg-[#EFECE6] font-semibold text-text-primary text-xs"
                >
                  Browse Academic Vault
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
