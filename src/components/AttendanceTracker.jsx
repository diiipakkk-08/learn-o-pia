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
  AlertTriangle,
  Share2,
  Download,
  Copy,
  Code,
  Check,
  Upload,
  X,
  Zap
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

// Robust Parser & Sanitizer for Raw / AI-generated Routine JSON
function sanitizeAndFormatRoutineJson(rawJson) {
  let parsed = rawJson;
  if (typeof rawJson === 'string') {
    try {
      parsed = JSON.parse(rawJson);
    } catch (err) {
      throw new Error('Invalid JSON format. Please paste valid JSON text.');
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Provided input is not a valid JSON object.');
  }

  // Handle various formats: { routine: { ... } }, { weeklySchedule: { ... } }, { timetable: { ... } }, or direct day mapping
  const routineObj = parsed.routine || parsed.weeklySchedule || parsed.timetable || parsed;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const formattedRoutine = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  };

  let totalClassesCount = 0;

  for (const day of DAYS) {
    const key = Object.keys(routineObj).find(k => k.toLowerCase() === day.toLowerCase());
    const dayList = key && Array.isArray(routineObj[key]) ? routineObj[key] : [];

    formattedRoutine[day] = dayList.map((item, idx) => {
      totalClassesCount++;
      const subject = item.subject || item.name || item.course || item.title || `Class ${idx + 1}`;
      const startTime24 = item.startTime24 || item.time24 || item.start || '09:00';
      const durationHours = parseInt(item.durationHours ?? item.hours ?? 1, 10);
      const durationMins = parseInt(item.durationMins ?? item.mins ?? 0, 10);
      const room = item.room || item.venue || item.location || '';
      const minTarget = parseInt(item.minTarget ?? item.target ?? 75, 10);

      const isLab = Boolean(item.isLab || item.lab || (subject && String(subject).toLowerCase().includes('lab')));
      const rawPoints = item.points ? parseInt(item.points, 10) : (isLab ? 2 : 1);
      const points = isNaN(rawPoints) ? (isLab ? 2 : 1) : Math.max(1, Math.min(10, rawPoints));

      const startTime = item.startTime || format12HourTime(startTime24);
      const endTime = item.endTime || calculateEndTimeFromHM(startTime24, durationHours, durationMins);
      const durationText = item.durationText || formatDurationText(durationHours, durationMins);

      return {
        id: `cls-${day.toLowerCase().slice(0,3)}-${idx}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`,
        subject: String(subject).trim(),
        startTime24,
        durationHours,
        durationMins,
        startTime,
        endTime,
        durationText,
        room: String(room).trim(),
        minTarget,
        isLab,
        points
      };
    });
  }

  if (totalClassesCount === 0) {
    throw new Error('No valid class schedules found under Monday - Sunday in the provided JSON.');
  }

  const semesterStartDate = parsed.semester_start_date || parsed.semesterStartDate || null;

  return { routine: formattedRoutine, semesterStartDate, totalClassesCount };
}

// Runtime sanitizer to guarantee every single class object has a deterministic unique ID
function ensureRoutineHasUniqueIds(routineObj) {
  if (!routineObj || typeof routineObj !== 'object') return DEFAULT_ROUTINE;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sanitized = {};

  for (const day of DAYS) {
    const list = Array.isArray(routineObj[day]) ? routineObj[day] : [];
    sanitized[day] = list.map((item, idx) => {
      const subject = item.subject || item.name || item.course || item.title || `Class ${idx + 1}`;
      const cleanSubject = String(subject).trim();
      const startTime24 = item.startTime24 || item.time24 || item.start || '09:00';
      const durationHours = parseInt(item.durationHours ?? item.hours ?? 1, 10);
      const durationMins = parseInt(item.durationMins ?? item.mins ?? 0, 10);
      const room = item.room || item.venue || item.location || '';
      const minTarget = parseInt(item.minTarget ?? item.target ?? 75, 10);

      const isLab = Boolean(item.isLab || item.lab || (cleanSubject && cleanSubject.toLowerCase().includes('lab')));
      const rawPoints = item.points ? parseInt(item.points, 10) : (isLab ? 2 : 1);
      const points = isNaN(rawPoints) ? (isLab ? 2 : 1) : Math.max(1, Math.min(10, rawPoints));

      const startTime = item.startTime || format12HourTime(startTime24);
      const endTime = item.endTime || calculateEndTimeFromHM(startTime24, durationHours, durationMins);
      const durationText = item.durationText || formatDurationText(durationHours, durationMins);

      // Deterministic unique ID for every class item
      const uniqueId = item.id || `cls-${day.toLowerCase().slice(0,3)}-${idx}-${cleanSubject.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      return {
        ...item,
        id: uniqueId,
        subject: cleanSubject,
        startTime24,
        durationHours,
        durationMins,
        startTime,
        endTime,
        durationText,
        room: String(room).trim(),
        minTarget,
        isLab,
        points
      };
    });
  }
  return sanitized;
}

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
    saveUserArchivesToDb,
    createSharedRoutine,
    getSharedRoutineByCode
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
  const classDurationKey = `learnopia_class_duration_mins_${userId}`;

  // Class Duration Setting (in minutes per point/class)
  const [classDurationMins, setClassDurationMins] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(classDurationKey) || localStorage.getItem('learnopia_class_duration_mins');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num > 0) return num;
      }
    }
    return 55;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(classDurationKey, classDurationMins.toString());
      localStorage.setItem('learnopia_class_duration_mins', classDurationMins.toString());
    }
  }, [classDurationMins, classDurationKey]);

  // Sharing & Import States
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeShareCode, setActiveShareCode] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // Admin / Owner JSON Importer Modal State
  const [showAdminJsonModal, setShowAdminJsonModal] = useState(false);
  const [adminJsonInput, setAdminJsonInput] = useState('');
  const [adminJsonError, setAdminJsonError] = useState('');
  const [adminGeneratedCode, setAdminGeneratedCode] = useState('');
  const [adminCodeCopied, setAdminCodeCopied] = useState(false);

  const [routineToast, setRoutineToast] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const handleOpenShareModal = async () => {
    setShareLoading(true);
    try {
      if (createSharedRoutine) {
        const code = await createSharedRoutine(routine, semesterStartDate, `${currentUser?.name || 'Student'}'s Routine`);
        setActiveShareCode(code);
        setShareCopied(false);
        setShowShareModal(true);
      }
    } catch (err) {
      console.warn('Share error:', err);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareCode = () => {
    if (activeShareCode && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(activeShareCode);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  const handleImportByCode = async (e) => {
    e.preventDefault();
    setImportError('');
    if (!importCodeInput.trim()) return;

    setImportLoading(true);
    try {
      const data = await getSharedRoutineByCode(importCodeInput.trim());
      if (!data || !data.routine) {
        setImportError('Routine ID not found. Please verify the 6-character code and try again.');
        return;
      }

      const sanitizedImport = sanitizeAndFormatRoutineJson(data.routine);
      setRoutine(sanitizedImport.routine);
      if (data.semesterStartDate || sanitizedImport.semesterStartDate) {
        const startDt = data.semesterStartDate || sanitizedImport.semesterStartDate;
        setSemesterStartDate(startDt);
        setTempStartDateInput(startDt);
      }

      setShowImportModal(false);
      setImportCodeInput('');
      setRoutineToast(`✅ Routine (${data.shareCode}) successfully imported!`);
      setTimeout(() => setRoutineToast(''), 4500);
    } catch (err) {
      setImportError(err?.message || 'Failed to load routine. Please check the ID.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleAdminGenerateFromJson = async (e) => {
    e.preventDefault();
    setAdminJsonError('');
    if (!adminJsonInput.trim()) return;

    try {
      const sanitized = sanitizeAndFormatRoutineJson(adminJsonInput.trim());
      const code = await createSharedRoutine(sanitized.routine, sanitized.semesterStartDate, 'Admin Curated Routine');
      setAdminGeneratedCode(code);
      setAdminCodeCopied(false);
      setRoutineToast(`✅ Routine ID ${code} generated and saved!`);
      setTimeout(() => setRoutineToast(''), 4500);
    } catch (err) {
      setAdminJsonError(err.message || 'Invalid routine JSON format.');
    }
  };

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

  // Extra Class Logger Form State
  const [showExtraClassForm, setShowExtraClassForm] = useState(false);
  const [extraSubName, setExtraSubName] = useState('');
  const [extraCustomSubName, setExtraCustomSubName] = useState('');
  const [extraStartTime24, setExtraStartTime24] = useState('10:00');
  const [extraDurationHours, setExtraDurationHours] = useState('1');
  const [extraDurationMins, setExtraDurationMins] = useState('0');
  const [extraRoom, setExtraRoom] = useState('Google Meet / Online');

  const allRoutineSubjects = useMemo(() => {
    const subs = new Set();
    Object.values(routine || {}).forEach((dayList) => {
      (dayList || []).forEach((cls) => {
        if (cls.subject) subs.add(cls.subject);
      });
    });
    return Array.from(subs);
  }, [routine]);

  const todayStr = formatLocalDate(new Date());
  const isSelectedPastDay = selectedDate < todayStr;

  const activeRoutine = useMemo(() => ensureRoutineHasUniqueIds(routine), [routine]);

  const dateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const dayName = useMemo(() => DAYS_OF_WEEK[dateObj.getDay()], [dateObj]);

  const scheduledToday = useMemo(() => sortClassesByTime(activeRoutine[dayName] || []), [activeRoutine, dayName]);
  const dayLog = useMemo(() => logs[selectedDate] || { isHoliday: false, classes: {}, extraClasses: [] }, [logs, selectedDate]);

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
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {}, extraClasses: [] };
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
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {}, extraClasses: [] };
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

  // Add One-Time Extra Class for selectedDate
  const handleAddExtraClass = (e) => {
    e.preventDefault();
    const finalSubject = (extraSubName === '__custom__' ? extraCustomSubName : extraSubName).trim();
    if (!finalSubject) return;

    const startTimeFormatted = format12HourTime(extraStartTime24);
    const endTimeFormatted = calculateEndTimeFromHM(extraStartTime24, extraDurationHours, extraDurationMins);
    const totalMins = (parseInt(extraDurationHours, 10) || 0) * 60 + (parseInt(extraDurationMins, 10) || 0);

    const newExtraClass = {
      id: `ext-${Date.now()}`,
      subject: finalSubject,
      startTime24: extraStartTime24,
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      durationHours: extraDurationHours,
      durationMins: extraDurationMins,
      durationText: formatDurationText(extraDurationHours, extraDurationMins),
      duration: totalMins || 60,
      room: extraRoom.trim() || 'Google Meet / Online',
      status: 'attended'
    };

    setLogs((prev) => {
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {}, extraClasses: [] };
      const currentExtra = currentDay.extraClasses || [];

      const updatedLogs = {
        ...prev,
        [selectedDate]: {
          ...currentDay,
          extraClasses: [...currentExtra, newExtraClass]
        }
      };

      if (userId && saveUserLogsToDb) {
        saveUserLogsToDb(userId, updatedLogs);
      }

      return updatedLogs;
    });

    setExtraSubName('');
    setExtraCustomSubName('');
    setShowExtraClassForm(false);
  };

  // Toggle Extra Class Attendance Status
  const markExtraClassStatus = (extraId, status) => {
    setLogs((prev) => {
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {}, extraClasses: [] };
      const currentExtra = currentDay.extraClasses || [];

      const updatedExtra = currentExtra.map((cls) => {
        if (cls.id === extraId) {
          return {
            ...cls,
            status: cls.status === status ? null : status
          };
        }
        return cls;
      });

      const updatedLogs = {
        ...prev,
        [selectedDate]: {
          ...currentDay,
          extraClasses: updatedExtra
        }
      };

      if (userId && saveUserLogsToDb) {
        saveUserLogsToDb(userId, updatedLogs);
      }

      return updatedLogs;
    });
  };

  // Delete Extra Class
  const handleDeleteExtraClass = (extraId) => {
    setLogs((prev) => {
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {}, extraClasses: [] };
      const currentExtra = currentDay.extraClasses || [];

      const updatedLogs = {
        ...prev,
        [selectedDate]: {
          ...currentDay,
          extraClasses: currentExtra.filter((cls) => cls.id !== extraId)
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

  // Dynamically Update Subject Weight / Lab Status across Routine (Data-safe & Backward Compatible)
  const handleUpdateSubjectConfig = (subName, newPoints, newIsLab) => {
    setRoutine((prevRoutine) => {
      const updatedRoutine = {};
      const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      for (const day of DAYS) {
        const list = prevRoutine[day] || [];
        updatedRoutine[day] = list.map((cls) => {
          if (cls.subject === subName) {
            return {
              ...cls,
              points: newPoints !== undefined && newPoints !== null ? Math.max(1, Math.min(10, parseInt(newPoints, 10) || 1)) : (cls.points || 1),
              isLab: newIsLab !== undefined ? Boolean(newIsLab) : Boolean(cls.isLab)
            };
          }
          return cls;
        });
      }
      if (userId && saveUserRoutineToDb) {
        saveUserRoutineToDb(userId, updatedRoutine, semesterStartDate);
      }
      return updatedRoutine;
    });
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

    Object.values(activeRoutine).forEach((dayList) => {
      dayList.forEach((cls) => {
        if (!statsMap[cls.subject]) {
          statsMap[cls.subject] = {
            subject: cls.subject,
            // Count of physical sessions (classes or labs)
            attendedCount: 0,
            absentCount: 0,
            massbunkCount: 0,
            cancelledCount: 0,
            totalConductedCount: 0,
            // Weighted points (used in backend calculation for attendance %)
            attendedPoints: 0,
            absentPoints: 0,
            massbunkPoints: 0,
            totalConductedPoints: 0,

            target: cls.minTarget || 75,
            points: cls.points || 1,
            isLab: Boolean(cls.isLab)
          };
        } else {
          if (cls.points) statsMap[cls.subject].points = cls.points;
          if (cls.isLab !== undefined) statsMap[cls.subject].isLab = cls.isLab;
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
      const dayClasses = activeRoutine[dName] || [];
      const logData = logs[dateStr] || { isHoliday: false, classes: {} };

      if (!logData.isHoliday && dayClasses.length > 0) {
        dayClasses.forEach((cls) => {
          if (statsMap[cls.subject]) {
            const status = logData.classes ? logData.classes[cls.id] : undefined;
            const pts = parseInt(cls.points || statsMap[cls.subject].points || 1, 10);

            if (status === 'attended') {
              statsMap[cls.subject].attendedCount += 1;
              statsMap[cls.subject].totalConductedCount += 1;
              statsMap[cls.subject].attendedPoints += pts;
              statsMap[cls.subject].totalConductedPoints += pts;
            } else if (status === 'cancelled') {
              statsMap[cls.subject].cancelledCount += 1;
            } else if (status === 'massbunk') {
              statsMap[cls.subject].massbunkCount += 1;
              statsMap[cls.subject].totalConductedCount += 1;
              statsMap[cls.subject].massbunkPoints += pts;
              statsMap[cls.subject].totalConductedPoints += pts;
            } else if (status === 'absent' || (!status && isPast)) {
              // UNMARKED PASSED DAYS ONLY -> DEFAULT ABSENT
              statsMap[cls.subject].absentCount += 1;
              statsMap[cls.subject].totalConductedCount += 1;
              statsMap[cls.subject].absentPoints += pts;
              statsMap[cls.subject].totalConductedPoints += pts;
            }
            // Unmarked TODAY or FUTURE days remain pending and do NOT penalize attendance!
          }
        });
      }

      // Also process extra classes logged on this date
      if (logData.extraClasses && Array.isArray(logData.extraClasses)) {
        logData.extraClasses.forEach((extCls) => {
          if (!extCls.subject) return;
          if (!statsMap[extCls.subject]) {
            statsMap[extCls.subject] = {
              subject: extCls.subject,
              attendedCount: 0,
              absentCount: 0,
              massbunkCount: 0,
              cancelledCount: 0,
              totalConductedCount: 0,
              attendedPoints: 0,
              absentPoints: 0,
              massbunkPoints: 0,
              totalConductedPoints: 0,
              target: 75,
              points: extCls.points || 1,
              isLab: Boolean(extCls.isLab)
            };
          }

          const status = extCls.status;
          const pts = parseInt(extCls.points || statsMap[extCls.subject].points || 1, 10);

          if (status === 'attended') {
            statsMap[extCls.subject].attendedCount += 1;
            statsMap[extCls.subject].totalConductedCount += 1;
            statsMap[extCls.subject].attendedPoints += pts;
            statsMap[extCls.subject].totalConductedPoints += pts;
          } else if (status === 'cancelled') {
            statsMap[extCls.subject].cancelledCount += 1;
          } else if (status === 'massbunk') {
            statsMap[extCls.subject].massbunkCount += 1;
            statsMap[extCls.subject].totalConductedCount += 1;
            statsMap[extCls.subject].massbunkPoints += pts;
            statsMap[extCls.subject].totalConductedPoints += pts;
          } else if (status === 'absent') {
            statsMap[extCls.subject].absentCount += 1;
            statsMap[extCls.subject].totalConductedCount += 1;
            statsMap[extCls.subject].absentPoints += pts;
            statsMap[extCls.subject].totalConductedPoints += pts;
          }
        });
      }

      curr.setDate(curr.getDate() + 1);
    }

    return Object.values(statsMap).map((item) => {
      const pct = item.totalConductedPoints > 0 ? Math.round((item.attendedPoints / item.totalConductedPoints) * 100) : 100;
      const targetDecimal = item.target / 100;
      const pts = Math.max(1, parseInt(item.points, 10) || 1);

      let safeBunks = 0;
      let neededClasses = 0;

      if (pct >= item.target) {
        // Number of upcoming sessions of weight pts that can be bunked
        safeBunks = Math.floor((item.attendedPoints - targetDecimal * item.totalConductedPoints) / (targetDecimal * pts));
        if (safeBunks < 0) safeBunks = 0;
      } else {
        // Number of upcoming sessions of weight pts that must be attended
        neededClasses = Math.ceil((targetDecimal * item.totalConductedPoints - item.attendedPoints) / (pts * (1 - targetDecimal)));
        if (neededClasses < 0) neededClasses = 0;
      }

      return {
        ...item,
        // Backward-compatible fields
        attended: item.attendedCount,
        absent: item.absentCount,
        massbunk: item.massbunkCount,
        cancelled: item.cancelledCount,
        totalConducted: item.totalConductedCount,
        percentage: pct,
        safeBunks,
        neededClasses,
        isAlert: pct < item.target
      };
    });
  }, [routine, logs, semesterStartDate, selectedDate, todayStr]);

  // Overall Total Summary & Multi-Metric Breakdown
  const overallStats = useMemo(() => {
    let totAttendedCount = 0;
    let totAbsentCount = 0;
    let totMassBunkCount = 0;
    let totCancelledCount = 0;
    let totConductedCount = 0;

    let totAttendedPoints = 0;
    let totAbsentPoints = 0;
    let totMassBunkPoints = 0;
    let totConductedPoints = 0;

    let theoryAttendedCount = 0;
    let theoryConductedCount = 0;
    let theoryAbsentCount = 0;
    let theoryMassBunkCount = 0;
    let theoryAttendedPoints = 0;
    let theoryConductedPoints = 0;

    let labAttendedCount = 0;
    let labConductedCount = 0;
    let labAbsentCount = 0;
    let labMassBunkCount = 0;
    let labAttendedPoints = 0;
    let labConductedPoints = 0;

    subjectAnalytics.forEach((s) => {
      totAttendedCount += s.attendedCount;
      totAbsentCount += s.absentCount;
      totMassBunkCount += s.massbunkCount;
      totCancelledCount += s.cancelledCount;
      totConductedCount += s.totalConductedCount;

      totAttendedPoints += s.attendedPoints;
      totAbsentPoints += s.absentPoints;
      totMassBunkPoints += s.massbunkPoints;
      totConductedPoints += s.totalConductedPoints;

      if (s.isLab) {
        labAttendedCount += s.attendedCount;
        labConductedCount += s.totalConductedCount;
        labAbsentCount += s.absentCount;
        labMassBunkCount += s.massbunkCount;

        labAttendedPoints += s.attendedPoints;
        labConductedPoints += s.totalConductedPoints;
      } else {
        theoryAttendedCount += s.attendedCount;
        theoryConductedCount += s.totalConductedCount;
        theoryAbsentCount += s.absentCount;
        theoryMassBunkCount += s.massbunkCount;

        theoryAttendedPoints += s.attendedPoints;
        theoryConductedPoints += s.totalConductedPoints;
      }
    });

    const pctOfficial = totConductedPoints > 0 ? Math.round((totAttendedPoints / totConductedPoints) * 100) : 100;
    const conductedPointsWithoutMassBunks = totConductedPoints - totMassBunkPoints;
    const pctWithoutMassBunks = conductedPointsWithoutMassBunks > 0 ? Math.round((totAttendedPoints / conductedPointsWithoutMassBunks) * 100) : 100;

    const theoryPct = theoryConductedPoints > 0 ? Math.round((theoryAttendedPoints / theoryConductedPoints) * 100) : null;
    const labPct = labConductedPoints > 0 ? Math.round((labAttendedPoints / labConductedPoints) * 100) : null;

    const totalMinutesStudied = totAttendedPoints * classDurationMins;
    const hoursStudied = Math.floor(totalMinutesStudied / 60);
    const minsStudied = totalMinutesStudied % 60;
    const hoursStudiedText = hoursStudied > 0 
      ? `${hoursStudied}h ${minsStudied}m` 
      : `${minsStudied} mins`;

    return { 
      totAttendedCount, 
      totAbsentCount, 
      totMassBunkCount, 
      totCancelledCount, 
      totConductedCount, 
      totAttendedPoints,
      totAbsentPoints,
      totMassBunkPoints,
      totConductedPoints,
      pct: pctOfficial, 
      pctWithoutMassBunks,
      theoryAttendedCount,
      theoryConductedCount,
      theoryAbsentCount,
      theoryMassBunkCount,
      theoryAttendedPoints,
      theoryConductedPoints,
      theoryPct,
      labAttendedCount,
      labConductedCount,
      labAbsentCount,
      labMassBunkCount,
      labAttendedPoints,
      labConductedPoints,
      labPct,
      totalMinutesStudied,
      hoursStudied,
      minsStudied,
      hoursStudiedText,
      // Backward compatibility fields
      totAttended: totAttendedCount,
      totAbsent: totAbsentCount,
      totMassBunk: totMassBunkCount,
      totCancelled: totCancelledCount,
      totConducted: totConductedCount,
      theoryAttended: theoryAttendedCount,
      theoryConducted: theoryConductedCount,
      labAttended: labAttendedCount,
      labConducted: labConductedCount
    };
  }, [subjectAnalytics, classDurationMins]);

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
      {/* Consolidated Top Action & Navigation Bar */}
      <div className="glass-panel" style={{
        padding: isMobile ? '10px 14px' : '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Left Side: Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'tracker' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tracker')}
            style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', padding: '6px 12px' }}
          >
            <CalendarCheck size={15} /> {isMobile ? 'Logger' : 'Daily Logger'}
          </button>
          <button
            className={`btn ${activeTab === 'routine' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('routine')}
            style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', padding: '6px 12px' }}
          >
            <Settings size={15} /> {isMobile ? 'Timetable' : 'Weekly Timetable'}
          </button>
          <button
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('analytics')}
            style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', padding: '6px 12px' }}
          >
            <TrendingUp size={15} /> {isMobile ? 'Analytics' : 'Analytics'}
          </button>
        </div>

        {/* Right Side: Semester Date & New Semester Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Calendar size={14} color="var(--primary)" />
            <span>Started: <strong>{semesterStartDate}</strong></span>
            <button
              onClick={() => { setTempStartDateInput(semesterStartDate); setShowStartDateModal(true); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.75rem' }}
            >
              Change
            </button>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setTempStartDateInput(formatLocalDate(new Date())); setShowEndSemModal(true); }}
            style={{ fontSize: '0.75rem', padding: '5px 10px' }}
            title="Reset schedule & start fresh semester"
          >
            <RefreshCw size={13} /> {isMobile ? 'New Sem' : 'New Semester'}
          </button>
        </div>
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
                  const rawStatus = dayLog.classes ? dayLog.classes[cls.id] : undefined;
                  const status = rawStatus;
                  const isWeighted = (cls.points || 1) > 1;

                  // Background & Border styling
                  let bgStyle = 'rgba(255,255,255,0.02)';
                  let borderStyle = '1px solid rgba(255,255,255,0.06)';

                  if (status === 'attended') {
                    if (isWeighted) {
                      bgStyle = 'rgba(59,130,246,0.12)';
                      borderStyle = '1px solid rgba(59,130,246,0.4)';
                    } else {
                      bgStyle = 'rgba(16,185,129,0.08)';
                      borderStyle = '1px solid rgba(16,185,129,0.2)';
                    }
                  } else if (status === 'massbunk') {
                    bgStyle = 'rgba(245,158,11,0.08)';
                    borderStyle = '1px solid rgba(245,158,11,0.2)';
                  } else if (status === 'cancelled') {
                    bgStyle = 'rgba(255,255,255,0.03)';
                    borderStyle = '1px solid rgba(255,255,255,0.08)';
                  } else if (status === 'absent') {
                    bgStyle = 'rgba(239,68,68,0.08)';
                    borderStyle = '1px solid rgba(239,68,68,0.2)';
                  }

                  return (
                    <div
                      key={cls.id}
                      style={{
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        borderRadius: '10px',
                        background: bgStyle,
                        border: borderStyle,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        justifyContent: isMobile ? 'flex-start' : 'space-between',
                        gap: isMobile ? '8px' : '10px'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ color: '#ffffff', fontSize: isMobile ? '0.85rem' : '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.subject}</strong>
                          {cls.isLab && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(139,92,246,0.25)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              🧪 LAB
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.65rem',
                            background: isWeighted ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)',
                            color: isWeighted ? '#93c5fd' : 'var(--text-secondary)',
                            border: isWeighted ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.12)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            {cls.points || 1} {(cls.points || 1) === 1 ? 'Pt' : 'Pts'}
                          </span>
                        </div>
                        <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cls.startTime} - {cls.endTime} ({cls.durationText || `${cls.duration || 60}m`}) · {cls.room}
                        </span>
                        {!rawStatus && isSelectedPastDay && (
                          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500, marginTop: 2 }}>
                            (Unmarked past class · Defaults to absent in percentage)
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
                          className={`btn ${rawStatus === 'absent' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: isMobile ? '4px 8px' : '4px 8px', color: rawStatus === 'absent' ? '#f87171' : undefined, flex: isMobile ? '1 1 auto' : 'none', minWidth: isMobile ? '70px' : undefined }}
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

            {/* Extra Classes Section for selectedDate */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: isMobile ? '0.88rem' : '0.95rem', color: '#ffffff', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={isMobile ? 14 : 16} color="#f59e0b" /> One-Time Extra Classes ({dayLog.extraClasses?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowExtraClassForm((prev) => !prev)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', padding: '4px 10px', gap: '4px', borderColor: 'rgba(245,158,11,0.4)', color: '#fcd34d' }}
                >
                  {showExtraClassForm ? <X size={12} /> : <Plus size={12} />}
                  {showExtraClassForm ? 'Cancel' : '+ Add Extra Class'}
                </button>
              </div>

              {/* Inline Form to Add Extra Class */}
              {showExtraClassForm && (
                <form
                  onSubmit={handleAddExtraClass}
                  style={{
                    padding: isMobile ? '12px' : '16px',
                    borderRadius: '12px',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                  className="animate-fade-in"
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fcd34d' }}>
                    ⚡ Log One-Time Extra Class for {selectedDate}
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Select Subject</label>
                      <select
                        value={extraSubName}
                        onChange={(e) => setExtraSubName(e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        required
                      >
                        <option value="">Choose Subject...</option>
                        {allRoutineSubjects.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                        <option value="__custom__">+ Add Custom Subject Name</option>
                      </select>
                    </div>

                    {extraSubName === '__custom__' && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Custom Subject Name</label>
                        <input
                          type="text"
                          value={extraCustomSubName}
                          onChange={(e) => setExtraCustomSubName(e.target.value)}
                          placeholder="e.g. Quantum Physics Seminar"
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Start Time</label>
                      <input
                        type="time"
                        value={extraStartTime24}
                        onChange={(e) => setExtraStartTime24(e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Duration</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select value={extraDurationHours} onChange={(e) => setExtraDurationHours(e.target.value)} className="form-input" style={{ padding: '6px 4px', fontSize: '0.78rem' }}>
                          {[0, 1, 2, 3, 4].map(h => <option key={h} value={h}>{h}h</option>)}
                        </select>
                        <select value={extraDurationMins} onChange={(e) => setExtraDurationMins(e.target.value)} className="form-input" style={{ padding: '6px 4px', fontSize: '0.78rem' }}>
                          <option value="0">0m</option>
                          <option value="15">15m</option>
                          <option value="30">30m</option>
                          <option value="45">45m</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, gridColumn: isMobile ? 'span 2' : 'span 1' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Platform / Room</label>
                      <input
                        type="text"
                        value={extraRoom}
                        onChange={(e) => setExtraRoom(e.target.value)}
                        placeholder="Google Meet / Room 302"
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button type="button" onClick={() => setShowExtraClassForm(false)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 14px', fontSize: '0.75rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      Save Extra Class
                    </button>
                  </div>
                </form>
              )}

              {/* Extra Classes Render List */}
              {(!dayLog.extraClasses || dayLog.extraClasses.length === 0) ? (
                <p style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  No extra classes logged for {selectedDate}. Click "+ Add Extra Class" above if your teacher conducted an online or extra lecture.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayLog.extraClasses.map((extCls) => {
                    const status = extCls.status;
                    return (
                      <div
                        key={extCls.id}
                        style={{
                          padding: isMobile ? '10px 12px' : '12px 16px',
                          borderRadius: '10px',
                          background: status === 'attended' ? 'rgba(16,185,129,0.08)' : status === 'massbunk' ? 'rgba(245,158,11,0.08)' : status === 'cancelled' ? 'rgba(255,255,255,0.03)' : status === 'absent' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.03)',
                          border: status === 'attended' ? '1px solid rgba(16,185,129,0.3)' : status === 'massbunk' ? '1px solid rgba(245,158,11,0.3)' : status === 'cancelled' ? '1px solid rgba(255,255,255,0.08)' : status === 'absent' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.2)',
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-start' : 'center',
                          justifyContent: isMobile ? 'flex-start' : 'space-between',
                          gap: isMobile ? '8px' : '10px'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ color: '#ffffff', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>{extCls.subject}</strong>
                            <span className="badge" style={{ fontSize: '0.6rem', background: 'rgba(245,158,11,0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.4)' }}>
                              ⚡ Extra Class
                            </span>
                          </div>
                          <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            {extCls.startTime} - {extCls.endTime} ({extCls.durationText || `${extCls.duration || 60}m`}) · {extCls.room}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: isMobile ? '4px' : '6px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => markExtraClassStatus(extCls.id, 'attended')}
                            className={`btn ${status === 'attended' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: '4px 8px', flex: isMobile ? '1 1 auto' : 'none' }}
                          >
                            <CheckCircle2 size={isMobile ? 11 : 13} /> {isMobile ? 'P' : 'Present'}
                          </button>
                          <button
                            onClick={() => markExtraClassStatus(extCls.id, 'absent')}
                            className={`btn ${status === 'absent' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: '4px 8px', color: status === 'absent' ? '#f87171' : undefined, flex: isMobile ? '1 1 auto' : 'none' }}
                          >
                            <XCircle size={isMobile ? 11 : 13} /> {isMobile ? 'A' : 'Absent'}
                          </button>
                          <button
                            onClick={() => markExtraClassStatus(extCls.id, 'massbunk')}
                            className={`btn ${status === 'massbunk' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: '4px 8px', color: status === 'massbunk' ? '#f59e0b' : undefined, flex: isMobile ? '1 1 auto' : 'none' }}
                          >
                            <Users size={isMobile ? 11 : 13} /> {isMobile ? 'MB' : 'Mass Bunk'}
                          </button>
                          <button
                            onClick={() => markExtraClassStatus(extCls.id, 'cancelled')}
                            className={`btn ${status === 'cancelled' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', padding: '4px 8px', flex: isMobile ? '1 1 auto' : 'none' }}
                          >
                            <MinusCircle size={isMobile ? 11 : 13} /> {isMobile ? 'X' : 'Cancelled'}
                          </button>
                          <button
                            onClick={() => handleDeleteExtraClass(extCls.id)}
                            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                            title="Delete Extra Class"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                Review schedule, share unique Routine ID, or load classmate's routine.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleOpenShareModal}
                disabled={shareLoading}
                className="btn btn-secondary"
                style={{ padding: isMobile ? '7px 12px' : '8px 16px', fontSize: isMobile ? '0.78rem' : '0.84rem', gap: '6px' }}
                title="Share your routine ID with classmates"
              >
                <Share2 size={15} color="var(--primary)" />
                {shareLoading ? 'Generating...' : 'Share Routine ID'}
              </button>

              <button
                type="button"
                onClick={() => { setImportError(''); setImportCodeInput(''); setShowImportModal(true); }}
                className="btn btn-secondary"
                style={{ padding: isMobile ? '7px 12px' : '8px 16px', fontSize: isMobile ? '0.78rem' : '0.84rem', gap: '6px' }}
                title="Import a routine shared by a friend"
              >
                <Download size={15} color="#10b981" />
                Import Routine
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => { setAdminJsonError(''); setAdminGeneratedCode(''); setShowAdminJsonModal(true); }}
                  className="btn btn-secondary"
                  style={{
                    padding: isMobile ? '7px 12px' : '8px 16px',
                    fontSize: isMobile ? '0.78rem' : '0.84rem',
                    gap: '6px',
                    borderColor: 'rgba(139,92,246,0.4)',
                    background: 'rgba(139,92,246,0.1)',
                    color: '#c4b5fd'
                  }}
                  title="Admin AI / JSON Routine Importer"
                >
                  <Code size={15} color="#c4b5fd" />
                  Admin JSON Importer
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAddClassForm(prev => !prev)}
                className="btn btn-primary"
                style={{ padding: isMobile ? '8px 14px' : '9px 18px', fontSize: isMobile ? '0.8rem' : '0.86rem', gap: '6px' }}
              >
                {showAddClassForm ? <X size={16} /> : <Plus size={16} />}
                {showAddClassForm ? 'Hide Form' : '+ Add Class'}
              </button>
            </div>
          </div>

          {routineToast && (
            <div style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }} className="animate-fade-in">
              <CheckCircle2 size={16} /> {routineToast}
            </div>
          )}

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
          {/* OVERALL ANALYTICS DASHBOARD */}
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '22px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: isMobile ? '1rem' : '1.15rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <TrendingUp size={isMobile ? 18 : 20} color="var(--primary)" /> Attendance Analytics & Time Log
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Clock size={14} color="#a78bfa" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Class Length:</span>
                <select
                  value={classDurationMins}
                  onChange={(e) => setClassDurationMins(parseInt(e.target.value, 10) || 55)}
                  style={{ background: '#11121c', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '6px', fontSize: '0.72rem', padding: '2px 6px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                >
                  {[30, 45, 50, 55, 60, 75, 90, 120].map((m) => (
                    <option key={m} value={m}>{m} Mins / Pt</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4 PRIMARY METRIC CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '14px' }}>
              {/* Card 1: Total Attendance (Weighted %) */}
              <div style={{ padding: isMobile ? '12px' : '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Attendance</div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: 800, color: overallStats.pct < 75 ? '#f87171' : '#34d399', margin: '4px 0' }}>
                  {overallStats.pct}%
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {overallStats.totAttendedCount} / {overallStats.totConductedCount} sessions attended
                </div>
              </div>

              {/* Card 2: Theory Attendance % */}
              <div style={{ padding: isMobile ? '12px' : '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📖 Theory Attendance
                </div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: 800, color: overallStats.theoryPct === null ? 'var(--text-muted)' : overallStats.theoryPct < 75 ? '#f87171' : '#34d399', margin: '4px 0' }}>
                  {overallStats.theoryPct !== null ? `${overallStats.theoryPct}%` : 'N/A'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {overallStats.theoryAttendedCount} / {overallStats.theoryConductedCount} classes attended
                </div>
              </div>

              {/* Card 3: Class Labs Attendance % */}
              <div style={{ padding: isMobile ? '12px' : '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🧪 Class Labs
                </div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: 800, color: overallStats.labPct === null ? 'var(--text-muted)' : overallStats.labPct < 75 ? '#f87171' : '#60a5fa', margin: '4px 0' }}>
                  {overallStats.labPct !== null ? `${overallStats.labPct}%` : 'N/A'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {overallStats.labAttendedCount} / {overallStats.labConductedCount} labs attended
                </div>
              </div>

              {/* Card 4: Hours & Minutes Spent in College */}
              <div style={{ padding: isMobile ? '12px' : '16px', borderRadius: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: '#93c5fd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Timer size={13} color="#60a5fa" /> Hours Studied in Class
                </div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight: 800, color: '#60a5fa', margin: '4px 0' }}>
                  {overallStats.hoursStudiedText}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  ({overallStats.totalMinutesStudied} mins · {classDurationMins}m / class)
                </div>
              </div>
            </div>

            {/* SECONDARY ROW: DETAILED COUNTS & MASS BUNK STATS */}
            <div style={{ 
              marginTop: '16px', 
              paddingTop: '16px', 
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
              gap: '12px' 
            }}>
              <div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: 'var(--text-secondary)' }}>Total Conducted</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 700, color: '#fff' }}>{overallStats.totConductedCount} sessions</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{overallStats.theoryConductedCount} classes, {overallStats.labConductedCount} labs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: 'var(--text-secondary)' }}>Attended</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 700, color: '#34d399' }}>{overallStats.totAttendedCount} sessions</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{overallStats.theoryAttendedCount} classes, {overallStats.labAttendedCount} labs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: 'var(--text-secondary)' }}>Absent</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 700, color: '#f87171' }}>{overallStats.totAbsentCount} sessions</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{overallStats.theoryAbsentCount} classes, {overallStats.labAbsentCount} labs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: 'var(--text-secondary)' }}>Mass Bunks</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 700, color: '#fbbf24' }}>{overallStats.totMassBunkCount} sessions</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{overallStats.theoryMassBunkCount} classes, {overallStats.labMassBunkCount} labs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: 'var(--text-secondary)' }}>Cancelled</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 700, color: '#94a3b8' }}>{overallStats.totCancelledCount}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>classes / labs</div>
              </div>
              <div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', color: 'var(--text-secondary)' }}>No Bunks Score</div>
                <div style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 700, color: overallStats.pctWithoutMassBunks < 75 ? '#f87171' : '#34d399' }}>
                  {overallStats.pctWithoutMassBunks}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>excl. mass bunks</div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', margin: '0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
             Subject-wise Breakdown
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(270px, 1fr))', gap: isMobile ? '12px' : '16px' }}>
            {subjectAnalytics.map((sub) => {
              const isAlert = sub.isAlert;
              const isWeighted = (sub.points || 1) > 1;
              const unitLabel = sub.isLab ? 'lab' : 'class';
              const unitLabelPlural = sub.isLab ? 'labs' : 'classes';

              // Color Theme:
              // Alert -> Red
              // > 1 Pt (or Lab) -> Electric Blue
              // Normal 1 Pt -> Emerald Green
              const cardBorder = isAlert 
                ? '1px solid rgba(239,68,68,0.45)' 
                : isWeighted 
                  ? '1px solid rgba(59,130,246,0.45)' 
                  : '1px solid rgba(16,185,129,0.35)';

              const cardBg = isAlert 
                ? 'rgba(239,68,68,0.06)' 
                : isWeighted 
                  ? 'rgba(59,130,246,0.06)' 
                  : 'rgba(16,185,129,0.05)';

              const pctColor = isAlert 
                ? '#f87171' 
                : isWeighted 
                  ? '#60a5fa' 
                  : '#34d399';

              return (
                <div
                  key={sub.subject}
                  className="glass-panel"
                  style={{
                    padding: isMobile ? '16px' : '20px',
                    borderRadius: '16px',
                    border: cardBorder,
                    background: cardBg
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                      <h4 style={{ fontSize: isMobile ? '0.9rem' : '1rem', margin: 0, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.subject}</h4>
                      {sub.isLab && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(139,92,246,0.25)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          🧪 LAB
                        </span>
                      )}
                      {isWeighted && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.25)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ⚡ Weight: {sub.points} Pts
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color: pctColor }}>
                      {sub.percentage}%
                    </span>
                  </div>

                  {/* Point Weight & Type Selector Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Calculation Weight:</span>
                    <select
                      value={sub.points || 1}
                      onChange={(e) => handleUpdateSubjectConfig(sub.subject, e.target.value, sub.isLab)}
                      style={{ background: '#11121c', color: isWeighted ? '#93c5fd' : '#fff', border: isWeighted ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.72rem', padding: '2px 6px', cursor: 'pointer', outline: 'none', fontWeight: 700 }}
                      title="Point weight used in the backend calculation for attendance percentage"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                        <option key={p} value={p}>
                          {p} {p === 1 ? 'Point' : 'Points'} / {sub.isLab ? 'Lab' : 'Class'}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleUpdateSubjectConfig(sub.subject, sub.points, !sub.isLab)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: sub.isLab ? 'rgba(139,92,246,0.2)' : 'transparent',
                        color: sub.isLab ? '#c4b5fd' : 'var(--text-secondary)',
                        borderColor: sub.isLab ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.15)'
                      }}
                    >
                      {sub.isLab ? '🧪 Lab Active' : '📖 Set as Lab'}
                    </button>
                  </div>

                  <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>Attended: <strong>{sub.attendedCount}</strong> {sub.attendedCount === 1 ? unitLabel : unitLabelPlural} / Conducted: <strong>{sub.totalConductedCount}</strong> {sub.totalConductedCount === 1 ? unitLabel : unitLabelPlural}</span>
                    <span>Absent: <strong>{sub.absentCount}</strong> {sub.absentCount === 1 ? unitLabel : unitLabelPlural} · Mass Bunked: <strong>{sub.massbunkCount}</strong> · Cancelled: <strong>{sub.cancelledCount}</strong></span>
                    {isWeighted && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                        (Backend weight: {sub.attendedPoints} / {sub.totalConductedPoints} pts)
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: isMobile ? '0.7rem' : '0.78rem' }}>
                    {sub.isAlert ? (
                      <span style={{ color: '#f87171', fontWeight: 600 }}>
                        ⚠️ Attendance Alert: You must attend the next <strong>{sub.neededClasses}</strong> {sub.neededClasses === 1 ? unitLabel : unitLabelPlural} to reach {sub.target}%.
                      </span>
                    ) : (
                      <span style={{ color: isWeighted ? '#60a5fa' : '#34d399', fontWeight: 600 }}>
                        ✔ Safe Margin: You can safely bunk up to <strong>{sub.safeBunks}</strong> upcoming {sub.safeBunks === 1 ? unitLabel : unitLabelPlural}.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* 1. SHARE ROUTINE MODAL */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel modal-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={18} color="var(--primary)" /> Share Routine ID
              </h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Share this unique 6-character Routine ID with your classmates. Anyone can paste this code into their Attendance Tracker to instantly load your schedule!
            </p>

            <div style={{ padding: '20px', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: '16px', textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c4b5fd', fontWeight: 700 }}>
                Unique Timetable ID
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.12em', margin: '8px 0', fontFamily: 'monospace' }}>
                {activeShareCode}
              </div>

              <button
                type="button"
                onClick={handleCopyShareCode}
                className="btn btn-primary"
                style={{ margin: '8px auto 0 auto', padding: '10px 20px', fontSize: '0.86rem', gap: 8 }}
              >
                {shareCopied ? <Check size={16} /> : <Copy size={16} />}
                {shareCopied ? 'Copied to Clipboard!' : 'Copy Routine ID'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowShareModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. IMPORT SHARED ROUTINE MODAL */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel modal-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', borderRadius: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={18} color="#10b981" /> Import Routine by ID
              </h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Paste the 6-character Routine ID shared by your classmate or professor to load their timetable into your tracker.
            </p>

            {importError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.8rem', marginBottom: '14px' }}>
                ⚠️ {importError}
              </div>
            )}

            <form onSubmit={handleImportByCode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Enter Routine ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RT-9X4K2A"
                  value={importCodeInput}
                  onChange={(e) => setImportCodeInput(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.08em', fontSize: '1.1rem', textAlign: 'center', padding: '10px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
                <button type="submit" disabled={importLoading} className="btn btn-primary" style={{ padding: '10px 18px' }}>
                  {importLoading ? 'Fetching...' : 'Load & Apply Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADMIN / OWNER JSON ROUTINE CREATOR MODAL */}
      {showAdminJsonModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }} className="animate-fade-in">
          <div className="glass-panel modal-card" style={{ maxWidth: '620px', width: '100%', padding: '24px', borderRadius: '20px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff' }}>Admin / AI JSON Routine Creator</h3>
              </div>
              <button onClick={() => setShowAdminJsonModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '14px' }}>
              Paste routine JSON generated by an AI or exported from another curriculum. The system will validate the schema, clean missing fields, and generate a shareable Routine ID!
            </p>

            {adminJsonError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.8rem', marginBottom: '14px' }}>
                ⚠️ {adminJsonError}
              </div>
            )}

            {adminGeneratedCode ? (
              <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '16px', textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6ee7b7', fontWeight: 700 }}>
                  Generated Routine ID for Students
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.12em', margin: '8px 0', fontFamily: 'monospace' }}>
                  {adminGeneratedCode}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(adminGeneratedCode);
                        setAdminCodeCopied(true);
                        setTimeout(() => setAdminCodeCopied(false), 3000);
                      }
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem', gap: 6 }}
                  >
                    {adminCodeCopied ? <Check size={16} /> : <Copy size={16} />}
                    {adminCodeCopied ? 'Copied ID!' : 'Copy Routine ID'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdminGeneratedCode('');
                      setAdminJsonInput('');
                      setShowAdminJsonModal(false);
                    }}
                    className="btn btn-secondary"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminGenerateFromJson} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ fontSize: '0.78rem', margin: 0 }}>Routine JSON Payload</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminJsonInput(JSON.stringify({
                          semester_start_date: "2026-06-30",
                          routine: {
                            Monday: [
                              { subject: "Data Structures & Algorithms", startTime24: "09:30", durationHours: 1, durationMins: 30, room: "Lab 3" },
                              { subject: "Database Management Systems", startTime24: "11:15", durationHours: 1, durationMins: 0, room: "Room 402" }
                            ],
                            Tuesday: [
                              { subject: "Operating Systems", startTime24: "10:00", durationHours: 1, durationMins: 0, room: "Room 201" }
                            ],
                            Wednesday: [
                              { subject: "Discrete Mathematics", startTime24: "09:00", durationHours: 1, durationMins: 30, room: "Room 105" }
                            ],
                            Thursday: [
                              { subject: "Computer Networks", startTime24: "14:00", durationHours: 2, durationMins: 0, room: "Network Lab" }
                            ],
                            Friday: [
                              { subject: "Software Engineering", startTime24: "10:30", durationHours: 1, durationMins: 0, room: "Room 302" }
                            ],
                            Saturday: [],
                            Sunday: []
                          }
                        }, null, 2));
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      Fill Example Schema
                    </button>
                  </div>

                  <textarea
                    className="form-input"
                    rows={10}
                    placeholder="Paste valid JSON routine here..."
                    value={adminJsonInput}
                    onChange={(e) => setAdminJsonInput(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAdminJsonModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', gap: 6 }}>
                    <Sparkles size={15} /> Validate & Generate Routine ID
                  </button>
                </div>
              </form>
            )}
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
