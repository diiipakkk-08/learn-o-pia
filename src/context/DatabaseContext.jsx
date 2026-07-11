import React, { createContext, useContext, useState, useEffect } from 'react';

const DatabaseContext = createContext();

const SEED_USERS = [
  { id: 'u-1', email: 'admin@learnopia.edu', name: 'Dr. Arthur Pendelton', role: 'admin', status: 'active', password: 'admin123', enrolledCourses: ['c-1'] },
  { id: 'u-2', email: 'creator@learnopia.edu', name: 'Prof. Sarah Miller', role: 'creator', status: 'active', password: 'creator123', enrolledCourses: [] },
  { id: 'u-3', email: 'learner@learnopia.edu', name: 'Alex Carter', role: 'learner', status: 'active', password: 'learner123', enrolledCourses: [] }
];

const SEED_COURSES = [
  {
    id: 'c-1',
    title: 'B.Tech Computer Science & Engineering',
    department: 'Computer Science',
    description: 'A complete 4-year degree curriculum covering algorithms, database architectures, operating systems, and discrete mathematics.',
    price: 0,
    creatorId: 'u-2',
    creatorName: 'Prof. Sarah Miller',
    isDegree: true
  },
  {
    id: 'c-2',
    title: 'B.Tech Information Technology',
    department: 'Information Technology',
    description: 'A comprehensive curriculum focusing on software engineering, cloud computing, cybersecurity, and computer systems networking.',
    price: 0,
    creatorId: 'u-2',
    creatorName: 'Prof. Sarah Miller',
    isDegree: true
  },
  {
    id: 'c-3',
    title: 'Full-Stack JavaScript Web Development',
    department: 'Computer Science',
    description: 'Learn MERN stack, state management, and modern server frameworks from scratch with unified subjects and zero semester partitioning.',
    price: 499,
    creatorId: 'u-2',
    creatorName: 'Prof. Sarah Miller',
    isDegree: false
  }
];

const SEED_SUBJECTS = [
  // CSE - Semester 1 (Degree)
  {
    id: 's-1',
    courseId: 'c-1',
    semester: 1,
    title: 'Engineering Mathematics I',
    playlists: [
      {
        id: 'pl-1',
        title: 'Calculus & Integral Theory',
        description: 'Covers limits, differentiation, integration, and applications in Cartesian spaces.',
        likes: ['u-3'],
        videos: [
          {
            id: 'v-1',
            title: 'Limits & Calculus Basics',
            description: 'Understanding limits, continuity, and derivatives for engineers.',
            youtubeId: 'RBSGKlAboiM'
          }
        ]
      }
    ],
    customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
    materials: [
      { id: 'doc-1', title: 'Chapter 1: Limits & Differentiation Formulas.pdf', url: 'https://drive.google.com', sectionName: 'Notes' },
      { id: 'doc-2', title: 'Mathematics I Syllabus Organizer.pdf', url: 'https://drive.google.com', sectionName: 'Organizer' }
    ]
  },
  {
    id: 's-2',
    courseId: 'c-1',
    semester: 1,
    title: 'Engineering Physics',
    playlists: [
      {
        id: 'pl-2',
        title: 'Wave Optics Lectures',
        description: 'Comprehensive study of wave properties, diffraction, and wave interference models.',
        likes: [],
        videos: [
          {
            id: 'v-2',
            title: 'Diffraction & Wave Basics',
            description: 'Double slit experiments and wave physics details.',
            youtubeId: 'sf_9ps74HCc'
          }
        ]
      }
    ],
    customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
    materials: [
      { id: 'doc-3', title: 'Physics Wave Interference Notes.pdf', url: 'https://drive.google.com', sectionName: 'Notes' },
      { id: 'doc-4', title: 'Physics Study Syllabus Organizer.pdf', url: 'https://drive.google.com', sectionName: 'Organizer' }
    ]
  },
  // CSE - Semester 3 (Degree)
  {
    id: 's-3',
    courseId: 'c-1',
    semester: 3,
    title: 'Data Structures & Algorithms',
    playlists: [
      {
        id: 'pl-3',
        title: 'Core DSA Lecture Series',
        description: 'Standard university lectures going over linear, non-linear, trees, and complexity analysis.',
        likes: [],
        videos: [
          {
            id: 'v-3',
            title: 'Big O Complexity Analysis',
            description: 'Understand time and space complexity scaling logarithmic, linear, and quadratic growth.',
            youtubeId: 'RBSGKlAboiM'
          },
          {
            id: 'v-4',
            title: 'Binary Search Tree Algorithms',
            description: 'Pre-order, in-order, and post-order DFS traversals on trees.',
            youtubeId: 'sf_9ps74HCc'
          }
        ]
      }
    ],
    customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
    materials: [
      { id: 'doc-5', title: 'DSA Complexity Summary.pdf', url: 'https://drive.google.com', sectionName: 'Notes' },
      { id: 'doc-6', title: 'DSA Study Schedule Planner.pdf', url: 'https://drive.google.com', sectionName: 'Organizer' }
    ]
  },
  // Standard Course - Unified Subjects (Non-Degree)
  {
    id: 's-4',
    courseId: 'c-3',
    semester: 1,
    title: 'Backend with Node.js & Express',
    playlists: [
      {
        id: 'pl-4',
        title: 'API Development Lectures',
        description: 'Build robust REST APIs, handle requests, and manage server routing.',
        likes: ['u-3'],
        videos: [
          {
            id: 'v-5',
            title: 'Introduction to Express Routing',
            description: 'Setting up routes, request parameters, and controllers.',
            youtubeId: 'SccSCuHhbc0'
          }
        ]
      }
    ],
    customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
    materials: [
      { id: 'doc-7', title: 'Node Express Cheat Sheet.pdf', url: 'https://drive.google.com', sectionName: 'Notes' }
    ]
  },
  {
    id: 's-5',
    courseId: 'c-3',
    semester: 1,
    title: 'Frontend with React & Vite',
    playlists: [
      {
        id: 'pl-5',
        title: 'React Components & Hooks',
        description: 'Understand components lifecycle, virtual DOM, and useState/useEffect hooks.',
        likes: [],
        videos: [
          {
            id: 'v-6',
            title: 'Building React Components',
            description: 'Learn component composability and prop passings.',
            youtubeId: 'Ke90Tje7VS0'
          }
        ]
      }
    ],
    customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
    materials: [
      { id: 'doc-8', title: 'React Hooks Quick reference.pdf', url: 'https://drive.google.com', sectionName: 'Notes' }
    ]
  }
];

export function DatabaseProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('learnopia_users_stable');
    let loaded = saved ? JSON.parse(saved) : SEED_USERS;
    
    // Reset/Sanitize any user role/status that was set in previous legacy tests
    return loaded.map(u => {
      if (u.creatorStatus === 'pending' || u.creatorStatus === 'rejected') {
        return { ...u, role: 'learner', status: 'active' };
      }
      // Revert Alex Carter (u-3) if he was set to rejected creator
      if (u.id === 'u-3' && u.role === 'creator') {
        return { ...u, role: 'learner', status: 'active', creatorStatus: 'rejected' };
      }
      return u;
    });
  });

  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('learnopia_courses_stable');
    return saved ? JSON.parse(saved) : SEED_COURSES;
  });

  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem('learnopia_subjects_stable');
    return saved ? JSON.parse(saved) : SEED_SUBJECTS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('learnopia_current_user_stable');
    const user = saved ? JSON.parse(saved) : null;
    if (user) {
      if (user.creatorStatus === 'pending' || user.creatorStatus === 'rejected') {
        return { ...user, role: 'learner', status: 'active' };
      }
      if (user.id === 'u-3' && user.role === 'creator') {
        return { ...user, role: 'learner', status: 'active', creatorStatus: 'rejected' };
      }
    }
    return user;
  });

  // Real, persistent system activity logs
  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('learnopia_activity_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'init-1', event: 'Learn-o-pia system database initialized.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
    ];
  });

  // Sync to stable localStorage keys
  useEffect(() => {
    localStorage.setItem('learnopia_users_stable', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('learnopia_courses_stable', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('learnopia_subjects_stable', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('learnopia_current_user_stable', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('learnopia_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Log helper
  const addLog = (event) => {
    setActivityLogs(prev => [
      {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        event,
        timestamp: new Date().toISOString()
      },
      ...prev
    ].slice(0, 100)); // Cap logs at 100 entries
  };

  // Auth Operations
  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!found) {
          reject(new Error('Invalid email or password.'));
          return;
        }
        if (found.status === 'suspended') {
          reject(new Error('Your account has been suspended by an administrator.'));
          return;
        }
        setCurrentUser(found);
        addLog(`User logged in: ${found.name} (${found.role.toUpperCase()})`);
        resolve(found);
      }, 300);
    });
  };

  const loginWithGoogle = ({ name, email, picture }) => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (existing.status === 'suspended') {
        throw new Error('Your account has been suspended by an administrator.');
      }
      setCurrentUser(existing);
      addLog(`User logged in via Google: ${existing.name} (${existing.role.toUpperCase()})`);
      return existing;
    }
    const newUser = {
      id: 'u-g-' + Date.now(),
      email: email.toLowerCase(),
      name,
      picture,
      role: 'learner',
      status: 'active',
      password: null,
      enrolledCourses: []
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    addLog(`New user registered via Google: ${newUser.name} (${newUser.email})`);
    return newUser;
  };

  const registerUser = (email, name, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          reject(new Error('Email is already registered.'));
          return;
        }

        const newUser = {
          id: 'u-' + (users.length + 1),
          email: email.toLowerCase(),
          name,
          role: 'learner',
          status: 'active',
          password,
          enrolledCourses: []
        };

        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        addLog(`New user registered: ${newUser.name} (${newUser.email})`);
        resolve(newUser);
      }, 300);
    });
  };

  const logout = () => {
    if (currentUser) {
      addLog(`User logged out: ${currentUser.name}`);
    }
    setCurrentUser(null);
  };

  const requestCreatorStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, creatorStatus: 'pending' };
      }
      return u;
    }));
    const usr = users.find(u => u.id === userId);
    if (usr) {
      addLog(`Creator permission requested by: ${usr.name}`);
    }
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, creatorStatus: 'pending' }));
    }
  };

  const enrollInCourse = (courseId) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const alreadyEnrolled = u.enrolledCourses.includes(courseId);
        const updated = alreadyEnrolled ? u.enrolledCourses : [...u.enrolledCourses, courseId];
        return { ...u, enrolledCourses: updated };
      }
      return u;
    }));

    const course = courses.find(c => c.id === courseId);
    if (course) {
      addLog(`Student ${currentUser.name} enrolled in: "${course.title}"`);
    }

    setCurrentUser(prev => {
      const alreadyEnrolled = prev.enrolledCourses.includes(courseId);
      const updated = alreadyEnrolled ? prev.enrolledCourses : [...prev.enrolledCourses, courseId];
      return { ...prev, enrolledCourses: updated };
    });
  };

  // Course Management
  const addCourse = (title, department, description, price = 0, isDegree = false) => {
    if (!currentUser || (currentUser.role !== 'creator' && currentUser.role !== 'admin')) return;

    const newCourse = {
      id: 'c-' + (courses.length + 1),
      title,
      department,
      description,
      price: parseFloat(price) || 0,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      isDegree
    };

    setCourses(prev => [...prev, newCourse]);
    addLog(`New ${isDegree ? 'Degree Program' : 'Standard Course'} created: "${title}" by ${currentUser.name}`);
  };

  const editCourse = (courseId, fields) => {
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const updated = { ...c, ...fields };
        addLog(`Course updated: "${updated.title}" properties modified.`);
        return updated;
      }
      return c;
    }));
  };

  const deleteCourse = (courseId) => {
    const target = courses.find(c => c.id === courseId);
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (target) {
      addLog(`Course deleted: "${target.title}"`);
    }
  };

  const addSubject = (courseId, semester, title) => {
    const newSubject = {
      id: 's-' + (subjects.length + 1),
      courseId,
      semester: parseInt(semester) || 1,
      title,
      playlists: [],
      customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
      materials: []
    };

    setSubjects(prev => [...prev, newSubject]);
    addLog(`Subject added: "${title}" (Semester ${semester})`);
  };

  const deleteSubject = (subjectId) => {
    const target = subjects.find(s => s.id === subjectId);
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    if (target) {
      addLog(`Subject deleted: "${target.title}"`);
    }
  };

  const addSubjectPlaylist = (subjectId, title, description) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const newPlaylist = {
          id: 'pl-' + Date.now(),
          title,
          description,
          likes: [],
          videos: []
        };
        const currentPlaylists = s.playlists || [];
        addLog(`Playlist "${title}" added under subject "${s.title}"`);
        return { ...s, playlists: [...currentPlaylists, newPlaylist] };
      }
      return s;
    }));
  };

  const deleteSubjectPlaylist = (subjectId, playlistId) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const currentPlaylists = s.playlists || [];
        const playlist = currentPlaylists.find(p => p.id === playlistId);
        if (playlist) {
          addLog(`Playlist "${playlist.title}" deleted from subject "${s.title}"`);
        }
        return { ...s, playlists: currentPlaylists.filter(p => p.id !== playlistId) };
      }
      return s;
    }));
  };

  const addVideoToPlaylist = (subjectId, playlistId, title, description, url) => {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      throw new Error('Please submit a valid YouTube video link.');
    }

    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const updatedPlaylists = s.playlists.map(pl => {
          if (pl.id === playlistId) {
            const newVideo = {
              id: 'v-' + Date.now(),
              title,
              description,
              youtubeId: videoId
            };
            addLog(`Video "${title}" embedded in playlist "${pl.title}"`);
            return { ...pl, videos: [...pl.videos, newVideo] };
          }
          return pl;
        });
        return { ...s, playlists: updatedPlaylists };
      }
      return s;
    }));
  };

  const deleteVideoFromPlaylist = (subjectId, playlistId, videoId) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const updatedPlaylists = s.playlists.map(pl => {
          if (pl.id === playlistId) {
            const targetVideo = pl.videos.find(v => v.id === videoId);
            if (targetVideo) {
              addLog(`Video "${targetVideo.title}" removed from playlist "${pl.title}"`);
            }
            return { ...pl, videos: pl.videos.filter(v => v.id !== videoId) };
          }
          return pl;
        });
        return { ...s, playlists: updatedPlaylists };
      }
      return s;
    }));
  };

  const addSubjectMaterialSection = (subjectId, sectionName) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const currentSections = s.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers'];
        if (currentSections.includes(sectionName)) return s;
        addLog(`Material section folder "${sectionName}" created for subject "${s.title}"`);
        return {
          ...s,
          customMaterialSections: [...currentSections, sectionName]
        };
      }
      return s;
    }));
  };

  const deleteSubjectMaterialSection = (subjectId, sectionName) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const currentSections = s.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers'];
        const currentMaterials = s.materials || [];
        addLog(`Material section folder "${sectionName}" deleted from subject "${s.title}"`);
        return {
          ...s,
          customMaterialSections: currentSections.filter(name => name !== sectionName),
          materials: currentMaterials.filter(m => m.sectionName !== sectionName)
        };
      }
      return s;
    }));
  };

  const addSubjectMaterial = (subjectId, title, url, sectionName) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const newDoc = {
          id: 'doc-' + Date.now(),
          title,
          url,
          sectionName
        };
        const currentMaterials = s.materials || [];
        addLog(`Document link "${title}" attached to section "${sectionName}" in subject "${s.title}"`);
        return { ...s, materials: [...currentMaterials, newDoc] };
      }
      return s;
    }));
  };

  const deleteSubjectMaterial = (subjectId, materialId) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const currentMaterials = s.materials || [];
        const doc = currentMaterials.find(d => d.id === materialId);
        if (doc) {
          addLog(`Document "${doc.title}" deleted from subject "${s.title}"`);
        }
        return { ...s, materials: currentMaterials.filter(d => d.id !== materialId) };
      }
      return s;
    }));
  };

  // Playlist Liking System
  const togglePlaylistLike = (subjectId, playlistId) => {
    if (!currentUser) return;
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const updatedPlaylists = s.playlists.map(p => {
          if (p.id === playlistId) {
            const hasLiked = p.likes?.includes(currentUser.id);
            const newLikes = hasLiked
              ? p.likes.filter(id => id !== currentUser.id)
              : [...(p.likes || []), currentUser.id];
            
            if (hasLiked) {
              addLog(`Student ${currentUser.name} unliked playlist "${p.title}"`);
            } else {
              addLog(`Student ${currentUser.name} liked playlist "${p.title}"`);
            }
            return { ...p, likes: newLikes };
          }
          return p;
        });
        return { ...s, playlists: updatedPlaylists };
      }
      return s;
    }));
  };

  // Admin Dashboard Actions
  const approveCreator = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: 'creator', status: 'active', creatorStatus: 'approved' };
      }
      return u;
    }));
    const target = users.find(u => u.id === userId);
    if (target) {
      addLog(`Creator request APPROVED for: ${target.name}`);
    }
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: 'creator', status: 'active', creatorStatus: 'approved' }));
    }
  };

  const rejectCreator = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, creatorStatus: 'rejected' };
      }
      return u;
    }));
    const target = users.find(u => u.id === userId);
    if (target) {
      addLog(`Creator request REJECTED for: ${target.name}`);
    }
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, creatorStatus: 'rejected' }));
    }
  };

  const makeAdmin = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        addLog(`User "${u.name}" promoted to Admin role`);
        return { ...u, role: 'admin', status: 'active' };
      }
      return u;
    }));
  };

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'active' ? 'suspended' : 'active';
        addLog(`User "${u.name}" account status set to ${newStatus.toUpperCase()}`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  return (
    <DatabaseContext.Provider value={{
      users,
      courses,
      subjects,
      currentUser,
      activityLogs,
      login,
      loginWithGoogle,
      registerUser,
      logout,
      requestCreatorStatus,
      enrollInCourse,
      addCourse,
      editCourse,
      deleteCourse,
      addSubject,
      deleteSubject,
      addSubjectPlaylist,
      deleteSubjectPlaylist,
      addVideoToPlaylist,
      deleteVideoFromPlaylist,
      addSubjectMaterialSection,
      deleteSubjectMaterialSection,
      addSubjectMaterial,
      deleteSubjectMaterial,
      togglePlaylistLike,
      approveCreator,
      rejectCreator,
      makeAdmin,
      toggleUserStatus
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
