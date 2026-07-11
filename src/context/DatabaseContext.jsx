import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DatabaseContext = createContext();

const mapProfile = (dbProfile) => {
  if (!dbProfile) return null;
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    name: dbProfile.name,
    role: dbProfile.role,
    status: dbProfile.status,
    creatorStatus: dbProfile.creator_status,
    enrolledCourses: dbProfile.enrolled_courses || []
  };
};

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
  }
];

export function DatabaseProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  // Check if Supabase client is active
  const isSupabaseLive = !!supabase;

  // ── Sync/Load Data ─────────────────────────────────────────────────────────
  const syncLocal = () => {
    const savedUsers = localStorage.getItem('learnopia_users_stable');
    const savedCourses = localStorage.getItem('learnopia_courses_stable');
    const savedSubjects = localStorage.getItem('learnopia_subjects_stable');
    const savedUser = localStorage.getItem('learnopia_current_user_stable');
    const savedLogs = localStorage.getItem('learnopia_activity_logs');

    let loadedUsers = savedUsers ? JSON.parse(savedUsers) : SEED_USERS;
    // Revert/Migrate legacy creator role states
    loadedUsers = loadedUsers.map(u => {
      if (u.creatorStatus === 'pending' || u.creatorStatus === 'rejected') {
        return { ...u, role: 'learner', status: 'active' };
      }
      if (u.id === 'u-3' && u.role === 'creator') {
        return { ...u, role: 'learner', status: 'active', creatorStatus: 'rejected' };
      }
      return u;
    });

    setUsers(loadedUsers);
    setCourses(savedCourses ? JSON.parse(savedCourses) : SEED_COURSES);
    setSubjects(savedSubjects ? JSON.parse(savedSubjects) : SEED_SUBJECTS);
    
    let activeUser = savedUser ? JSON.parse(savedUser) : null;
    if (activeUser) {
      if (activeUser.creatorStatus === 'pending' || activeUser.creatorStatus === 'rejected') {
        activeUser = { ...activeUser, role: 'learner', status: 'active' };
      }
      if (activeUser.id === 'u-3' && activeUser.role === 'creator') {
        activeUser = { ...activeUser, role: 'learner', status: 'active', creatorStatus: 'rejected' };
      }
    }
    setCurrentUser(activeUser);

    setActivityLogs(savedLogs ? JSON.parse(savedLogs) : [
      { id: 'init-1', event: 'Learn-o-pia system database initialized.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
    ]);
    setAuthLoading(false);
  };

  const syncSupabase = async () => {
    try {
      // 1. Users profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      if (profiles) setUsers(profiles.map(mapProfile));

      // 2. Courses
      const { data: coursesData } = await supabase.from('courses').select('*');
      if (coursesData) setCourses(coursesData);

      // 3. Subjects assembly (nested structure)
      const { data: subs } = await supabase.from('subjects').select('*');
      const { data: playlists } = await supabase.from('playlists').select('*');
      const { data: videos } = await supabase.from('videos').select('*');
      const { data: materials } = await supabase.from('materials').select('*');

      if (subs) {
        const assembled = subs.map(s => {
          const subPlaylists = (playlists || [])
            .filter(pl => pl.subject_id === s.id)
            .map(pl => ({
              id: pl.id,
              title: pl.title,
              description: pl.description,
              likes: pl.likes || [],
              videos: (videos || [])
                .filter(v => v.playlist_id === pl.id)
                .map(v => ({
                  id: v.id,
                  title: v.title,
                  description: v.description,
                  youtubeId: v.youtube_id
                }))
            }));

          const subMaterials = (materials || [])
            .filter(m => m.subject_id === s.id)
            .map(m => ({
              id: m.id,
              title: m.title,
              url: m.url,
              sectionName: m.section_name
            }));

          return {
            id: s.id,
            courseId: s.course_id,
            semester: s.semester,
            title: s.title,
            playlists: subPlaylists,
            customMaterialSections: s.custom_material_sections || ['Notes', 'Organizer', 'Past Year Papers'],
            materials: subMaterials
          };
        });
        setSubjects(assembled);
      }

      // 4. Logs
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (logs) setActivityLogs(logs);

      // 5. Auth Sync
      const { data: authSession } = await supabase.auth.getSession();
      if (authSession?.session?.user) {
        const user = authSession.session.user;
        let { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!dbProfile) {
          const newProfile = {
            id: user.id,
            email: user.email.toLowerCase(),
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: 'learner',
            status: 'active',
            enrolled_courses: []
          };
          await supabase.from('profiles').insert([newProfile]);
          dbProfile = newProfile;
          addLog(`New user registered via Google: ${newProfile.name}`);
        }
        
        const mapped = mapProfile(dbProfile);
        if (mapped) {
          if (mapped.status === 'suspended') {
            await supabase.auth.signOut();
            setCurrentUser(null);
          } else {
            setCurrentUser(mapped);
          }
        }
      }
    } catch (err) {
      console.error('Supabase load error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (isSupabaseLive) {
      syncSupabase();
    } else {
      syncLocal();
    }
  }, [isSupabaseLive]);

  // Save changes locally if in local mode
  useEffect(() => {
    if (!isSupabaseLive && users.length > 0) {
      localStorage.setItem('learnopia_users_stable', JSON.stringify(users));
    }
  }, [users, isSupabaseLive]);

  useEffect(() => {
    if (!isSupabaseLive && courses.length > 0) {
      localStorage.setItem('learnopia_courses_stable', JSON.stringify(courses));
    }
  }, [courses, isSupabaseLive]);

  useEffect(() => {
    if (!isSupabaseLive && subjects.length > 0) {
      localStorage.setItem('learnopia_subjects_stable', JSON.stringify(subjects));
    }
  }, [subjects, isSupabaseLive]);

  useEffect(() => {
    if (!isSupabaseLive) {
      localStorage.setItem('learnopia_current_user_stable', JSON.stringify(currentUser));
    }
  }, [currentUser, isSupabaseLive]);

  useEffect(() => {
    if (!isSupabaseLive && activityLogs.length > 0) {
      localStorage.setItem('learnopia_activity_logs', JSON.stringify(activityLogs));
    }
  }, [activityLogs, isSupabaseLive]);

  // Log Helper
  const addLog = async (event) => {
    if (isSupabaseLive) {
      await supabase.from('activity_logs').insert([{ event }]);
      syncSupabase();
    } else {
      setActivityLogs(prev => [
        { id: 'log-' + Date.now(), event, timestamp: new Date().toISOString() },
        ...prev
      ].slice(0, 100));
    }
  };

  // ── Database Operations ───────────────────────────────────────────────────

  const login = async (email, password) => {
    if (isSupabaseLive) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });
      if (error) {
        throw new Error(error.message || 'Login failed. Please check your credentials.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message || 'Failed to retrieve user profile.');
      }

      if (!profile) {
        // Auto-create profile if missing
        const newProfile = {
          id: data.user.id,
          email: email.toLowerCase(),
          name: email.split('@')[0],
          role: 'learner',
          status: 'active',
          enrolled_courses: []
        };
        const { error: createError } = await supabase.from('profiles').insert([newProfile]);
        if (createError) {
          throw new Error('Failed to initialize user database profile.');
        }
        const mapped = mapProfile(newProfile);
        setCurrentUser(mapped);
        return mapped;
      }

      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('Your account has been suspended by an administrator.');
      }

      const mapped = mapProfile(profile);
      setCurrentUser(mapped);
      addLog(`User logged in: ${mapped.name} (${mapped.role.toUpperCase()})`);
      return mapped;
    } else {
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) throw new Error('Invalid email or password.');
      if (found.status === 'suspended') throw new Error('Your account has been suspended.');
      setCurrentUser(found);
      addLog(`User logged in: ${found.name} (${found.role.toUpperCase()})`);
      return found;
    }
  };

  const loginWithGoogle = async (googleUser = null) => {
    if (isSupabaseLive) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw new Error(error.message || 'Google OAuth redirect failed.');
      return data;
    } else {
      // Local fallback — handles both mock login and local google authentication
      const email = googleUser?.email || 'learner@learnopia.edu';
      const name = googleUser?.name || 'Alex Carter';
      const picture = googleUser?.picture || null;
      
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setCurrentUser(existing);
        addLog(`User logged in via Google: ${existing.name}`);
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
      addLog(`New user registered via Google: ${newUser.name}`);
      return newUser;
    }
  };

  const registerUser = async (email, name, password) => {
    if (isSupabaseLive) {
      // Pre-check if email already exists in profiles to prevent user enumeration fake UUID issues
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        throw new Error('This email address is already registered. Please sign in instead.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password
      });
      if (error) {
        throw new Error(error.message || 'Registration failed.');
      }
      if (!data || !data.user) {
        throw new Error('Registration failed.');
      }

      // Check if user requires email confirmation (confirmed_at is null)
      const requiresConfirmation = !data.user.confirmed_at;

      const newProfile = {
        id: data.user.id,
        email: email.toLowerCase(),
        name,
        role: 'learner',
        status: 'active',
        enrolled_courses: []
      };

      const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
      if (insertError) {
        throw new Error(insertError.message || 'Profile insertion failed.');
      }

      addLog(`New user registered: ${name}`);
      syncSupabase();

      if (requiresConfirmation) {
        return { requiresConfirmation: true };
      }

      const mapped = mapProfile(newProfile);
      setCurrentUser(mapped);
      return mapped;
    } else {
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) throw new Error('Email is already registered.');

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
      addLog(`New user registered: ${newUser.name}`);
      return newUser;
    }
  };

  const logout = async () => {
    if (isSupabaseLive) {
      await supabase.auth.signOut();
    }
    if (currentUser) {
      addLog(`User logged out: ${currentUser.name}`);
    }
    setCurrentUser(null);
    localStorage.removeItem('learnopia_view');
    localStorage.removeItem('learnopia_selected_playlist');
    localStorage.removeItem('learnopia_selected_video');
  };

  const requestCreatorStatus = async (userId) => {
    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ creator_status: 'pending' })
        .eq('id', userId);
      addLog(`Creator permission requested.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, creatorStatus: 'pending' } : u));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, creatorStatus: 'pending' }));
      }
      addLog(`Creator permission requested.`);
    }
  };

  const enrollInCourse = async (courseId) => {
    if (!currentUser) return;
    const currentEnrolled = currentUser.enrolledCourses || [];
    if (currentEnrolled.includes(courseId)) return;

    const updated = [...currentEnrolled, courseId];

    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ enrolled_courses: updated })
        .eq('id', currentUser.id);
      addLog(`Student enrolled in course.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, enrolledCourses: updated } : u));
      setCurrentUser(prev => ({ ...prev, enrolledCourses: updated }));
      addLog(`Student enrolled in course.`);
    }
  };

  const addCourse = async (title, department, description, price = 0, isDegree = false) => {
    if (!currentUser) return;
    if (isSupabaseLive) {
      await supabase.from('courses').insert([{
        title,
        department,
        description,
        price: parseFloat(price) || 0,
        creator_id: currentUser.id,
        creator_name: currentUser.name,
        is_degree: isDegree
      }]);
      addLog(`Course created: "${title}"`);
      syncSupabase();
    } else {
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
      addLog(`Course created: "${title}"`);
    }
  };

  const editCourse = async (courseId, fields) => {
    if (isSupabaseLive) {
      await supabase
        .from('courses')
        .update({
          title: fields.title,
          description: fields.description,
          price: fields.price !== undefined ? parseFloat(fields.price) : undefined
        })
        .eq('id', courseId);
      addLog(`Course updated.`);
      syncSupabase();
    } else {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...fields } : c));
      addLog(`Course updated.`);
    }
  };

  const deleteCourse = async (courseId) => {
    if (isSupabaseLive) {
      await supabase.from('courses').delete().eq('id', courseId);
      addLog(`Course deleted.`);
      syncSupabase();
    } else {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      addLog(`Course deleted.`);
    }
  };

  const addSubject = async (courseId, semester, title) => {
    if (isSupabaseLive) {
      await supabase.from('subjects').insert([{
        course_id: courseId,
        semester: parseInt(semester) || 1,
        title,
        custom_material_sections: ['Notes', 'Organizer', 'Past Year Papers']
      }]);
      addLog(`Subject added: "${title}"`);
      syncSupabase();
    } else {
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
      addLog(`Subject added: "${title}"`);
    }
  };

  const deleteSubject = async (subjectId) => {
    if (isSupabaseLive) {
      await supabase.from('subjects').delete().eq('id', subjectId);
      addLog(`Subject deleted.`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      addLog(`Subject deleted.`);
    }
  };

  const addSubjectPlaylist = async (subjectId, title, description) => {
    if (isSupabaseLive) {
      await supabase.from('playlists').insert([{
        subject_id: subjectId,
        title,
        description,
        likes: []
      }]);
      addLog(`Playlist added: "${title}"`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const newPlaylist = {
            id: 'pl-' + Date.now(),
            title,
            description,
            likes: [],
            videos: []
          };
          return { ...s, playlists: [...(s.playlists || []), newPlaylist] };
        }
        return s;
      }));
      addLog(`Playlist added: "${title}"`);
    }
  };

  const deleteSubjectPlaylist = async (subjectId, playlistId) => {
    if (isSupabaseLive) {
      await supabase.from('playlists').delete().eq('id', playlistId);
      addLog(`Playlist deleted.`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, playlists: (s.playlists || []).filter(p => p.id !== playlistId) } : s));
      addLog(`Playlist deleted.`);
    }
  };

  const addVideoToPlaylist = async (subjectId, playlistId, title, description, url) => {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      throw new Error('Please submit a valid YouTube video link.');
    }

    if (isSupabaseLive) {
      await supabase.from('videos').insert([{
        playlist_id: playlistId,
        title,
        description,
        youtube_id: videoId
      }]);
      addLog(`Video added: "${title}"`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const updatedPlaylists = (s.playlists || []).map(pl => {
            if (pl.id === playlistId) {
              const newVideo = { id: 'v-' + Date.now(), title, description, youtubeId: videoId };
              return { ...pl, videos: [...(pl.videos || []), newVideo] };
            }
            return pl;
          });
          return { ...s, playlists: updatedPlaylists };
        }
        return s;
      }));
      addLog(`Video added: "${title}"`);
    }
  };

  const deleteVideoFromPlaylist = async (subjectId, playlistId, videoId) => {
    if (isSupabaseLive) {
      await supabase.from('videos').delete().eq('id', videoId);
      addLog(`Video deleted.`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const updatedPlaylists = (s.playlists || []).map(pl => {
            if (pl.id === playlistId) {
              return { ...pl, videos: (pl.videos || []).filter(v => v.id !== videoId) };
            }
            return pl;
          });
          return { ...s, playlists: updatedPlaylists };
        }
        return s;
      }));
      addLog(`Video deleted.`);
    }
  };

  const addSubjectMaterialSection = async (subjectId, sectionName) => {
    if (isSupabaseLive) {
      const sub = subjects.find(s => s.id === subjectId);
      if (!sub) return;
      const current = sub.customMaterialSections || [];
      if (current.includes(sectionName)) return;

      await supabase
        .from('subjects')
        .update({ custom_material_sections: [...current, sectionName] })
        .eq('id', subjectId);
      addLog(`Section folder created: "${sectionName}"`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const current = s.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers'];
          if (current.includes(sectionName)) return s;
          return { ...s, customMaterialSections: [...current, sectionName] };
        }
        return s;
      }));
      addLog(`Section folder created: "${sectionName}"`);
    }
  };

  const deleteSubjectMaterialSection = async (subjectId, sectionName) => {
    if (isSupabaseLive) {
      const sub = subjects.find(s => s.id === subjectId);
      if (!sub) return;
      const current = sub.customMaterialSections || [];

      // Delete material links belonging to this section from database
      await supabase.from('materials').delete().eq('subject_id', subjectId).eq('section_name', sectionName);

      await supabase
        .from('subjects')
        .update({ custom_material_sections: current.filter(n => n !== sectionName) })
        .eq('id', subjectId);

      addLog(`Section folder deleted.`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const current = s.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers'];
          const currentMaterials = s.materials || [];
          return {
            ...s,
            customMaterialSections: current.filter(n => n !== sectionName),
            materials: currentMaterials.filter(m => m.sectionName !== sectionName)
          };
        }
        return s;
      }));
      addLog(`Section folder deleted.`);
    }
  };

  const addSubjectMaterial = async (subjectId, title, url, sectionName) => {
    if (isSupabaseLive) {
      await supabase.from('materials').insert([{
        subject_id: subjectId,
        title,
        url,
        section_name: sectionName
      }]);
      addLog(`Document attached: "${title}"`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const newDoc = { id: 'doc-' + Date.now(), title, url, sectionName };
          return { ...s, materials: [...(s.materials || []), newDoc] };
        }
        return s;
      }));
      addLog(`Document attached: "${title}"`);
    }
  };

  const deleteSubjectMaterial = async (subjectId, materialId) => {
    if (isSupabaseLive) {
      await supabase.from('materials').delete().eq('id', materialId);
      addLog(`Document deleted.`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, materials: (s.materials || []).filter(m => m.id !== materialId) } : s));
      addLog(`Document deleted.`);
    }
  };

  const togglePlaylistLike = async (subjectId, playlistId) => {
    if (!currentUser) return;
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;
    const pl = (sub.playlists || []).find(p => p.id === playlistId);
    if (!pl) return;

    const likes = pl.likes || [];
    const hasLiked = likes.includes(currentUser.id);
    const updatedLikes = hasLiked
      ? likes.filter(id => id !== currentUser.id)
      : [...likes, currentUser.id];

    if (isSupabaseLive) {
      await supabase
        .from('playlists')
        .update({ likes: updatedLikes })
        .eq('id', playlistId);
      addLog(hasLiked ? 'Unliked playlist.' : 'Liked playlist.');
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const updated = (s.playlists || []).map(p => p.id === playlistId ? { ...p, likes: updatedLikes } : p);
          return { ...s, playlists: updated };
        }
        return s;
      }));
      addLog(hasLiked ? 'Unliked playlist.' : 'Liked playlist.');
    }
  };

  const approveCreator = async (userId) => {
    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ role: 'creator', status: 'active', creator_status: 'approved' })
        .eq('id', userId);
      addLog(`Creator approved.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'creator', status: 'active', creatorStatus: 'approved' } : u));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, role: 'creator', status: 'active', creatorStatus: 'approved' }));
      }
      addLog(`Creator approved.`);
    }
  };

  const rejectCreator = async (userId) => {
    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ creator_status: 'rejected' })
        .eq('id', userId);
      addLog(`Creator rejected.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, creatorStatus: 'rejected' } : u));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, creatorStatus: 'rejected' }));
      }
      addLog(`Creator rejected.`);
    }
  };

  const makeAdmin = async (userId) => {
    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ role: 'admin', status: 'active' })
        .eq('id', userId);
      addLog(`Promoted user to admin.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin', status: 'active' } : u));
      addLog(`Promoted user to admin.`);
    }
  };

  const toggleUserStatus = async (userId) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'suspended' : 'active';

    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      addLog(`User status changed to ${newStatus}.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      addLog(`User status changed to ${newStatus}.`);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    if (isSupabaseLive) {
      const updates = { role: newRole };
      if (newRole === 'learner') {
        updates.creator_status = null;
      }
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      addLog(`User role changed to ${newRole}.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          const updated = { ...u, role: newRole };
          if (newRole === 'learner') {
            updated.creatorStatus = null;
          }
          return updated;
        }
        return u;
      }));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => {
          const updated = { ...prev, role: newRole };
          if (newRole === 'learner') {
            updated.creatorStatus = null;
          }
          return updated;
        });
      }
      addLog(`User role changed to ${newRole}.`);
    }
  };

  return (
    <DatabaseContext.Provider value={{
      users,
      courses,
      subjects,
      currentUser,
      authLoading,
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
      toggleUserStatus,
      changeUserRole
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
