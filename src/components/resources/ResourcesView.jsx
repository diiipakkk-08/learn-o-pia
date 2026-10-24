import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search,
  FileText,
  Download,
  Copy,
  Check,
  FolderPlus,
  Folder,
  GraduationCap,
  Code2,
  Link2,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function ResourcesView({ setCurrentView, setSelectedPlaylistId, isSidebarCollapsed = false }) {
  const {
    currentUser,
    standaloneResources,
    subjects,
    globalSearchQuery,
    setGlobalSearchQuery,
    savedResourceIds,
    toggleSaveResource
  } = useDatabase();

  const userId = currentUser?.id || 'guest';

  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'saved'
  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [page, setPage] = useState(1);
  const [toastNotice, setToastNotice] = useState(null);

  // Folder assignment modal state
  const [resourceToAddToFolder, setResourceToAddToFolder] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState('academic');
  const [targetSubfolderId, setTargetSubfolderId] = useState('');

  // Reload explorer folders whenever modal opens to reflect user changes
  useEffect(() => {
    if (resourceToAddToFolder) {
      try {
        const raw = localStorage.getItem(`learnopia_explorer_folders_v2_${userId}`);
        if (raw) {
          let parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed = parsed.map(f => (f.id === 'source' ? { ...f, id: 'document', title: 'Document' } : f));
            setUserFolders(parsed);
          }
        }
      } catch {}
      setTargetFolderId('academic');
      setTargetSubfolderId('');
    }
  }, [resourceToAddToFolder, userId]);

  const handleSelectFolder = (folderId) => {
    setTargetFolderId(folderId);
    setTargetSubfolderId('');
  };

  // Load explorer folders to know if resources are assigned
  const [userFolders, setUserFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(`learnopia_explorer_folders_v2_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setLocalSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  useEffect(() => {
    setPage(1);
  }, [localSearch, activeTab]);

  const handleCopyLink = (res, e) => {
    if (e) e.preventDefault();
    if (!res) return;
    const linkToCopy = res.url || `${window.location.origin}/#vault-${res.id}`;
    navigator.clipboard.writeText(linkToCopy);
    setCopiedId(res.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Compile all standalone resources and subject document materials
  const allDocResources = useMemo(() => {
    const list = [];
    const seen = new Set();

    (standaloneResources || []).forEach((res) => {
      if (!res.id || seen.has(res.id)) return;
      seen.add(res.id);
      list.push({
        id: res.id,
        title: res.title,
        url: res.url,
        type: res.type || 'pdf',
        category: res.category || 'Study Guide',
        description: res.description || '',
        author: res.author || 'Educator',
        subjectTitle: (res.subjects && res.subjects[0]) || 'General Vault',
        keywords: res.keywords || ['makaut', 'notes', 'study material', 'pyq']
      });
    });

    (subjects || []).forEach((sub) => {
      (sub.materials || []).forEach((mat) => {
        const matId = mat.originalResourceId || mat.id;
        if (!matId || seen.has(matId)) return;
        seen.add(matId);
        list.push({
          id: matId,
          title: mat.title,
          url: mat.url,
          type: mat.type || 'pdf',
          category: mat.sectionName || 'Subject Material',
          description: `Academic resource from ${sub.title}`,
          author: sub.title,
          subjectTitle: sub.title,
          keywords: mat.keywords || ['makaut', sub.title.toLowerCase(), mat.sectionName?.toLowerCase() || 'notes']
        });
      });
    });

    return list;
  }, [standaloneResources, subjects]);

  // Check which resources are in folders
  const isResourceInFolders = useMemo(() => {
    const map = {};
    const scan = (node) => {
      (node.items || []).forEach((item) => {
        if (item.id) map[item.id] = true;
        if (item.url) map[item.url] = true;
      });
      (node.subfolders || []).forEach(scan);
    };
    (userFolders || []).forEach(scan);
    return map;
  }, [userFolders]);

  const query = (localSearch || '').trim().toLowerCase();

  const filteredResources = useMemo(() => {
    return allDocResources.filter((res) => {
      if (activeTab === 'saved') {
        const isInFolder = !!isResourceInFolders[res.id] || !!isResourceInFolders[res.url];
        const isDBSaved = savedResourceIds?.includes(res.id);
        if (!isInFolder && !isDBSaved) return false;
      }

      if (!query) return true;
      const kw = res.keywords;
      const kwMatch = Array.isArray(kw)
        ? kw.some((k) => String(k).toLowerCase().includes(query))
        : String(kw || '').toLowerCase().includes(query);

      return (
        res.title.toLowerCase().includes(query) ||
        (res.category && res.category.toLowerCase().includes(query)) ||
        (res.author && res.author.toLowerCase().includes(query)) ||
        (res.subjectTitle && res.subjectTitle.toLowerCase().includes(query)) ||
        (res.description && res.description.toLowerCase().includes(query)) ||
        kwMatch
      );
    });
  }, [allDocResources, activeTab, savedResourceIds, isResourceInFolders, query]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResources.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResources, currentPage]);

  const handleOpenAddToFolder = (res) => {
    setResourceToAddToFolder(res);
    setTargetFolderId('academic');
    setTargetSubfolderId('');
  };

  const handleSaveToFolder = (e) => {
    e.preventDefault();
    if (!resourceToAddToFolder) return;

    let currentFolders = [];
    try {
      const raw = localStorage.getItem(`learnopia_explorer_folders_v2_${userId}`);
      if (raw) currentFolders = JSON.parse(raw);
    } catch {}

    if (!currentFolders || currentFolders.length === 0) {
      currentFolders = [
        { id: 'academic', title: 'Academic', subfolders: [{ id: 'sem-1', title: 'Semester 1', items: [] }], items: [] },
        { id: 'source', title: 'Source', subfolders: [], items: [] },
        { id: 'links', title: 'Important Links', subfolders: [], items: [] },
        { id: 'personal', title: 'Personal', subfolders: [], items: [] }
      ];
    }

    const newItem = {
      id: `item-${Date.now()}`,
      title: resourceToAddToFolder.title,
      url: resourceToAddToFolder.url || '#',
      type: 'document',
      author: resourceToAddToFolder.author || 'University Vault',
      count: resourceToAddToFolder.type ? resourceToAddToFolder.type.toUpperCase() : 'PDF Document',
      date: 'Added from Vault'
    };

    const updated = currentFolders.map((root) => {
      if (root.id !== targetFolderId) return root;

      if (targetSubfolderId && root.subfolders?.length > 0) {
        return {
          ...root,
          subfolders: root.subfolders.map((sf) => {
            if (sf.id === targetSubfolderId) {
              return {
                ...sf,
                items: [newItem, ...(sf.items || [])]
              };
            }
            return sf;
          })
        };
      }

      return {
        ...root,
        items: [newItem, ...(root.items || [])]
      };
    });

    try {
      localStorage.setItem(`learnopia_explorer_folders_v2_${userId}`, JSON.stringify(updated));
      setUserFolders(updated);
    } catch {}

    // Also mark saved in DB if not already
    if (toggleSaveResource && !savedResourceIds?.includes(resourceToAddToFolder.id)) {
      toggleSaveResource(resourceToAddToFolder.id);
    }

    const folderName =
      targetFolderId === 'academic'
        ? `Academic (${targetSubfolderId.toUpperCase()})`
        : targetFolderId === 'source'
        ? 'Source'
        : targetFolderId === 'links'
        ? 'Important Links'
        : 'Personal';

    setToastNotice(`Saved "${resourceToAddToFolder.title}" to ${folderName}!`);
    setTimeout(() => setToastNotice(null), 3000);
    setResourceToAddToFolder(null);
  };

  const TABS = [
    { id: 'all', label: `All Vault (${allDocResources.length})` },
    { id: 'saved', label: `Saved in Folders (${savedResourceIds?.length || 0})` }
  ];

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 space-y-6">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark shadow-modal animate-bounce-short">
          {toastNotice}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight font-editorial">
            Academic Vault & Study Materials
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Curated PDFs, syllabus guides, semester organizers, and past year question papers.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-ink text-text-on-dark border-accent-ink'
                    : 'bg-surface text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Filter documents by title, subject, or author..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value);
            if (setGlobalSearchQuery) setGlobalSearchQuery(e.target.value);
          }}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border-strong text-xs sm:text-sm bg-surface focus:outline-none"
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-text-muted font-mono-tabular">
        <span>SHOWING {filteredResources.length} DOCUMENTS</span>
        <span>INDEXED IN ACADEMIC REPOSITORY</span>
      </div>

      {/* Document Table / Card Grid */}
      {paginatedResources.length > 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden shadow-sm divide-y divide-border-subtle">
          {paginatedResources.map((res) => {
            const isInFolder = !!isResourceInFolders[res.id] || !!isResourceInFolders[res.url] || savedResourceIds?.includes(res.id);

            return (
              <div
                key={res.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg border border-border-strong bg-subtle flex items-center justify-center shrink-0 font-mono-tabular font-bold text-xs text-text-primary">
                    {res.type ? res.type.toUpperCase() : 'PDF'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {res.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1 font-mono-tabular">
                      <span>{res.subjectTitle}</span>
                      <span>•</span>
                      <span>{res.category}</span>
                      <span>•</span>
                      <span>{res.author}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Add to Folder, Copy Link, Open */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleOpenAddToFolder(res)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs ${
                      isInFolder
                        ? 'border-accent-forest/30 bg-accent-forest/10 text-accent-forest font-bold'
                        : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-primary'
                    }`}
                    title="Add to Workspace Folder"
                  >
                    {isInFolder ? <Check size={13} className="text-accent-forest" /> : <FolderPlus size={13} />}
                    <span>{isInFolder ? 'Saved' : 'Add to Folder'}</span>
                  </button>

                  <button
                    onClick={(e) => handleCopyLink(res, e)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                    title="Copy Document Direct Link"
                  >
                    {copiedId === res.id ? (
                      <>
                        <Check size={14} className="text-accent-forest" />
                        <span className="text-[10px] font-mono-tabular text-accent-forest font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="text-text-muted" />
                        <span className="text-[10px] font-mono-tabular text-text-muted hidden sm:inline">Link</span>
                      </>
                    )}
                  </button>

                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 hover:opacity-95 shadow-xs"
                    >
                      <Download size={13} />
                      <span>Open</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-xl border border-border-subtle bg-surface text-center space-y-3">
          <FileText size={36} className="text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No academic documents match your filter</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try clearing the search query or browse through all subject materials.
          </p>
          <button
            onClick={() => {
              setLocalSearch('');
              if (setGlobalSearchQuery) setGlobalSearchQuery('');
              setActiveTab('all');
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle text-xs">
          <span className="font-mono-tabular text-text-muted">
            PAGE {currentPage} OF {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="p-2 rounded-lg border border-border-subtle bg-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover font-semibold"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="p-2 rounded-lg border border-border-subtle bg-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-hover font-semibold"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          TOP-POSITIONED ADD DOCUMENT TO STUDY FOLDER MODAL
          Positioned near top of viewport with backdrop blur!
      ================================================================= */}
      {resourceToAddToFolder && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-16 md:pt-20 overflow-y-auto animate-fade-in"
          onClick={() => setResourceToAddToFolder(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 space-y-4 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-text-primary" />
                <h3 className="text-base font-bold text-text-primary">Add Document to Folder</h3>
              </div>
              <button
                onClick={() => setResourceToAddToFolder(null)}
                className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl border border-border-subtle bg-subtle space-y-1">
              <span className="text-[10px] font-mono-tabular font-bold text-accent-forest uppercase">
                {resourceToAddToFolder.category}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-1">
                {resourceToAddToFolder.title}
              </h4>
              <p className="text-[11px] text-text-muted font-mono-tabular truncate">
                {resourceToAddToFolder.author} • {resourceToAddToFolder.type?.toUpperCase() || 'PDF'}
              </p>
            </div>

            <form onSubmit={handleSaveToFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Select Workspace Folder
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'academic', title: 'Academic', icon: <GraduationCap size={15} /> },
                    { id: 'document', title: 'Document', icon: <FileText size={15} /> },
                    { id: 'links', title: 'Important Links', icon: <Link2 size={15} /> },
                    { id: 'personal', title: 'Personal', icon: <Lock size={15} /> }
                  ].map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => handleSelectFolder(f.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        targetFolderId === f.id
                          ? 'border-border-strong bg-accent-ink text-text-on-dark shadow-xs'
                          : 'border-border-subtle bg-surface hover:bg-surface-hover text-text-primary'
                      }`}
                    >
                      {f.icon}
                      <span>{f.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Subfolder Picker */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Folder Location / Subfolder (Optional)
                </label>
                {(() => {
                  const activeRoot = userFolders.find(f => f.id === targetFolderId);
                  const availableSubfolders = activeRoot?.subfolders || [];
                  if (availableSubfolders.length > 0) {
                    return (
                      <select
                        value={targetSubfolderId}
                        onChange={(e) => setTargetSubfolderId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border-strong text-xs bg-canvas text-text-primary focus:outline-none"
                      >
                        <option value="">-- Direct to {activeRoot?.title || 'Root'} (Root) --</option>
                        {availableSubfolders.map((sf) => (
                          <option key={sf.id} value={sf.id}>
                            {sf.title}
                          </option>
                        ))}
                      </select>
                    );
                  }
                  return (
                    <div className="text-[11px] text-text-muted bg-surface-sunken p-2.5 rounded-lg border border-border-subtle flex items-center justify-between">
                      <span>Directly saves inside <strong>{activeRoot?.title || 'Root'}</strong></span>
                      <span className="text-[10px] text-text-tertiary font-mono-tabular">No subfolders</span>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setResourceToAddToFolder(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <FolderPlus size={13} />
                  <span>Save to Folder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
