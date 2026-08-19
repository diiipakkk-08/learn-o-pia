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
  Timer
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

// Calculate End Time from Start Time (24h) + Duration in Minutes
const calculateEndTime = (startTime24, durationMinutes) => {
  if (!startTime24) return '10:00 AM';
  const [hStr, mStr] = startTime24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '10:00 AM';
  const totalMins = h * 60 + m + parseInt(durationMinutes, 10);
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return format12HourTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
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
  const [durationMinutes, setDurationMinutes] = useState('60'); // 60 mins default
  const [newRoom, setNewRoom] = useState('Room 101');
  const [targetPercent, setTargetPercent] = useState(75);

  const dateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const dayName = useMemo(() => DAYS_OF_WEEK[dateObj.getDay()], [dateObj]);

  const scheduledToday = useMemo(() => sortClassesByTime(routine[dayName] || []), [routine, dayName]);
  const dayLog = useMemo(() => logs[selectedDate] || { isHoliday: false, classes: {} }, [logs, selectedDate]);

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

  // Add Class to Routine with Duration & Auto End Time
  const handleAddRoutineClass = (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const startTimeFormatted = format12HourTime(newStartTime24);
    const endTimeFormatted = calculateEndTime(newStartTime24, durationMinutes);

    const newClass = {
      id: `r-${Date.now()}`,
      subject: newSubName.trim(),
      startTime24: newStartTime24,
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      duration: parseInt(durationMinutes, 10),
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

  // ── OVERALL ATTENDANCE ANALYTICS (WITH MASS BUNK & DEFAULT ABSENTEE) ──
  const subjectAnalytics = useMemo(() => {
    const statsMap = {};

    // 1. Initialize stats for all subjects present in the routine
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
    const todayObj = parseLocalDate(formatLocalDate(new Date()));
    const endDateObj = parseLocalDate(selectedDate) > todayObj ? parseLocalDate(selectedDate) : todayObj;

    const curr = new Date(startObj.getTime());

    while (curr <= endDateObj) {
      const dateStr = formatLocalDate(curr);
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
            } else {
              // Explicitly marked absent OR Unmarked scheduled past class -> DEFAULT ABSENT
              statsMap[cls.subject].absent += 1;
              statsMap[cls.subject].totalConducted += 1;
            }
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
  }, [routine, logs, semesterStartDate, selectedDate]);

  // Overall Total Summary
  const overallStats = useMemo(() => {
    let totAttended = 0;
    let totConducted = 0;

    subjectAnalytics.forEach((s) => {
      totAttended += s.attended;
      totConducted += s.totalConducted;
    });

    const pct = totConducted > 0 ? Math.round((totAttended / totConducted) * 100) : 100;
    return { totAttended, totConducted, pct };
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

    // WIPE ROUTINE & LOGS COMPLETELY FOR CLEAN NEW SEMESTER
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
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary) 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>Semester Attendance Tracker</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Semester Started: <strong>{semesterStartDate}</strong>
              </span>
              <button
                onClick={() => { setTempStartDateInput(semesterStartDate); setShowStartDateModal(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Change Date
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => { setTempStartDateInput(formatLocalDate(new Date())); setShowEndSemModal(true); }}>
            <RefreshCw size={15} /> End & Start New Semester
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
        <button className={`btn ${activeTab === 'tracker' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('tracker')}>
          <CalendarCheck size={16} /> Daily Attendance Logger
        </button>
        <button className={`btn ${activeTab === 'routine' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('routine')}>
          <Settings size={16} /> Weekly Timetable Setup
        </button>
        <button className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('analytics')}>
          <TrendingUp size={16} /> Subject Analytics ({overallStats.pct}%)
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE LOGGER */}
      {activeTab === 'tracker' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={18} color="var(--primary)" /> Classes for {selectedDate} ({dayName})
              </h3>
              <button onClick={toggleHoliday} className={`btn ${dayLog.isHoliday ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
                <Sun size={14} /> {dayLog.isHoliday ? 'Holiday Marked' : 'Mark Holiday'}
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.78rem' }}>Select Log Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {dayLog.isHoliday ? (
              <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Sun size={32} color="#f59e0b" style={{ marginBottom: 8 }} />
                <h4 style={{ color: '#ffffff', margin: 0 }}>Official Holiday / Off Day</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>No classes count against your attendance record on holidays.</p>
              </div>
            ) : scheduledToday.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No classes scheduled in your weekly routine for {dayName}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scheduledToday.map((cls) => {
                  const status = dayLog.classes[cls.id] || 'absent'; // DEFAULT ABSENT IF UNMARKED

                  return (
                    <div
                      key={cls.id}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: status === 'attended' ? 'rgba(16,185,129,0.08)' : status === 'massbunk' ? 'rgba(245,158,11,0.08)' : status === 'cancelled' ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.08)',
                        border: status === 'attended' ? '1px solid rgba(16,185,129,0.2)' : status === 'massbunk' ? '1px solid rgba(245,158,11,0.2)' : status === 'cancelled' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(239,68,68,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#ffffff', fontSize: '0.9rem', display: 'block' }}>{cls.subject}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {cls.startTime} - {cls.endTime} ({cls.duration || 60}m) · {cls.room}
                        </span>
                        {!dayLog.classes[cls.id] && (
                          <span style={{ fontSize: '0.7rem', color: '#f87171', display: 'block', fontWeight: 600, marginTop: 2 }}>
                            (Unmarked → Default Absent)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => markClassStatus(cls.id, 'attended')}
                          className={`btn ${status === 'attended' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        >
                          <CheckCircle2 size={13} /> Present
                        </button>
                        <button
                          onClick={() => markClassStatus(cls.id, 'absent')}
                          className={`btn ${status === 'absent' && dayLog.classes[cls.id] ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: '0.72rem', padding: '4px 8px', color: status === 'absent' ? '#f87171' : undefined }}
                        >
                          <XCircle size={13} /> Absent
                        </button>
                        <button
                          onClick={() => markClassStatus(cls.id, 'massbunk')}
                          className={`btn ${status === 'massbunk' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: '0.72rem', padding: '4px 8px', color: status === 'massbunk' ? '#f59e0b' : undefined }}
                        >
                          <Users size={13} /> Mass Bunk
                        </button>
                        <button
                          onClick={() => markClassStatus(cls.id, 'cancelled')}
                          className={`btn ${status === 'cancelled' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        >
                          <MinusCircle size={13} /> Cancelled
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left' }}>
          {/* Add Class Form */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 14px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={18} color="var(--primary)" /> Add Class to Weekly Routine
            </h3>

            <form onSubmit={handleAddRoutineClass} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Day of Week</label>
                <select className="form-input" value={editingDay} onChange={(e) => setEditingDay(e.target.value)}>
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Subject Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newStartTime24}
                    onChange={(e) => setNewStartTime24(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Class Duration</label>
                  <select className="form-input" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}>
                    <option value="45">45 Minutes</option>
                    <option value="50">50 Minutes</option>
                    <option value="60">1 Hour (60m)</option>
                    <option value="90">1.5 Hours (90m)</option>
                    <option value="120">2 Hours (120m)</option>
                    <option value="180">3 Hours (180m)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Room / Venue</label>
                <input type="text" className="form-input" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 6 }}>
                Save Class to Timetable
              </button>
            </form>
          </div>

          {/* Current Routine View (Sorted Chronologically) */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 14px 0', color: '#ffffff' }}>Weekly Timetable Schedule (Chronological)</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {DAYS_OF_WEEK.map((d) => {
                const dayClasses = sortClassesByTime(routine[d] || []);
                return (
                  <div key={d} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{d} ({dayClasses.length} classes)</strong>

                    {dayClasses.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>No classes</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {dayClasses.map((c) => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ffffff' }}>
                            <span>{c.subject} ({c.startTime} - {c.endTime})</span>
                            <button onClick={() => handleDeleteRoutineClass(d, c.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                              <Trash2 size={13} />
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
        </div>
      )}

      {/* TAB 3: SUBJECT ANALYTICS & ARCHIVES */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {subjectAnalytics.map((sub) => (
              <div
                key={sub.subject}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: sub.isAlert ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(16,185,129,0.3)',
                  background: sub.isAlert ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0, color: '#ffffff' }}>{sub.subject}</h4>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: sub.isAlert ? '#f87171' : '#34d399' }}>
                    {sub.percentage}%
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Attended: {sub.attended} / Conducted: {sub.totalConducted}</span>
                  <span>Absent (including default): {sub.absent} · Mass Bunked: {sub.massbunk} · Cancelled: {sub.cancelled}</span>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem' }}>
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
            <div className="glass-panel" style={{ padding: '20px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 14px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Archive size={18} color="var(--primary)" /> Past Semester Records ({archivedSemesters.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {archivedSemesters.map((arch) => (
                  <div key={arch.id} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>Semester ({arch.startDate} to {arch.endDate})</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: 2 }}>
                        Overall Score: {arch.percentage}% ({arch.totalAttended} / {arch.totalConducted} classes attended)
                      </span>
                    </div>
                    <button onClick={() => handleDeleteArchive(arch.id)} className="btn btn-secondary btn-sm" style={{ color: '#f87171' }}>
                      <Trash2 size={13} /> Delete Record
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* START NEW SEMESTER MODAL */}
      {showEndSemModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '440px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={18} color="var(--primary)" /> End & Start New Semester
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Ending the semester will archive your current stats and <strong>delete all current timetable routines and daily logs</strong> so you can build a clean new schedule.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmNewSemester(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>New Semester Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={tempStartDateInput}
                  onChange={(e) => setTempStartDateInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEndSemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Clear Routine & Start Semester</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE START DATE MODAL */}
      {showStartDateModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '420px', textAlign: 'left' }}>
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
