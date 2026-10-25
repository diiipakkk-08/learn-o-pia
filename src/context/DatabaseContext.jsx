/**
 * DatabaseContext.jsx
 * Central application state and data persistence layer for Learn-O-Pia:
 * - Supabase Cloud Synchronization (Courses, Playlists, Users, Notices, Shared Routines)
 * - LocalStorage Offline Resilience & Cache Fallback
 * - YouTube Data API & IFrame Playlist Scraper Utilities
 * - Student, Educator, and Administrator role-based access control (RBAC)
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseLive } from '../lib/supabaseClient';
import { foldersToProfilePayload, profilePayloadToFolders, saveWorkspaceFolders } from '../utils/workspaceFolders';

const DatabaseContext = createContext();

export const extractYoutubePlaylistId = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  
  // 1. Match ?list=... or &list=...
  const match = trimmed.match(/[?&]list=([^#&]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // 2. Match embed/videoseries?list=...
  const matchEmbed = trimmed.match(/embed\/videoseries\?list=([^#&]+)/);
  if (matchEmbed && matchEmbed[1]) {
    return matchEmbed[1];
  }

  // 3. Raw Playlist ID: Must contain NO spaces and match valid YouTube playlist ID format
  if (!trimmed.includes(' ') && !trimmed.includes('/') && !trimmed.includes('?')) {
    if (/^(PL|FL|UU|RD|LL|LM|OLAK)[A-Za-z0-9_-]+$/.test(trimmed) || (/^[A-Za-z0-9_-]{16,}$/.test(trimmed))) {
      return trimmed;
    }
  }

  return '';
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 3500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const fetchYoutubePlaylistVideosFallback = async (playlistId) => {
  if (!playlistId) return [];

  let bestVideoList = [];

  // Provider 1: Piped & Invidious Open APIs
  const openApiInstances = [
    `https://api.piped.video/playlists/${playlistId}`,
    `https://pipedapi.kavin.rocks/playlists/${playlistId}`,
    `https://inv.tux.pizza/api/v1/playlists/${playlistId}`,
    `https://invidious.nerdvpn.de/api/v1/playlists/${playlistId}`,
    `https://vid.puffyan.us/api/v1/playlists/${playlistId}`
  ];

  for (const apiUrl of openApiInstances) {
    try {
      const res = await fetchWithTimeout(apiUrl, { headers: { 'Accept': 'application/json' } }, 3500);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.relatedStreams) && data.relatedStreams.length > 0) {
          const vids = data.relatedStreams.map((item, idx) => {
            let vId = '';
            if (item.url) {
              const m = item.url.match(/[?&]v=([^#&]+)/);
              if (m && m[1]) vId = m[1];
            }
            return {
              id: 'yt-v-' + Date.now() + '-' + idx,
              title: item.title || `Lecture ${idx + 1}`,
              description: '',
              youtubeId: vId,
              position: idx,
              likes: []
            };
          }).filter(v => v.youtubeId);

          if (vids.length > bestVideoList.length) {
            bestVideoList = vids;
          }
        }
        if (data && Array.isArray(data.videos) && data.videos.length > 0) {
          const vids = data.videos.map((item, idx) => ({
            id: 'yt-v-' + Date.now() + '-' + idx,
            title: item.title || `Lecture ${idx + 1}`,
            description: item.description || '',
            youtubeId: item.videoId,
            position: idx,
            likes: []
          })).filter(v => v.youtubeId);

          if (vids.length > bestVideoList.length) {
            bestVideoList = vids;
          }
        }
      }
    } catch {}
    if (bestVideoList.length >= 20) break;
  }

  if (bestVideoList.length >= 20) {
    return bestVideoList;
  }

  // Provider 2: Fallback rss2json
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetchWithTimeout(apiUrl, {}, 3000);
    const data = await res.json();

    if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
      return data.items.map((item, idx) => {
        let videoId = '';
        if (item.guid && item.guid.includes('yt:video:')) {
          videoId = item.guid.replace('yt:video:', '');
        } else if (item.link) {
          const match = item.link.match(/[?&]v=([^#&]+)/);
          if (match && match[1]) videoId = match[1];
        }
        return {
          id: 'yt-v-' + (Date.now() + idx),
          title: item.title || `Lecture ${idx + 1}`,
          description: item.description ? item.description.substring(0, 200) : '',
          youtubeId: videoId,
          position: idx,
          likes: []
        };
      }).filter(v => v.youtubeId);
    }
  } catch {}

  return bestVideoList;
};

export const fetchYoutubePlaylistVideos = async (playlistId) => {
  if (!playlistId) return [];

  // Try Native YouTube iFrame Player API in Browser
  const nativeResult = await new Promise((resolve) => {
    let resolved = false;

    const timeoutTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 7000);

    // Ensure YT iFrame API is loaded
    if (typeof window !== 'undefined') {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else if (document.head) {
          document.head.appendChild(tag);
        }
      }

      let container = document.getElementById('temp-yt-importer-container');
      if (!container && document.body) {
        container = document.createElement('div');
        container.id = 'temp-yt-importer-container';
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = '1px';
        container.style.height = '1px';
        container.style.opacity = '0.01';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
      }

      const playerDivId = 'temp-yt-player-' + Date.now();
      const playerDiv = document.createElement('div');
      playerDiv.id = playerDivId;
      if (container) container.appendChild(playerDiv);

      let attempts = 0;
      const checkYT = () => {
        if (resolved) return;
        attempts++;
        if (window.YT && window.YT.Player) {
          try {
            const player = new window.YT.Player(playerDivId, {
              height: '100',
              width: '100',
              playerVars: {
                listType: 'playlist',
                list: playlistId,
                autoplay: 0
              },
              events: {
                onReady: async (event) => {
                  if (resolved) return;
                  try {
                    const videoIds = event.target.getPlaylist();
                    if (Array.isArray(videoIds) && videoIds.length > 0) {
                      resolved = true;
                      clearTimeout(timeoutTimer);
                      try { player.destroy(); playerDiv.remove(); } catch {}

                      // Fetch titles in parallel via oembed
                      const formatted = await Promise.all(
                        videoIds.map(async (vId, idx) => {
                          let title = `Lecture ${idx + 1}`;
                          try {
                            const oeRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vId}&format=json`);
                            if (oeRes.ok) {
                              const oeData = await oeRes.json();
                              if (oeData.title) title = oeData.title;
                            }
                          } catch {}

                          return {
                            id: 'yt-v-' + Date.now() + '-' + idx,
                            title,
                            description: '',
                            youtubeId: vId,
                            position: idx,
                            likes: []
                          };
                        })
                      );
                      resolve(formatted);
                      return;
                    }
                  } catch (err) {
                    console.warn("Native YT Player error:", err);
                  }
                },
                onError: () => {
                  if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutTimer);
                    try { player.destroy(); playerDiv.remove(); } catch {}
                    resolve(null);
                  }
                }
              }
            });
          } catch {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutTimer);
              resolve(null);
            }
          }
        } else if (attempts < 30) {
          setTimeout(checkYT, 200);
        } else {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutTimer);
            resolve(null);
          }
        }
      };

      checkYT();
    } else {
      resolve(null);
    }
  });

  if (nativeResult && nativeResult.length > 0) {
    console.log(`Native YT iFrame API extracted ${nativeResult.length} videos!`);
    return nativeResult;
  }

  return await fetchYoutubePlaylistVideosFallback(playlistId);
};

export const extractYoutubeVideoId = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  const m1 = trimmed.match(/[?&]v=([^#&]+)/);
  if (m1 && m1[1]) return m1[1];
  const m2 = trimmed.match(/youtu\.be\/([^?#&]+)/);
  if (m2 && m2[1]) return m2[1];
  const m3 = trimmed.match(/embed\/([^?#&]+)/);
  if (m3 && m3[1]) return m3[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return '';
};

export const cleanCourseTitle = (rawTitle) => {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  let clean = rawTitle.trim();
  clean = clean
    .replace(/^(lecture|lec|video|day|part|ep|episode|class)\s*#?1[:\s-]+/i, '')
    .replace(/^#?1[:\s-]+/i, '')
    .replace(/\s*-\s*YouTube\s*$/i, '')
    .trim();
  return clean || rawTitle;
};

export const extractPlaylistTitleFromVideos = (videos, fallbackChannel) => {
  if (!Array.isArray(videos) || videos.length === 0) return '';
  const titles = videos.map(v => (typeof v === 'string' ? v : v.title || '')).filter(Boolean);
  if (titles.length === 0) return '';

  // 1. Try finding common prefix before delimiter (e.g. "Python Tutorial | Lecture 1", "Python Tutorial | Lecture 2")
  const delimiters = [' | ', ' - ', ' — ', ' // ', ' : ', ' • ', ': '];

  for (const delim of delimiters) {
    const parts0 = titles[0].split(delim);
    if (parts0.length >= 2) {
      const candidatePrefix = parts0[0].trim();
      if (!candidatePrefix.match(/^(lecture|lec|video|day|part|ep|episode|class|#|\d+)\s*#?\d*$/i) && candidatePrefix.length > 3) {
        const matches = titles.filter(t => t.startsWith(candidatePrefix + delim) || t.startsWith(candidatePrefix + ' '));
        if (matches.length >= Math.min(2, titles.length)) {
          return candidatePrefix;
        }
      }

      const candidateSuffix = parts0[parts0.length - 1].trim();
      if (!candidateSuffix.match(/^(lecture|lec|video|day|part|ep|episode|class|#|\d+)\s*#?\d*$/i) && candidateSuffix.length > 3) {
        const matchesSuffix = titles.filter(t => t.endsWith(delim + candidateSuffix) || t.endsWith(' ' + candidateSuffix));
        if (matchesSuffix.length >= Math.min(2, titles.length)) {
          if (!fallbackChannel || candidateSuffix.toLowerCase() !== fallbackChannel.toLowerCase()) {
            return candidateSuffix;
          }
        }
      }
    }
  }

  // 2. Fallback: Clean up first video title by removing lecture numbers and episode tags
  let clean = titles[0];
  if (fallbackChannel) {
    clean = clean.replace(new RegExp(`\\s*[-|•]\\s*${fallbackChannel}\\s*$`, 'i'), '');
  }
  clean = clean
    .replace(/^(lecture|lec|video|day|part|ep|episode|class)\s*#?\d*[:\s-]+/i, '')
    .replace(/^#?\d+[:\s-]+/i, '')
    .replace(/\s*[-|•]\s*(lecture|lec|video|day|part|ep|episode|class)\s*#?\d*.*/i, '')
    .replace(/\s*[-|•]\s*#?\d+.*$/i, '')
    .trim();

  return clean || titles[0];
};

export const fetchYoutubePlaylistTitle = async (playlistId) => {
  if (!playlistId) return null;
  try {
    const res = await fetchWithTimeout(
      `https://r.jina.ai/https://www.youtube.com/playlist?list=${playlistId}`,
      { headers: { 'Accept': 'application/json' } },
      4500
    );
    if (res.ok) {
      const data = await res.json();
      const rawTitle = data.data ? data.data.title : data.title;
      if (rawTitle && typeof rawTitle === 'string') {
        const clean = rawTitle.replace(/\s*-\s*YouTube\s*$/i, '').trim();
        if (clean && clean !== 'YouTube' && clean !== 'undefined' && !clean.toLowerCase().includes('before you continue')) {
          return clean;
        }
      }
    }
  } catch {}
  return null;
};

export const fetchYoutubeMetadata = async (urlOrId) => {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const playlistId = extractYoutubePlaylistId(trimmed);
  const videoId = extractYoutubeVideoId(trimmed);

  let result = {
    title: '',
    author: '',
    description: '',
    thumbnailUrl: '',
    playlistId: playlistId || '',
    videoId: videoId || '',
    videoCount: 0
  };

  let targetVideoId = videoId;

  // CASE 1: PLAYLIST / COURSE
  if (playlistId) {
    // 1. Fetch real playlist title from YouTube
    try {
      const plTitle = await fetchYoutubePlaylistTitle(playlistId);
      if (plTitle) {
        result.title = plTitle;
      }
    } catch {}

    // 2. Fetch playlist videos to determine videoCount, author, and fallback title
    try {
      const videos = await fetchYoutubePlaylistVideos(playlistId);
      if (Array.isArray(videos) && videos.length > 0) {
        result.videoCount = videos.length;
        const firstVid = videos[0];
        if (!targetVideoId && firstVid?.youtubeId) {
          targetVideoId = firstVid.youtubeId;
        }

        // If title still not resolved, extract common playlist name across videos
        if (!result.title) {
          result.title = extractPlaylistTitleFromVideos(videos, result.author);
        }
      }
    } catch {}
  }

  // CASE 2: oEmbed query for author & thumbnail (and title ONLY IF NOT a playlist)
  if (targetVideoId) {
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${targetVideoId}&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (!result.author && data.author_name) result.author = data.author_name;
        if (!result.thumbnailUrl && data.thumbnail_url) result.thumbnailUrl = data.thumbnail_url;
        
        // ONLY if this is a standalone single video (NOT a playlist), use the video's title
        if (!playlistId && data.title) {
          result.title = data.title;
        }

        if (result.author && !result.description) {
          result.description = playlistId
            ? `Curated comprehensive curriculum series (${result.videoCount || 'full'} lectures) by ${result.author}.`
            : `Educational lecture video by ${result.author}.`;
        }
      }
    } catch {}
  }

  // CASE 3: Final safety fallbacks
  if (!result.title) {
    result.title = playlistId ? 'Curated University Course' : 'University Lecture';
  }

  return result;
};

export const getUserDesignation = (user) => {
  if (!user) return 'Guest User';
  return user.name || user.username || 'User';
};

const mapProfile = (dbProfile) => {
  if (!dbProfile) return null;
  
  // Database 'role' is the single source of truth.
  // In offline mode (no Supabase), admin@learnopia.edu defaults to owner.
  const isOwner = dbProfile.role === 'owner' || (!isSupabaseLive && dbProfile.email?.toLowerCase() === 'admin@learnopia.edu');
  const isCompletedInDb = dbProfile.onboarding_completed === true || dbProfile.onboarding_completed === 'true' || dbProfile.onboardingCompleted === true || dbProfile.onboardingCompleted === 'true';
  const isCompleted = isOwner || isCompletedInDb;

  return {
    id: dbProfile.id,
    name: dbProfile.name || (dbProfile.email ? dbProfile.email.split('@')[0] : 'User'),
    username: dbProfile.username || `@${(dbProfile.name || (dbProfile.email ? dbProfile.email.split('@')[0] : 'user')).toLowerCase().replace(/\s+/g, '')}`,
    email: dbProfile.email,
    password: dbProfile.password || '',
    picture: dbProfile.picture || dbProfile.avatar_url || dbProfile.avatar || dbProfile.dpUrl || dbProfile.dp || null,
    phone: dbProfile.phone || '',
    college: dbProfile.college || '',
    department: dbProfile.department || '',
    courseName: dbProfile.course_name || dbProfile.courseName || '',
    joiningYear: dbProfile.joining_year || dbProfile.joiningYear || '',
    passingYear: dbProfile.passing_year || dbProfile.passingYear || '',
    totalSemesters: dbProfile.total_semesters || dbProfile.totalSemesters || 8,
    interests: dbProfile.interests || '',
    educationLevel: dbProfile.education_level || dbProfile.educationLevel || 'college',
    dob: dbProfile.dob || '',
    targetExam: dbProfile.target_exam || dbProfile.targetExam || '',
    onboardingCompleted: isCompleted,
    idCardLink: dbProfile.id_card_link || dbProfile.idCardLink || '',
    isVerified: !!(dbProfile.is_verified || dbProfile.isVerified || isOwner),
    verificationStatus: dbProfile.verification_status || dbProfile.verificationStatus || (isOwner ? 'verified' : ((dbProfile.id_card_link || dbProfile.idCardLink) ? 'pending' : 'none')),
    verificationType: dbProfile.verification_type || dbProfile.verificationType || (isOwner ? 'creator' : 'student'),
    role: dbProfile.role || (isOwner ? 'owner' : 'learner'),
    status: dbProfile.status || 'active',
    creatorStatus: dbProfile.creator_status || dbProfile.creatorStatus || null,
    enrolledCourses: dbProfile.enrolled_courses || dbProfile.enrolledCourses || [],
    enrolledPlaylists: dbProfile.enrolled_playlists || dbProfile.enrolledPlaylists || ['pl-1'],
    folderAcademic: dbProfile.folder_academic || dbProfile.folderAcademic || null,
    folderDocument: dbProfile.folder_document || dbProfile.folderDocument || null,
    folderLinks: dbProfile.folder_links || dbProfile.folderLinks || null,
    folderPersonal: dbProfile.folder_personal || dbProfile.folderPersonal || null
  };
};

const SEED_USERS = [
  { id: 'u-1', email: 'admin@learnopia.edu', name: 'Deepak Shaw', username: '@deepak_shaw', phone: '+91 9876543210', college: 'MAKAUT University', department: 'CSE/IT', interests: 'Computer Science, AI, Web Development', isVerified: true, verificationStatus: 'verified', verificationType: 'creator', role: 'owner', status: 'active', password: 'admin123', onboardingCompleted: true, enrolledCourses: ['c-1'], enrolledPlaylists: ['pl-1'] },
  { id: 'u-2', email: 'creator@learnopia.edu', name: 'Sarah Miller', username: '@sarah_miller', phone: '+91 9876543211', college: 'MAKAUT Campus', department: 'Physics', interests: 'Quantum Mechanics, Wave Optics', isVerified: true, verificationStatus: 'verified', verificationType: 'professor', role: 'creator', status: 'active', password: 'creator123', onboardingCompleted: false, enrolledCourses: [], enrolledPlaylists: ['pl-1', 'pl-2'] },
  { id: 'u-3', email: 'learner@learnopia.edu', name: 'Alex Carter', username: '@alex_carter', phone: '+91 9876543212', college: 'Heritage Institute', department: 'CSE', interests: 'Data Structures, C Programming', isVerified: true, verificationStatus: 'verified', verificationType: 'student', role: 'learner', status: 'active', password: 'learner123', onboardingCompleted: false, enrolledCourses: [], enrolledPlaylists: ['pl-1'] }
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
    isDegree: true,
    bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'c-2',
    title: 'B.Tech Information Technology',
    department: 'Information Technology',
    description: 'A comprehensive curriculum focusing on software engineering, cloud computing, cybersecurity, and computer systems networking.',
    price: 0,
    creatorId: 'u-2',
    creatorName: 'Prof. Sarah Miller',
    isDegree: true,
    bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'c-3',
    title: 'Full-Stack JavaScript Web Development',
    department: 'Computer Science',
    description: 'Learn MERN stack, state management, and modern server frameworks from scratch with unified subjects and zero semester partitioning.',
    price: 499,
    creatorId: 'u-2',
    creatorName: 'Prof. Sarah Miller',
    isDegree: false,
    bannerUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop'
  }
];

const SEED_STANDALONE_RESOURCES = [
  {
    id: 'res-1',
    title: 'MAKAUT Engineering Mathematics Complete Formula Sheet (2025-26)',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    type: 'pdf',
    category: 'Formula Sheet & Quick Reference',
    description: 'Comprehensive Quick Revision Formula Sheet for Calculus, Linear Algebra, and Differential Equations.',
    author: 'Owner. Deepak Shaw',
    createdAt: '2026-08-15'
  },
  {
    id: 'res-2',
    title: 'Physics-I Mechanics & Vector Calculus Lab Manual',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    type: 'pdf',
    category: 'Lab Manual',
    description: 'Official Physics Laboratory Experiment Guide and viva question answers.',
    author: 'Prof. Sarah Miller',
    createdAt: '2026-08-16'
  }
];

const SEED_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: '📢 Welcome to Learnopia Announcements',
    message: 'Stay updated with important platform notices, exam schedules, and new study resources shared directly by your admins.',
    resourceTitle: '',
    resourceUrl: '',
    createdAt: new Date().toISOString(),
    createdBy: 'Admin Team'
  }
];

const SEED_SUBJECTS = [
  // CSE - Semester 1 (Degree)
  {
    id: 's-1',
    courseId: 'c-1',
    semester: 1,
    title: 'Engineering Mathematics I',
    playlists: [],
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
    playlists: [],
    customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
    materials: [
      { id: 'doc-3', title: 'Physics Wave Interference Notes.pdf', url: 'https://drive.google.com', sectionName: 'Notes' },
      { id: 'doc-4', title: 'Physics Study Syllabus Organizer.pdf', url: 'https://drive.google.com', sectionName: 'Organizer' }
    ]
  }
];

// ── Desktop & In-App Web Notification Trigger ─────────────────────────────
export const triggerWebNotification = (announcement) => {
  if (typeof window === 'undefined' || !announcement) return;

  // 1. In-app real-time event for floating toast
  try {
    window.dispatchEvent(new CustomEvent('learnopia_broadcast_received', { detail: announcement }));
  } catch {}

  // 2. Browser native desktop Notification API (if supported and user permitted)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(`📢 Campus Notice: ${announcement.title || 'New Broadcast'}`, {
        body: announcement.message || 'Check the notification bell for full details.',
        icon: '/learnopia-logo-dark-on.svg',
        badge: '/learnopia-logo-dark-on.svg',
        tag: announcement.id || 'learnopia-broadcast',
        renotify: true
      });
      n.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('learnopia_open_announcements'));
      };
    } catch (err) {
      console.warn('[Web Notification API notice]', err);
    }
  }
};

export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      return res;
    } catch (e) {
      console.warn('Notification permission request error:', e);
    }
  }
  return 'unsupported';
};

export function DatabaseProvider({ children }) {
  const [users, setUsers] = useState(() => {
    if (typeof window === 'undefined') return SEED_USERS;
    const saved = localStorage.getItem('learnopia_users_stable');
    return saved ? JSON.parse(saved) : SEED_USERS;
  });
  const [courses, setCourses] = useState(() => {
    if (typeof window === 'undefined') return SEED_COURSES;
    const saved = localStorage.getItem('learnopia_courses_stable');
    return saved ? JSON.parse(saved) : SEED_COURSES;
  });
  const [subjects, setSubjects] = useState(() => {
    if (typeof window === 'undefined') return SEED_SUBJECTS;
    const saved = localStorage.getItem('learnopia_subjects_stable');
    return saved ? JSON.parse(saved) : SEED_SUBJECTS;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('learnopia_current_user_stable');
    return saved ? JSON.parse(saved) : null;
  });
  const [activityLogs, setActivityLogs] = useState(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('learnopia_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  const openUserProfile = (userOrId) => {
    if (!userOrId) return;
    if (typeof userOrId === 'object') {
      const matched = users.find(u => u.id === userOrId.id || (u.email && u.email.toLowerCase() === userOrId.email?.toLowerCase()));
      setViewingProfileUser(matched || userOrId);
    } else if (typeof userOrId === 'string') {
      const q = userOrId.toLowerCase().trim();
      const matched = users.find(u => u.id === userOrId || (u.email && u.email.toLowerCase() === q) || (u.name && u.name.toLowerCase() === q));
      if (matched) {
        setViewingProfileUser(matched);
      } else {
        setViewingProfileUser({
          id: `usr-${Date.now()}`,
          name: userOrId,
          email: `${userOrId.toLowerCase().replace(/\s+/g, '')}@learnopia.edu`,
          role: 'learner',
          status: 'active'
        });
      }
    }
  };

  const closeUserProfile = () => {
    setViewingProfileUser(null);
  };

  useEffect(() => {
    if (viewingProfileUser?.id) {
      const updated = users.find(u => u.id === viewingProfileUser.id);
      if (updated && updated !== viewingProfileUser) {
        setViewingProfileUser(updated);
      }
    }
  }, [users, viewingProfileUser?.id]);

  const [standaloneResources, setStandaloneResources] = useState(() => {
    const saved = localStorage.getItem('learnopia_standalone_resources');
    return saved ? JSON.parse(saved) : SEED_STANDALONE_RESOURCES;
  });

  const [savedResourceIds, setSavedResourceIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const userRaw = localStorage.getItem('learnopia_current_user_stable');
      const uid = userRaw ? JSON.parse(userRaw)?.id : 'guest';
      const key = `learnopia_saved_resource_ids_${uid || 'guest'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep saved resource IDs isolated to the currently logged in user account
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uid = currentUser?.id || 'guest';
    const key = `learnopia_saved_resource_ids_${uid}`;
    try {
      const saved = localStorage.getItem(key);
      setSavedResourceIds(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedResourceIds([]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uid = currentUser?.id || 'guest';
      const key = `learnopia_saved_resource_ids_${uid}`;
      localStorage.setItem(key, JSON.stringify(savedResourceIds));
    }
  }, [savedResourceIds, currentUser?.id]);

  const [lastPlayed, setLastPlayed] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('learnopia_last_played');
    return saved ? JSON.parse(saved) : null;
  });

  const updateLastPlayed = (item) => {
    if (!item) return;
    const payload = {
      playlistId: item.playlistId || null,
      playlistTitle: item.playlistTitle || item.courseTitle || 'Lecture Series',
      courseTitle: item.courseTitle || item.playlistTitle || 'Lecture Series',
      videoId: item.videoId || null,
      videoTitle: item.videoTitle || 'Lecture Video',
      courseId: item.courseId || null,
      bannerUrl: item.bannerUrl || null,
      videoThumbnail: item.thumbnail || item.videoThumbnail || item.bannerUrl || null,
      thumbnail: item.thumbnail || item.videoThumbnail || item.bannerUrl || null,
      youtubeId: item.youtubeId || null,
      videoIndex: item.videoIndex !== undefined ? item.videoIndex : 0,
      subjectId: item.subjectId || null,
      semester: item.semester || 1,
      progress: item.progress !== undefined ? item.progress : 25,
      duration: item.duration || 'Lecture Track',
      timestamp: new Date().toISOString()
    };
    setLastPlayed(payload);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnopia_last_played', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('learnopia_last_played_updated', { detail: payload }));
    }
  };

  const toggleSaveResource = (resId) => {
    if (!resId) return;
    setSavedResourceIds(prev => {
      return prev.includes(resId) ? prev.filter(id => id !== resId) : [...prev, resId];
    });
  };

  const isResourceSaved = (resId) => {
    return savedResourceIds.includes(resId);
  };

  const addStandaloneResource = (resource) => {
    const newRes = {
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      ...resource
    };
    setStandaloneResources(prev => {
      const next = [newRes, ...prev];
      localStorage.setItem('learnopia_standalone_resources', JSON.stringify(next));
      return next;
    });
    if (typeof addLog === 'function') addLog(`Standalone resource published: ${resource.title}`);
  };

  const deleteStandaloneResource = async (resourceId) => {
    if (!resourceId) return;
    if (isSupabaseLive) {
      try {
        await supabase.from('materials').delete().eq('id', resourceId);
      } catch {}
      syncSupabase();
    }
    setStandaloneResources(prev => {
      const next = prev.filter(r => r.id !== resourceId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('learnopia_standalone_resources', JSON.stringify(next));
      }
      return next;
    });
    setSavedResourceIds(prev => prev.filter(id => id !== resourceId));
  };

  const [announcements, setAnnouncements] = useState(() => {
    if (typeof window === 'undefined') return SEED_ANNOUNCEMENTS;
    const saved = localStorage.getItem('learnopia_announcements');
    return saved ? JSON.parse(saved) : SEED_ANNOUNCEMENTS;
  });

  const [lastReadAnnouncementTime, setLastReadAnnouncementTime] = useState(() => {
    if (typeof window === 'undefined') return '1970-01-01T00:00:00.000Z';
    return localStorage.getItem('learnopia_last_read_announcement') || '1970-01-01T00:00:00.000Z';
  });

  const unreadAnnouncementsCount = useMemo(() => {
    return announcements.filter(a => new Date(a.createdAt) > new Date(lastReadAnnouncementTime)).length;
  }, [announcements, lastReadAnnouncementTime]);

  const markAnnouncementsRead = () => {
    const now = new Date().toISOString();
    setLastReadAnnouncementTime(now);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnopia_last_read_announcement', now);
    }
  };

  const broadcastAnnouncement = async ({ title, message, resourceTitle, resourceUrl, link, category, author }) => {
    const finalAuthor = (author && author.trim()) || currentUser?.name || 'Platform Admin';
    const finalLink = (link && link.trim()) || (resourceUrl && resourceUrl.trim()) || '';
    const finalResourceTitle = (resourceTitle && resourceTitle.trim()) || '';
    const annId = `ann-${Date.now()}`;

    const newAnn = {
      id: annId,
      title: title.trim(),
      message: message.trim(),
      author: finalAuthor,
      resourceTitle: finalResourceTitle,
      resourceUrl: finalLink,
      link: finalLink,
      category: category || 'Campus Notice',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || finalAuthor
    };

    if (isSupabaseLive) {
      try {
        await supabase.from('announcements').insert([{
          id: newAnn.id,
          title: newAnn.title,
          message: newAnn.message,
          author: newAnn.author,
          resource_title: newAnn.resourceTitle || null,
          resource_url: newAnn.resourceUrl || null,
          link: newAnn.link || null,
          category: newAnn.category || 'Campus Notice',
          created_by: currentUser?.id || currentUser?.name || 'Admin',
          created_at: newAnn.createdAt
        }]);
      } catch (err) {
        console.warn('Could not persist announcement to Supabase:', err);
      }
    }

    setAnnouncements(prev => {
      const updated = [newAnn, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('learnopia_announcements', JSON.stringify(updated));
      }
      return updated;
    });

    if (finalLink) {
      const resName = finalResourceTitle || title.trim();
      addStandaloneResource({
        title: resName,
        url: finalLink,
        type: finalLink.endsWith('.pdf') ? 'pdf' : 'link',
        category: category || 'Announcement Shared Resource',
        description: `Shared via Admin Announcement: ${message.trim()}`,
        author: finalAuthor
      });
    }

    if (typeof addLog === 'function') {
      addLog(`Admin broadcasted announcement: "${title.trim()}"`);
    }

    // 1. Sync across tabs
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('learnopia_last_broadcast', JSON.stringify({ ...newAnn, _ts: Date.now() }));
      } catch {}
    }

    // 2. Trigger notification in current window
    triggerWebNotification(newAnn);

    return newAnn;
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!announcementId) return;
    if (isSupabaseLive) {
      try {
        await supabase.from('announcements').delete().eq('id', announcementId);
      } catch (err) {
        console.warn('Could not delete announcement from Supabase:', err);
      }
    }
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== announcementId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('learnopia_announcements', JSON.stringify(updated));
      }
      return updated;
    });
  };


  const setPasswordForUser = async (userId, newPassword) => {
    if (isSupabaseLive) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (authErr) {
        console.warn('[Supabase Auth Password Update]', authErr);
      }
      try {
        await supabase.from('profiles').update({ password: newPassword }).eq('id', userId);
      } catch (e) {
        console.warn('[Supabase Profile Password Update]', e);
      }
    }
    setUsers(prev => {
      const next = prev.map(u => u.id === userId ? { ...u, password: newPassword } : u);
      localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
      return next;
    });
    if (currentUser && currentUser.id === userId) {
      const updated = { ...currentUser, password: newPassword };
      setCurrentUser(updated);
      localStorage.setItem('learnopia_current_user_stable', JSON.stringify(updated));
    }
    return { success: true };
  };

  const resetPasswordByEmail = async (emailOrUsername, newPassword) => {
    const target = users.find(u =>
      u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
      u.username?.toLowerCase() === emailOrUsername.toLowerCase() ||
      u.username?.toLowerCase() === `@${emailOrUsername.toLowerCase()}`
    );

    if (!target) {
      return { success: false, error: 'No user account found matching that email or username.' };
    }

    await setPasswordForUser(target.id, newPassword);
    return { success: true, email: target.email };
  };

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
    // ── STEP 1: Auth session check with max 3.5s timeout protection ──────────
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3500));
    try {
      const sessionPromise = supabase.auth.getSession();
      const authResult = await Promise.race([sessionPromise, timeoutPromise]);
      const authSession = authResult?.data;

      if (authSession?.session?.user) {
        const user = authSession.session.user;
        let { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!dbProfile) {
          // If not found by ID, try email lookup
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', user.email.toLowerCase())
            .maybeSingle();

          if (profileByEmail) {
            dbProfile = profileByEmail;
          } else {
            // Profile does not exist yet (new OAuth signup or account was recreated)
            // Automatically create their profile row in Supabase!
            const isInitialOwner = user.email?.toLowerCase() === 'admin@learnopia.edu';
            const defaultName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
            const newProfile = {
              id: user.id,
              email: user.email.toLowerCase(),
              name: defaultName,
              role: isInitialOwner ? 'owner' : 'learner',
              status: 'active',
              is_verified: isInitialOwner,
              verification_status: isInitialOwner ? 'verified' : 'none',
              verification_type: isInitialOwner ? 'creator' : 'student',
              onboarding_completed: isInitialOwner,
              college: '',
              department: '',
              interests: '',
              enrolled_courses: []
            };
            try {
              await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
            } catch (e) {
              console.warn('[Sync Profile Auto-create Warn]', e);
            }
            dbProfile = newProfile;
          }
        }

        const mapped = mapProfile(dbProfile);
        if (mapped) {
          if (mapped.status === 'suspended') {
            await supabase.auth.signOut();
            setCurrentUser(null);
            localStorage.removeItem('learnopia_current_user_stable');
            try {
              sessionStorage.setItem('learnopia_auth_notice', JSON.stringify({
                type: 'error',
                message: 'Your account is suspended. Please contact the administrator.'
              }));
              window.dispatchEvent(new CustomEvent('learnopia_auth_notice', {
                detail: { type: 'error', message: 'Your account is suspended. Please contact the administrator.' }
              }));
            } catch {}
          } else {
            setCurrentUser(mapped);
            localStorage.setItem('learnopia_current_user_stable', JSON.stringify(mapped));
          }
        }
      } else {
        // No active auth session in Supabase — clear stale cached state
        setCurrentUser(null);
        localStorage.removeItem('learnopia_current_user_stable');
      }
    } catch (err) {
      console.warn('Supabase auth load warning:', err);
    } finally {
      // ── Always unblock the UI immediately ─────────────────────────────────
      setAuthLoading(false);
    }

    // ── STEP 2: Load all remaining data in PARALLEL with Promise.allSettled ───
    try {
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('playlists').select('*'),
        supabase.from('materials').select('*'),
        supabase.from('marketplace_items').select('*').eq('status', 'active'),
        supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('standalone_resources').select('*')
      ]);

      const profiles = results[0]?.status === 'fulfilled' ? results[0].value?.data : null;
      const coursesData = results[1]?.status === 'fulfilled' ? results[1].value?.data : null;
      const subs = results[2]?.status === 'fulfilled' ? results[2].value?.data : null;
      const playlists = results[3]?.status === 'fulfilled' ? results[3].value?.data : null;
      const materials = results[4]?.status === 'fulfilled' ? results[4].value?.data : null;
      const marketplaceData = results[5]?.status === 'fulfilled' ? results[5].value?.data : null;
      const logs = results[6]?.status === 'fulfilled' ? results[6].value?.data : null;
      const announcementsData = results[7]?.status === 'fulfilled' ? results[7].value?.data : null;
      const standaloneResData = results[8]?.status === 'fulfilled' ? results[8].value?.data : null;

      // Gracefully check if videos table is present in Supabase for backward compatibility
      let existingVideos = [];
      try {
        const { data: vids } = await supabase.from('videos').select('*');
        if (vids && Array.isArray(vids)) existingVideos = vids;
      } catch (err) {
        console.info('Supabase videos table not active; utilizing dynamic playlist architecture.');
      }

      if (profiles && profiles.length > 0) {
        const mappedUsers = profiles.map(mapProfile);
        setUsers(mappedUsers);
        localStorage.setItem('learnopia_users_stable', JSON.stringify(mappedUsers));

        // If current user is logged in, sync their 4 folders from profile if available
        if (currentUser?.id) {
          const userProfile = profiles.find(p => p.id === currentUser.id);
          if (userProfile) {
            const remoteFolders = profilePayloadToFolders(userProfile);
            if (remoteFolders) {
              saveWorkspaceFolders(currentUser.id, remoteFolders);
            }
          }
        }
      }

      if (standaloneResData && Array.isArray(standaloneResData) && standaloneResData.length > 0) {
        const mappedRes = standaloneResData.map(r => ({
          id: r.id,
          title: r.title,
          url: r.url,
          type: r.type || 'pdf',
          category: r.category || 'Formula Sheet & Quick Reference',
          description: r.description || '',
          author: r.author || '',
          uploaderId: r.uploader_id || '',
          keywords: r.keywords || '',
          isPublic: r.is_public !== false,
          createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));
        setStandaloneResources(mappedRes);
        localStorage.setItem('learnopia_standalone_resources', JSON.stringify(mappedRes));
      }

      if (coursesData && Array.isArray(coursesData)) {
        const mappedCourses = coursesData.map(c => ({
          id: c.id,
          title: c.title,
          department: c.department,
          description: c.description,
          price: c.price,
          creatorId: c.creator_id,
          creatorName: c.creator_name,
          isDegree: c.is_degree === true,
          author: c.author || c.creator_name,
          isPublic: c.is_public !== false,
          youtubePlaylistId: c.youtube_playlist_id || c.youtubePlaylistId || '',
          bannerUrl: c.banner_url || c.bannerUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
          keywords: c.keywords || ''
        }));

        setCourses(prev => {
          const remoteIds = new Set(mappedCourses.map(c => c.id));
          const localOnly = prev.filter(c => !remoteIds.has(c.id));
          const merged = [...mappedCourses, ...localOnly];
          try {
            localStorage.setItem('learnopia_courses_stable', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }

      if (subs && Array.isArray(subs)) {
        const sortedSubs = [...subs].sort((a, b) => (a.position || 0) - (b.position || 0));
        const assembled = sortedSubs.map(s => {
          const subPlaylists = (playlists || [])
            .filter(pl => pl.subject_id === s.id)
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(pl => {
              const dbVideos = (existingVideos || [])
                .filter(v => v.playlist_id === pl.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map(v => ({
                  id: v.id,
                  title: v.title,
                  description: v.description || '',
                  youtubeId: v.youtube_id || v.youtubeId || '',
                  position: v.position,
                  likes: v.likes || []
                }));

              return {
                id: pl.id,
                title: pl.title,
                description: pl.description,
                likes: pl.likes || [],
                author: pl.author,
                position: pl.position,
                isPublic: pl.is_public !== false,
                youtubePlaylistId: pl.youtube_playlist_id || pl.youtubePlaylistId || '',
                videos: dbVideos.length > 0 ? dbVideos : (pl.videos || [])
              };
            });

          const subMaterials = (materials || [])
            .filter(m => m.subject_id === s.id)
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(m => ({
              id: m.id,
              title: m.title,
              url: m.url,
              sectionName: m.section_name,
              author: m.author,
              position: m.position,
              isPublic: m.is_public !== false
            }));

          return {
            id: s.id,
            courseId: s.course_id,
            semester: s.semester,
            title: s.title,
            position: s.position,
            isPublic: s.is_public !== false,
            youtubePlaylistId: s.youtube_playlist_id || s.youtubePlaylistId || '',
            playlists: subPlaylists,
            customMaterialSections: s.custom_material_sections || ['Notes', 'Organizer', 'Past Year Papers'],
            materials: subMaterials
          };
        });
        setSubjects(assembled);
        localStorage.setItem('learnopia_subjects_stable', JSON.stringify(assembled));
      }

      if (announcementsData && Array.isArray(announcementsData) && announcementsData.length > 0) {
        const mappedAnn = announcementsData.map(a => ({
          id: a.id,
          title: a.title,
          message: a.message,
          author: a.author,
          resourceTitle: a.resource_title,
          resourceUrl: a.resource_url,
          link: a.link || a.resource_url,
          category: a.category,
          createdBy: a.created_by,
          createdAt: a.created_at
        }));
        setAnnouncements(mappedAnn);
        localStorage.setItem('learnopia_announcements', JSON.stringify(mappedAnn));
      }

      if (marketplaceData && marketplaceData.length > 0) {
        const mappedMarketplace = marketplaceData.map(m => ({
          id: m.id,
          title: m.title,
          category: m.category,
          price: m.price,
          description: m.description,
          author: m.author,
          sellerId: m.seller_id,
          contactMethod: m.contact_method || 'whatsapp',
          contactDetail: m.contact_detail || '',
          imageUrl: m.image_url,
          keywords: m.keywords,
          status: m.status || 'active',
          listedAt: m.listed_at ? new Date(m.listed_at).getTime() : Date.now(),
          createdAt: m.created_at
        }));
        localStorage.setItem('learnopia_marketplace_items', JSON.stringify(mappedMarketplace));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('learnopia_marketplace_updated'));
        }
      }

      if (logs && logs.length > 0) {
        setActivityLogs(logs);
        localStorage.setItem('learnopia_activity_logs', JSON.stringify(logs));
      }

      // Load platform / global ad settings from dedicated Supabase 'ads' table
      try {
        const { data: adsTableData } = await supabase
          .from('ads')
          .select('*')
          .eq('id', 'global_ad_settings')
          .maybeSingle();

        if (adsTableData) {
          const parsed = {
            enabled: adsTableData.enabled !== false,
            intervalMinutes: adsTableData.interval_minutes || 15,
            skipDelaySeconds: adsTableData.skip_delay_seconds || 10,
            youtubeUrl: adsTableData.youtube_url || '',
            title: adsTableData.title || '',
            message: adsTableData.message || '',
            targetUrl: adsTableData.target_url || '',
            bannerLink: adsTableData.banner_link || '',
            ...(adsTableData.settings_json || {})
          };
          setAdSettings(parsed);
          localStorage.setItem('learnopia_ad_settings_stable', JSON.stringify(parsed));
        } else {
          // Fallback to platform_settings
          const { data: adRow } = await supabase
            .from('platform_settings')
            .select('settings_json')
            .eq('id', 'global_ad_settings')
            .maybeSingle();

          if (adRow && adRow.settings_json) {
            setAdSettings(adRow.settings_json);
            localStorage.setItem('learnopia_ad_settings_stable', JSON.stringify(adRow.settings_json));
          }
        }
      } catch (adLoadErr) {
        console.warn('Ad settings remote load warn:', adLoadErr);
      }

    } catch (err) {
      console.warn('Supabase background data load warning:', err);
    }
  };

  useEffect(() => {
    if (isSupabaseLive) {
      syncSupabase();

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          try {
            let { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!dbProfile) {
              const { data: profileByEmail } = await supabase
                .from('profiles')
                .select('*')
                .ilike('email', session.user.email.toLowerCase())
                .maybeSingle();

              if (profileByEmail) {
                dbProfile = profileByEmail;
              } else {
                const isInitialOwner = session.user.email?.toLowerCase() === 'admin@learnopia.edu';
                const newProfile = {
                  id: session.user.id,
                  email: session.user.email.toLowerCase(),
                  name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                  role: isInitialOwner ? 'owner' : 'learner',
                  status: 'active',
                  is_verified: isInitialOwner,
                  verification_status: isInitialOwner ? 'verified' : 'none',
                  verification_type: isInitialOwner ? 'creator' : 'student',
                  onboarding_completed: isInitialOwner,
                  college: '',
                  department: '',
                  interests: '',
                  enrolled_courses: []
                };
                await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
                dbProfile = newProfile;
              }
            }

            const mapped = mapProfile(dbProfile);
            if (mapped) {
              if (mapped.status === 'suspended') {
                await supabase.auth.signOut();
                setCurrentUser(null);
                localStorage.removeItem('learnopia_current_user_stable');
                try {
                  sessionStorage.setItem('learnopia_auth_notice', JSON.stringify({
                    type: 'error',
                    message: 'Your account is suspended. Please contact the administrator.'
                  }));
                  window.dispatchEvent(new CustomEvent('learnopia_auth_notice', {
                    detail: { type: 'error', message: 'Your account is suspended. Please contact the administrator.' }
                  }));
                } catch {}
              } else {
                setCurrentUser(mapped);
                localStorage.setItem('learnopia_current_user_stable', JSON.stringify(mapped));
              }
            }
          } catch (err) {
            console.warn('[onAuthStateChange Profile Sync]', err);
          }
        } else if (event === 'SIGNED_OUT' || !session?.user) {
          setCurrentUser(null);
          localStorage.removeItem('learnopia_current_user_stable');
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
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

  // ── Realtime Broadcast & Announcement Listener ────────────────────────────
  useEffect(() => {
    // 1. Cross-tab sync via storage events
    const handleStorage = (e) => {
      if (e.key === 'learnopia_last_broadcast' && e.newValue) {
        try {
          const ann = JSON.parse(e.newValue);
          if (ann && ann.id) {
            setAnnouncements(prev => {
              if (prev.some(a => a.id === ann.id)) return prev;
              const next = [ann, ...prev];
              try {
                localStorage.setItem('learnopia_announcements', JSON.stringify(next));
              } catch {}
              return next;
            });
            triggerWebNotification(ann);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. Supabase Realtime channel for announcements table
    let subChannel = null;
    if (isSupabaseLive && supabase) {
      try {
        subChannel = supabase
          .channel('public:announcements')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'announcements' },
            (payload) => {
              const raw = payload.new;
              if (!raw || !raw.id) return;
              const newAnn = {
                id: raw.id,
                title: raw.title,
                message: raw.message,
                author: raw.author || raw.created_by || 'Academic Admin',
                resourceTitle: raw.resource_title || '',
                resourceUrl: raw.resource_url || raw.link || '',
                link: raw.link || raw.resource_url || '',
                category: raw.category || 'Campus Notice',
                createdAt: raw.created_at || new Date().toISOString(),
                createdBy: raw.created_by || raw.author
              };

              setAnnouncements(prev => {
                if (prev.some(a => a.id === newAnn.id)) return prev;
                const next = [newAnn, ...prev];
                try {
                  localStorage.setItem('learnopia_announcements', JSON.stringify(next));
                } catch {}
                return next;
              });

              triggerWebNotification(newAnn);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime announcements subscription notice:', err);
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (subChannel && supabase) {
        supabase.removeChannel(subChannel);
      }
    };
  }, [isSupabaseLive]);

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
      let authUser = null;
      let loginErr = null;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password
        });
        if (!error && data?.user) {
          authUser = data.user;
        } else {
          loginErr = error;
        }
      } catch (e) {
        loginErr = e;
      }

      // If Supabase Auth signInWithPassword didn't match (e.g. Google OAuth user who set a profile password),
      // check if profiles table has matching email & password
      if (!authUser) {
        let existingProfile = null;
        try {
          const { data: foundProfile } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', email.trim().toLowerCase())
            .maybeSingle();
          existingProfile = foundProfile;
        } catch (dbErr) {
          console.warn('[Database Login Profile Check Error]', dbErr);
        }

        const localUser = (users || []).find(u => u.email.toLowerCase() === email.trim().toLowerCase());

        // 1. Account is not registered / not created
        if (!existingProfile && !localUser) {
          throw new Error('This email is not registered. Please create an account first.');
        }

        // 2. Account is suspended
        if ((existingProfile && existingProfile.status === 'suspended') || (localUser && localUser.status === 'suspended')) {
          throw new Error('Your account is suspended. Please contact the administrator.');
        }

        // 3. Fallback: check profile password or localUser password
        if (existingProfile && existingProfile.password && existingProfile.password === password) {
          const mapped = mapProfile(existingProfile);
          setCurrentUser(mapped);
          localStorage.setItem('learnopia_current_user_stable', JSON.stringify(mapped));
          addLog(`User logged in: ${mapped.name} (${mapped.role.toUpperCase()})`);
          return mapped;
        }

        if (localUser && localUser.password && localUser.password === password) {
          setCurrentUser(localUser);
          localStorage.setItem('learnopia_current_user_stable', JSON.stringify(localUser));
          addLog(`User logged in: ${localUser.name} (${localUser.role.toUpperCase()})`);
          return localUser;
        }

        // 4. Account exists and is active, but password was incorrect
        throw new Error('Incorrect password. Please verify your password or use forgot password.');
      }

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profile) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', email.toLowerCase())
          .maybeSingle();

        if (profileByEmail) {
          profile = profileByEmail;
        } else {
          const isInitialOwner = email.toLowerCase() === 'admin@learnopia.edu';
          const newProfile = {
            id: authUser.id,
            email: email.toLowerCase(),
            name: authUser.user_metadata?.full_name || email.split('@')[0],
            role: isInitialOwner ? 'owner' : 'learner',
            status: 'active',
            is_verified: isInitialOwner,
            verification_status: isInitialOwner ? 'verified' : 'none',
            verification_type: isInitialOwner ? 'creator' : 'student',
            onboarding_completed: isInitialOwner,
            college: '',
            department: '',
            interests: '',
            password: password || null,
            enrolled_courses: []
          };
          const { error: createError } = await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
          if (createError) {
            console.warn('Profile upsert warning:', createError);
          }
          profile = newProfile;
        }
      }

      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('Your account is suspended. Please contact the administrator.');
      }

      // Sync password to profile if not yet stored
      if (password && (!profile.password || profile.password !== password)) {
        try {
          await supabase.from('profiles').update({ password }).eq('id', profile.id);
          profile.password = password;
        } catch {}
      }

      const mapped = mapProfile(profile);
      setCurrentUser(mapped);
      localStorage.setItem('learnopia_current_user_stable', JSON.stringify(mapped));
      addLog(`User logged in: ${mapped.name} (${mapped.role.toUpperCase()})`);
      return mapped;
    } else {
      const cleanEmail = (email || '').trim().toLowerCase();
      const found = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (!found) {
        throw new Error('This email is not registered. Please create an account first.');
      }
      if (found.status === 'suspended') {
        throw new Error('Your account is suspended. Please contact the administrator.');
      }
      if (found.password !== password) {
        throw new Error('Incorrect password. Please verify your password or use forgot password.');
      }
      setCurrentUser(found);
      localStorage.setItem('learnopia_current_user_stable', JSON.stringify(found));
      addLog(`User logged in: ${found.name} (${found.role.toUpperCase()})`);
      return found;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      id: 'guest',
      name: 'Guest Explorer',
      email: 'guest@learnopia.edu',
      role: 'guest',
      isGuest: true,
      department: 'Open Scholar',
      semester: 'All Semesters',
      college: 'Community Campus',
      enrolledCourses: [],
      folderAcademic: [],
      folderDocument: [],
      folderLinks: [],
      folderPersonal: []
    };
    setCurrentUser(guestUser);
    localStorage.setItem('learnopia_current_user_stable', JSON.stringify(guestUser));
    addLog('Guest Explorer session initiated (Read-Only Preview Mode)');
    return guestUser;
  };

  const loginWithGoogle = async (googleUser = null) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
          throw new Error('Google Sign-In is not enabled yet in your Supabase project. Please enable Google in Supabase Dashboard → Authentication → Providers → Google, or sign in with your email & password.');
        }
        throw new Error(error.message || 'Google OAuth redirect failed.');
      }
      return data;
    } else {
      if (googleUser && googleUser.email) {
        const email = googleUser.email;
        const name = googleUser.name || email.split('@')[0];
        const picture = googleUser.picture || null;
        
        const cleanGoogleEmail = (email || '').trim().toLowerCase();
        const existing = users.find(u => u.email.toLowerCase() === cleanGoogleEmail);
        if (existing) {
          if (existing.status === 'suspended') {
            throw new Error('Your account is suspended. Please contact the administrator.');
          }
          setCurrentUser(existing);
          localStorage.setItem('learnopia_current_user_stable', JSON.stringify(existing));
          addLog(`User logged in via Google: ${existing.name}`);
          return existing;
        }
        const newUser = {
          id: 'u-g-' + Date.now(),
          email: email.toLowerCase(),
          name,
          username: `@${name.toLowerCase().replace(/\s+/g, '')}`,
          picture,
          role: 'learner',
          status: 'active',
          password: null,
          enrolledCourses: []
        };
        setUsers(prev => {
          const next = [...prev, newUser];
          localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
          return next;
        });
        setCurrentUser(newUser);
        localStorage.setItem('learnopia_current_user_stable', JSON.stringify(newUser));
        addLog(`New user registered via Google: ${newUser.name}`);
        return newUser;
      }
      throw new Error('Google Sign-In is unavailable without an active Supabase connection or Google OAuth credentials. Please sign in with your email and password.');
    }
  };

  const registerUser = async (email, name, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.');
    }

    if (isSupabaseLive) {
      // 1. Check if email already exists in profiles or local state
      let existingProfile = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', cleanEmail)
          .maybeSingle();
        existingProfile = data;
      } catch (e) {
        console.warn('[Check profile on register warn]', e);
      }

      const localExists = (users || []).some(u => u.email.toLowerCase() === cleanEmail);

      if (existingProfile || localExists) {
        throw new Error('This email address already exists. Please sign in instead.');
      }

      // 2. Attempt auth signUp
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password
      });

      // Handle case where user exists in auth.users (e.g. recreation after deletion or Google sign-in)
      const isAlreadyInAuth = (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) ||
                              (error && error.message?.toLowerCase().includes('already registered'));

      if (isAlreadyInAuth) {
        // Try sign in with the provided password first (handles re-registration after password-based delete)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!signInError && signInData?.user) {
          // Signed in — upsert profile (covers case where profile was deleted but auth record remained)
          const newProfile = {
            id: signInData.user.id,
            email: cleanEmail,
            name: name.trim(),
            role: 'learner',
            status: 'active',
            password: password,
            onboarding_completed: false,
            enrolled_courses: []
          };
          try {
            await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
          } catch (e) {
            console.warn('[Re-register profile upsert warn]', e);
          }
          const mapped = mapProfile(newProfile);
          setCurrentUser(mapped);
          addLog(`User re-registered: ${name}`);
          return mapped;
        }

        throw new Error('This email address already exists. Please sign in instead.');
      }

      if (error) {
        if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
          throw new Error('This email address already exists. Please sign in instead.');
        }
        throw new Error(error.message || 'Registration failed.');
      }
      if (!data || !data.user) {
        throw new Error('Registration failed.');
      }

      // Check if user requires email confirmation (session is null and confirmed_at is null)
      const requiresConfirmation = !data.session && !data.user.confirmed_at;

      const newProfile = {
        id: data.user.id,
        email: cleanEmail,
        name: name.trim(),
        role: 'learner',
        status: 'active',
        password: password,
        enrolled_courses: []
      };

      try {
        const { error: insertError } = await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
        if (insertError) {
          console.warn('[Profile upsert warn on register]', insertError);
        }
      } catch (e) {
        console.warn('[Profile upsert exception on register]', e);
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
      const exists = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (exists) throw new Error('This email address already exists. Please sign in instead.');

      const newUser = {
        id: 'u-' + (users.length + 1),
        email: cleanEmail,
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
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.warn('[Supabase SignOut Warn]', e);
      }
    }
    if (currentUser) {
      addLog(`User logged out: ${currentUser.name}`);
    }
    setCurrentUser(null);
    localStorage.removeItem('learnopia_current_user_stable');
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
      setUsers(prev => {
        const next = prev.map(u => u.id === userId ? { ...u, creatorStatus: 'pending' } : u);
        localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
        return next;
      });
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, creatorStatus: 'pending' };
        setCurrentUser(updatedUser);
        localStorage.setItem('learnopia_current_user_stable', JSON.stringify(updatedUser));
      }
      addLog(`Creator permission requested.`);
    }
  };

  const updateUserProfile = async (targetIdOrData, maybeData) => {
    let userId = currentUser?.id;
    let profileData = {};

    if (typeof targetIdOrData === 'string') {
      userId = targetIdOrData;
      profileData = maybeData || {};
    } else if (typeof targetIdOrData === 'object' && targetIdOrData !== null) {
      profileData = targetIdOrData;
      if (typeof maybeData === 'string') {
        userId = maybeData;
      }
    }

    // If Supabase is live, get the active session user ID (UUID)
    if (isSupabaseLive) {
      try {
        const session = (await supabase.auth.getSession())?.data?.session;
        if (session?.user?.id) {
          userId = session.user.id;
          if (!profileData.email) profileData.email = session.user.email;
        }
      } catch {}
    }

    if (!userId) return { success: false, error: 'No user ID specified.' };

    const userToUpdate = users.find(u => u.id === userId) || currentUser || {};

    const updatedUser = {
      ...userToUpdate,
      ...profileData,
      id: userId,
      picture: profileData.picture ?? profileData.avatar_url ?? profileData.dpUrl ?? userToUpdate.picture ?? null,
      email: userToUpdate.email || currentUser?.email || profileData.email || '',
      password: profileData.password || userToUpdate.password || currentUser?.password || '',
      onboardingCompleted: true,
      verificationStatus: profileData.verificationStatus || (profileData.idCardLink ? 'pending' : userToUpdate?.verificationStatus || 'none')
    };

    setUsers(prev => {
      const exists = prev.some(u => u.id === userId);
      const next = exists
        ? prev.map(u => u.id === userId ? updatedUser : u)
        : [...prev, updatedUser];
      localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
      return next;
    });

    if (currentUser && (currentUser.id === userId || !currentUser.id)) {
      setCurrentUser(updatedUser);
      localStorage.setItem('learnopia_current_user_stable', JSON.stringify(updatedUser));
    }

    if (isSupabaseLive) {
      try {
        // If password is provided, update user auth password in Supabase
        if (profileData.password && profileData.password.length >= 6) {
          try {
            await supabase.auth.updateUser({ password: profileData.password });
            console.log('🔑 [Supabase Auth Password Updated for user]:', userId);
          } catch (passErr) {
            console.warn('[Supabase Auth Password Update Warning]:', passErr.message);
          }
        }

        const userEmail = updatedUser.email || currentUser?.email || '';
        const rawDob = updatedUser.dob ? String(updatedUser.dob).trim() : null;
        const validDob = rawDob && rawDob.length === 10 ? rawDob : null;
        const totalSemestersVal = parseInt(updatedUser.totalSemesters, 10) || 8;

        let payloadToSave = {
          id: userId,
          email: userEmail.toLowerCase(),
          name: updatedUser.name || '',
          picture: updatedUser.picture || null,
          avatar_url: updatedUser.picture || null,
          phone: updatedUser.phone || null,
          college: updatedUser.college || null,
          department: updatedUser.department || null,
          interests: updatedUser.interests || null,
          education_level: updatedUser.educationLevel || 'college',
          course_name: updatedUser.courseName || null,
          joining_year: updatedUser.joiningYear || null,
          passing_year: updatedUser.passingYear || null,
          total_semesters: totalSemestersVal,
          dob: validDob,
          target_exam: updatedUser.targetExam || null,
          onboarding_completed: true,
          id_card_link: updatedUser.idCardLink || null,
          verification_status: updatedUser.verificationStatus || 'none',
          verification_type: updatedUser.verificationType || 'student',
          is_verified: !!updatedUser.isVerified,
          password: updatedUser.password || null,
          updated_at: new Date().toISOString()
        };

        // Resilient upsert: automatically strips any column that doesn't exist in Supabase profiles schema
        let saved = false;
        let lastError = null;
        for (let attempt = 0; attempt < 8; attempt++) {
          const { error: upsertErr } = await supabase
            .from('profiles')
            .upsert([payloadToSave], { onConflict: 'id' });

          if (!upsertErr) {
            saved = true;
            console.log('✅ [Supabase Profile Persisted Successfully in Database]:', userId);
            break;
          }

          lastError = upsertErr;
          console.warn(`[Supabase Upsert Attempt ${attempt + 1}] Error:`, upsertErr.message);

          // Check if error is due to a missing column in Supabase schema cache
          const missingCol = upsertErr.message?.match(/Could not find the '([^']+)' column/i)?.[1] ||
                             upsertErr.details?.match(/column "([^"]+)" of relation "profiles" does not exist/i)?.[1];

          if (missingCol && payloadToSave.hasOwnProperty(missingCol)) {
            console.warn(`⚠️ [Supabase Schema Mismatch] Column '${missingCol}' does not exist in 'profiles'. Omitting and retrying...`);
            delete payloadToSave[missingCol];
            continue;
          }

          // If no specific missing column identified on first failure, fall back to core columns
          if (attempt === 0) {
            payloadToSave = {
              id: userId,
              email: userEmail.toLowerCase(),
              name: updatedUser.name || '',
              phone: updatedUser.phone || null,
              college: updatedUser.college || null,
              course_name: updatedUser.courseName || null,
              joining_year: updatedUser.joiningYear || null,
              passing_year: updatedUser.passingYear || null,
              total_semesters: totalSemestersVal,
              interests: updatedUser.interests || null,
              onboarding_completed: true,
              password: updatedUser.password || null
            };
            continue;
          }

          break;
        }

        if (!saved && lastError) {
          console.error('[Supabase Profile Upsert Final Failure]:', lastError);
          throw new Error(`Database save error: ${lastError.message}`);
        }
      } catch (e) {
        console.error('[Supabase Profile Upsert Error]', e);
        throw e;
      }

      // Sync Supabase to refresh all users state
      try {
        await syncSupabase();
      } catch {}
    }

    return { success: true, user: updatedUser };
  };

  const deleteUserAccount = async (userId) => {
    const idToDelete = userId || currentUser?.id;
    if (!idToDelete) return { success: false, error: 'No user ID' };

    // 1. Delete from Supabase tables + Sign Out session
    if (isSupabaseLive) {
      try {
        await supabase.from('profiles').delete().eq('id', idToDelete);
        await supabase.from('user_routines').delete().eq('user_id', idToDelete);
        await supabase.from('user_attendance_logs').delete().eq('user_id', idToDelete);
        await supabase.from('user_archived_semesters').delete().eq('user_id', idToDelete);
      } catch (e) {
        console.warn('[Supabase Delete User Tables Error]', e);
      }

      try {
        await supabase.rpc('delete_user_account');
      } catch {}

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch {}
    }

    // 2. Delete from local state and clean all storage
    setUsers(prev => {
      const next = prev.filter(u => u.id !== idToDelete);
      localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
      return next;
    });

    setCurrentUser(null);
    localStorage.removeItem('learnopia_current_user_stable');
    localStorage.removeItem('learnopia_view');
    localStorage.removeItem('learnopia_selected_playlist');
    localStorage.removeItem('learnopia_selected_video');
    try {
      localStorage.removeItem(`learnopia_onboarding_done_${idToDelete}`);
      localStorage.removeItem(`learnopia_profile_${idToDelete}`);
      localStorage.removeItem(`learnopia_attendance_routine_${idToDelete}`);
      localStorage.removeItem(`learnopia_attendance_logs_${idToDelete}`);
      localStorage.removeItem(`learnopia_archived_semesters_${idToDelete}`);
      localStorage.removeItem(`learnopia_semester_start_${idToDelete}`);
    } catch {}

    return { success: true };
  };

  const adminVerifyUser = async (userId, newStatus) => {
    const isVerified = newStatus === 'verified';
    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({
          is_verified: isVerified,
          verification_status: newStatus
        })
        .eq('id', userId);
      syncSupabase();
    } else {
      setUsers(prev => {
        const next = prev.map(u => u.id === userId ? { ...u, isVerified, verificationStatus: newStatus } : u);
        localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
        return next;
      });
      if (currentUser && currentUser.id === userId) {
        const updated = { ...currentUser, isVerified, verificationStatus: newStatus };
        setCurrentUser(updated);
        localStorage.setItem('learnopia_current_user_stable', JSON.stringify(updated));
      }
    }
  };

  const unverifyUser = async (userId) => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;

    if (isSupabaseLive) {
      try {
        await supabase
          .from('profiles')
          .update({
            is_verified: false,
            verification_status: 'none'
          })
          .eq('id', targetId);
      } catch (e) {
        console.warn('[Unverify Error]', e);
      }
      try {
        syncSupabase();
      } catch {}
    }

    setUsers(prev => {
      const next = prev.map(u => u.id === targetId ? { ...u, isVerified: false, verificationStatus: 'none' } : u);
      localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
      return next;
    });

    if (currentUser && currentUser.id === targetId) {
      const updated = { ...currentUser, isVerified: false, verificationStatus: 'none' };
      setCurrentUser(updated);
      localStorage.setItem('learnopia_current_user_stable', JSON.stringify(updated));
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

  const removeUserEnrollment = async (userId, courseId) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const currentEnrolled = target.enrolledCourses || [];
    const updated = currentEnrolled.filter(id => id !== courseId);

    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ enrolled_courses: updated })
        .eq('id', userId);
      const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';
      addLog(`Enrollment of student ${target.name} (${target.email}) was REMOVED by ${adminName}`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, enrolledCourses: updated } : u));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, enrolledCourses: updated }));
      }
      const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';
      addLog(`Enrollment of student ${target.name} (${target.email}) was REMOVED by ${adminName}`);
    }
  };

  const enrollInPlaylist = async (playlistId) => {
    if (!currentUser || !playlistId) return;
    const currentEnrolled = currentUser.enrolledPlaylists || [];
    if (currentEnrolled.includes(playlistId)) return;

    const updated = [...currentEnrolled, playlistId];

    if (isSupabaseLive) {
      try {
        await supabase
          .from('profiles')
          .update({ enrolled_playlists: updated })
          .eq('id', currentUser.id);
      } catch {}
      addLog(`Playlist added to My Learning.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, enrolledPlaylists: updated } : u));
      setCurrentUser(prev => ({ ...prev, enrolledPlaylists: updated }));
      addLog(`Playlist added to My Learning.`);
    }
  };

  const removeUserPlaylistEnrollment = async (userId, playlistId) => {
    const target = users.find(u => u.id === userId) || currentUser;
    if (!target || !playlistId) return;
    const currentEnrolled = target.enrolledPlaylists || [];
    const updated = currentEnrolled.filter(id => id !== playlistId);

    if (isSupabaseLive) {
      try {
        await supabase
          .from('profiles')
          .update({ enrolled_playlists: updated })
          .eq('id', target.id);
      } catch {}
      addLog(`Playlist removed from My Learning.`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, enrolledPlaylists: updated } : u));
      if (currentUser && currentUser.id === target.id) {
        setCurrentUser(prev => ({ ...prev, enrolledPlaylists: updated }));
      }
      addLog(`Playlist removed from My Learning.`);
    }
  };

  const deletePlaylist = async (playlistId) => {
    if (!playlistId) return;
    if (isSupabaseLive) {
      try {
        await supabase.from('playlists').delete().eq('id', playlistId);
      } catch {}
      addLog(`Playlist deleted.`);
      syncSupabase();
    }
    setSubjects(prev => prev.map(s => ({
      ...s,
      playlists: (s.playlists || []).filter(p => p.id !== playlistId)
    })));
  };

  const addCourse = async (title, department, description, price = 0, isDegree = false, author = '', bannerUrl = '', keywords = '') => {
    if (!currentUser) return;
    const finalBanner = bannerUrl.trim() || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop';
    const courseId = 'c-' + Date.now();
    const finalKeywords = Array.isArray(keywords) ? keywords.join(', ') : (keywords || '');

    const newCourse = {
      id: courseId,
      title,
      department,
      description,
      price: parseFloat(price) || 0,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      isDegree,
      author: author || currentUser.name,
      bannerUrl: finalBanner,
      keywords: finalKeywords
    };
    setCourses(prev => [newCourse, ...prev]);
    addLog(`Course created: "${title}"`);

    if (isSupabaseLive) {
      try {
        await supabase.from('courses').insert([{
          id: courseId,
          title,
          department,
          description,
          price: parseFloat(price) || 0,
          creator_id: currentUser.id,
          creator_name: currentUser.name,
          is_degree: isDegree,
          author: author || currentUser.name,
          banner_url: finalBanner,
          keywords: finalKeywords
        }]);
        syncSupabase();
      } catch (err) {
        console.warn('Course insert into Supabase warning:', err);
      }
    }
  };

  const editCourse = async (courseId, fields) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...fields } : c));
    addLog(`Course updated.`);

    if (isSupabaseLive) {
      try {
        const updates = {};
        if (fields.title !== undefined) updates.title = fields.title;
        if (fields.description !== undefined) updates.description = fields.description;
        if (fields.price !== undefined) updates.price = parseFloat(fields.price) || 0;
        if (fields.author !== undefined) updates.author = fields.author;
        if (fields.department !== undefined) updates.department = fields.department;
        if (fields.bannerUrl !== undefined) updates.banner_url = fields.bannerUrl;
        if (fields.likes !== undefined) updates.likes = fields.likes;

        await supabase.from('courses').update(updates).eq('id', courseId);
        syncSupabase();
      } catch (e) {
        console.warn("Supabase course update error:", e);
      }
    }
  };

  const toggleCourseLike = async (courseId) => {
    if (!currentUser) return;
    let targetLikes = [];
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const likes = c.likes || [];
        const isLiked = likes.includes(currentUser.id);
        targetLikes = isLiked
          ? likes.filter(id => id !== currentUser.id)
          : [...likes, currentUser.id];
        return { ...c, likes: targetLikes };
      }
      return c;
    }));

    if (isSupabaseLive) {
      try {
        await supabase.from('courses').update({ likes: targetLikes }).eq('id', courseId);
      } catch (e) {
        console.warn("Supabase course like error:", e);
      }
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
    const semVal = parseInt(semester) || 1;
    const siblings = subjects.filter(s => s.courseId === courseId && s.semester === semVal);
    const newPosition = siblings.length;

    if (isSupabaseLive) {
      try {
        const { error } = await supabase.from('subjects').insert([{
          course_id: courseId,
          semester: semVal,
          title,
          custom_material_sections: ['Notes', 'Organizer', 'Past Year Papers'],
          position: newPosition
        }]);
        if (error) throw error;
      } catch (err) {
        console.warn("Retrying subject insert without 'position' column:", err);
        await supabase.from('subjects').insert([{
          course_id: courseId,
          semester: semVal,
          title,
          custom_material_sections: ['Notes', 'Organizer', 'Past Year Papers']
        }]);
      }
      addLog(`Subject added: "${title}"`);
      syncSupabase();
    } else {
      const newSubject = {
        id: 's-' + (subjects.length + 1),
        courseId,
        semester: semVal,
        title,
        playlists: [],
        customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
        materials: [],
        position: newPosition
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

  const updateSubjectDetails = async (subjectId, details) => {
    if (isSupabaseLive) {
      try {
        await supabase.from('subjects').update({
          code: details.code,
          credits: details.credits,
          author: details.author,
          department: details.department,
          overview_info: details.overviewInfo
        }).eq('id', subjectId);
      } catch (e) {
        console.warn('Could not update subject details in DB:', e);
      }
      syncSupabase();
    } else {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, ...details } : s
        )
      );
      addLog(`Subject details updated.`);
    }
  };

  const addSubjectPlaylist = async (subjectId, title, description, author = '', youtubePlaylistId = '', initialVideos = [], extraInfo = '') => {
    const subject = subjects.find(s => s.id === subjectId);
    const siblings = subject ? (subject.playlists || []) : [];
    const newPosition = siblings.length;
    const plId = 'pl-' + Date.now();
    let createdPlId = plId;

    if (isSupabaseLive) {
      try {
        const { data, error } = await supabase.from('playlists').insert([{
          subject_id: subjectId,
          title,
          description,
          likes: [],
          author: author || currentUser?.name || '',
          position: newPosition,
          youtube_playlist_id: youtubePlaylistId || null
        }]).select();
        if (error) throw error;
        
        if (data && data[0] && data[0].id) {
          createdPlId = data[0].id;
        }
      } catch (err) {
        console.warn("Retrying playlist insert without optional columns:", err);
        const { data: retryData } = await supabase.from('playlists').insert([{
          subject_id: subjectId,
          title,
          description,
          likes: [],
          author: author || currentUser?.name || ''
        }]).select();
        if (retryData && retryData[0] && retryData[0].id) {
          createdPlId = retryData[0].id;
        }
      }
      addLog(`Playlist added: "${title}"`);
      syncSupabase();
      return createdPlId || plId;
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const newPlaylist = {
            id: plId,
            title,
            description,
            likes: [],
            videos: initialVideos,
            author: author || currentUser?.name || '',
            position: newPosition,
            youtubePlaylistId: youtubePlaylistId || '',
            extraInfo: extraInfo || ''
          };
          return { ...s, playlists: [...(s.playlists || []), newPlaylist] };
        }
        return s;
      }));
      addLog(`Playlist added: "${title}"`);
      return plId;
    }
  };

  const importVideosToExistingPlaylist = async (subjectId, playlistId, youtubePlaylistUrl) => {
    const ytPlId = extractYoutubePlaylistId(youtubePlaylistUrl);
    if (!ytPlId) throw new Error('Please provide a valid YouTube Playlist link or ID.');

    const fetchedVideos = await fetchYoutubePlaylistVideos(ytPlId);
    if (!fetchedVideos || fetchedVideos.length === 0) {
      throw new Error('Could not fetch videos from this YouTube playlist link.');
    }

    if (isSupabaseLive) {
      try {
        await supabase.from('playlists').update({ youtube_playlist_id: ytPlId }).eq('id', playlistId);
      } catch (err) {
        console.warn("Could not update playlist youtube_playlist_id:", err);
      }
      addLog(`Linked YouTube playlist with ${fetchedVideos.length} videos.`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const updatedPlaylists = (s.playlists || []).map(pl => {
            if (pl.id === playlistId) {
              const currentVids = pl.videos || [];
              const startPos = currentVids.length;
              const formattedNewVids = fetchedVideos.map((fv, idx) => ({
                ...fv,
                position: startPos + idx
              }));
              return { ...pl, videos: [...currentVids, ...formattedNewVids] };
            }
            return pl;
          });
          return { ...s, playlists: updatedPlaylists };
        }
        return s;
      }));
      addLog(`Imported ${fetchedVideos.length} videos into playlist.`);
    }
    return fetchedVideos.length;
  };

  const deleteSubjectPlaylist = async (subjectIdOrPlaylistId, maybePlaylistId) => {
    const playlistId = maybePlaylistId || subjectIdOrPlaylistId;
    const subjectId = maybePlaylistId ? subjectIdOrPlaylistId : null;
    if (!playlistId) return;

    if (isSupabaseLive) {
      try {
        await supabase.from('playlists').delete().eq('id', playlistId);
      } catch (err) {
        console.warn('Could not delete playlist from Supabase:', err);
      }
      addLog(`Playlist deleted.`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (subjectId && s.id !== subjectId) return s;
        return { ...s, playlists: (s.playlists || []).filter(p => p.id !== playlistId) };
      }));
      addLog(`Playlist deleted.`);
    }
  };

  const createCourseWithPlaylist = async ({
    title,
    author,
    description,
    category,
    department,
    youtubePlaylistUrl,
    isPublic = true,
    bannerUrl = '',
    keywords = ''
  }) => {
    const ytId = extractYoutubePlaylistId(youtubePlaylistUrl) || '';
    
    // Generate valid RFC4122 v4 UUIDs for PostgreSQL compatibility
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try { return crypto.randomUUID(); } catch {}
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

    const courseId = generateUUID();
    const subjectId = generateUUID();
    const playlistId = generateUUID();
    const validCreatorId = isUUID(currentUser?.id) ? currentUser.id : null;

    const finalAuthor = author || currentUser?.name || 'Faculty Educator';
    const finalDept = department || category || 'Core Engineering';
    const finalDesc = description || `Comprehensive academic lecture series for ${title}.`;
    const finalBanner = bannerUrl || (ytId && !ytId.startsWith('PL') ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '');
    const finalKeywords = Array.isArray(keywords) ? keywords.join(', ') : (keywords || '');

    if (isSupabaseLive) {
      try {
        // 1. Insert into courses (primary table) with modern schema and fallback
        const fullCoursePayload = {
          id: courseId,
          title: title.trim(),
          department: finalDept,
          description: finalDesc,
          price: 0,
          creator_id: validCreatorId,
          creator_name: finalAuthor,
          author: finalAuthor,
          banner_url: finalBanner,
          is_public: isPublic,
          youtube_playlist_id: ytId,
          keywords: finalKeywords
        };

        const { error: insertErr } = await supabase.from('courses').insert([fullCoursePayload]);
        if (insertErr) {
          console.warn("Full courses insert warn:", insertErr.message);
          // Fallback if columns like is_public or keywords don't exist yet in Supabase
          const fallbackCoursePayload = {
            id: courseId,
            title: title.trim(),
            department: finalDept,
            description: finalDesc,
            price: 0,
            creator_id: validCreatorId,
            creator_name: finalAuthor,
            author: finalAuthor,
            banner_url: finalBanner,
            is_degree: false,
            likes: 0
          };
          const fallbackRes = await supabase.from('courses').insert([fallbackCoursePayload]);
          if (fallbackRes.error) {
            console.warn("Fallback courses insert warn:", fallbackRes.error.message);
          }
        }

        // 2. Insert into subjects (optional sub-classification)
        try {
          await supabase.from('subjects').insert([{
            id: subjectId,
            course_id: courseId,
            title: title.trim(),
            semester: 1,
            position: 0,
            is_public: isPublic,
            youtube_playlist_id: ytId
          }]);
        } catch (sErr) {
          console.warn("Subjects table insert fallback:", sErr);
        }

        // 3. Insert into playlists
        try {
          await supabase.from('playlists').insert([{
            id: playlistId,
            subject_id: subjectId,
            title: title.trim(),
            description: finalDesc,
            author: finalAuthor,
            youtube_playlist_id: ytId,
            is_public: isPublic,
            position: 0,
            likes: [],
            keywords: finalKeywords
          }]);
        } catch (pErr) {
          console.warn("Playlists table insert fallback:", pErr);
        }

        addLog(`Published new course and playlist: "${title.trim()}"`);
        syncSupabase();
      } catch (err) {
        console.error("Failed to create course in Supabase:", err);
      }
    }

    // Local state immediate synchronization
    const newCourse = {
      id: courseId,
      title: title.trim(),
      department: finalDept,
      description: finalDesc,
      price: 0,
      creatorId: validCreatorId || currentUser?.id || 'admin',
      creatorName: finalAuthor,
      author: finalAuthor,
      bannerUrl: finalBanner,
      isPublic,
      youtubePlaylistId: ytId,
      keywords: finalKeywords
    };

    const newPlaylist = {
      id: playlistId,
      title: title.trim(),
      description: finalDesc,
      author: finalAuthor,
      youtubePlaylistId: ytId,
      isPublic,
      position: 0,
      likes: [],
      videos: []
    };

    const newSubject = {
      id: subjectId,
      courseId,
      semester: 1,
      title: title.trim(),
      position: 0,
      isPublic,
      youtubePlaylistId: ytId,
      playlists: [newPlaylist],
      customMaterialSections: ['Notes', 'Organizer', 'Past Year Papers'],
      materials: []
    };

    setCourses(prev => {
      const updated = [newCourse, ...prev.filter(c => c.id !== courseId)];
      try {
        localStorage.setItem('learnopia_courses_stable', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSubjects(prev => [newSubject, ...prev.filter(s => s.id !== subjectId)]);

    return { courseId, subjectId, playlistId };
  };

  const deleteCourseCatalogItem = async ({ courseId, subjectId, playlistId }) => {
    if (playlistId) await deleteSubjectPlaylist(playlistId);
    if (subjectId) await deleteSubject(subjectId);
    if (courseId) await deleteCourse(courseId);
  };

  const addVideoToPlaylist = async (subjectId, playlistId, title, description, url) => {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      throw new Error('Please submit a valid YouTube video link.');
    }

    const subject = subjects.find(s => s.id === subjectId);
    const playlist = subject ? (subject.playlists || []).find(p => p.id === playlistId) : null;
    const siblings = playlist ? (playlist.videos || []) : [];
    const newPosition = siblings.length;

    if (isSupabaseLive) {
      try {
        await supabase.from('videos').insert([{
          playlist_id: playlistId,
          title,
          description,
          youtube_id: videoId,
          position: newPosition
        }]);
      } catch (err) {
        // videos table is deprecated/dropped; maintain in local state
        console.warn("Notice: Videos table not active; saving to client state:", err?.message);
      }
      addLog(`Video added: "${title}"`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const updatedPlaylists = (s.playlists || []).map(pl => {
            if (pl.id === playlistId) {
              const newVideo = { id: 'v-' + Date.now(), title, description, youtubeId: videoId, position: newPosition };
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
      try {
        await supabase.from('videos').delete().eq('id', videoId);
      } catch {}
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

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const getResourceById = (targetId) => {
    if (!targetId) return null;
    const cleanId = String(targetId).trim().toLowerCase();

    // 1. Search standalone open resources
    if (standaloneResources && Array.isArray(standaloneResources)) {
      const found = standaloneResources.find(r => r.id && String(r.id).toLowerCase() === cleanId);
      if (found) return found;
    }

    // 2. Search materials across all subjects
    for (const sub of subjects) {
      if (sub.materials && Array.isArray(sub.materials)) {
        const found = sub.materials.find(m => m.id && String(m.id).toLowerCase() === cleanId);
        if (found) return { ...found, subjectTitle: sub.title };
      }
    }

    return null;
  };

  const addSubjectMaterial = async (subjectId, title, urlOrResId, sectionName, author = '') => {
    const subject = subjects.find(s => s.id === subjectId);
    const siblings = subject ? (subject.materials || []).filter(m => m.sectionName === sectionName) : [];
    const newPosition = siblings.length;

    // Check if input is an existing resource ID / UUID
    const existingRes = getResourceById(urlOrResId);
    const finalTitle = existingRes ? (title.trim() || existingRes.title) : title;
    const finalUrl = existingRes ? existingRes.url : urlOrResId;
    const finalAuthor = existingRes ? (existingRes.author || author || currentUser?.name || '') : (author || currentUser?.name || '');
    const resourceIdRef = existingRes ? existingRes.id : null;

    if (isSupabaseLive) {
      try {
        const { error } = await supabase.from('materials').insert([{
          subject_id: subjectId,
          title: finalTitle,
          url: finalUrl,
          section_name: sectionName,
          author: finalAuthor,
          position: newPosition,
          resource_id: resourceIdRef
        }]);
        if (error) throw error;
      } catch (err) {
        console.warn("Retrying material insert fallback:", err);
        await supabase.from('materials').insert([{
          subject_id: subjectId,
          title: finalTitle,
          url: finalUrl,
          section_name: sectionName,
          author: finalAuthor
        }]);
      }
      addLog(`Document attached: "${finalTitle}"`);
      syncSupabase();
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const newDoc = {
            id: existingRes ? existingRes.id : ('doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)),
            title: finalTitle,
            url: finalUrl,
            sectionName,
            author: finalAuthor,
            position: newPosition,
            originalResourceId: resourceIdRef
          };
          return { ...s, materials: [...(s.materials || []), newDoc] };
        }
        return s;
      }));
      addLog(`Document attached: "${finalTitle}"`);
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

  const toggleVideoLike = async (subjectId, playlistId, videoId) => {
    if (!currentUser) return;
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;
    const pl = (sub.playlists || []).find(p => p.id === playlistId);
    if (!pl) return;
    const vid = (pl.videos || []).find(v => v.id === videoId);
    if (!vid) return;

    const likes = vid.likes || [];
    const hasLiked = likes.includes(currentUser.id);
    const updatedLikes = hasLiked
      ? likes.filter(id => id !== currentUser.id)
      : [...likes, currentUser.id];

    if (isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('videos')
          .update({ likes: updatedLikes })
          .eq('id', videoId);
        if (error) throw error;
        addLog(hasLiked ? 'Unliked video.' : 'Liked video.');
        syncSupabase();
      } catch (err) {
        console.warn('Could not update video likes in Supabase (column may be missing):', err);
        // Fallback to local state update so it still works in the UI
        setSubjects(prev => prev.map(s => {
          if (s.id === subjectId) {
            const updatedPlaylists = (s.playlists || []).map(p => {
              if (p.id === playlistId) {
                const updatedVids = (p.videos || []).map(v => v.id === videoId ? { ...v, likes: updatedLikes } : v);
                return { ...p, videos: updatedVids };
              }
              return p;
            });
            return { ...s, playlists: updatedPlaylists };
          }
          return s;
        }));
      }
    } else {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          const updatedPlaylists = (s.playlists || []).map(p => {
            if (p.id === playlistId) {
              const updatedVids = (p.videos || []).map(v => v.id === videoId ? { ...v, likes: updatedLikes } : v);
              return { ...p, videos: updatedVids };
            }
            return p;
          });
          return { ...s, playlists: updatedPlaylists };
        }
        return s;
      }));
      addLog(hasLiked ? 'Unliked video.' : 'Liked video.');
    }
  };

  const approveCreator = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';
    const targetName = targetUser ? `${targetUser.name} (${targetUser.email})` : `User ID ${userId}`;

    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ role: 'creator', status: 'active', creator_status: 'approved' })
        .eq('id', userId);
      addLog(`Creator clearance for user ${targetName} APPROVED by ${adminName}`);
      syncSupabase();
    } else {
      setUsers(prev => {
        const next = prev.map(u => u.id === userId ? { ...u, role: 'creator', status: 'active', creatorStatus: 'approved' } : u);
        localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
        return next;
      });
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, role: 'creator', status: 'active', creatorStatus: 'approved' };
        setCurrentUser(updatedUser);
        localStorage.setItem('learnopia_current_user_stable', JSON.stringify(updatedUser));
      }
      addLog(`Creator clearance for user ${targetName} APPROVED by ${adminName}`);
    }
  };

  const rejectCreator = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';
    const targetName = targetUser ? `${targetUser.name} (${targetUser.email})` : `User ID ${userId}`;

    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ creator_status: 'rejected' })
        .eq('id', userId);
      addLog(`Creator clearance for user ${targetName} REJECTED by ${adminName}`);
      syncSupabase();
    } else {
      setUsers(prev => {
        const next = prev.map(u => u.id === userId ? { ...u, creatorStatus: 'rejected' } : u);
        localStorage.setItem('learnopia_users_stable', JSON.stringify(next));
        return next;
      });
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, creatorStatus: 'rejected' };
        setCurrentUser(updatedUser);
        localStorage.setItem('learnopia_current_user_stable', JSON.stringify(updatedUser));
      }
      addLog(`Creator clearance for user ${targetName} REJECTED by ${adminName}`);
    }
  };

  const makeAdmin = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';
    const targetName = targetUser ? `${targetUser.name} (${targetUser.email})` : `User ID ${userId}`;

    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ role: 'admin', status: 'active' })
        .eq('id', userId);
      addLog(`User ${targetName} promoted to Admin status by ${adminName}`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'admin', status: 'active' } : u));
      addLog(`User ${targetName} promoted to Admin status by ${adminName}`);
    }
  };

  const toggleUserStatus = async (userId) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'suspended' : 'active';
    const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';
    const targetName = `${target.name} (${target.email})`;

    if (isSupabaseLive) {
      await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      addLog(`User account ${targetName} status changed to ${newStatus.toUpperCase()} by ${adminName}`);
      syncSupabase();
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      addLog(`User account ${targetName} status changed to ${newStatus.toUpperCase()} by ${adminName}`);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';
    const targetName = targetUser ? `${targetUser.name} (${targetUser.email})` : `User ID ${userId}`;

    if (isSupabaseLive) {
      const updates = { role: newRole };
      if (newRole === 'learner') {
        updates.creator_status = null;
      }
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      addLog(`Role of user ${targetName} changed to ${newRole.toUpperCase()} by ${adminName}`);
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
      addLog(`Role of user ${targetName} changed to ${newRole.toUpperCase()} by ${adminName}`);
    }
  };

  const pruneActivityLogs = async (period) => {
    let boundaryDate = null;
    const now = new Date();
    
    if (period === '1h') {
      boundaryDate = new Date(now.getTime() - 60 * 60 * 1000);
    } else if (period === '1d') {
      boundaryDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === '1w') {
      boundaryDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '1m') {
      boundaryDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const adminName = currentUser ? `${currentUser.name} (${currentUser.email})` : 'System';

    if (isSupabaseLive) {
      if (period === 'all') {
        await supabase
          .from('activity_logs')
          .delete()
          .gte('timestamp', new Date(0).toISOString());
      } else if (boundaryDate) {
        await supabase
          .from('activity_logs')
          .delete()
          .lt('timestamp', boundaryDate.toISOString());
      }
      await addLog(`Activity logs cleared (Period: ${period}) by Admin ${adminName}`);
      syncSupabase();
    } else {
      if (period === 'all') {
        setActivityLogs([]);
      } else if (boundaryDate) {
        setActivityLogs(prev => prev.filter(log => new Date(log.timestamp) >= boundaryDate));
      }
      addLog(`Activity logs cleared (Period: ${period}) by Admin ${adminName}`);
    }
  };

  const reorderSubject = async (subjectId, direction) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const courseId = subject.courseId;
    const semester = subject.semester;

    const siblings = subjects
      .filter(s => s.courseId === courseId && s.semester === semester)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const idx = siblings.findIndex(s => s.id === subjectId);
    if (idx === -1) return;

    let targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    const normalizedSiblings = siblings.map((s, index) => ({ ...s, position: index }));
    const temp = normalizedSiblings[idx].position;
    normalizedSiblings[idx].position = normalizedSiblings[targetIdx].position;
    normalizedSiblings[targetIdx].position = temp;

    // 1. Optimistic UI update (update local state immediately)
    setSubjects(prev => prev.map(item => {
      const match = normalizedSiblings.find(ns => ns.id === item.id);
      return match ? { ...item, position: match.position } : item;
    }));

    // 2. Persist to Supabase if live
    if (isSupabaseLive) {
      try {
        for (const s of normalizedSiblings) {
          const { error } = await supabase.from('subjects').update({ position: s.position }).eq('id', s.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error("Failed to reorder subjects in Supabase (make sure the 'position' column exists):", err);
      }
    }
  };

  const reorderPlaylist = async (subjectId, playlistId, direction) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const playlistsList = subject.playlists || [];
    const siblings = [...playlistsList].sort((a, b) => (a.position || 0) - (b.position || 0));

    const idx = siblings.findIndex(p => p.id === playlistId);
    if (idx === -1) return;

    let targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    const normalizedSiblings = siblings.map((p, index) => ({ ...p, position: index }));
    const temp = normalizedSiblings[idx].position;
    normalizedSiblings[idx].position = normalizedSiblings[targetIdx].position;
    normalizedSiblings[targetIdx].position = temp;

    // 1. Optimistic UI update
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const updatedPlaylists = s.playlists.map(pl => {
          const match = normalizedSiblings.find(ns => ns.id === pl.id);
          return match ? { ...pl, position: match.position } : pl;
        });
        return { ...s, playlists: updatedPlaylists };
      }
      return s;
    }));

    // 2. Persist to Supabase if live
    if (isSupabaseLive) {
      try {
        for (const p of normalizedSiblings) {
          const { error } = await supabase.from('playlists').update({ position: p.position }).eq('id', p.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error("Failed to reorder playlists in Supabase (make sure the 'position' column exists):", err);
      }
    }
  };

  const reorderVideo = async (subjectId, playlistId, videoId, direction) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const playlist = (subject.playlists || []).find(p => p.id === playlistId);
    if (!playlist) return;

    const siblings = [...(playlist.videos || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
    const idx = siblings.findIndex(v => v.id === videoId);
    if (idx === -1) return;

    let targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    const normalizedSiblings = siblings.map((v, index) => ({ ...v, position: index }));
    const temp = normalizedSiblings[idx].position;
    normalizedSiblings[idx].position = normalizedSiblings[targetIdx].position;
    normalizedSiblings[targetIdx].position = temp;

    // 1. Optimistic UI update
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const updatedPlaylists = s.playlists.map(pl => {
          if (pl.id === playlistId) {
            const updatedVideos = pl.videos.map(v => {
              const match = normalizedSiblings.find(ns => ns.id === v.id);
              return match ? { ...v, position: match.position } : v;
            });
            return { ...pl, videos: updatedVideos };
          }
          return pl;
        });
        return { ...s, playlists: updatedPlaylists };
      }
      return s;
    }));

    // 2. Persist to Supabase if live
    if (isSupabaseLive) {
      try {
        for (const v of normalizedSiblings) {
          const { error } = await supabase.from('videos').update({ position: v.position }).eq('id', v.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error("Failed to reorder videos in Supabase (make sure the 'position' column exists):", err);
      }
    }
  };

  const reorderMaterialSection = async (subjectId, sectionName, direction) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const sections = [...(subject.customMaterialSections || ['Notes', 'Organizer', 'Past Year Papers'])];
    const idx = sections.indexOf(sectionName);
    if (idx === -1) return;

    let targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const temp = sections[idx];
    sections[idx] = sections[targetIdx];
    sections[targetIdx] = temp;

    if (isSupabaseLive) {
      try {
        await supabase
          .from('subjects')
          .update({ custom_material_sections: sections })
          .eq('id', subjectId);
        syncSupabase();
      } catch (err) {
        console.error("Failed to reorder material sections", err);
      }
    } else {
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, customMaterialSections: sections } : s));
    }
  };

  // ── SUPABASE TIMETABLE & ATTENDANCE PERSISTENCE HELPERS ──
  const saveUserRoutineToDb = async (userId, routineData, semesterStartDate) => {
    if (isSupabaseLive && userId) {
      try {
        const { data: existing, error: selectError } = await supabase
          .from('user_routines')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (selectError) {
          console.error('[Supabase Routine Select Error]', selectError.code, selectError.message);
        }

        if (existing) {
          const { error } = await supabase
            .from('user_routines')
            .update({
              routine_json: routineData,
              semester_start_date: semesterStartDate,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          if (error) {
            console.error('[Supabase Routine Update Error]', error.code, error.message, error.details);
          } else {
            console.log('✅ [Supabase Routine Updated Successfully for user]:', userId);
          }
        } else {
          const { error } = await supabase
            .from('user_routines')
            .insert([{
              user_id: userId,
              routine_json: routineData,
              semester_start_date: semesterStartDate,
              updated_at: new Date().toISOString()
            }]);
          if (error) {
            console.error('[Supabase Routine Insert Error]', error.code, error.message, error.details);
          } else {
            console.log('✅ [Supabase Routine Inserted Successfully for user]:', userId);
          }
        }
      } catch (e) {
        console.warn('[Supabase Routine Sync Error]', e);
      }
    }
  };

  const getUserRoutineFromDb = async (userId) => {
    if (isSupabaseLive && userId) {
      try {
        const { data, error } = await supabase
          .from('user_routines')
          .select('routine_json, semester_start_date')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) console.error('[Supabase Routine Fetch Error]', error.code, error.message);
        if (data) return data;
      } catch (e) {
        console.warn('[Supabase Routine Fetch Error]', e);
      }
    }
    return null;
  };

  const saveUserLogsToDb = async (userId, logsData) => {
    if (isSupabaseLive && userId) {
      try {
        const { data: existing, error: selectError } = await supabase
          .from('user_attendance_logs')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (selectError) {
          console.error('[Supabase Logs Select Error]', selectError.code, selectError.message);
        }

        if (existing) {
          const { error } = await supabase
            .from('user_attendance_logs')
            .update({
              logs_json: logsData,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          if (error) {
            console.error('[Supabase Logs Update Error]', error.code, error.message, error.details);
          } else {
            console.log('✅ [Supabase Attendance Logs Updated Successfully for user]:', userId);
          }
        } else {
          const { error } = await supabase
            .from('user_attendance_logs')
            .insert([{
              user_id: userId,
              logs_json: logsData,
              updated_at: new Date().toISOString()
            }]);
          if (error) {
            console.error('[Supabase Logs Insert Error]', error.code, error.message, error.details);
          } else {
            console.log('✅ [Supabase Attendance Logs Inserted Successfully for user]:', userId);
          }
        }
      } catch (e) {
        console.warn('[Supabase Logs Sync Error]', e);
      }
    }
  };

  const getUserLogsFromDb = async (userId) => {
    if (isSupabaseLive && userId) {
      try {
        const { data } = await supabase
          .from('user_attendance_logs')
          .select('logs_json')
          .eq('user_id', userId)
          .maybeSingle();
        if (data && data.logs_json) return data.logs_json;
      } catch (e) {
        console.warn('[Supabase Logs Fetch Error]', e);
      }
    }
    return null;
  };

  const saveUserArchivesToDb = async (userId, archivesData) => {
    if (isSupabaseLive && userId) {
      try {
        const { data: existing } = await supabase
          .from('user_archived_semesters')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('user_archived_semesters')
            .update({
              archives_json: archivesData,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          if (error) console.error('[Supabase Archives Update Error]', error.message);
        } else {
          const { error } = await supabase
            .from('user_archived_semesters')
            .insert([{
              user_id: userId,
              archives_json: archivesData,
              updated_at: new Date().toISOString()
            }]);
          if (error) console.error('[Supabase Archives Insert Error]', error.message);
        }
      } catch (e) {
        console.warn('[Supabase Archives Sync Error]', e);
      }
    }
  };

  // ── LOCAL STORAGE DISCUSSIONS PERSISTENCE HELPERS (Supabase discussion_threads dropped) ──
  const saveDiscussionThreadsToDb = async (threadsData) => {
    try {
      localStorage.setItem('learnopia_discussion_threads_cache', JSON.stringify(threadsData));
    } catch (e) {
      console.warn('[Discussion Threads Save Error]', e);
    }
  };

  const getDiscussionThreadsFromDb = async () => {
    try {
      const cached = localStorage.getItem('learnopia_discussion_threads_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('[Discussion Threads Fetch Error]', e);
    }
    return null;
  };

  // ── SHARED ROUTINES ENGINE (Unique Routine ID / Share Code) ───────────────────
  const createSharedRoutine = async (routineJson, semesterStartDate = null, title = 'Weekly Class Schedule') => {
    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codeBody = '';
    for (let i = 0; i < 6; i++) {
      codeBody += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    const shareCode = `RT-${codeBody}`;
    const id = `shared-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const creatorId = currentUser?.id || 'guest';
    const creatorName = currentUser?.name || 'Learnopia Learner';

    const record = {
      id,
      share_code: shareCode,
      title: title || 'Weekly Routine',
      routine_json: routineJson,
      semester_start_date: semesterStartDate,
      creator_id: creatorId,
      creator_name: creatorName,
      created_at: new Date().toISOString()
    };

    // 1. Save to local storage pool
    try {
      const localPool = JSON.parse(localStorage.getItem('learnopia_shared_routines') || '{}');
      localPool[shareCode] = record;
      localStorage.setItem('learnopia_shared_routines', JSON.stringify(localPool));
    } catch {}

    // 2. Save to Supabase shared_routines table
    if (isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('shared_routines')
          .insert([record]);
        if (error) {
          console.warn('[Supabase Shared Routine Insert Error]', error.message);
        } else {
          console.log('✅ [Supabase Shared Routine Saved]:', shareCode);
        }
      } catch (e) {
        console.warn('[Supabase Shared Routine Warn]', e);
      }
    }

    addLog(`Routine shared with ID: ${shareCode}`);
    return shareCode;
  };

  const getSharedRoutineByCode = async (rawCode) => {
    if (!rawCode) return null;
    let cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode.startsWith('RT-') && cleanCode.length === 6) {
      cleanCode = `RT-${cleanCode}`;
    }

    // 1. Fetch from Supabase
    if (isSupabaseLive) {
      try {
        const { data } = await supabase
          .from('shared_routines')
          .select('*')
          .or(`share_code.eq.${cleanCode},id.eq.${cleanCode}`)
          .maybeSingle();

        if (data && data.routine_json) {
          return {
            shareCode: data.share_code || cleanCode,
            title: data.title,
            routine: data.routine_json,
            semesterStartDate: data.semester_start_date,
            creatorName: data.creator_name
          };
        }
      } catch (e) {
        console.warn('[Supabase Shared Routine Fetch]', e);
      }
    }

    // 2. Fallback to local storage pool
    try {
      const localPool = JSON.parse(localStorage.getItem('learnopia_shared_routines') || '{}');
      if (localPool[cleanCode]) {
        const localData = localPool[cleanCode];
        return {
          shareCode: localData.share_code || cleanCode,
          title: localData.title,
          routine: localData.routine_json,
          semesterStartDate: localData.semester_start_date,
          creatorName: localData.creator_name
        };
      }
    } catch {}

    return null;
  };

  const getAllSharedRoutines = async () => {
    let routines = [];
    if (isSupabaseLive) {
      try {
        const { data } = await supabase
          .from('shared_routines')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) {
          routines = data;
        }
      } catch (e) {
        console.warn('[Supabase Shared Routines Fetch All Error]', e);
      }
    }
    try {
      const localPool = JSON.parse(localStorage.getItem('learnopia_shared_routines') || '{}');
      Object.values(localPool).forEach(localR => {
        if (!routines.some(r => r.share_code === localR.share_code)) {
          routines.push(localR);
        }
      });
    } catch {}
    return routines;
  };

  const deleteSharedRoutine = async (shareCode) => {
    if (isSupabaseLive) {
      try {
        await supabase.from('shared_routines').delete().eq('share_code', shareCode);
      } catch {}
    }
    try {
      const localPool = JSON.parse(localStorage.getItem('learnopia_shared_routines') || '{}');
      delete localPool[shareCode];
      localStorage.setItem('learnopia_shared_routines', JSON.stringify(localPool));
    } catch {}
  };

  // ── COMMUNITY AD & POP-UP SETTINGS ──────────────────────────────────────────
  const DEFAULT_AD_SETTINGS = {
    enabled: true,
    intervalMinutes: 15,
    skipDelaySeconds: 10,
    title: "Support Learnopia's Open Education Infrastructure",
    message: "Learnopia is built by students, for students. Help us keep all engineering degree curricula, attendance algorithms, and YouTube lecture sync servers fast, open, and free for everyone!",
    targetUrl: "https://github.com/diiipakkk-08/learn-o-pia",
    youtubeUrl: ""
  };

  const [adSettings, setAdSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_ad_settings_stable');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return DEFAULT_AD_SETTINGS;
  });

  const updateAdSettings = async (newSettings) => {
    const merged = { ...adSettings, ...newSettings };
    setAdSettings(merged);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnopia_ad_settings_stable', JSON.stringify(merged));
    }

    if (isSupabaseLive) {
      try {
        await supabase
          .from('ads')
          .upsert([{
            id: 'global_ad_settings',
            title: merged.title || '',
            message: merged.message || '',
            target_url: merged.targetUrl || '',
            youtube_url: merged.youtubeUrl || '',
            banner_link: merged.bannerLink || null,
            enabled: merged.enabled !== false,
            interval_minutes: parseInt(merged.intervalMinutes) || 15,
            skip_delay_seconds: parseInt(merged.skipDelaySeconds) || 10,
            settings_json: merged,
            updated_at: new Date().toISOString()
          }], { onConflict: 'id' });
      } catch (eAds) {
        console.warn('Dedicated ads table sync fallback:', eAds);
      }

      try {
        const { data: existing } = await supabase
          .from('platform_settings')
          .select('id')
          .eq('id', 'global_ad_settings')
          .maybeSingle();

        if (existing) {
          await supabase
            .from('platform_settings')
            .update({
              settings_json: merged,
              updated_at: new Date().toISOString()
            })
            .eq('id', 'global_ad_settings');
        } else {
          await supabase
            .from('platform_settings')
            .insert([{
              id: 'global_ad_settings',
              settings_json: merged,
              updated_at: new Date().toISOString()
            }]);
        }
        console.log('✅ [Supabase Global Ad Settings Saved]:', merged);
      } catch (e) {
        console.warn('[Supabase Global Ad Settings Save Error]', e);
      }
    }

    addLog(`Admin updated Community Ad parameters (Status: ${merged.enabled ? 'Enabled' : 'Disabled'}, Interval: ${merged.intervalMinutes}m, Skip Delay: ${merged.skipDelaySeconds}s)`);
  };

  const saveUserFoldersToDb = async (userId, folders) => {
    if (!isSupabaseLive || !userId || userId === 'guest') return;
    try {
      const payload = foldersToProfilePayload(folders);
      await supabase.from('profiles').update({
        ...payload,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
    } catch (err) {
      console.warn('Failed to sync workspace folders to Supabase profile:', err);
    }
  };

  useEffect(() => {
    const handleFoldersUpdated = (e) => {
      const { userId, folders } = e.detail || {};
      if (userId && folders) {
        saveUserFoldersToDb(userId, folders);
      }
    };
    window.addEventListener('learnopia_workspace_folders_updated', handleFoldersUpdated);
    return () => window.removeEventListener('learnopia_workspace_folders_updated', handleFoldersUpdated);
  }, []);

  return (
    <DatabaseContext.Provider value={{
      users,
      courses,
      subjects,
      currentUser,
      authLoading,
      activityLogs,
      standaloneResources,
      announcements,
      broadcastAnnouncement,
      deleteAnnouncement,
      markAnnouncementsRead,
      unreadAnnouncementsCount,
      triggerWebNotification,
      requestNotificationPermission,
      adSettings,
      updateAdSettings,
      createSharedRoutine,
      getSharedRoutineByCode,
      getAllSharedRoutines,
      deleteSharedRoutine,
      addStandaloneResource,
      setPasswordForUser,
      resetPasswordByEmail,
      login,
      loginAsGuest,
      loginWithGoogle,
      registerUser,
      logout,
      requestCreatorStatus,
      updateUserProfile,
      adminVerifyUser,
      unverifyUser,
      enrollInCourse,
      removeUserEnrollment,
      enrollInPlaylist,
      removeUserPlaylistEnrollment,
      deletePlaylist,
      deleteStandaloneResource,
      lastPlayed,
      updateLastPlayed,
      addCourse,
      editCourse,
      deleteCourse,
      createCourseWithPlaylist,
      deleteCourseCatalogItem,
      addSubject,
      updateSubjectDetails,
      deleteSubject,
      addSubjectPlaylist,
      deleteSubjectPlaylist,
      addVideoToPlaylist,
      deleteVideoFromPlaylist,
      addSubjectMaterialSection,
      deleteSubjectMaterialSection,
      addSubjectMaterial,
      deleteSubjectMaterial,
      globalSearchQuery,
      setGlobalSearchQuery,
      getResourceById,
      savedResourceIds,
      toggleSaveResource,
      isResourceSaved,
      toggleCourseLike,
      togglePlaylistLike,
      toggleVideoLike,
      approveCreator,
      rejectCreator,
      makeAdmin,
      toggleUserStatus,
      changeUserRole,
      pruneActivityLogs,
      reorderSubject,
      reorderPlaylist,
      reorderVideo,
      reorderMaterialSection,
      extractYoutubePlaylistId,
      importVideosToExistingPlaylist,
      saveUserRoutineToDb,
      getUserRoutineFromDb,
      saveUserLogsToDb,
      getUserLogsFromDb,
      saveUserArchivesToDb,
      saveDiscussionThreadsToDb,
      getDiscussionThreadsFromDb,
      deleteUserAccount,
      saveUserFoldersToDb,
      isSupabaseLive,
      viewingProfileUser,
      openUserProfile,
      closeUserProfile
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
