import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Play,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  BookmarkCheck,
  Download,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Folder,
  FolderPlus,
  FolderOpen,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Link2,
  Share2,
  Search,
  Code2,
  GraduationCap,
  Lock,
  Copy,
  Check
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
    routine,
    addStandaloneResource
  } = useDatabase();

  const userId = currentUser?.id || 'guest';

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
  }, [userId]);

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

  // =================================================================
  // 4 FIXED ROOT FOLDERS SYSTEM: Academic, Document, Important Links, Personal
  // =================================================================
  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(`learnopia_explorer_folders_v2_${userId}`);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          // Seamless migration: Rename old 'source' id/title to 'document'
          let changed = false;
          parsed = parsed.map(f => {
            if (f.id === 'source') {
              changed = true;
              return { ...f, id: 'document', title: 'Document' };
            }
            return f;
          });
          if (changed) {
            localStorage.setItem(`learnopia_explorer_folders_v2_${userId}`, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch {}

    return [
      {
        id: 'academic',
        title: 'Academic',
        isSystem: true,
        subfolders: [
          {
            id: 'sem-1',
            title: 'Semester 1',
            subfolders: [],
            items: [
              {
                id: 'item-math1',
                title: 'Engineering Mathematics I (Calculus & Linear Systems)',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-1',
                type: 'playlist',
                author: 'MAKAUT Faculty',
                count: '36 Lectures',
                date: 'Core Subject'
              },
              {
                id: 'item-phys1',
                title: 'Engineering Physics: Quantum & Wave Optics',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-2',
                type: 'playlist',
                author: 'Dept. of Physics',
                count: '28 Lectures',
                date: 'Core Subject'
              },
              {
                id: 'item-bee1',
                title: 'Basic Electrical Engineering: AC/DC Circuits & Transformers',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-3',
                type: 'playlist',
                author: 'EE Department',
                count: '24 Lectures',
                date: 'Core Subject'
              },
              {
                id: 'item-pps1',
                title: 'Programming for Problem Solving in C',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-4',
                type: 'playlist',
                author: 'Computer Science Faculty',
                count: '32 Lectures',
                date: 'Core Subject'
              },
              {
                id: 'item-syl1',
                title: 'MAKAUT 1st Year Official Syllabus & Credit Distribution',
                url: 'https://makautexam.net/pdf/syllabus_btech_1st_year.pdf',
                type: 'document',
                author: 'MAKAUT Academic Council',
                count: 'PDF Document',
                date: 'Official Syllabus'
              },
              {
                id: 'item-pyq1',
                title: 'Previous Years Solved Question Papers & Solutions',
                url: 'https://makautexam.net/question_papers/btech_sem1.pdf',
                type: 'document',
                author: 'Exam Cell',
                count: 'Question Bank',
                date: 'Verified'
              }
            ]
          },
          {
            id: 'sem-2',
            title: 'Semester 2',
            subfolders: [],
            items: [
              {
                id: 'item-math2',
                title: 'Engineering Mathematics II: Differential Equations & Vector Calculus',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-1',
                type: 'playlist',
                author: 'MAKAUT Faculty',
                count: '30 Lectures',
                date: 'Core Subject'
              },
              {
                id: 'item-chem1',
                title: 'Engineering Chemistry & Material Science',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-2',
                type: 'playlist',
                author: 'Chemistry Faculty',
                count: '22 Lectures',
                date: 'Core Subject'
              }
            ]
          },
          {
            id: 'sem-3',
            title: 'Semester 3',
            subfolders: [],
            items: [
              {
                id: 'item-dsa3',
                title: 'Data Structures and Algorithms in C/C++',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-1',
                type: 'playlist',
                author: 'CS Faculty',
                count: '42 Lectures',
                date: 'Core Subject'
              },
              {
                id: 'item-coa3',
                title: 'Computer Organization and Architecture',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-2',
                type: 'playlist',
                author: 'CS Faculty',
                count: '34 Lectures',
                date: 'Core Subject'
              }
            ]
          },
          {
            id: 'sem-4',
            title: 'Semester 4',
            subfolders: [],
            items: [
              {
                id: 'item-os4',
                title: 'Operating Systems Principles & Concurrency',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-1',
                type: 'playlist',
                author: 'CS Faculty',
                count: '38 Lectures',
                date: 'Core Subject'
              },
              {
                id: 'item-dbms4',
                title: 'Database Management Systems & SQL Fundamentals',
                url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
                playlistId: 'pl-2',
                type: 'playlist',
                author: 'CS Faculty',
                count: '35 Lectures',
                date: 'Core Subject'
              }
            ]
          },
          {
            id: 'sem-5',
            title: 'Semester 5',
            subfolders: [],
            items: []
          },
          {
            id: 'sem-6',
            title: 'Semester 6',
            subfolders: [],
            items: []
          },
          {
            id: 'sem-7',
            title: 'Semester 7',
            subfolders: [],
            items: []
          },
          {
            id: 'sem-8',
            title: 'Semester 8',
            subfolders: [],
            items: []
          }
        ],
        items: []
      },
      {
        id: 'document',
        title: 'Document',
        isSystem: true,
        subfolders: [
          {
            id: 'doc-dsa',
            title: 'Algorithms & LeetCode Solutions',
            subfolders: [],
            items: [
              {
                id: 'src-1',
                title: 'DSA Master Repository (C++ / Java / Python)',
                url: 'https://github.com/topics/data-structures-and-algorithms',
                type: 'source',
                author: 'Open Source Community',
                count: 'Git Repository',
                date: 'v2.4'
              },
              {
                id: 'src-2',
                title: 'Striver SDE Sheet Implementations & Solutions',
                url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/',
                type: 'link',
                author: 'Striver Tuf',
                count: 'Coding Sheet',
                date: '2026'
              }
            ]
          },
          {
            id: 'doc-labs',
            title: 'University Lab Code & Manuals',
            subfolders: [],
            items: [
              {
                id: 'src-3',
                title: 'MAKAUT B.Tech CS Lab Code Boilerplates',
                url: 'https://github.com/topics/btech-cse',
                type: 'source',
                author: 'MAKAUT Code Lab',
                count: 'Git Repository',
                date: 'Semester 1-4'
              },
              {
                id: 'src-4',
                title: 'Linux Shell Scripting & GCC Build Tools',
                url: 'https://github.com/topics/shell-script',
                type: 'source',
                author: 'Systems Lab',
                count: 'Scripts',
                date: 'Lab Kit'
              }
            ]
          },
          {
            id: 'doc-guides',
            title: 'Course Notes & Reference Guides',
            subfolders: [],
            items: [
              {
                id: 'src-5',
                title: 'LearnOpia Frontend & Architecture Codebase',
                url: 'https://github.com',
                type: 'source',
                author: 'Deepak',
                count: 'React + Vite',
                date: 'Active Project'
              }
            ]
          }
        ],
        items: []
      },
      {
        id: 'links',
        title: 'Important Links',
        isSystem: true,
        subfolders: [
          {
            id: 'links-university',
            title: 'MAKAUT & Examination Portals',
            subfolders: [],
            items: [
              {
                id: 'link-1',
                title: 'MAKAUT Official Student Examination Portal',
                url: 'https://makautexam.net',
                type: 'link',
                author: 'Controller of Examinations',
                count: 'Official Portal',
                date: 'makautexam.net'
              },
              {
                id: 'link-2',
                title: 'MAKAUT Semester Results & Review Publication',
                url: 'https://makautexam.net/results',
                type: 'link',
                author: 'MAKAUT Exam Cell',
                count: 'Results Portal',
                date: 'makautexam.net'
              },
              {
                id: 'link-3',
                title: 'MAKAUT Main University Website',
                url: 'https://makautwb.ac.in',
                type: 'link',
                author: 'West Bengal Tech Univ',
                count: 'Official Website',
                date: 'makautwb.ac.in'
              }
            ]
          },
          {
            id: 'links-resources',
            title: 'Digital Libraries & National Portals',
            subfolders: [],
            items: [
              {
                id: 'link-4',
                title: 'National Digital Library of India (NDLI)',
                url: 'https://ndl.iitkgp.ac.in',
                type: 'link',
                author: 'Ministry of Education, IIT KGP',
                count: 'E-Library',
                date: 'ndl.iitkgp.ac.in'
              },
              {
                id: 'link-5',
                title: 'SWAYAM / NPTEL Online Certification Courses',
                url: 'https://swayam.gov.in',
                type: 'link',
                author: 'Govt of India / IITs / IISc',
                count: 'Courses Portal',
                date: 'swayam.gov.in'
              },
              {
                id: 'link-6',
                title: 'AICTE Virtual Internship & Scholastic Portal',
                url: 'https://internship.aicte-india.org',
                type: 'link',
                author: 'AICTE New Delhi',
                count: 'Internships',
                date: 'aicte-india.org'
              }
            ]
          }
        ],
        items: []
      },
      {
        id: 'personal',
        title: 'Personal',
        isSystem: true,
        subfolders: [
          {
            id: 'pers-notes',
            title: 'Personal Study Notes',
            subfolders: [],
            items: [
              {
                id: 'pers-1',
                title: 'Engineering Mathematics - Quick Formula Sheet',
                url: 'https://makautexam.net',
                type: 'document',
                author: 'My Notes',
                count: 'Formula Guide',
                date: 'Updated recently'
              },
              {
                id: 'pers-2',
                title: 'Operating Systems - Deadlocks & CPU Scheduling Summary',
                url: 'https://makautexam.net',
                type: 'document',
                author: 'My Notes',
                count: 'Revision Doc',
                date: 'Oct 2026'
              }
            ]
          },
          {
            id: 'pers-prep',
            title: 'Interview & Placement Prep',
            subfolders: [],
            items: [
              {
                id: 'pers-3',
                title: 'System Design Interview Primer',
                url: 'https://github.com/donnemartin/system-design-primer',
                type: 'source',
                author: 'Donne Martin',
                count: 'Guide & Code',
                date: 'Placement'
              },
              {
                id: 'pers-4',
                title: 'CS Core Subjects Interview Questions (OS, DBMS, CN)',
                url: 'https://takeuforward.org',
                type: 'link',
                author: 'Placement Cell',
                count: 'Handout',
                date: 'Preparation'
              }
            ]
          }
        ],
        items: []
      }
    ];
  });

  // Explorer Navigation State
  const [activeRootFolderId, setActiveRootFolderId] = useState(null); // 'academic' | 'document' | 'links' | 'personal' | null
  const [subfolderPath, setSubfolderPath] = useState([]); // Array of subfolder IDs
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateSubfolderModal, setShowCreateSubfolderModal] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemType, setItemType] = useState('playlist');
  const [itemAuthor, setItemAuthor] = useState('');
  const [publishPublicly, setPublishPublicly] = useState(false);
  const [folderNotice, setFolderNotice] = useState('');

  const saveFolders = (newFolders) => {
    setFolders(newFolders);
    try {
      localStorage.setItem(`learnopia_explorer_folders_v2_${userId}`, JSON.stringify(newFolders));
    } catch {}
  };

  // Helper: recursively update a node at given subfolderPath
  const updateFolderNode = (folderList, rootId, path, updateFn) => {
    return folderList.map(root => {
      if (root.id !== rootId) return root;

      const recurse = (node, depth) => {
        if (depth === path.length) {
          return updateFn(node);
        }
        const targetSeg = path[depth];
        return {
          ...node,
          subfolders: (node.subfolders || []).map(sf =>
            sf.id === targetSeg ? recurse(sf, depth + 1) : sf
          )
        };
      };

      return recurse(root, 0);
    });
  };

  // Active root folder object
  const activeRootFolder = useMemo(() => {
    return folders.find(f => f.id === activeRootFolderId) || null;
  }, [folders, activeRootFolderId]);

  // Current active node (subfolder or root)
  const activeNode = useMemo(() => {
    if (!activeRootFolder) return null;
    let curr = activeRootFolder;
    for (const segId of subfolderPath) {
      const next = (curr.subfolders || []).find(sf => sf.id === segId);
      if (next) {
        curr = next;
      } else {
        break;
      }
    }
    return curr;
  }, [activeRootFolder, subfolderPath]);

  // Breadcrumb path title segments
  const currentPathDetails = useMemo(() => {
    if (!activeRootFolder) return [];
    const crumbs = [];
    let curr = activeRootFolder;
    for (const segId of subfolderPath) {
      const next = (curr.subfolders || []).find(sf => sf.id === segId);
      if (next) {
        crumbs.push({ id: next.id, title: next.title });
        curr = next;
      }
    }
    return crumbs;
  }, [activeRootFolder, subfolderPath]);

  // Filtered subfolders & items inside current active node
  const filteredSubfolders = useMemo(() => {
    if (!activeNode?.subfolders) return [];
    if (!searchQuery.trim()) return activeNode.subfolders;
    const q = searchQuery.toLowerCase();
    return activeNode.subfolders.filter(sf => sf.title.toLowerCase().includes(q));
  }, [activeNode, searchQuery]);

  const filteredItems = useMemo(() => {
    if (!activeNode?.items) return [];
    if (!searchQuery.trim()) return activeNode.items;
    const q = searchQuery.toLowerCase();
    return activeNode.items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.author && item.author.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q))
    );
  }, [activeNode, searchQuery]);

  // Explorer Handlers
  const handleCreateSubfolder = (e) => {
    e.preventDefault();
    if (!newSubfolderName.trim() || !activeRootFolderId) return;

    const newSub = {
      id: `sub-${Date.now()}`,
      title: newSubfolderName.trim(),
      subfolders: [],
      items: []
    };

    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      subfolders: [...(node.subfolders || []), newSub]
    }));

    saveFolders(updated);
    setNewSubfolderName('');
    setShowCreateSubfolderModal(false);
    setFolderNotice(`Subfolder "${newSub.title}" created!`);
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleDeleteSubfolder = (subfolderId) => {
    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      subfolders: (node.subfolders || []).filter(sf => sf.id !== subfolderId)
    }));
    saveFolders(updated);
    setFolderNotice('Subfolder removed.');
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleAddItemToFolder = (e) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemUrl.trim() || !activeRootFolderId) return;

    const newItem = {
      id: `item-${Date.now()}`,
      title: itemTitle.trim(),
      url: itemUrl.trim(),
      type: itemType,
      author: itemAuthor.trim() || currentUser?.name || 'Scholar',
      count:
        itemType === 'playlist'
          ? 'Video Series'
          : itemType === 'source'
          ? 'Code Repository'
          : itemType === 'document'
          ? 'Document'
          : 'Web Resource',
      date: 'Added recently'
    };

    // If YouTube playlist URL, extract playlistId
    const listMatch = itemUrl.match(/[?&]list=([^#&]+)/);
    if (listMatch && listMatch[1]) {
      newItem.playlistId = listMatch[1];
    }

    if (publishPublicly && typeof addStandaloneResource === 'function' && itemType === 'document') {
      addStandaloneResource({
        title: itemTitle.trim(),
        url: itemUrl.trim(),
        type: 'pdf',
        category: 'Community Notes',
        description: `Shared by ${currentUser?.name || 'Scholar'}`,
        author: currentUser?.name || 'Scholar',
        keywords: ['makaut', 'student notes', itemTitle.toLowerCase()]
      });
    }

    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      items: [newItem, ...(node.items || [])]
    }));

    saveFolders(updated);
    setItemTitle('');
    setItemUrl('');
    setItemAuthor('');
    setItemType('playlist');
    setPublishPublicly(false);
    setShowAddItemModal(false);
    setFolderNotice(`Added "${newItem.title}"!`);
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handleDeleteItem = (itemId) => {
    const updated = updateFolderNode(folders, activeRootFolderId, subfolderPath, (node) => ({
      ...node,
      items: (node.items || []).filter(item => item.id !== itemId)
    }));
    saveFolders(updated);
    setFolderNotice('Resource removed.');
    setTimeout(() => setFolderNotice(''), 3000);
  };

  const handlePlayItem = (item) => {
    if (item.playlistId) {
      if (setSelectedPlaylistId) setSelectedPlaylistId(item.playlistId);
      if (setSelectedVideoIndex) setSelectedVideoIndex(0);
      setCurrentView('learning-player');
      return;
    }

    if (item.url) {
      const listMatch = item.url.match(/[?&]list=([^#&]+)/);
      if (listMatch && listMatch[1]) {
        if (setSelectedPlaylistId) setSelectedPlaylistId(listMatch[1]);
        if (setSelectedVideoIndex) setSelectedVideoIndex(0);
        setCurrentView('learning-player');
        return;
      }
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setFolderNotice('Link copied to clipboard!');
    setTimeout(() => setFolderNotice(''), 3000);
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 space-y-5 animate-fade-in">
      {/* Toast Notice */}
      {folderNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shadow-modal animate-bounce-short">
          {folderNotice}
        </div>
      )}

      {/* =================================================================
          VIEW CONDITION 1: FULL-SCREEN FILE EXPLORER VIEW
      ================================================================= */}
      {activeRootFolderId && activeRootFolder ? (
        <div className="w-full space-y-6">
          {/* Top Header & Breadcrumb Toolbar */}
          <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    if (subfolderPath.length > 0) {
                      setSubfolderPath(prev => prev.slice(0, -1));
                    } else {
                      setActiveRootFolderId(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft size={13} />
                  <span>{subfolderPath.length > 0 ? 'Up One Level' : 'Back to Workspace'}</span>
                </button>

                <div className="h-4 w-px bg-border-subtle hidden sm:block" />

                {/* Breadcrumb Navigation Trail */}
                <nav className="flex items-center gap-1.5 text-xs font-mono-tabular overflow-x-auto py-1">
                  <button
                    onClick={() => {
                      setActiveRootFolderId(null);
                      setSubfolderPath([]);
                    }}
                    className="text-text-muted hover:text-text-primary transition-colors cursor-pointer font-medium"
                  >
                    Workspace
                  </button>

                  <ChevronRight size={12} className="text-text-muted shrink-0" />

                  <button
                    onClick={() => setSubfolderPath([])}
                    className={`transition-colors cursor-pointer ${
                      subfolderPath.length === 0
                        ? 'text-text-primary font-bold'
                        : 'text-text-muted hover:text-text-primary font-medium'
                    }`}
                  >
                    {activeRootFolder.title}
                  </button>

                  {currentPathDetails.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                      <ChevronRight size={12} className="text-text-muted shrink-0" />
                      <button
                        onClick={() => setSubfolderPath(subfolderPath.slice(0, idx + 1))}
                        className={`transition-colors cursor-pointer ${
                          idx === currentPathDetails.length - 1
                            ? 'text-text-primary font-bold'
                            : 'text-text-muted hover:text-text-primary font-medium'
                        }`}
                      >
                        {crumb.title}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
              </div>

              {/* Action Controls: Search, + Subfolder, + Add Item */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search bar */}
                <div className="relative flex-1 sm:w-48 lg:w-56">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Filter in folder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-border-subtle bg-canvas text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowCreateSubfolderModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 text-text-primary cursor-pointer shadow-xs transition-colors"
                >
                  <FolderPlus size={13} />
                  <span>New Subfolder</span>
                </button>

                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-accent-ink text-text-on-dark text-xs font-semibold flex items-center gap-1.5 hover:opacity-95 cursor-pointer shadow-xs transition-opacity"
                >
                  <Plus size={13} />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* Current Folder Heading Banner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-subtle flex items-center justify-center text-text-primary border border-border-subtle shadow-2xs">
                  {activeRootFolder.id === 'academic' ? (
                    <GraduationCap size={20} />
                  ) : activeRootFolder.id === 'document' ? (
                    <FileText size={20} />
                  ) : activeRootFolder.id === 'links' ? (
                    <Link2 size={20} />
                  ) : (
                    <Lock size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                    {activeNode?.title}
                  </h2>
                  <span className="text-[11px] font-mono-tabular text-text-muted">
                    {filteredSubfolders.length} Subfolders • {filteredItems.length} Items
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Subfolders Grid (if any) */}
          {filteredSubfolders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <FolderOpen size={14} className="text-text-primary" />
                  <span>Subfolders ({filteredSubfolders.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredSubfolders.map((sf) => (
                  <div
                    key={sf.id}
                    onClick={() => {
                      setSubfolderPath(prev => [...prev, sf.id]);
                      setSearchQuery('');
                    }}
                    className="p-3.5 sm:p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover/80 hover:border-border-strong transition-all cursor-pointer flex flex-col justify-between group shadow-xs space-y-2.5 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-subtle flex items-center justify-center text-text-primary group-hover:bg-accent-ink group-hover:text-text-on-dark transition-colors">
                        <Folder size={16} />
                      </div>
                      {!sf.isSystem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubfolder(sf.id);
                          }}
                          className="p-1 text-text-muted hover:text-red-500 cursor-pointer transition-colors"
                          title="Delete subfolder"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-forest transition-colors truncate">
                        {sf.title}
                      </h4>
                      <span className="text-[10px] sm:text-[11px] font-mono-tabular text-text-muted mt-0.5 block">
                        {(sf.subfolders?.length || 0)} subfolders • {(sf.items?.length || 0)} items
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Items / Files List (if any) */}
          {filteredItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <FileText size={14} className="text-text-primary" />
                  <span>Resources & Items ({filteredItems.length})</span>
                </h3>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm divide-y divide-border-subtle">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-hover/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center text-text-primary shrink-0 border border-border-subtle">
                        {item.type === 'playlist' ? (
                          <Play size={14} className="text-red-500 fill-red-500" />
                        ) : item.type === 'source' ? (
                          <Code2 size={14} className="text-indigo-500" />
                        ) : item.type === 'document' ? (
                          <FileText size={14} className="text-amber-500" />
                        ) : (
                          <Link2 size={14} className="text-emerald-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono-tabular text-text-muted mt-0.5">
                          <span>{item.author || 'University Resource'}</span>
                          <span>•</span>
                          <span>{item.count || (item.type === 'playlist' ? 'Video Series' : 'Resource')}</span>
                          {item.date && (
                            <>
                              <span>•</span>
                              <span>{item.date}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {item.type === 'playlist' || item.playlistId ? (
                        <button
                          onClick={() => handlePlayItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 hover:opacity-95 cursor-pointer shadow-xs"
                        >
                          <Play size={11} fill="currentColor" />
                          <span>Watch</span>
                        </button>
                      ) : item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>Open</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : null}

                      {item.url && (
                        <button
                          onClick={() => handleCopyLink(item.url)}
                          className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Copy resource URL"
                        >
                          <Copy size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove from folder"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Clean Empty State (When both empty) */}
          {filteredSubfolders.length === 0 && filteredItems.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-border-strong bg-surface/50 p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-subtle flex items-center justify-center text-text-muted mx-auto border border-border-subtle">
                <FolderOpen size={24} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-text-primary">
                  {searchQuery ? 'No matching resources found' : 'This folder is currently empty'}
                </h4>
                <p className="text-xs text-text-secondary">
                  {searchQuery
                    ? `No subfolders or items match "${searchQuery}". Try a different search keyword.`
                    : 'Add subfolders, lecture playlists, syllabus PDFs, or documents to this folder.'}
                </p>
              </div>
              {!searchQuery && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateSubfolderModal(true)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FolderPlus size={13} />
                    <span>New Subfolder</span>
                  </button>
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 hover:opacity-95 cursor-pointer shadow-xs"
                  >
                    <Plus size={13} />
                    <span>Add Resource</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =================================================================
            VIEW CONDITION 2: HOME DASHBOARD VIEW
        ================================================================= */
        <div className="w-full space-y-5">
          {/* Editorial Workspace Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-subtle pb-3.5">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight font-editorial text-text-primary">
                Study Workspace
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Welcome back, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Scholar'}. Track your courses, attendance, and study materials.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono-tabular text-text-muted bg-subtle px-2.5 py-1 rounded-md border border-border-subtle">
                {currentUser?.semester ? `SEM ${currentUser.semester}` : 'ACTIVE TERM'} • 75% MINIMUM TARGET
              </span>
            </div>
          </div>

          {/* TOP HERO: COMPACT CONTINUE LEARNING BAR */}
          <div
            onClick={handleResumeHero}
            className="rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover/80 p-3 sm:p-4 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {/* 16:9 Thumbnail */}
              <div className="relative w-24 sm:w-44 md:w-52 aspect-video rounded-lg overflow-hidden shrink-0 bg-black border border-border-subtle">
                <img
                  src={activeHero.thumbnail}
                  alt={activeHero.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-black/80 text-white shadow-md">
                    <Play size={13} fill="#FFFFFF" className="ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono-tabular bg-black/85 text-white">
                  {activeHero.duration}
                </span>
              </div>

              {/* Module Information & Progress */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-tabular font-bold text-accent-forest uppercase tracking-wider">
                      CONTINUE LEARNING
                    </span>
                    <span className="hidden sm:inline text-[11px] text-text-muted font-mono-tabular">
                      • {activeHero.progress}% Completed
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-text-primary truncate mt-0.5 group-hover:text-accent-forest transition-colors">
                    {activeHero.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-text-muted truncate mt-0.5">
                    {activeHero.moduleTitle}
                  </p>
                </div>

                {/* Hairline Progress Track */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-subtle">
                    <div
                      className="h-full rounded-full bg-accent-forest transition-all duration-300"
                      style={{ width: `${activeHero.progress}%` }}
                    />
                  </div>
                  <span className="sm:hidden text-[10px] font-mono-tabular text-text-muted shrink-0">
                    {activeHero.progress}%
                  </span>
                </div>
              </div>

              {/* Desktop Right CTA Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shrink-0 transition-transform group-hover:translate-x-0.5">
                <span>Resume</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>

          {/* MAIN BALANCED 2-COLUMN STUDIO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN (7 cols): Folders Only (Lecture notes removed as requested) */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-5">
              {/* SECTION: WORKSPACE 4-FOLDERS BLOCK */}
              <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Folder size={16} className="text-text-primary" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                      Workspace Folders
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono-tabular text-text-muted">
                    4 Core Folders
                  </span>
                </div>

                {/* Exactly 4 Clean File Manager Blocks: Academic, Document, Important Links, Personal */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {folders.map((folder) => {
                    const icon =
                      folder.id === 'academic' ? (
                        <GraduationCap size={18} />
                      ) : folder.id === 'document' ? (
                        <FileText size={18} />
                      ) : folder.id === 'links' ? (
                        <Link2 size={18} />
                      ) : (
                        <Lock size={18} />
                      );

                    return (
                      <div
                        key={folder.id}
                        onClick={() => {
                          setActiveRootFolderId(folder.id);
                          setSubfolderPath([]);
                          setSearchQuery('');
                        }}
                        className="p-3.5 sm:p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover/80 hover:border-border-strong transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 group shadow-xs active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-subtle flex items-center justify-center text-text-primary group-hover:bg-accent-ink group-hover:text-text-on-dark transition-colors shadow-2xs">
                          {icon}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-accent-forest transition-colors truncate w-full">
                          {folder.title}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN (5 cols): Attendance, Timetable, Vault */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-5">
              {/* WIDGET 1: ATTENDANCE SNAPSHOT */}
              <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-accent-forest" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                      Attendance Buffer
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('attendance')}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                  >
                    Full Ledger &rarr;
                  </button>
                </div>

                {/* Attendance Percentage & Metric */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold font-mono-tabular text-text-primary">
                      {attendanceMetrics.percentage}%
                    </span>
                    <span className="text-xs text-text-muted ml-2 font-mono-tabular">
                      ({attendanceMetrics.attended}/{attendanceMetrics.total} classes)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono-tabular border ${
                      attendanceMetrics.isSafe ? 'pill-safe' : 'pill-alert'
                    }`}
                  >
                    {attendanceMetrics.isSafe ? 'SAFE' : 'ALERT'}
                  </span>
                </div>

                {/* Target Visual Indicator */}
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-subtle">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        attendanceMetrics.isSafe ? 'bg-accent-forest' : 'bg-accent-danger'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, parseFloat(attendanceMetrics.percentage)))}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {attendanceMetrics.pillText}
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView('attendance')}
                  className="w-full py-2 rounded-lg text-xs font-semibold border border-border-subtle bg-surface-hover hover:bg-subtle text-text-primary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CalendarDays size={13} />
                  <span>Log Today's Classes</span>
                </button>
              </section>

              {/* WIDGET 2: TODAY'S TIMETABLE / CLASSES */}
              <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-text-primary" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                      Today • {todayClasses.currentDay}
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('attendance')}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                  >
                    Timetable &rarr;
                  </button>
                </div>

                {todayClasses.dayClasses.length > 0 ? (
                  <div className="divide-y divide-border-subtle">
                    {todayClasses.dayClasses.slice(0, 3).map((item, idx) => (
                      <div key={item.id || idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-text-primary truncate">
                            {item.subjectName || item.title || 'Lecture'}
                          </h4>
                          <span className="text-[11px] text-text-muted font-mono-tabular">
                            {item.startTime || '10:00 AM'} - {item.endTime || '11:00 AM'} • {item.room || 'Room 101'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold pill-safe shrink-0 border">
                          SCHEDULED
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-text-muted">
                    <p>No classes scheduled for today.</p>
                    <button
                      onClick={() => setCurrentView('attendance')}
                      className="mt-1 text-xs font-semibold text-accent-forest hover:underline cursor-pointer"
                    >
                      Configure Routine &rarr;
                    </button>
                  </div>
                )}
              </section>

              {/* WIDGET 3: ACADEMIC VAULT QUICK LINKS */}
              <section className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck size={16} className="text-accent-forest" />
                    <h2 className="text-xs font-bold tracking-wider uppercase text-text-secondary font-mono-tabular">
                      Academic Vault
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentView('resources')}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                  >
                    All ({standaloneResources?.length || 0}) &rarr;
                  </button>
                </div>

                <div className="divide-y divide-border-subtle">
                  {topVaultResources.map((res) => (
                    <div key={res.id} className="py-2.5 flex items-center justify-between gap-3 group">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-tabular font-bold bg-subtle text-text-primary uppercase border border-border-subtle">
                            {res.type || 'PDF'}
                          </span>
                          <h4 className="text-xs font-bold text-text-primary truncate">
                            {res.title}
                          </h4>
                        </div>
                        <span className="text-[11px] text-text-muted mt-0.5 block truncate">
                          {res.category}
                        </span>
                      </div>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-hover text-text-secondary hover:text-text-primary shrink-0 transition-colors"
                        title="Download / View Resource"
                      >
                        <Download size={13} />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUBFOLDER MODAL */}
      {showCreateSubfolderModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-16 md:pt-20 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 space-y-4 shadow-modal">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-text-primary" />
                <h3 className="text-base font-bold text-text-primary">Create Subfolder</h3>
              </div>
              <button
                onClick={() => setShowCreateSubfolderModal(false)}
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Inside <span className="font-semibold text-text-primary">{activeNode?.title || activeRootFolder?.title}</span>
            </p>

            <form onSubmit={handleCreateSubfolder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Subfolder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 2: Quantum Physics, Lab Assignments, Cheat Sheets"
                  value={newSubfolderName}
                  onChange={(e) => setNewSubfolderName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCreateSubfolderModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Create Subfolder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ITEM TO FOLDER MODAL */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-16 md:pt-20 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 space-y-4 shadow-modal">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-text-primary" />
                <h3 className="text-base font-bold text-text-primary">Add Resource to Folder</h3>
              </div>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Target folder: <span className="font-semibold text-text-primary">{activeNode?.title || activeRootFolder?.title}</span>
            </p>

            <form onSubmit={handleAddItemToFolder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Title / Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems Lecture Series or DSA Master Notes"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Resource URL / Link
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/playlist?list=... or https://github.com/..."
                  value={itemUrl}
                  onChange={(e) => setItemUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-canvas focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Resource Type
                  </label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                  >
                    <option value="playlist">YouTube Playlist / Video</option>
                    <option value="document">PDF / Study Material</option>
                    <option value="source">Source Code / GitHub</option>
                    <option value="link">Web Link / Portal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Author / Source
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MAKAUT, Striver, NPTEL"
                    value={itemAuthor}
                    onChange={(e) => setItemAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              {itemType === 'document' && (
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary select-none">
                    <input
                      type="checkbox"
                      checked={publishPublicly}
                      onChange={(e) => setPublishPublicly(e.target.checked)}
                      className="w-4 h-4 rounded border-border-strong accent-accent-ink cursor-pointer"
                    />
                    <span>Publish publicly to Learn-O-Pia Catalog</span>
                  </label>
                  <p className="text-[11px] text-text-muted ml-6.5 mt-0.5">
                    Allow other university students to discover this material in search.
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Add to Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
