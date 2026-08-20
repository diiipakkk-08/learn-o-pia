import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Sun,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Archive,
  RefreshCw,
  AlertCircle,
  Database,
  CalendarCheck,
  Users,
  Timer,
  AlertTriangle
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_ROUTINE = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
};

// Safe Local Date Helpers (prevents UTC shifts)
const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

// Add or subtract days from a date string 'YYYY-MM-DD'
const addDaysToDateStr = (dateStr, days) => {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
};

const getDefaultSemesterStartDate = () => {
  const currentYear = new Date().getFullYear();
  return `${currentYear}-06-30`;
};

// Convert 24-hour time "09:30" to 12-hour "09:30 AM"
const format12HourTime = (time24) => {
  if (!time24) return '09:00 AM';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '09:00 AM';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

// Calculate End Time from Start Time (24h) + Duration Hours & Minutes
const calculateEndTimeFromHM = (startTime24, durationHours, durationMins) => {
  if (!startTime24) return '10:00 AM';
  const [hStr, mStr] = startTime24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '10:00 AM';

  const totalDurationMins = (parseInt(durationHours, 10) || 0) * 60 + (parseInt(durationMins, 10) || 0);
  const safeMins = totalDurationMins <= 0 ? 60 : totalDurationMins;

  const totalMins = h * 60 + m + safeMins;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return format12HourTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
};

// Format duration into clean text "1 hr 30 mins" or "45 mins"
const formatDurationText = (durationHours, durationMins) => {
  const h = parseInt(durationHours, 10) || 0;
  const m = parseInt(durationMins, 10) || 0;
  if (h === 0 && m === 0) return '1 hr';
  let parts = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hr' : 'hrs'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'min' : 'mins'}`);
  return parts.join(' ');
};

// Sort routine classes chronologically by start time
const sortClassesByTime = (classList) => {
  if (!Array.isArray(classList)) return [];
  return [...classList].sort((a, b) => {
    const timeA = a.startTime24 || a.startTime || '';
    const timeB = b.startTime24 || b.startTime || '';
    return timeA.localeCompare(timeB);
  });
};

export default function AttendanceTracker({ setCurrentView }) {
  const {
    currentUser,
    saveUserRoutineToDb,
    getUserRoutineFromDb,
    saveUserLogsToDb,
    getUserLogsFromDb,
    saveUserArchivesToDb
  } = useDatabase();

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userId = currentUser?.id || 'guest';
  const routineKey = `learnopia_attendance_routine_${userId}`;
  const logsKey = `learnopia_attendance_logs_${userId}`;
  const archivesKey = `learnopia_archived_semesters_${userId}`;
  const startDateKey = `learnopia_semester_start_${userId}`;

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));

  // Tab state: 'tracker' | 'routine' | 'analytics'
  const [activeTab, setActiveTab] = useState('tracker');
  const [showEndSemModal, setShowEndSemModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showAddClassForm, setShowAddClassForm] = useState(false);

  // Semester Start Date State
  const [semesterStartDate, setSemesterStartDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(startDateKey);
      if (saved) return saved;
    }
    return getDefaultSemesterStartDate();
  });

  const [tempStartDateInput, setTempStartDateInput] = useState(semesterStartDate);

  // Timetable Routine State
  const [routine, setRoutine] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUserRoutine = localStorage.getItem(routineKey);
      if (savedUserRoutine) {
        try { return JSON.parse(savedUserRoutine); } catch (e) {}
      }
    }
    return DEFAULT_ROUTINE;
  });

  // Attendance Records Log State
  const [logs, setLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUserLogs = localStorage.getItem(logsKey);
      if (savedUserLogs) {
        try { return JSON.parse(savedUserLogs); } catch (e) {}
      }
    }
    return {};
  });

  // Archived Semesters Summary State
  const [archivedSemesters, setArchivedSemesters] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUserArchives = localStorage.getItem(archivesKey);
      if (savedUserArchives) {
        try { return JSON.parse(savedUserArchives); } catch (e) {}
      }
    }
    return [];
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load Supabase Database routine & logs on account login
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteData = async () => {
      if (!userId || userId === 'guest') {
        if (isMounted) setIsLoaded(true);
        return;
      }
      try {
        if (getUserRoutineFromDb) {
          const dbRoutineData = await getUserRoutineFromDb(userId);
          if (dbRoutineData && isMounted) {
            if (dbRoutineData.routine_json) setRoutine(dbRoutineData.routine_json);
            if (dbRoutineData.semester_start_date) {
              setSemesterStartDate(dbRoutineData.semester_start_date);
              setTempStartDateInput(dbRoutineData.semester_start_date);
            }
          }
        }
        if (getUserLogsFromDb) {
          const dbLogs = await getUserLogsFromDb(userId);
          if (dbLogs && isMounted) setLogs(dbLogs);
        }
      } catch (e) {
        console.warn('[Supabase Sync Warn]', e);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };
    fetchRemoteData();
    return () => { isMounted = false; };
  }, [userId]);

  // Sync to User LocalStorage & Supabase (Only when isLoaded is true)
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && isLoaded) {
      localStorage.setItem(routineKey, JSON.stringify(routine));
      localStorage.setItem(startDateKey, semesterStartDate);
      if (saveUserRoutineToDb) {
        saveUserRoutineToDb(userId, routine, semesterStartDate);
      }
    }
  }, [routine, semesterStartDate, userId, routineKey, startDateKey, isLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined' && userId && isLoaded) {
      localStorage.setItem(logsKey, JSON.stringify(logs));
      if (saveUserLogsToDb) {
        saveUserLogsToDb(userId, logs);
      }
    }
  }, [logs, userId, logsKey, isLoaded]);

  useEffect(() => {
    if (typeof window !== 'undefined' && userId && isLoaded) {
      localStorage.setItem(archivesKey, JSON.stringify(archivedSemesters));
      if (saveUserArchivesToDb) {
        saveUserArchivesToDb(userId, archivedSemesters);
      }
    }
  }, [archivedSemesters, userId, archivesKey, isLoaded]);

  // Form State for Routine Manager
  const [editingDay, setEditingDay] = useState('Monday');
  const [newSubName, setNewSubName] = useState('');
  const [newStartTime24, setNewStartTime24] = useState('09:00');
  const [durationHours, setDurationHours] = useState('1'); // 1 hour default
  const [durationMins, setDurationMins] = useState('0'); // 0 mins default
  const [newRoom, setNewRoom] = useState('Room 101');
  const [targetPercent, setTargetPercent] = useState(75);

  const todayStr = formatLocalDate(new Date());
  const isSelectedPastDay = selectedDate < todayStr;

  const dateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const dayName = useMemo(() => DAYS_OF_WEEK[dateObj.getDay()], [dateObj]);

  const scheduledToday = useMemo(() => sortClassesByTime(routine[dayName] || []), [routine, dayName]);
  const dayLog = useMemo(() => logs[selectedDate] || { isHoliday: false, classes: {} }, [logs, selectedDate]);

  const isAtSemesterStart = selectedDate <= semesterStartDate;

  useEffect(() => {
    if (selectedDate < semesterStartDate) {
      setSelectedDate(semesterStartDate);
    }
  }, [semesterStartDate, selectedDate]);

  // Step Date Forward/Backward (Cannot navigate earlier than semesterStartDate)
  const handlePrevDay = () => {
    if (selectedDate <= semesterStartDate) return;
    setSelectedDate((prev) => {
      const nextDate = addDaysToDateStr(prev, -1);
      return nextDate < semesterStartDate ? semesterStartDate : nextDate;
    });
  };
  const handleNextDay = () => setSelectedDate((prev) => addDaysToDateStr(prev, 1));

  // Mark class attendance status ('attended' | 'absent' | 'massbunk' | 'cancelled')
  const markClassStatus = (routineId, status) => {
    setLogs((prev) => {
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {} };
      const nextClasses = { ...currentDay.classes };

      if (nextClasses[routineId] === status) {
        delete nextClasses[routineId];
      } else {
        nextClasses[routineId] = status;
      }

      const updatedLogs = {
        ...prev,
        [selectedDate]: {
          ...currentDay,
          classes: nextClasses
        }
      };

      if (userId && saveUserLogsToDb) {
        saveUserLogsToDb(userId, updatedLogs);
      }

      return updatedLogs;
    });
  };

  // Toggle Day Holiday Status
  const toggleHoliday = () => {
    setLogs((prev) => {
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {} };
      const updatedLogs = {
        ...prev,
        [selectedDate]: {
          ...currentDay,
          isHoliday: !currentDay.isHoliday
        }
      };

      if (userId && saveUserLogsToDb) {
        saveUserLogsToDb(userId, updatedLogs);
      }

      return updatedLogs;
    });
  };

  // Add Class to Routine with Flexible Hours & Minutes Duration
  const handleAddRoutineClass = (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const startTimeFormatted = format12HourTime(newStartTime24);
    const endTimeFormatted = calculateEndTimeFromHM(newStartTime24, durationHours, durationMins);
    const totalMins = (parseInt(durationHours, 10) || 0) * 60 + (parseInt(durationMins, 10) || 0);

    const newClass = {
      id: `r-${Date.now()}`,
      subject: newSubName.trim(),
      startTime24: newStartTime24,
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      durationHours,
      durationMins,
      durationText: formatDurationText(durationHours, durationMins),
      duration: totalMins || 60,
      room: newRoom.trim() || 'Room 101',
      minTarget: parseInt(targetPercent, 10) || 75
    };

    const dayList = routine[editingDay] || [];
    const updatedDayList = sortClassesByTime([...dayList, newClass]);

    const updatedRoutine = {
      ...routine,
      [editingDay]: updatedDayList
    };

    setRoutine(updatedRoutine);

    if (userId && saveUserRoutineToDb) {
      saveUserRoutineToDb(userId, updatedRoutine, semesterStartDate);
    }

    setNewSubName('');
  };

  // Delete class from routine
  const handleDeleteRoutineClass = (day, classId) => {
    const updatedRoutine = {
      ...routine,
      [day]: sortClassesByTime((routine[day] || []).filter((c) => c.id !== classId))
    };

    setRoutine(updatedRoutine);

    if (userId && saveUserRoutineToDb) {
      saveUserRoutineToDb(userId, updatedRoutine, semesterStartDate);
    }
  };

  // Delete Archived Semester Record
  const handleDeleteArchive = (archiveId) => {
    const updatedArchives = archivedSemesters.filter((a) => a.id !== archiveId);
    setArchivedSemesters(updatedArchives);
    if (userId && saveUserArchivesToDb) {
      saveUserArchivesToDb(userId, updatedArchives);
    }
  };

  // ── OVERALL ATTENDANCE ANALYTICS (ONLY PASSED UNMARKED DAYS DEFAULT TO ABSENT) ──
  const subjectAnalytics = useMemo(() => {
    const statsMap = {};

    Object.values(routine).forEach((dayList) => {
      dayList.forEach((cls) => {
        if (!statsMap[cls.subject]) {
          statsMap[cls.subject] = {
            subject: cls.subject,
            attended: 0,
            absent: 0,
            massbunk: 0,
            cancelled: 0,
            totalConducted: 0,
            target: cls.minTarget || 75
          };
        }
      });
    });

    const startObj = parseLocalDate(semesterStartDate);
    const todayObj = parseLocalDate(todayStr);
    const endDateObj = parseLocalDate(selectedDate) > todayObj ? parseLocalDate(selectedDate) : todayObj;

    const curr = new Date(startObj.getTime());

    while (curr <= endDateObj) {
      const dateStr = formatLocalDate(curr);
      const isPast = dateStr < todayStr;
      const dName = DAYS_OF_WEEK[curr.getDay()];
      const dayClasses = routine[dName] || [];
      const logData = logs[dateStr] || { isHoliday: false, classes: {} };

      if (!logData.isHoliday && dayClasses.length > 0) {
        dayClasses.forEach((cls) => {
          if (statsMap[cls.subject]) {
            const status = logData.classes ? logData.classes[cls.id] : undefined;

            if (status === 'attended') {
              statsMap[cls.subject].attended += 1;
              statsMap[cls.subject].totalConducted += 1;
            } else if (status === 'cancelled') {
              statsMap[cls.subject].cancelled += 1;
            } else if (status === 'massbunk') {
              statsMap[cls.subject].massbunk += 1;
              statsMap[cls.subject].totalConducted += 1;
            } else if (status === 'absent') {
              statsMap[cls.subject].absent += 1;
              statsMap[cls.subject].totalConducted += 1;
            } else if (!status && isPast) {
              // UNMARKED PASSED DAYS ONLY -> DEFAULT ABSENT
              statsMap[cls.subject].absent += 1;
              statsMap[cls.subject].totalConducted += 1;
            }
            // Unmarked TODAY or FUTURE days remain pending and do NOT penalize attendance!
          }
        });
      }

      curr.setDate(curr.getDate() + 1);
    }

    return Object.values(statsMap).map((item) => {
      const pct = item.totalConducted > 0 ? Math.round((item.attended / item.totalConducted) * 100) : 100;
      const targetDecimal = item.target / 100;

      let safeBunks = 0;
      let neededClasses = 0;

      if (pct >= item.target) {
        safeBunks = Math.floor((item.attended - targetDecimal * item.totalConducted) / targetDecimal);
        if (safeBunks < 0) safeBunks = 0;
      } else {
        neededClasses = Math.ceil((targetDecimal * item.totalConducted - item.attended) / (1 - targetDecimal));
        if (neededClasses < 0) neededClasses = 0;
      }

      return {
        ...item,
        percentage: pct,
        safeBunks,
        neededClasses,
        isAlert: pct < item.target
      };
    });
  }, [routine, logs, semesterStartDate, selectedDate, todayStr]);

  // Overall Total Summary
  const overallStats = useMemo(() => {
    let totAttended = 0;
    let totAbsent = 0;
    let totMassBunk = 0;
    let totCancelled = 0;
    let totConducted = 0;

    subjectAnalytics.forEach((s) => {
      totAttended += s.attended;
      totAbsent += s.absent;
      totMassBunk += s.massbunk;
      totCancelled += s.cancelled;
      totConducted += s.totalConducted;
    });

    const pctOfficial = totConducted > 0 ? Math.round((totAttended / totConducted) * 100) : 100;
    const conductedWithoutMassBunks = totConducted - totMassBunk;
    const pctWithoutMassBunks = conductedWithoutMassBunks > 0 ? Math.round((totAttended / conductedWithoutMassBunks) * 100) : 100;

    return { 
      totAttended, 
      totAbsent, 
      totMassBunk, 
      totCancelled, 
      totConducted, 
      pct: pctOfficial, 
      pctWithoutMassBunks 
    };
  }, [subjectAnalytics]);

  // End Semester Handler -> Clears & Resets Routine Completely
  const handleConfirmNewSemester = () => {
    if (!tempStartDateInput) return;

    const summaryRecord = {
      id: `sem-${Date.now()}`,
      archivedAt: new Date().toLocaleDateString(),
      startDate: semesterStartDate,
      endDate: formatLocalDate(new Date()),
      totalConducted: overallStats.totConducted,
      totalAttended: overallStats.totAttended,
      percentage: overallStats.pct,
      subjects: subjectAnalytics
    };

    const nextArchives = [summaryRecord, ...archivedSemesters];
    setArchivedSemesters(nextArchives);

    const emptyRoutine = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
    };

    setRoutine(emptyRoutine);
    setLogs({});
    setSemesterStartDate(tempStartDateInput);
    setShowEndSemModal(false);

    if (userId) {
      if (saveUserArchivesToDb) saveUserArchivesToDb(userId, nextArchives);
      if (saveUserRoutineToDb) saveUserRoutineToDb(userId, emptyRoutine, tempStartDateInput);
      if (saveUserLogsToDb) saveUserLogsToDb(userId, {});
    }
  };

  const handleUpdateStartDateOnly = (e) => {
    e.preventDefault();
    if (!tempStartDateInput) return;
    setSemesterStartDate(tempStartDateInput);
    setShowStartDateModal(false);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Top Banner & Header */}
      <div className="glass-panel" style={{ padding: isMobile ? '16px' : '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', minWidth: 0 }}>
          <div style={{ width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: isMobile ? 12 : 14, background: 'linear-gradient(135deg, var(--primary) 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={isMobile ? 18 : 22} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: isMobile ? '1rem' : '1.25rem', margin: 0, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Semester Attendance Tracker</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Semester Started: <strong>{semesterStartDate}</strong>
              </span>
              <button
                onClick={() => { setTempStartDateInput(semesterStartDate); setShowStartDateModal(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: isMobile ? '0.68rem' : '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Change Date
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => { setTempStartDateInput(formatLocalDate(new Date())); setShowEndSemModal(true); }} style={{ padding: isMobile ? '8px 12px' : undefined, fontSize: isMobile ? '0.75rem' : undefined }}>
            <RefreshCw size={isMobile ? 13 : 15} /> {isMobile ? 'New Semester' : 'End & Start New Semester'}
          </button>
        </div>
      </div>

      {/* Tabs Row - Scrollable on mobile */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button className={`btn ${activeTab === 'tracker' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('tracker')} style={{ flex: '0 0 auto', minWidth: isMobile ? '110px' : '130px', justifyContent: 'center', fontSize: isMobile ? '0.75rem' : '0.82rem', padding: isMobile ? '8px 10px' : '9px 12px', whiteSpace: 'nowrap' }}>
          <CalendarCheck size={isMobile ? 14 : 16} /> {isMobile ? 'Logger' : 'Daily Logger'}
        </button>
        <button className={`btn ${activeTab === 'routine' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('routine')} style={{ flex: '0 0 auto', minWidth: isMobile ? '110px' : '130px', justifyContent: 'center', fontSize: isMobile ? '0.75rem' : '0.82rem', padding: isMobile ? '8px 10px' : '9px 12px', whiteSpace: 'nowrap' }}>
          <Settings size={isMobile ? 14 : 16} /> {isMobile ? 'Timetable' : 'Weekly Timetable'}
        </button>
        <button className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('analytics')} style={{ flex: '0 0 auto', minWidth: isMobile ? '110px' : '130px', justifyContent: 'center', fontSize: isMobile ? '0.75rem' : '0.82rem', padding: isMobile ? '8px 10px' : '9px 12px', whiteSpace: 'nowrap' }}>
          <TrendingUp size={isMobile ? 14 : 16} /> {isMobile ? 'Analytics' : 'Analytics'}
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE LOGGER */}
      {activeTab === 'tracker' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: isMobile ? '16px' : '20px', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={isMobile ? 16 : 18} color="var(--primary)" /> Classes for {selectedDate} ({dayName})
              </h3>
              <button onClick={toggleHoliday} className={`btn ${dayLog.isHoliday ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ padding: isMobile ? '6px 10px' : undefined, fontSize: isMobile ? '0.7rem' : undefined }}>
                <Sun size={isMobile ? 12 : 14} /> {dayLog.isHoliday ? 'Holiday' : 'Mark Holiday'}
              </button>
            </div>

            {/* Quick 1-Click Day Stepper & Date Picker */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handlePrevDay}
                disabled={isAtSemesterStart}
                className="btn btn-secondary btn-sm"
                title={isAtSemesterStart ? "Semester Start Date Reached" : "Previous Day"}
                style={{
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: isAtSemesterStart ? 0.45 : 1,
                  cursor: isAtSemesterStart ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={isMobile ? 14 : 16} /> {isMobile ? '' : 'Prev'}
              </button>
              
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                min={semesterStartDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val < semesterStartDate) {
                    setSelectedDate(semesterStartDate);
                  } else {
                    setSelectedDate(val);
                  }
                }}
                style={{ flex: 1, minWidth: isMobile ? '100px' : '120px', textAlign: 'center', fontSize: isMobile ? '0.8rem' : undefined }}
              />

              <button onClick={handleNextDay} className="btn btn-secondary btn-sm" title="Next Day" style={{ padding: isMobile ? '6px 10px' : '8px 12px', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {isMobile ? '' : 'Next '}<ChevronRight size={isMobile ? 14 : 16} />
              </button>
            </div>

            {dayLog.isHoliday ? (
              <div style={{ padding: isMobile ? '20px' : '30px', textAlign: 'center', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Sun size={isMobile ? 28 : 32} color="#f59e0b" style={{ marginBottom: 8 }} />
                <h4 style={{ color: '#ffffff', margin: 0, fontSize: isMobile ? '1rem' : undefined }}>Official Holiday / Off Day</h4>
                <p style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>No classes count against your attendance record on holidays.</p>
              </div>
            ) : scheduledToday.length === 0 ? (
              <div style={{ padding: isMobile ? '20px' : '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.8rem' : '0.85rem' }}>No classes scheduled in your weekly routine for {dayName}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scheduledToday.map((cls) => {
                  const rawStatus = dayLog.classes[cls.id];
                  const status = rawStatus || (isSelectedPastDay ? 'absent' : null); // ONLY PAST UNMARKED DAYS DEFAULT TO ABSENT

                  return (
                    <div
                      key={cls.id}
                      style={{
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        borderRadius: '10px',
                        background: status === 'attended' ? 'rgba(16,185,129,0.08)' : status === 'massbunk' ? 'rgba(245,158,11,0.08)' : status === 'cancelled' ? 'rgba(255,255,255,0.03)' : status === 'absent' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                        border: status === 'attended' ? '1px solid rgba(16,185,129,0.2)' : status === 'massbunk' ? '1px solid rgba(245,158,11,0.2)' : status === 'cancelled' ? '1px solid rgba(255,255,255,0.08)' : status === 'absent' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        justifyContent: isMobile ? 'flex-start' : 'space-between',
                        gap: isMobile ? '8px' : '10px'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ color: '#ffffff', fontSize: isMobile ? '0.85rem' : '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.subject}</strong>
                        <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cls.startTime} - {cls.endTime} ({cls.durationText || `${cls.duration || 60}m`}) · {cls.room}
                        </span>
                        {!rawStatus && isSelectedPastDay && (
                          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#f87171', display: 'block', fontWeight: 600, marginTop: 2 }}>
                            (Passed Day Unmarked → Default Absent)
                          </span>
                        )}
                        {!rawStatus && !isSelectedPastDay && (
                          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#a78bfa', display: 'block', fontWeight: 500, marginTop: 2 }}>
                            (Select Attendance Status)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: isMobile ? '4px' : '6px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                        <button
                          onClick={() => markClassStatus(cls.id, 'attended')}
                          className={`btn ${rawStatus === 'attended' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: isMobile ? '4px 8px' : '4px 8px', flex: isMobile ? '1 1 auto' : 'none', minWidth: isMobile ? '70px' : undefined }}
                        >
                          <CheckCircle2 size={isMobile ? 11 : 13} /> {isMobile ? 'P' : 'Present'}
                        </button>
                        <button
                          onClick={() => markClassStatus(cls.id, 'absent')}
                          className={`btn ${rawStatus === 'absent' || (isSelectedPastDay && !rawStatus) ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: isMobile ? '4px 8px' : '4px 8px', color: (rawStatus === 'absent' || (isSelectedPastDay && !rawStatus)) ? '#f87171' : undefined, flex: isMobile ? '1 1 auto' : 'none', minWidth: isMobile ? '70px' : undefined }}
                        >
                          <XCircle size={isMobile ? 11 : 13} /> {isMobile ? 'A' : 'Absent'}
                        </button>
                        <button
                          onClick={() => markClassStatus(cls.id, 'massbunk')}
                          className={`btn ${rawStatus === 'massbunk' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: isMobile ? '4px 8px' : '4px 8px', color: rawStatus === 'massbunk' ? '#f59e0b' : undefined, flex: isMobile ? '1 1 auto' : 'none', minWidth: isMobile ? '70px' : undefined }}
                        >
                          <Users size={isMobile ? 11 : 13} /> {isMobile ? 'MB' : 'Mass Bunk'}
                        </button>
                        <button
                          onClick={() => markClassStatus(cls.id, 'cancelled')}
                          className={`btn ${rawStatus === 'cancelled' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: isMobile ? '4px 8px' : '4px 8px', flex: isMobile ? '1 1 auto' : 'none', minWidth: isMobile ? '70px' : undefined }}
                        >
                          <MinusCircle size={isMobile ? 11 : 13} /> {isMobile ? 'X' : 'Cancelled'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY TIMETABLE SETUP */}
      {activeTab === 'routine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px', textAlign: 'left' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h3 style={{ fontSize: isMobile ? '1rem' : '1.15rem', margin: 0, color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={20} color="var(--primary)" /> Weekly Timetable Routine
              </h3>
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                Review your weekly class schedule or add new classes below.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddClassForm(prev => !prev)}
              className="btn btn-primary"
              style={{ padding: isMobile ? '8px 14px' : '9px 18px', fontSize: isMobile ? '0.8rem' : '0.86rem', gap: '6px' }}
            >
              {showAddClassForm ? <X size={16} /> : <Plus size={16} />}
              {showAddClassForm ? 'Hide Add Class Form' : '+ Add New Class'}
            </button>
          </div>

          {/* FIRST SECTION: Current Routine View (Sorted Chronologically) */}
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '20px', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', margin: 0, color: '#ffffff', fontWeight: 700 }}>
                Weekly Timetable Schedule
              </h3>
              <button
                type="button"
                onClick={() => setShowAddClassForm(true)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '4px' }}
              >
                <Plus size={14} /> Add Class
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {DAYS_OF_WEEK.map((d) => {
                const dayClasses = sortClassesByTime(routine[d] || []);
                return (
                  <div key={d} style={{ padding: isMobile ? '10px 12px' : '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ color: 'var(--primary)', fontSize: isMobile ? '0.8rem' : '0.85rem' }}>{d}</strong>
                      <span style={{ fontSize: '0.72rem', color: dayClasses.length > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>
                        {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                      </span>
                    </div>

                    {dayClasses.length === 0 ? (
                      <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>No classes scheduled</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 6 }}>
                        {dayClasses.map((c) => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: isMobile ? '0.78rem' : '0.82rem', color: '#ffffff', width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '8px' }}>
                            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                              <span style={{ fontWeight: 600, color: '#ffffff', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{c.startTime} - {c.endTime} {c.room ? `· ${c.room}` : ''}</span>
                            </div>
                            <button onClick={() => handleDeleteRoutineClass(d, c.id)} title="Delete class" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', padding: '6px', borderRadius: '6px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECOND SECTION: Add Class Form (Placed below routine or expanded) */}
          {showAddClassForm ? (
            <div className="glass-panel animate-fade-in" style={{ padding: isMobile ? '16px' : '22px', border: '1px solid rgba(139,92,246,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={isMobile ? 16 : 18} color="var(--primary)" /> Add Class to Weekly Routine
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddClassForm(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddRoutineClass} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '10px' : '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem' }}>Day of Week</label>
                    <select className="form-input" value={editingDay} onChange={(e) => setEditingDay(e.target.value)} style={{ fontSize: isMobile ? '0.8rem' : undefined }}>
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem' }}>Subject Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Data Structures & Algorithms"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      required
                      style={{ fontSize: isMobile ? '0.8rem' : undefined }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '10px' : '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem' }}>Start Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={newStartTime24}
                      onChange={(e) => setNewStartTime24(e.target.value)}
                      required
                      style={{ fontSize: isMobile ? '0.8rem' : undefined }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem' }}>Duration (Hours)</label>
                    <select className="form-input" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} style={{ fontSize: isMobile ? '0.8rem' : undefined }}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                        <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem' }}>Duration (Minutes)</label>
                    <select className="form-input" value={durationMins} onChange={(e) => setDurationMins(e.target.value)} style={{ fontSize: isMobile ? '0.8rem' : undefined }}>
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                        <option key={m} value={m}>{m} Mins</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--primary)', fontWeight: 600, background: 'rgba(139,92,246,0.1)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)', wordBreak: 'break-word' }}>
                  ⏰ Calculated Class Time: {format12HourTime(newStartTime24)} → {calculateEndTimeFromHM(newStartTime24, durationHours, durationMins)} ({formatDurationText(durationHours, durationMins)})
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem' }}>Room / Venue (Optional)</label>
                  <input type="text" className="form-input" placeholder="e.g. Lab 3, Room 102" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} style={{ fontSize: isMobile ? '0.8rem' : undefined }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 4 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: isMobile ? '10px' : '12px', fontSize: isMobile ? '0.82rem' : '0.9rem' }}>
                    Save Class to Timetable
                  </button>
                  <button type="button" onClick={() => setShowAddClassForm(false)} className="btn btn-secondary" style={{ padding: isMobile ? '10px 14px' : '12px 18px', fontSize: isMobile ? '0.82rem' : '0.9rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowAddClassForm(true)}
                className="btn btn-secondary"
                style={{ padding: '10px 24px', fontSize: '0.88rem', gap: '8px', margin: '0 auto' }}
              >
                <Plus size={18} color="var(--primary)" /> + Add New Class Below Timetable
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBJECT ANALYTICS & ARCHIVES */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px', textAlign: 'left' }}>
          {/* OVERALL ANALYTICS */}
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', margin: '0 0 16px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={isMobile ? 18 : 20} color="var(--primary)" /> Overall Analytics
            </h3>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 min-content', minWidth: '120px' }}>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Actual Attendance</div>
                <div style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, color: overallStats.pct < 75 ? '#f87171' : '#34d399' }}>
                  {overallStats.pct}%
                </div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  (Includes Mass Bunks)
                </div>
              </div>

              <div style={{ flex: '1 1 min-content', minWidth: '120px' }}>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ignoring Mass Bunks</div>
                <div style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 800, color: overallStats.pctWithoutMassBunks < 75 ? '#f87171' : '#34d399' }}>
                  {overallStats.pctWithoutMassBunks}%
                </div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  (If Bunks Were Cancelled)
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '16px', 
              paddingTop: '16px', 
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
              gap: '12px' 
            }}>
              <div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: 'var(--text-secondary)' }}>Total Classes</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#fff' }}>{overallStats.totConducted}</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: 'var(--text-secondary)' }}>Attended</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#34d399' }}>{overallStats.totAttended}</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: 'var(--text-secondary)' }}>Absent</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#f87171' }}>{overallStats.totAbsent}</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: 'var(--text-secondary)' }}>Mass Bunks</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#fbbf24' }}>{overallStats.totMassBunk}</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: 'var(--text-secondary)' }}>Cancelled</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 700, color: '#94a3b8' }}>{overallStats.totCancelled}</div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', margin: '0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
             Subject-wise Breakdown
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isMobile ? '12px' : '16px' }}>
            {subjectAnalytics.map((sub) => (
              <div
                key={sub.subject}
                className="glass-panel"
                style={{
                  padding: isMobile ? '16px' : '20px',
                  borderRadius: '16px',
                  border: sub.isAlert ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(16,185,129,0.3)',
                  background: sub.isAlert ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontSize: isMobile ? '0.9rem' : '1rem', margin: 0, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.subject}</h4>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: sub.isAlert ? '#f87171' : '#34d399' }}>
                    {sub.percentage}%
                  </span>
                </div>

                <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>Attended: {sub.attended} / Conducted: {sub.totalConducted}</span>
                  <span>Absent: {sub.absent} · Mass Bunked: {sub.massbunk} · Cancelled: {sub.cancelled}</span>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: isMobile ? '0.7rem' : '0.78rem' }}>
                  {sub.isAlert ? (
                    <span style={{ color: '#f87171', fontWeight: 600 }}>
                      ⚠️ Attendance Alert: You must attend the next <strong>{sub.neededClasses}</strong> classes to reach {sub.target}%.
                    </span>
                  ) : (
                    <span style={{ color: '#34d399', fontWeight: 600 }}>
                      ✔ Safe Margin: You can safely bunk up to <strong>{sub.safeBunks}</strong> upcoming classes.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Archived Semesters History */}
          {archivedSemesters.length > 0 && (
            <div className="glass-panel" style={{ padding: isMobile ? '16px' : '20px', marginTop: '10px' }}>
              <h3 style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', margin: '0 0 14px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Archive size={isMobile ? 16 : 18} color="var(--primary)" /> Past Semester Records ({archivedSemesters.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {archivedSemesters.map((arch) => (
                  <div key={arch.id} style={{ padding: isMobile ? '10px 12px' : '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '8px' : 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: '#ffffff', fontSize: isMobile ? '0.8rem' : '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Semester ({arch.startDate} to {arch.endDate})</strong>
                      <span style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Overall Score: {arch.percentage}% ({arch.totalAttended} / {arch.totalConducted} classes attended)
                      </span>
                    </div>
                    <button onClick={() => handleDeleteArchive(arch.id)} className="btn btn-secondary btn-sm" style={{ color: '#f87171', padding: isMobile ? '6px 10px' : undefined, fontSize: isMobile ? '0.7rem' : undefined, alignSelf: isMobile ? 'flex-start' : 'auto' }}>
                      <Trash2 size={isMobile ? 11 : 13} /> {isMobile ? 'Delete' : 'Delete Record'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CENTERED WARNING MODAL FOR ENDING / STARTING NEW SEMESTER */}
      {showEndSemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '28px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(18, 14, 24, 0.95)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '14px' }}>
                <AlertTriangle size={28} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>End Current Semester?</h3>
                <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>
                  ⚠️ Critical Action: Complete Timetable Wipe
                </span>
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--text-secondary)',
              fontSize: '0.83rem',
              lineHeight: 1.6,
              marginBottom: '18px'
            }}>
              Starting a new semester will <strong>PERMANENTLY DELETE all your weekly routine subjects and daily attendance logs</strong> for the current semester.
              <br /><br />
              💡 <em>If you want to save your current semester stats or schedule, please take a screenshot or copy your analytics summary before proceeding.</em>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmNewSemester(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>New Semester Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={tempStartDateInput}
                  onChange={(e) => setTempStartDateInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEndSemModal(false)}>
                  Cancel & Keep Routine
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Trash2 size={16} /> I Understand, Delete Routine & Start Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE START DATE MODAL */}
      {showStartDateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel modal-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', borderRadius: '20px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarCheck size={18} color="var(--primary)" /> Update Semester Start Date
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Total conducted classes and attendance percentages are calculated from this start date up to today.
            </p>

            <form onSubmit={handleUpdateStartDateOnly} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Semester Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={tempStartDateInput}
                  onChange={(e) => setTempStartDateInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStartDateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Start Date</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  }
};
