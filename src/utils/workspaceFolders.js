// Unified workspace folders utility for Learn-O-Pia
// Manages the 4 core folders: Academic, Document, Important Links, Personal

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
    title: 'Document',
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
    title: 'Important Links',
    isSystem: true,
    subfolders: [
      { id: 'links-university', title: 'MAKAUT & Examination Portals', subfolders: [], items: [] },
      { id: 'links-resources', title: 'Digital Libraries & National Portals', subfolders: [], items: [] }
    ],
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

        // 1. Rename any legacy 'source' root folder to 'document'
        folders = folders.map((f) => {
          if (f.id === 'source') {
            changed = true;
            return { ...f, id: 'document', title: 'Document' };
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

        // 4. Ensure Academic has all 8 Semesters
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

        // 5. Ensure Document has default subfolders if empty
        const docFolder = folders.find((f) => f.id === 'document');
        if (docFolder && (!docFolder.subfolders || docFolder.subfolders.length === 0)) {
          docFolder.subfolders = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS[1].subfolders));
          changed = true;
        }

        // 6. Ensure Links has default subfolders if empty
        const linksFolder = folders.find((f) => f.id === 'links');
        if (linksFolder && (!linksFolder.subfolders || linksFolder.subfolders.length === 0)) {
          linksFolder.subfolders = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS[2].subfolders));
          changed = true;
        }

        // 7. Ensure Personal has default subfolders if empty
        const persFolder = folders.find((f) => f.id === 'personal');
        if (persFolder && (!persFolder.subfolders || persFolder.subfolders.length === 0)) {
          persFolder.subfolders = JSON.parse(JSON.stringify(DEFAULT_WORKSPACE_FOLDERS[3].subfolders));
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
  return fresh;
}

export function foldersToProfilePayload(folders) {
  if (!Array.isArray(folders)) return {};
  const academic = folders.find(f => f.id === 'academic') || null;
  const document = folders.find(f => f.id === 'document') || null;
  const links = folders.find(f => f.id === 'links') || null;
  const personal = folders.find(f => f.id === 'personal') || null;

  return {
    folder_academic: academic ? (academic.subfolders || []) : [],
    folder_document: document ? (document.subfolders || []) : [],
    folder_links: links ? (links.subfolders || []) : [],
    folder_personal: personal ? (personal.subfolders || []) : []
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

  if (fAcad && Array.isArray(fAcad)) {
    const acadRoot = base.find(f => f.id === 'academic');
    if (acadRoot && fAcad.length > 0) acadRoot.subfolders = fAcad;
  }
  if (fDoc && Array.isArray(fDoc)) {
    const docRoot = base.find(f => f.id === 'document');
    if (docRoot && fDoc.length > 0) docRoot.subfolders = fDoc;
  }
  if (fLinks && Array.isArray(fLinks)) {
    const linksRoot = base.find(f => f.id === 'links');
    if (linksRoot && fLinks.length > 0) linksRoot.subfolders = fLinks;
  }
  if (fPers && Array.isArray(fPers)) {
    const persRoot = base.find(f => f.id === 'personal');
    if (persRoot && fPers.length > 0) persRoot.subfolders = fPers;
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
