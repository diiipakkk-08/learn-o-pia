// Unified workspace folders utility for Learn-O-Pia
// Manages the 4 core folders: Academic, Document, Important Links, Personal

export const DEFAULT_WORKSPACE_FOLDERS = [
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

export function getWorkspaceFolders(userId = 'guest') {
  const key = `learnopia_explorer_folders_v2_${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      let folders = JSON.parse(raw);
      if (Array.isArray(folders) && folders.length > 0) {
        let changed = false;

        // 1. Rename any legacy 'source' root folder to 'document'
        folders = folders.map((f) => {
          if (f.id === 'source') {
            changed = true;
            return { ...f, id: 'document', title: 'Document' };
          }
          return f;
        });

        // 2. Ensure all 4 root folders exist
        const requiredRootIds = ['academic', 'document', 'links', 'personal'];
        requiredRootIds.forEach((reqId) => {
          if (!folders.some((f) => f.id === reqId)) {
            const defaultRoot = DEFAULT_WORKSPACE_FOLDERS.find((d) => d.id === reqId);
            if (defaultRoot) {
              folders.push(JSON.parse(JSON.stringify(defaultRoot)));
              changed = true;
            }
          }
        });

        // 3. Ensure Academic has all 8 Semesters
        const academicFolder = folders.find((f) => f.id === 'academic');
        if (academicFolder) {
          if (!academicFolder.subfolders || academicFolder.subfolders.length === 0) {
            academicFolder.subfolders = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS[0].subfolders));
            changed = true;
          } else {
            // Check if semesters 1 through 8 are present; if any are missing, add them
            for (let sem = 1; sem <= 8; sem++) {
              const semId = `sem-${sem}`;
              const exists = academicFolder.subfolders.some((sf) => sf.id === semId);
              if (!exists) {
                const defaultSem = DEFAULT_WORKSPACE_FOLDERS[0].subfolders.find((s) => s.id === semId) || {
                  id: semId,
                  title: `Semester ${sem}`,
                  subfolders: [],
                  items: []
                };
                academicFolder.subfolders.push(JSON.parse(JSON.stringify(defaultSem)));
                changed = true;
              }
            }
          }
        }

        // 4. Ensure Document has default subfolders if empty
        const docFolder = folders.find((f) => f.id === 'document');
        if (docFolder && (!docFolder.subfolders || docFolder.subfolders.length === 0)) {
          docFolder.subfolders = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS[1].subfolders));
          changed = true;
        }

        if (changed) {
          localStorage.setItem(key, JSON.stringify(folders));
        }

        return folders;
      }
    }
  } catch (err) {
    console.error('Failed to parse workspace folders:', err);
  }

  // Fallback to fresh defaults
  const fresh = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS));
  try {
    localStorage.setItem(key, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

export function saveWorkspaceFolders(userId = 'guest', folders) {
  const key = `learnopia_explorer_folders_v2_${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save workspace folders:', err);
  }
}
