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
  Sparkles,
  ExternalLink,
  ChevronRight,
  Download,
  AlertCircle,
  CalendarDays
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
    routine
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
      // Default contextual study notes
      return [
        {
          id: 'sample-1',
          text: 'Remember to verify continuity at x=0 before applying L\'Hopital\'s Rule in limits problems.',
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

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-12 space-y-6">
      {/* Editorial Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight font-editorial">
            Study Workspace
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Welcome back, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Scholar'}. Here is your active study desk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono-tabular text-text-muted bg-[#EFECE6] px-3 py-1.5 rounded-lg border border-border-subtle">
            {currentUser?.semester ? `SEMESTER ${currentUser.semester}` : 'ACTIVE TERM'} • 75% MINIMUM TARGET
          </div>
        </div>
      </div>

      {/* =================================================================
          TOP HERO WIDGET: CONTINUE LEARNING WHERE YOU LEFT OFF
      ================================================================= */}
      <section className="rounded-xl p-5 border border-border-subtle bg-surface shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular flex items-center gap-2">
            <Play size={14} className="text-accent-forest" />
            Continue Learning
          </h2>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-[#EFECE6] text-text-secondary font-mono-tabular">
            RESUME TRACK
          </span>
        </div>

        {/* 16:9 Video Frame + Resume Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div
            onClick={handleResumeHero}
            className="lg:col-span-6 xl:col-span-5 relative aspect-video rounded-lg overflow-hidden cursor-pointer group border border-border-subtle bg-[#141413]"
          >
            <img
              src={activeHero.thumbnail}
              alt={activeHero.title}
              className="w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 bg-[#141413]/85 text-white shadow-lg">
                <Play size={20} fill="#FFFFFF" className="ml-0.5" />
              </div>
            </div>
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-mono-tabular font-medium bg-[#141413]/85 text-[#F7F5F0]">
              {activeHero.duration}
            </span>
          </div>

          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-mono-tabular font-semibold text-accent-forest uppercase">
                ACTIVE LECTURE MODULE
              </span>
              <h3 className="text-lg sm:text-xl font-bold leading-snug mt-0.5 text-text-primary">
                {activeHero.title}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                {activeHero.moduleTitle}
              </p>
            </div>

            {/* Progress Track */}
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full overflow-hidden bg-[#EFECE6]">
                <div
                  className="h-full rounded-full bg-accent-forest transition-all duration-300"
                  style={{ width: `${activeHero.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-text-muted font-mono-tabular">
                <span>{activeHero.progress}% COMPLETED</span>
                <span>MODULE 3 OF 8</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleResumeHero}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 transition-all hover:opacity-95 active:scale-95 cursor-pointer"
              >
                <span>Resume Lecture</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setCurrentView('learning')}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-surface hover:bg-[#FAF8F5] text-text-secondary cursor-pointer"
              >
                All Subjects
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          DASHBOARD WIDGETS BENTO GRID (Responsive & Bite-Sized)
      ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-start">
        {/* ===============================================================
            WIDGET 1: ATTENDANCE BUFFER SNAPSHOT (4 cols)
        =============================================================== */}
        <div className="lg:col-span-4 rounded-xl p-5 border border-border-subtle bg-surface shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-accent-forest" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                  Attendance Snapshot
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('attendance')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Full Ledger →
              </button>
            </div>

            {/* Attendance Percentage Metric */}
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono-tabular text-text-primary">
                  {attendanceMetrics.percentage}%
                </span>
                <span className="text-xs text-text-muted ml-2 font-mono-tabular">
                  ({attendanceMetrics.attended}/{attendanceMetrics.total} classes)
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono-tabular ${
                  attendanceMetrics.isSafe
                    ? 'bg-[#E6F0E9] text-accent-forest border border-[#C2DEC9]'
                    : 'bg-[#FDECEC] text-accent-danger border border-[#F5C2C2]'
                }`}
              >
                {attendanceMetrics.isSafe ? 'SAFE' : 'ALERT'}
              </span>
            </div>

            {/* Target Status Bar */}
            <div className="mt-3 space-y-1">
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#EFECE6]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    attendanceMetrics.isSafe ? 'bg-accent-forest' : 'bg-accent-danger'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, parseFloat(attendanceMetrics.percentage)))}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                {attendanceMetrics.pillText}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle">
            <button
              onClick={() => setCurrentView('attendance')}
              className="w-full py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-[#FAF8F5] hover:bg-[#EFECE6] text-text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <CalendarDays size={13} />
              <span>Log Today's Classes</span>
            </button>
          </div>
        </div>

        {/* ===============================================================
            WIDGET 2: MY ACTIVE COURSES WIDGET (4 cols)
        =============================================================== */}
        <div className="lg:col-span-4 rounded-xl p-5 border border-border-subtle bg-surface shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-text-primary" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                  My Active Subjects
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('learning')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Catalog ({courses.length}) →
              </button>
            </div>

            {/* Compact List of Enrolled Courses */}
            <div className="mt-3 space-y-2.5">
              {enrolledSubjectCourses.length > 0 ? (
                enrolledSubjectCourses.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (setSelectedPlaylistId) setSelectedPlaylistId(item.playlistId);
                      if (setSelectedVideoIndex) setSelectedVideoIndex(0);
                      setCurrentView('learning-player');
                    }}
                    className="p-2.5 rounded-lg border border-border-subtle hover:border-border-strong hover:bg-[#FAF8F5] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-accent-forest transition-colors">
                        {item.title}
                      </h4>
                      <span className="text-[11px] text-text-muted truncate block">
                        {item.subjectTitle} • {item.author}
                      </span>
                    </div>
                    <ArrowRight size={13} className="shrink-0 text-text-muted group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-text-muted">
                  <p>No active courses yet.</p>
                  <button
                    onClick={() => setCurrentView('learning')}
                    className="mt-2 text-xs font-semibold text-accent-forest hover:underline cursor-pointer"
                  >
                    Browse Catalog &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle">
            <button
              onClick={() => setCurrentView('learning')}
              className="w-full py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-[#FAF8F5] hover:bg-[#EFECE6] text-text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Explore All Subjects</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* ===============================================================
            WIDGET 3: MY TIMESTAMPED NOTES WIDGET (4 cols)
        =============================================================== */}
        <div className="lg:col-span-4 rounded-xl p-5 border border-border-subtle bg-surface shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-accent-amber" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                  My Lecture Notes
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('resources')}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Vault →
              </button>
            </div>

            {/* Note Previews */}
            <div className="mt-3 space-y-2.5">
              {userRecentNotes.slice(0, 3).map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    if (setSelectedPlaylistId && note.playlistId) {
                      setSelectedPlaylistId(note.playlistId);
                    }
                    setCurrentView('learning-player');
                  }}
                  className="p-2.5 rounded-lg border border-border-subtle hover:border-border-strong hover:bg-[#FAF8F5] cursor-pointer transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                    <span className="font-semibold text-accent-forest">
                      [{note.timestamp}]
                    </span>
                    <span className="text-text-muted truncate max-w-[140px]">
                      {note.courseTitle || 'Lecture'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle">
            <button
              onClick={() => {
                if (setSelectedPlaylistId) setSelectedPlaylistId(activeHero.id);
                setCurrentView('learning-player');
              }}
              className="w-full py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-[#FAF8F5] hover:bg-[#EFECE6] text-text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>Take Notes in Player</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* ===============================================================
            WIDGET 4: ACADEMIC VAULT / SAVED RESOURCES (6 cols)
        =============================================================== */}
        <div className="lg:col-span-6 rounded-xl p-5 border border-border-subtle bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <BookmarkCheck size={15} className="text-accent-forest" />
              <h3 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                Academic Vault & Formulas
              </h3>
            </div>
            <button
              onClick={() => setCurrentView('resources')}
              className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
            >
              All Resources ({standaloneResources?.length || 0}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {topVaultResources.map((res) => (
              <div
                key={res.id}
                className="p-3 rounded-lg border border-border-subtle flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-[#EFECE6] text-text-primary uppercase">
                      {res.type || 'PDF'}
                    </span>
                    <h4 className="text-xs font-bold text-text-primary truncate">
                      {res.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-text-muted mt-0.5 block truncate">
                    {res.category} • {res.author}
                  </span>
                </div>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg border border-border-subtle hover:bg-surface text-text-secondary hover:text-text-primary shrink-0"
                  title="Download / View Resource"
                >
                  <Download size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ===============================================================
            WIDGET 5: TODAY'S TIMETABLE / SCHEDULE (6 cols)
        =============================================================== */}
        <div className="lg:col-span-6 rounded-xl p-5 border border-border-subtle bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-text-primary" />
              <h3 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                Today's Schedule • {todayClasses.currentDay}
              </h3>
            </div>
            <button
              onClick={() => setCurrentView('attendance')}
              className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
            >
              View Routine →
            </button>
          </div>

          {todayClasses.dayClasses.length > 0 ? (
            <div className="space-y-2.5">
              {todayClasses.dayClasses.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-lg border border-border-subtle flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">
                      {item.subjectName || item.title || 'Academic Lecture'}
                    </h4>
                    <span className="text-[11px] text-text-muted font-mono-tabular">
                      {item.startTime || '10:00 AM'} - {item.endTime || '11:00 AM'} • {item.room || 'Room 101'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold bg-[#E6F0E9] text-accent-forest">
                    SCHEDULED
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-border-subtle text-center space-y-2">
              <Calendar size={24} className="text-text-muted mx-auto" />
              <p className="text-xs text-text-secondary">
                No classes scheduled for {todayClasses.currentDay}. Enjoy your revision & study time!
              </p>
              <button
                onClick={() => setCurrentView('attendance')}
                className="text-xs font-semibold text-accent-forest hover:underline cursor-pointer"
              >
                Configure Timetable in Attendance Tracker &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
