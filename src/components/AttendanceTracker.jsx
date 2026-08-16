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
  AlertCircle
} from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Earliest allowed date boundary for attendance tracking (June 1, 2026)
const MIN_DATE = '2026-06-01';

const DEFAULT_ROUTINE = {
  Monday: [
    { id: 'r-1', subject: 'Programming in C', startTime: '09:00 AM', endTime: '10:00 AM', room: 'Lab 102', minTarget: 75 },
    { id: 'r-2', subject: 'Engineering Mathematics I', startTime: '10:15 AM', endTime: '11:15 AM', room: 'Hall 3', minTarget: 75 },
    { id: 'r-3', subject: 'Data Structures', startTime: '01:30 PM', endTime: '02:30 PM', room: 'Room 204', minTarget: 75 }
  ],
  Tuesday: [
    { id: 'r-4', subject: 'Engineering Physics', startTime: '09:30 AM', endTime: '10:30 AM', room: 'Physics Lab', minTarget: 75 },
    { id: 'r-5', subject: 'Web Engineering', startTime: '11:00 AM', endTime: '12:00 PM', room: 'CS Lab 2', minTarget: 75 }
  ],
  Wednesday: [
    { id: 'r-6', subject: 'Programming in C', startTime: '09:00 AM', endTime: '10:00 AM', room: 'Lab 102', minTarget: 75 },
    { id: 'r-7', subject: 'Data Structures', startTime: '10:15 AM', endTime: '11:15 AM', room: 'Room 204', minTarget: 75 },
    { id: 'r-8', subject: 'Economics for Engineers', startTime: '01:30 PM', endTime: '02:30 PM', room: 'Hall 1', minTarget: 75 }
  ],
  Thursday: [
    { id: 'r-9', subject: 'Engineering Physics', startTime: '10:00 AM', endTime: '11:00 AM', room: 'Physics Lab', minTarget: 75 },
    { id: 'r-10', subject: 'Web Engineering', startTime: '11:30 AM', endTime: '12:30 PM', room: 'CS Lab 2', minTarget: 75 }
  ],
  Friday: [
    { id: 'r-11', subject: 'Engineering Mathematics I', startTime: '09:00 AM', endTime: '10:00 AM', room: 'Hall 3', minTarget: 75 },
    { id: 'r-12', subject: 'Economics for Engineers', startTime: '11:00 AM', endTime: '12:00 PM', room: 'Hall 1', minTarget: 75 }
  ],
  Saturday: [
    { id: 'r-13', subject: 'Data Structures Lab', startTime: '10:00 AM', endTime: '12:00 PM', room: 'Main Computer Center', minTarget: 75 }
  ],
  Sunday: []
};

// Safe Local Date Helpers (prevents timezone UTC shifts)
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

export default function AttendanceTracker({ setCurrentView }) {
  const { currentUser } = useDatabase();

  // Selected date state (defaults to today or MIN_DATE if earlier)
  const [selectedDate, setSelectedDate] = useState(() => {
    const todayStr = formatLocalDate(new Date());
    return todayStr < MIN_DATE ? MIN_DATE : todayStr;
  });

  // Tab state: 'tracker' | 'routine' | 'analytics'
  const [activeTab, setActiveTab] = useState('tracker');
  const [showEndSemModal, setShowEndSemModal] = useState(false);

  // Timetable Routine State
  const [routine, setRoutine] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_attendance_routine');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_ROUTINE;
  });

  // Attendance Records Log State
  const [logs, setLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_attendance_logs');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {};
  });

  // Archived Semesters Summary State
  const [archivedSemesters, setArchivedSemesters] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_archived_semesters');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  // New Class Form State for Routine Manager
  const [editingDay, setEditingDay] = useState('Monday');
  const [newSubName, setNewSubName] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00 AM');
  const [newEndTime, setNewEndTime] = useState('10:00 AM');
  const [newRoom, setNewRoom] = useState('Room 101');
  const [targetPercent, setTargetPercent] = useState(75);

  // Persistence to LocalStorage
  useEffect(() => {
    localStorage.setItem('learnopia_attendance_routine', JSON.stringify(routine));
  }, [routine]);

  useEffect(() => {
    localStorage.setItem('learnopia_attendance_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('learnopia_archived_semesters', JSON.stringify(archivedSemesters));
  }, [archivedSemesters]);

  // Compute selected day details cleanly without UTC timezone shifting
  const dateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const dayName = useMemo(() => DAYS_OF_WEEK[dateObj.getDay()], [dateObj]);

  const scheduledToday = useMemo(() => routine[dayName] || [], [routine, dayName]);
  const dayLog = useMemo(() => logs[selectedDate] || { isHoliday: false, classes: {} }, [logs, selectedDate]);

  // Mark class attendance status
  const markClassStatus = (routineId, status) => {
    setLogs((prev) => {
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {} };
      const nextClasses = { ...currentDay.classes };

      if (nextClasses[routineId] === status) {
        delete nextClasses[routineId];
      } else {
        nextClasses[routineId] = status;
      }

      return {
        ...prev,
        [selectedDate]: {
          ...currentDay,
          classes: nextClasses
        }
      };
    });
  };

  // Toggle Day Holiday Status
  const toggleHoliday = () => {
    setLogs((prev) => {
      const currentDay = prev[selectedDate] || { isHoliday: false, classes: {} };
      return {
        ...prev,
        [selectedDate]: {
          ...currentDay,
          isHoliday: !currentDay.isHoliday
        }
      };
    });
  };

  // Add new class to routine
  const handleAddClassToRoutine = (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newClass = {
      id: `r-${Date.now()}`,
      subject: newSubName.trim(),
      startTime: newStartTime,
      endTime: newEndTime,
      room: newRoom.trim() || 'Room 101',
      minTarget: parseInt(targetPercent, 10) || 75
    };

    setRoutine((prev) => ({
      ...prev,
      [editingDay]: [...(prev[editingDay] || []), newClass]
    }));

    setNewSubName('');
  };

  // Delete class from routine
  const handleDeleteRoutineClass = (day, classId) => {
    setRoutine((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((c) => c.id !== classId)
    }));
  };

  // Compute Overall Attendance Analytics
  const subjectAnalytics = useMemo(() => {
    const statsMap = {};

    Object.values(routine).forEach((dayList) => {
      dayList.forEach((cls) => {
        if (!statsMap[cls.subject]) {
          statsMap[cls.subject] = {
            subject: cls.subject,
            attended: 0,
            absent: 0,
            cancelled: 0,
            totalConducted: 0,
            target: cls.minTarget || 75
          };
        }
      });
    });

    Object.entries(logs).forEach(([dStr, logData]) => {
      if (logData.isHoliday) return;

      const dObj = parseLocalDate(dStr);
      const dName = DAYS_OF_WEEK[dObj.getDay()];
      const dayRoutine = routine[dName] || [];

      Object.entries(logData.classes || {}).forEach(([rId, status]) => {
        const clsInfo = dayRoutine.find((c) => c.id === rId);
        const subName = clsInfo ? clsInfo.subject : null;

        if (subName && statsMap[subName]) {
          if (status === 'attended') {
            statsMap[subName].attended += 1;
            statsMap[subName].totalConducted += 1;
          } else if (status === 'absent') {
            statsMap[subName].absent += 1;
            statsMap[subName].totalConducted += 1;
          } else if (status === 'cancelled') {
            statsMap[subName].cancelled += 1;
          }
        }
      });
    });

    return Object.values(statsMap).map((item) => {
      const pct = item.totalConducted > 0 ? Math.round((item.attended / item.totalConducted) * 100) : 100;
      const targetDecimal = item.target / 100;

      let safeBunks = 0;
      let requiredAttends = 0;

      if (item.totalConducted > 0) {
        if (pct >= item.target) {
          safeBunks = Math.floor((item.attended - targetDecimal * item.totalConducted) / targetDecimal);
          safeBunks = Math.max(0, safeBunks);
        } else {
          requiredAttends = Math.ceil((targetDecimal * item.totalConducted - item.attended) / (1 - targetDecimal));
          requiredAttends = Math.max(0, requiredAttends);
        }
      }

      return {
        ...item,
        percentage: pct,
        safeBunks,
        requiredAttends
      };
    });
  }, [routine, logs]);

  const overallTotals = useMemo(() => {
    let totalAttended = 0;
    let totalConducted = 0;

    subjectAnalytics.forEach((s) => {
      totalAttended += s.attended;
      totalConducted += s.totalConducted;
    });

    const overallPct = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;
    return { totalAttended, totalConducted, overallPct };
  }, [subjectAnalytics]);

  // Robust linear date shifting (prevents timezone bugs & enforces June 1, 2026 minimum)
  const shiftDate = (days) => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + days);
    const nextStr = formatLocalDate(d);

    if (nextStr < MIN_DATE) {
      setSelectedDate(MIN_DATE);
    } else {
      setSelectedDate(nextStr);
    }
  };

  // End Semester & Storage Reset Handler
  const handleEndSemester = () => {
    const semName = `Semester ${archivedSemesters.length + 1} (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;

    const archiveEntry = {
      id: `sem-${Date.now()}`,
      name: semName,
      endedAt: formatLocalDate(new Date()),
      overallPct: overallTotals.overallPct,
      totalAttended: overallTotals.totalAttended,
      totalConducted: overallTotals.totalConducted,
      subjectSummaries: subjectAnalytics.map((s) => ({
        subject: s.subject,
        pct: s.percentage,
        attended: s.attended,
        totalConducted: s.totalConducted
      }))
    };

    // Save lightweight archive summary
    setArchivedSemesters((prev) => [archiveEntry, ...prev]);

    // Wipe detailed day logs from storage
    setLogs({});

    // Reset weekly routine for new semester setup
    setRoutine({
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    });

    setShowEndSemModal(false);
    setActiveTab('routine');
  };

  return (
    <div className="attendance-container animate-fade-in">
      {/* Top Header Bar */}
      <div className="attendance-header glass-panel">
        <div className="attendance-head-left">
          <button onClick={() => setCurrentView('learning')} className="btn btn-secondary btn-sm">
            <ChevronLeft size={16} /> Back to Learning
          </button>
          <div>
            <h1>Class Attendance Tracker</h1>
            <p className="section-sub">Track daily attendance, manage class routines, and archive completed semesters.</p>
          </div>
        </div>

        {/* Overall Meter & End Semester Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="overall-gauge-badge">
            <div className="gauge-icon">
              <TrendingUp size={24} color={overallTotals.overallPct >= 75 ? 'var(--success)' : 'var(--error)'} />
            </div>
            <div className="gauge-text">
              <span className="gauge-val">{overallTotals.overallPct}%</span>
              <span className={`gauge-status ${overallTotals.overallPct >= 75 ? 'safe' : 'danger'}`}>
                {overallTotals.overallPct >= 75 ? 'Safe (≥75%)' : 'Shortage (<75%)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowEndSemModal(true)}
            className="btn btn-secondary"
            style={{ padding: '10px 14px', fontSize: '0.8rem', gap: '6px' }}
            title="End current semester and reset routine"
          >
            <Archive size={15} color="#a78bfa" /> End Semester
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="attendance-tabs-bar">
        <button
          className={`att-tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          <Calendar size={16} /> Daily Logger
        </button>
        <button
          className={`att-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Award size={16} /> Overall Dashboard
        </button>
        <button
          className={`att-tab-btn ${activeTab === 'routine' ? 'active' : ''}`}
          onClick={() => setActiveTab('routine')}
        >
          <Settings size={16} /> Timetable Routine
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY ATTENDANCE LOGGER                           */}
      {/* ========================================================= */}
      {activeTab === 'tracker' && (
        <div className="att-tab-workspace animate-fade-in">
          {/* Date Selector Banner */}
          <div className="date-picker-bar glass-panel">
            <div className="date-nav-controls">
              <button
                className="date-arrow-btn"
                onClick={() => shiftDate(-1)}
                disabled={selectedDate <= MIN_DATE}
                style={{ opacity: selectedDate <= MIN_DATE ? 0.4 : 1, cursor: selectedDate <= MIN_DATE ? 'not-allowed' : 'pointer' }}
                title={selectedDate <= MIN_DATE ? 'Earliest date reached (June 1, 2026)' : 'Previous Day'}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="date-display">
                <Calendar size={18} color="var(--primary)" />
                <input
                  type="date"
                  value={selectedDate}
                  min={MIN_DATE}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val >= MIN_DATE) setSelectedDate(val);
                  }}
                  className="date-input-field"
                />
                <span className="day-name-pill">{dayName}</span>
              </div>

              <button className="date-arrow-btn" onClick={() => shiftDate(1)} title="Next Day">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="date-actions">
              <button
                className={`btn btn-sm ${dayLog.isHoliday ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleHoliday}
              >
                <Sun size={15} /> {dayLog.isHoliday ? 'Holiday Marked' : 'Mark Day as Holiday'}
              </button>
            </div>
          </div>

          {/* Scheduled Classes List for Selected Date */}
          {dayLog.isHoliday ? (
            <div className="holiday-banner glass-panel">
              <Sun size={48} color="#f59e0b" />
              <h3>Holiday / Day Off</h3>
              <p>No attendance is required on holidays. Enjoy your day!</p>
            </div>
          ) : scheduledToday.length === 0 ? (
            <div className="empty-day-banner glass-panel">
              <Sparkles size={40} color="var(--text-muted)" />
              <h3>No Classes Scheduled for {dayName}</h3>
              <p>You have no lectures in your routine for {dayName}. Use the "Timetable Routine" tab to add classes.</p>
            </div>
          ) : (
            <div className="scheduled-classes-list">
              {scheduledToday.map((cls) => {
                const currentStatus = dayLog.classes[cls.id];

                return (
                  <div key={cls.id} className="class-attendance-card glass-panel">
                    <div className="class-info-left">
                      <div className="class-time-badge">
                        <Clock size={15} /> {cls.startTime} - {cls.endTime}
                      </div>
                      <h3 className="class-subject-title">{cls.subject}</h3>
                      <span className="class-room-sub">Location: {cls.room}</span>
                    </div>

                    {/* Attendance Action Buttons */}
                    <div className="class-status-actions">
                      <button
                        className={`status-chip-btn attended ${currentStatus === 'attended' ? 'active' : ''}`}
                        onClick={() => markClassStatus(cls.id, 'attended')}
                      >
                        <CheckCircle2 size={16} /> Attended
                      </button>

                      <button
                        className={`status-chip-btn absent ${currentStatus === 'absent' ? 'active' : ''}`}
                        onClick={() => markClassStatus(cls.id, 'absent')}
                      >
                        <XCircle size={16} /> Missed
                      </button>

                      <button
                        className={`status-chip-btn cancelled ${currentStatus === 'cancelled' ? 'active' : ''}`}
                        onClick={() => markClassStatus(cls.id, 'cancelled')}
                      >
                        <MinusCircle size={16} /> Class Off
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: OVERALL ANALYTICS & SUBJECT DASHBOARD              */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="att-tab-workspace animate-fade-in">
          {/* Top Summary Cards Grid */}
          <div className="analytics-summary-grid">
            <div className="stat-metric-card glass-panel">
              <div className="metric-icon">
                <BookOpen size={22} color="var(--primary)" />
              </div>
              <div className="metric-data">
                <span className="metric-value">{overallTotals.totalAttended} / {overallTotals.totalConducted}</span>
                <span className="metric-label">Total Classes Attended</span>
              </div>
            </div>

            <div className="stat-metric-card glass-panel">
              <div className="metric-icon">
                <TrendingUp size={22} color={overallTotals.overallPct >= 75 ? 'var(--success)' : 'var(--error)'} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{overallTotals.overallPct}%</span>
                <span className="metric-label">Current Semester Average</span>
              </div>
            </div>

            <div className="stat-metric-card glass-panel">
              <div className="metric-icon">
                <Award size={22} color="#f59e0b" />
              </div>
              <div className="metric-data">
                <span className="metric-value">{subjectAnalytics.length}</span>
                <span className="metric-label">Tracked Subjects</span>
              </div>
            </div>
          </div>

          {/* Current Semester Subject Breakdown Table */}
          <div className="analytics-table-card glass-panel">
            <h3 className="card-title-h">Current Semester Attendance Breakdown</h3>

            {subjectAnalytics.length === 0 ? (
              <p className="empty-text-p">No attendance records logged yet for this semester.</p>
            ) : (
              <div className="table-responsive-scroll">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Attended / Total</th>
                      <th>Attendance %</th>
                      <th>Status & Target</th>
                      <th>Smart Forecast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectAnalytics.map((item) => {
                      const isSafe = item.percentage >= item.target;

                      return (
                        <tr key={item.subject}>
                          <td>
                            <strong className="sub-table-title">{item.subject}</strong>
                          </td>
                          <td>
                            {item.attended} / {item.totalConducted} ({item.absent} missed)
                          </td>
                          <td>
                            <div className="progress-cell">
                              <span className="pct-text">{item.percentage}%</span>
                              <div className="table-progress-bar">
                                <div
                                  className={`table-progress-fill ${isSafe ? 'safe' : 'danger'}`}
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${isSafe ? 'safe' : 'danger'}`}>
                              {isSafe ? `Safe (≥${item.target}%)` : `Shortage (<${item.target}%)`}
                            </span>
                          </td>
                          <td>
                            <div className="forecast-cell">
                              {item.totalConducted === 0 ? (
                                <span className="forecast-muted">No classes recorded yet</span>
                              ) : isSafe ? (
                                <span className="forecast-safe">
                                  ✓ Can bunk <strong>{item.safeBunks}</strong> more class(es)
                                </span>
                              ) : (
                                <span className="forecast-danger">
                                  ⚠ Must attend <strong>{item.requiredAttends}</strong> consecutive class(es)
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Archived Past Semesters History */}
          {archivedSemesters.length > 0 && (
            <div className="analytics-table-card glass-panel" style={{ marginTop: '24px' }}>
              <h3 className="card-title-h" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={18} color="#a78bfa" /> Previous Semesters Overview
              </h3>

              <div className="table-responsive-scroll">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Semester</th>
                      <th>Concluded Date</th>
                      <th>Overall Attendance</th>
                      <th>Attended / Conducted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedSemesters.map((sem) => (
                      <tr key={sem.id}>
                        <td><strong>{sem.name}</strong></td>
                        <td>{sem.endedAt}</td>
                        <td>
                          <span className={`status-pill ${sem.overallPct >= 75 ? 'safe' : 'danger'}`}>
                            {sem.overallPct}% Overall
                          </span>
                        </td>
                        <td>{sem.totalAttended} / {sem.totalConducted} Classes</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TIMETABLE ROUTINE SETUP                             */}
      {/* ========================================================= */}
      {activeTab === 'routine' && (
        <div className="att-tab-workspace animate-fade-in">
          <div className="routine-editor-grid">
            {/* Left: Add Class Form */}
            <div className="routine-form-card glass-panel">
              <h3>Register Class in Routine</h3>
              <p className="card-sub-p">Configure your weekly lecture timetable day by day.</p>

              <form onSubmit={handleAddClassToRoutine} className="routine-form">
                <div className="form-group-field">
                  <label>Select Day of Week</label>
                  <select
                    className="form-input"
                    value={editingDay}
                    onChange={(e) => setEditingDay(e.target.value)}
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-field">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Data Structures"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group-field">
                    <label>Start Time</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="09:00 AM"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group-field">
                    <label>End Time</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="10:00 AM"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group-field">
                    <label>Room / Classroom</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Lab 102"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                    />
                  </div>

                  <div className="form-group-field">
                    <label>Target Min Attendance %</label>
                    <input
                      type="number"
                      className="form-input"
                      value={targetPercent}
                      onChange={(e) => setTargetPercent(e.target.value)}
                      min="50"
                      max="100"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  <Plus size={16} /> Add Class to {editingDay}
                </button>
              </form>
            </div>

            {/* Right: Weekly Timetable Display */}
            <div className="routine-display-card glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Weekly Timetable Schedule</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Configure your active semester routine</span>
                </div>
                <button
                  onClick={() => setShowEndSemModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <RefreshCw size={13} /> Reset Routine for New Semester
                </button>
              </div>

              <div className="routine-days-accordion">
                {DAYS_OF_WEEK.map((day) => {
                  const dayClasses = routine[day] || [];

                  return (
                    <div key={day} className="routine-day-block">
                      <div className="routine-day-header">
                        <strong>{day}</strong>
                        <span className="count-tag">{dayClasses.length} Classes</span>
                      </div>

                      {dayClasses.length === 0 ? (
                        <p className="no-class-text">No lectures scheduled for {day}</p>
                      ) : (
                        <div className="day-classes-grid">
                          {dayClasses.map((cls) => (
                            <div key={cls.id} className="routine-item-chip">
                              <div className="chip-details">
                                <span className="chip-time">{cls.startTime} - {cls.endTime}</span>
                                <strong>{cls.subject}</strong>
                                <span className="chip-room">{cls.room}</span>
                              </div>
                              <button
                                type="button"
                                className="delete-chip-btn"
                                onClick={() => handleDeleteRoutineClass(day, cls.id)}
                                title="Delete from timetable"
                              >
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
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* END SEMESTER CONFIRMATION MODAL                           */}
      {/* ========================================================= */}
      {showEndSemModal && (
        <div style={modalStyles.overlay}>
          <div className="glass-panel" style={modalStyles.box}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a78bfa', marginBottom: '10px' }}>
              <Archive size={24} />
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>End Current Semester?</h2>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Ending your current semester will:
            </p>

            <ul style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '20px' }}>
              <li>Save a compact overview summary (Overall % & total classes attended).</li>
              <li><strong>Delete all detailed daily logs</strong> to free up storage space.</li>
              <li>Clear your weekly routine so you can register new subjects for the next semester.</li>
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowEndSemModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEndSemester}>
                Confirm & Start New Semester
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  box: {
    maxWidth: '480px',
    width: '100%',
    padding: '24px',
    textAlign: 'left'
  }
};
