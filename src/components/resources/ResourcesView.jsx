import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Search,
  FileText,
  Download,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Video,
  Play,
  FolderKanban,
  Sparkles,
  ExternalLink,
  Clock,
  User,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function ResourcesView({ setCurrentView, setSelectedPlaylistId, isSidebarCollapsed = false }) {
  const {
    currentUser,
    standaloneResources,
    subjects,
    courses,
    globalSearchQuery,
    setGlobalSearchQuery,
    savedResourceIds,
    toggleSaveResource,
    isResourceSaved,
    deleteStandaloneResource
  } = useDatabase();

  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'documents' | 'videos' | 'saved'
  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setLocalSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  useEffect(() => {
    setPage(1);
  }, [localSearch, activeTab]);

  const handleCopy = (id, e) => {
    if (e) e.preventDefault();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        subjectTitle: (res.subjects && res.subjects[0]) || 'General Vault'
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
          subjectTitle: sub.title
        });
      });
    });

    return list;
  }, [standaloneResources, subjects]);

  const query = (localSearch || '').trim().toLowerCase();

  const filteredResources = useMemo(() => {
    return allDocResources.filter((res) => {
      if (activeTab === 'saved') {
        if (!savedResourceIds?.includes(res.id)) return false;
      }

      if (!query) return true;
      return (
        res.title.toLowerCase().includes(query) ||
        (res.category && res.category.toLowerCase().includes(query)) ||
        (res.author && res.author.toLowerCase().includes(query)) ||
        (res.subjectTitle && res.subjectTitle.toLowerCase().includes(query))
      );
    });
  }, [allDocResources, activeTab, savedResourceIds, query]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResources.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResources, currentPage]);

  const TABS = [
    { id: 'all', label: `All Vault (${allDocResources.length})` },
    { id: 'saved', label: `Saved Bookmarks (${savedResourceIds?.length || 0})` }
  ];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 sm:pt-6 pb-12 space-y-6">
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
            const isSaved = savedResourceIds?.includes(res.id);
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

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => toggleSaveResource && toggleSaveResource(res.id)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold cursor-pointer transition-colors"
                    title={isSaved ? 'Remove Bookmark' : 'Bookmark Document'}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={15} className="text-accent-forest" />
                    ) : (
                      <Bookmark size={15} className="text-text-muted" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleCopy(res.id, e)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface hover:bg-surface-hover text-xs font-semibold cursor-pointer transition-colors"
                    title="Copy Document ID"
                  >
                    {copiedId === res.id ? (
                      <Check size={15} className="text-accent-forest" />
                    ) : (
                      <Copy size={15} className="text-text-muted" />
                    )}
                  </button>

                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark flex items-center gap-1.5 hover:opacity-95"
                    >
                      <Download size={13} />
                      <span>Open Document</span>
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
    </div>
  );
}
