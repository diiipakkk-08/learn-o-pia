// Unified workspace folders utility for Learnopia
// Manages the 4 core folders: Academic, Docs, Links, Personal
import { supabase, isSupabaseLive } from '../lib/supabaseClient';

export const DEFAULT_WORKSPACE_FOLDERS = [
  {
    id: 'academic',
    title: 'Academic',
    isSystem: true,
    subfolders: [
      { id: 'sem-1', title: 'Semester 1', subfolders: [], items: [] },
      { id: 'sem-2', title: 'Semester 2', subfolders: [], items: [] },
      { id: 'sem-3', title: 'Semester 3', subfolders: [], items: [] },
      { id: 'sem-4', title: 'Semester 4', subfolders: [], items: [] },
      { id: 'sem-5', title: 'Semester 5', subfolders: [], items: [] },
      { id: 'sem-6', title: 'Semester 6', subfolders: [], items: [] },
      { id: 'sem-7', title: 'Semester 7', subfolders: [], items: [] },
      { id: 'sem-8', title: 'Semester 8', subfolders: [], items: [] }
    ],
    items: []
  },
  {
    id: 'document',
    title: 'Docs',
    isSystem: true,
    subfolders: [
      { id: 'doc-dsa', title: 'Algorithms & LeetCode Solutions', subfolders: [], items: [] },
      { id: 'doc-labs', title: 'University Lab Code & Manuals', subfolders: [], items: [] },
      { id: 'doc-guides', title: 'Course Notes & Reference Guides', subfolders: [], items: [] }
    ],
    items: []
  },
  {
    id: 'links',
    title: 'Links',
    isSystem: true,
    subfolders: [],
    items: []
  },
  {
    id: 'personal',
    title: 'Personal',
    isSystem: true,
    subfolders: [
      { id: 'pers-notes', title: 'Personal Study Notes', subfolders: [], items: [] },
      { id: 'pers-prep', title: 'Interview & Placement Prep', subfolders: [], items: [] }
    ],
    items: []
  }
];

const MOCK_ITEM_IDS = new Set([
  'item-math1', 'item-phys1', 'item-bee1', 'item-pps1', 'item-syl1', 'item-pyq1',
  'item-math2', 'item-chem1', 'item-dsa3', 'item-coa3', 'item-os4', 'item-dbms4',
  'src-1', 'src-2', 'src-3', 'src-4', 'src-5',
  'link-1', 'link-2', 'link-3', 'link-4', 'link-5', 'link-6',
  'pers-1', 'pers-2', 'pers-3', 'pers-4'
]);

export function getWorkspaceFolders(userId = 'guest') {
  const key = `learnopia_explorer_folders_v2_${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      let folders = JSON.parse(raw);
      if (Array.isArray(folders) && folders.length > 0) {
        let changed = false;

        // 1. Rename any legacy 'source' root folder to 'document' and update titles
        folders = folders.map((f) => {
          if (f.id === 'source' || f.id === 'document') {
            changed = true;
            return { ...f, id: 'document', title: 'Docs' };
          }
          if (f.id === 'links') {
            return { ...f, title: 'Links' };
          }
          return f;
        });

        // 2. Clean out legacy example mock items so subfolders start clean
        const cleanNodeMockItems = (node) => {
          if (!node) return;
          if (Array.isArray(node.items)) {
            const origLen = node.items.length;
            node.items = node.items.filter((it) => it && !MOCK_ITEM_IDS.has(it.id));
            if (node.items.length !== origLen) changed = true;
          }
          if (Array.isArray(node.subfolders)) {
            node.subfolders.forEach((sf) => {
              // Strict single-level depth: enforce subfolders under subfolder are empty
              if (Array.isArray(sf.subfolders) && sf.subfolders.length > 0) {
                sf.subfolders = [];
                changed = true;
              }
              cleanNodeMockItems(sf);
            });
          }
        };
        folders.forEach(cleanNodeMockItems);

        // 3. Ensure all 4 root folders exist
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

        // 4. Ensure Academic has Semesters and NO root items
        const academicFolder = folders.find((f) => f.id === 'academic');
        if (academicFolder) {
          if (!academicFolder.subfolders || academicFolder.subfolders.length === 0) {
            academicFolder.subfolders = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS[0].subfolders));
            changed = true;
          }
          // Move any root items into semester 1
          if (Array.isArray(academicFolder.items) && academicFolder.items.length > 0) {
            const sem1 = academicFolder.subfolders[0];
            if (sem1) {
              sem1.items = [...(sem1.items || []), ...academicFolder.items];
            }
            academicFolder.items = [];
            changed = true;
          }
        }

        // 5. Ensure Docs has default structure
        const docFolder = folders.find((f) => f.id === 'document');
        if (docFolder) {
          docFolder.title = 'Docs';
          if (!Array.isArray(docFolder.subfolders)) {
            docFolder.subfolders = [];
            changed = true;
          }
          if (!Array.isArray(docFolder.items)) {
            docFolder.items = [];
            changed = true;
          }
        }

        // 6. Ensure Links has NO subfolders and strictly flat items
        const linksFolder = folders.find((f) => f.id === 'links');
        if (linksFolder) {
          linksFolder.title = 'Links';
          if (Array.isArray(linksFolder.subfolders) && linksFolder.subfolders.length > 0) {
            const extracted = [];
            linksFolder.subfolders.forEach((sf) => {
              if (Array.isArray(sf.items)) extracted.push(...sf.items);
            });
            linksFolder.items = [...(linksFolder.items || []), ...extracted];
            linksFolder.subfolders = [];
            changed = true;
          }
          if (!Array.isArray(linksFolder.items)) {
            linksFolder.items = [];
            changed = true;
          }
        }

        // 7. Ensure Personal can have subfolders and items
        const persFolder = folders.find((f) => f.id === 'personal');
        if (persFolder) {
          persFolder.title = 'Personal';
          if (!Array.isArray(persFolder.subfolders)) {
            persFolder.subfolders = [];
            changed = true;
          }
          if (!Array.isArray(persFolder.items)) {
            persFolder.items = [];
            changed = true;
          }
        }

        // 8. Ensure all root folders have an items array
        folders.forEach((f) => {
          if (!Array.isArray(f.items)) {
            f.items = [];
            changed = true;
          }
        });

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
  return fresh;
}

export function getPinnedSemester(userId = 'guest') {
  try {
    const val = localStorage.getItem(`learnopia_pinned_semester_${userId}`);
    return val || 'sem-1';
  } catch {
    return 'sem-1';
  }
}

export async function setPinnedSemester(userId = 'guest', semId) {
  try {
    localStorage.setItem(`learnopia_pinned_semester_${userId}`, semId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('learnopia_pinned_semester_updated', {
        detail: { userId, pinnedSemester: semId }
      }));
    }
    if (userId && userId !== 'guest' && isSupabaseLive && supabase) {
      try {
        await supabase.from('profiles').update({
          pinned_semester: semId,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      } catch (dbErr) {
        console.warn('Could not sync pinned_semester to Supabase:', dbErr);
      }
    }
  } catch (err) {
    console.error('Failed to set pinned semester:', err);
  }
}

export function setAcademicSemestersCount(userId = 'guest', count = 8) {
  const folders = getWorkspaceFolders(userId);
  const academic = folders.find(f => f.id === 'academic');
  if (!academic) return folders;

  const currentSubs = academic.subfolders || [];
  const newSubs = [];

  for (let i = 1; i <= count; i++) {
    const semId = `sem-${i}`;
    const existing = currentSubs.find(s => s.id === semId);
    if (existing) {
      newSubs.push(existing);
    } else {
      newSubs.push({
        id: semId,
        title: `Semester ${i}`,
        subfolders: [],
        items: []
      });
    }
  }

  academic.subfolders = newSubs;
  saveWorkspaceFolders(userId, folders);
  return folders;
}

export function foldersToProfilePayload(folders) {
  if (!Array.isArray(folders)) return {};
  const academic = folders.find(f => f.id === 'academic') || null;
  const document = folders.find(f => f.id === 'document') || null;
  const links = folders.find(f => f.id === 'links') || null;
  const personal = folders.find(f => f.id === 'personal') || null;

  return {
    folder_academic: academic ? (academic.subfolders || []) : [],
    folder_document: document ? { subfolders: document.subfolders || [], items: document.items || [] } : { subfolders: [], items: [] },
    folder_links: links ? (links.items || []) : [],
    folder_personal: personal ? { subfolders: personal.subfolders || [], items: personal.items || [] } : { subfolders: [], items: [] }
  };
}

export function profilePayloadToFolders(profile) {
  if (!profile) return null;
  const fAcad = profile.folder_academic || profile.folderAcademic;
  const fDoc = profile.folder_document || profile.folderDocument;
  const fLinks = profile.folder_links || profile.folderLinks;
  const fPers = profile.folder_personal || profile.folderPersonal;

  if (!fAcad && !fDoc && !fLinks && !fPers) return null;

  const base = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS));

  // Academic: subfolders are semesters
  const acadRoot = base.find(f => f.id === 'academic');
  if (acadRoot && fAcad) {
    if (Array.isArray(fAcad)) {
      acadRoot.subfolders = fAcad;
    } else if (typeof fAcad === 'object' && Array.isArray(fAcad.subfolders)) {
      acadRoot.subfolders = fAcad.subfolders;
    }
    acadRoot.items = []; // Academic items only inside semesters
  }

  // Docs: subfolders + root items
  const docRoot = base.find(f => f.id === 'document');
  if (docRoot && fDoc) {
    if (Array.isArray(fDoc)) {
      docRoot.subfolders = fDoc;
    } else if (typeof fDoc === 'object') {
      if (Array.isArray(fDoc.subfolders)) docRoot.subfolders = fDoc.subfolders;
      if (Array.isArray(fDoc.items)) docRoot.items = fDoc.items;
    }
  }

  // Links: flat items only
  const linksRoot = base.find(f => f.id === 'links');
  if (linksRoot && fLinks) {
    linksRoot.subfolders = [];
    if (Array.isArray(fLinks)) {
      const extracted = [];
      fLinks.forEach(entry => {
        if (entry && Array.isArray(entry.items)) {
          extracted.push(...entry.items);
        } else if (entry && (entry.url || entry.title || entry.id)) {
          extracted.push(entry);
        }
      });
      linksRoot.items = extracted;
    } else if (typeof fLinks === 'object' && Array.isArray(fLinks.items)) {
      linksRoot.items = fLinks.items;
    }
  }

  // Personal: subfolders + root items
  const persRoot = base.find(f => f.id === 'personal');
  if (persRoot && fPers) {
    if (Array.isArray(fPers)) {
      // Check if it's subfolders array or items array
      const hasSubfolders = fPers.some(entry => entry && Array.isArray(entry.items) && !entry.url);
      if (hasSubfolders) {
        persRoot.subfolders = fPers;
      } else {
        persRoot.items = fPers;
      }
    } else if (typeof fPers === 'object') {
      if (Array.isArray(fPers.subfolders)) persRoot.subfolders = fPers.subfolders;
      if (Array.isArray(fPers.items)) persRoot.items = fPers.items;
    }
  }

  return base;
}

export function saveWorkspaceFolders(userId = 'guest', folders) {
  const key = `learnopia_explorer_folders_v2_${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(folders));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('learnopia_workspace_folders_updated', {
        detail: { userId, folders }
      }));
    }
  } catch (err) {
    console.error('Failed to save workspace folders:', err);
  }
}
