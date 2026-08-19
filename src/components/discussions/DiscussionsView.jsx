import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase, getUserDesignation } from '../../context/DatabaseContext';
import {
  MessageSquare,
  Plus,
  Lock,
  Globe,
  Search,
  Hash,
  Copy,
  Check,
  Send,
  User,
  CornerDownRight,
  Shield,
  Key,
  Folder,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ChevronLeft,
  X,
  LogOut,
  Info,
  TrendingUp,
  Clock
} from 'lucide-react';

const DEFAULT_THREADS = [
  {
    id: 'thread-1',
    code: 'DS-9182',
    name: 'data-structures-doubts',
    title: 'Data Structures & Algorithms Doubts & Solutions',
    isPrivate: false,
    author: 'Owner. Deepak Shaw',
    authorRole: 'owner',
    createdAt: '2026-08-10',
    messages: [
      {
        id: 'm-1',
        sender: 'Owner. Deepak Shaw',
        role: 'owner',
        text: 'Welcome to the #data-structures-doubts thread! Ask any queries regarding Binary Search Trees, Graph Traversals, and Dynamic Programming algorithms here.',
        time: '10:30 AM'
      },
      {
        id: 'm-2',
        sender: 'St. Rahul Verma',
        role: 'learner',
        text: 'Could someone clarify the time complexity of QuickSort in the worst-case scenario?',
        time: '02:15 PM'
      },
      {
        id: 'm-3',
        sender: 'Owner. Deepak Shaw',
        role: 'owner',
        text: 'In the worst case (when the pivot choice produces unbalanced partitions), QuickSort is O(n²). Average case remains O(n log n).',
        time: '03:00 PM',
        quotedMessage: {
          sender: 'St. Rahul Verma',
          text: 'Could someone clarify the time complexity of QuickSort in the worst-case scenario?'
        }
      }
    ]
  },
  {
    id: 'thread-2',
    code: 'PYQ-4410',
    name: 'pyq-solutions',
    title: 'MAKAUT Previous Year Paper Solutions',
    isPrivate: false,
    author: 'Prof. Sarah Miller',
    authorRole: 'creator',
    createdAt: '2026-08-12',
    messages: [
      {
        id: 'm-4',
        sender: 'Prof. Sarah Miller',
        role: 'creator',
        text: 'Shared solution notes for Physics-I and C Programming 2024 papers. Feel free to discuss any doubts in this thread!',
        time: '11:00 AM'
      }
    ]
  }
];

export default function DiscussionsView({ setCurrentView }) {
  const { currentUser, saveDiscussionThreadsToDb, getDiscussionThreadsFromDb } = useDatabase();
  const [isLoaded, setIsLoaded] = useState(false);

  const [threads, setThreads] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_discord_threads');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_THREADS;
  });

  const userId = currentUser?.id || 'guest';
  const joinedKey = `learnopia_joined_threads_${userId}`;

  // Joined thread IDs state
  const [joinedThreadIds, setJoinedThreadIds] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(joinedKey);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return ['thread-1'];
  });

  // View modes: 'my_threads' (default) | 'search' | 'join_code' | 'create' | 'chat'
  const [viewMode, setViewMode] = useState('my_threads');
  const [previousViewMode, setPreviousViewMode] = useState('my_threads');
  const [activeThreadId, setActiveThreadId] = useState('thread-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync Joined Threads to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(joinedKey, JSON.stringify(joinedThreadIds));
    }
  }, [joinedThreadIds, joinedKey]);

  // Join Code Form State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [joinError, setJoinError] = useState('');

  // Create Thread Form State
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [isThreadPrivate, setIsThreadPrivate] = useState(false);
  const [showVerificationAlertModal, setShowVerificationAlertModal] = useState(false);

  // Thread Info Modal State
  const [showThreadDetailsModal, setShowThreadDetailsModal] = useState(false);

  // Chat message & reply state
  const [messageText, setMessageText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const activeDesignation = getUserDesignation(currentUser);

  // Fetch Remote Discussion Threads from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteThreads = async () => {
      try {
        if (getDiscussionThreadsFromDb) {
          const dbThreads = await getDiscussionThreadsFromDb();
          if (dbThreads && Array.isArray(dbThreads) && isMounted) {
            setThreads(dbThreads);
          }
        }
      } catch (e) {
        console.warn('[Discussions Sync Error]', e);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };
    fetchRemoteThreads();
    return () => { isMounted = false; };
  }, []);

  // Sync to LocalStorage & Supabase
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      localStorage.setItem('learnopia_discord_threads', JSON.stringify(threads));
      if (saveDiscussionThreadsToDb) {
        saveDiscussionThreadsToDb(threads);
      }
    }
  }, [threads, isLoaded]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  // User's Joined Threads list
  const joinedThreads = useMemo(() => {
    return threads.filter(t => joinedThreadIds.includes(t.id));
  }, [threads, joinedThreadIds]);

  // Top 10 Most Active Public Threads (sorted by message count)
  const top10PublicThreads = useMemo(() => {
    const publicOnly = threads.filter(t => !t.isPrivate);
    return [...publicOnly]
      .sort((a, b) => (b.messages?.length || 0) - (a.messages?.length || 0))
      .slice(0, 10);
  }, [threads]);

  // Searched Public Threads
  const searchedPublicThreads = useMemo(() => {
    if (!searchQuery.trim()) return top10PublicThreads;
    const q = searchQuery.toLowerCase().trim();
    return threads.filter(t => 
      !t.isPrivate && 
      (t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
    );
  }, [threads, top10PublicThreads, searchQuery]);

  const openThreadChat = (threadId) => {
    setPreviousViewMode(viewMode);
    setActiveThreadId(threadId);
    setViewMode('chat');
  };

  const handleJoinThreadById = (threadId) => {
    if (!joinedThreadIds.includes(threadId)) {
      setJoinedThreadIds(prev => [...prev, threadId]);
    }
  };

  const handleLeaveThread = (threadId) => {
    setJoinedThreadIds(prev => prev.filter(id => id !== threadId));
    setShowThreadDetailsModal(false);
    setViewMode('my_threads');
  };

  const handleJoinByCodeSubmit = (e) => {
    e.preventDefault();
    setJoinMsg('');
    setJoinError('');

    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a thread code.');
      return;
    }

    const targetCode = joinCodeInput.trim().toUpperCase();
    const found = threads.find(t => t.code.toUpperCase() === targetCode);

    if (!found) {
      setJoinError('Invalid thread access code. Please check the code and try again.');
      return;
    }

    if (!joinedThreadIds.includes(found.id)) {
      setJoinedThreadIds(prev => [...prev, found.id]);
    }
    setJoinCodeInput('');
    setViewMode('my_threads');
  };

  const handleCreateThreadSubmit = (e) => {
    e.preventDefault();
    if (!newThreadName.trim() || !newThreadTitle.trim()) return;

    const formattedName = newThreadName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const randomCode = 'TH-' + Math.floor(1000 + Math.random() * 9000);

    const newThread = {
      id: 'thread-' + Date.now(),
      code: randomCode,
      name: formattedName,
      title: newThreadTitle.trim(),
      isPrivate: isThreadPrivate,
      author: activeDesignation,
      authorRole: currentUser?.role || 'learner',
      createdAt: new Date().toISOString().split('T')[0],
      messages: [
        {
          id: 'm-init-' + Date.now(),
          sender: activeDesignation,
          role: currentUser?.role || 'learner',
          text: `Thread #${formattedName} created by ${activeDesignation}. Welcome!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setThreads(prev => [newThread, ...prev]);
    setJoinedThreadIds(prev => [...prev, newThread.id]);
    setNewThreadName('');
    setNewThreadTitle('');
    setIsThreadPrivate(false);
    setViewMode('my_threads');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeThread) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: activeDesignation,
      role: currentUser?.role || 'learner',
      isVerified: !!currentUser?.isVerified,
      verificationType: currentUser?.verificationType || (currentUser?.role === 'creator' ? 'creator' : 'student'),
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quotedMessage: replyingToMessage ? { sender: replyingToMessage.sender, text: replyingToMessage.text } : null
    };

    // Auto-join thread on sending message
    handleJoinThreadById(activeThread.id);

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return { ...t, messages: [...(t.messages || []), newMsg] };
      }
      return t;
    }));

    setMessageText('');
    setReplyingToMessage(null);
  };

  const handleOpenCreateMode = () => {
    const canCreate = currentUser?.isVerified || currentUser?.role === 'creator' || currentUser?.role === 'admin' || currentUser?.role === 'owner';
    if (!canCreate) {
      setShowVerificationAlertModal(true);
      return;
    }
    setViewMode('create');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px 10px 100px 10px' : '20px 20px 60px 20px', width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">

      {/* ── MODE 1: MY JOINED THREADS (DEFAULT DASHBOARD VIEW) ── */}
      {viewMode === 'my_threads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', margin: 0, color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={22} color="var(--primary)" /> My Joined Threads
                </h2>
                <span style={{ fontSize: isMobile ? '0.75rem' : '0.83rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                  Threads & discussions you participate in ({joinedThreads.length})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('search')}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <Search size={14} /> Search Threads
                </button>
              </div>
            </div>

            {joinedThreads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <MessageSquare size={36} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '10px' }} />
                <h4 style={{ fontSize: '1rem', color: '#ffffff', margin: '0 0 6px 0' }}>No Joined Threads Yet</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 16px auto' }}>
                  Tap the floating <strong>+</strong> button in the bottom right corner to search public threads or enter a 6-digit thread code!
                </p>
                <button onClick={() => setViewMode('search')} className="btn btn-primary" style={{ fontSize: '0.85rem', gap: '6px' }}>
                  <Search size={16} /> Explore Public Threads
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {joinedThreads.map((t) => {
                  const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
                  return (
                    <div
                      key={t.id}
                      onClick={() => openThreadChat(t.id)}
                      style={{
                        padding: isMobile ? '12px 14px' : '16px',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      className="glass-panel"
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                            #{t.name}
                          </span>
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontWeight: 600 }}>
                            Joined
                          </span>
                        </div>
                        <p style={{ fontSize: isMobile ? '0.78rem' : '0.84rem', color: '#ffffff', margin: '2px 0 8px 0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {t.title}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '4px', fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {lastMsg ? `${lastMsg.sender.split('.')[0]}: ${lastMsg.text}` : 'No messages yet'}
                        </span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Open Chat →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODE 2: SEARCH PUBLIC THREADS ── */}
      {viewMode === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setViewMode('my_threads')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
              >
                <ArrowLeft size={14} /> Back to My Threads
              </button>
              <h3 style={{ fontSize: isMobile ? '1rem' : '1.15rem', margin: 0, color: '#ffffff', fontWeight: 700 }}>
                Explore Public Threads
              </h3>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Type to search public threads by hashtag or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '42px', fontSize: isMobile ? '0.85rem' : '0.92rem' }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {searchQuery.trim() ? `Search Results (${searchedPublicThreads.length})` : `Top 10 Most Active Public Threads`}
            </div>

            {searchedPublicThreads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No public threads match "{searchQuery}".
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {searchedPublicThreads.map((t) => {
                  const isJoined = joinedThreadIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: isMobile ? '12px 14px' : '16px',
                        borderRadius: '14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.92rem' }}>
                            #{t.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            💬 {t.messages?.length || 0} msgs
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#ffffff', margin: 0, fontWeight: 600 }}>
                          {t.title}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          onClick={() => openThreadChat(t.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: '0.78rem' }}
                        >
                          View Thread
                        </button>
                        {!isJoined ? (
                          <button
                            onClick={() => { handleJoinThreadById(t.id); openThreadChat(t.id); }}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.78rem' }}
                          >
                            + Join Thread
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#10b981', alignSelf: 'center', fontWeight: 600 }}>✔ Joined</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODE 3: JOIN VIA ACCESS CODE ── */}
      {viewMode === 'join_code' && (
        <div style={{ maxWidth: '440px', margin: '20px auto', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: isMobile ? '20px' : '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={20} color="#f59e0b" /> Join Thread via Code
              </h3>
              <button
                type="button"
                onClick={() => setViewMode('my_threads')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Paste the 6-character thread code (e.g. <strong>DS-9182</strong> or <strong>PYQ-4410</strong>) to unlock and join the discussion thread.
            </p>

            <form onSubmit={handleJoinByCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DS-9182"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                required
                style={{ fontSize: '0.95rem', padding: '12px' }}
                autoFocus
              />

              {joinMsg && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{joinMsg}</span>}
              {joinError && <span style={{ fontSize: '0.8rem', color: 'var(--error)' }}>{joinError}</span>}

              <div style={{ display: 'flex', gap: '10px', marginTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setViewMode('my_threads')} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Join Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODE 4: CREATE THREAD FORM ── */}
      {viewMode === 'create' && (
        <div style={{ maxWidth: '520px', margin: '10px auto', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: isMobile ? '20px' : '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Hash size={20} color="var(--primary)" /> Create Discussion Thread
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logged in as <strong>{activeDesignation}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('my_threads')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateThreadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Hashtag Handle (e.g. pyq-solutions)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. data-structures-doubts"
                  value={newThreadName}
                  onChange={(e) => setNewThreadName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Thread Title & Topic Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MAKAUT 2025 Paper Solutions & Queries"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  required
                />
              </div>

              <label className="checkbox-toggle-label" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={isThreadPrivate}
                  onChange={(e) => setIsThreadPrivate(e.target.checked)}
                />
                <span>Private Thread (Generates 6-Digit Access Code)</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setViewMode('my_threads')} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Publish Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODE 5: THREAD CHAT PLAYER VIEW ── */}
      {viewMode === 'chat' && activeThread && (
        <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100vh - 180px)' : '650px', textAlign: 'left', overflow: 'hidden' }}>
          {/* Chat Header Bar */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(12,13,22,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <button
                type="button"
                onClick={() => setViewMode(previousViewMode || 'my_threads')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px', fontSize: '0.78rem', gap: 4 }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  #{activeThread.name}
                  {activeThread.isPrivate && <Lock size={14} color="#f59e0b" />}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeThread.title}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowThreadDetailsModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: 4 }}
            >
              <Info size={14} /> Details
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeThread.messages?.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.sender.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>{msg.sender}</span>
                    {msg.isVerified && (
                      <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>✔ Verified</span>
                    )}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                    <button
                      onClick={() => setReplyingToMessage(msg)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                    >
                      Reply
                    </button>
                  </div>

                  {msg.quotedMessage && (
                    <div style={{ margin: '4px 0 6px 0', padding: '4px 10px', background: 'rgba(139,92,246,0.08)', borderLeft: '3px solid var(--primary)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.7rem' }}>Replying to {msg.quotedMessage.sender}</strong>
                      <p style={{ margin: 0, fontStyle: 'italic' }}>"{msg.quotedMessage.text}"</p>
                    </div>
                  )}

                  <p style={{ fontSize: '0.88rem', color: '#ffffff', lineHeight: 1.5, margin: 0, wordBreak: 'break-word' }}>
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Bar */}
          {replyingToMessage && (
            <div style={{ padding: '6px 14px', background: 'rgba(139,92,246,0.12)', borderTop: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#ffffff' }}>
              <span>Replying to <strong>{replyingToMessage.sender}</strong></span>
              <button onClick={() => setReplyingToMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
            </div>
          )}

          {/* Send Input Bar */}
          <form onSubmit={handleSendMessage} style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder={`Message #${activeThread.name}...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', fontSize: '0.88rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', gap: '4px' }}>
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      )}

      {/* ── FLOATING ACTION BUTTON (FAB) & EXPANDABLE MENU ── */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '90px' : '30px',
        right: isMobile ? '16px' : '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}>
        {/* Expanded Stack of 3 Actions */}
        {fabOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', marginBottom: '6px' }} className="animate-fade-in">
            {/* Option 1: Search Public Threads */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(12, 13, 22, 0.92)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                Search Public Threads
              </span>
              <button
                type="button"
                onClick={() => { setViewMode('search'); setFabOpen(false); }}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none', color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(99,102,241,0.5)'
                }}
              >
                <Search size={18} />
              </button>
            </div>

            {/* Option 2: Join via Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(12, 13, 22, 0.92)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                Join via Thread Code
              </span>
              <button
                type="button"
                onClick={() => { setViewMode('join_code'); setFabOpen(false); }}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none', color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(245,158,11,0.5)'
                }}
              >
                <Key size={18} />
              </button>
            </div>

            {/* Option 3: Create Thread */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(12, 13, 22, 0.92)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                Create New Thread
              </span>
              <button
                type="button"
                onClick={() => { handleOpenCreateMode(); setFabOpen(false); }}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none', color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(16,185,129,0.5)'
                }}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Trigger Button (+ / ×) */}
        <button
          type="button"
          onClick={() => setFabOpen(prev => !prev)}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: fabOpen ? '#ef4444' : 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(139, 92, 246, 0.6), 0 0 20px rgba(168, 85, 247, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {fabOpen ? <X size={24} color="#ffffff" /> : <Plus size={24} color="#ffffff" />}
        </button>
      </div>

      {/* THREAD DETAILS & EXIT MODAL */}
      {showThreadDetailsModal && activeThread && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '420px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={18} color="var(--primary)" /> Thread Info
              </h3>
              <button onClick={() => setShowThreadDetailsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>HASHTAG</strong>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>#{activeThread.name}</span>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>TOPIC</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{activeThread.title}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>ACCESS CODE</strong>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{activeThread.code}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>CREATOR</strong>
                  <span style={{ color: '#ffffff' }}>{activeThread.author}</span>
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => handleLeaveThread(activeThread.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', gap: 4 }}
                >
                  <LogOut size={14} /> Leave Thread
                </button>
                <button onClick={() => setShowThreadDetailsModal(false)} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATION ALERT MODAL */}
      {showVerificationAlertModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '420px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Shield size={22} color="var(--warning)" />
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>Verification Required</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Only <strong>Verified Students</strong>, <strong>Professors</strong>, or <strong>Creators</strong> can publish public discussion threads.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowVerificationAlertModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setShowVerificationAlertModal(false); setCurrentView('profile'); }}>
                Go to Profile Verification
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
