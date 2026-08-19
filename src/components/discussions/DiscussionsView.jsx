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
  MoreHorizontal,
  X,
  LogOut,
  Info
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

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '20px',
    minHeight: '650px'
  },
  sidebarCol: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },
  chatCol: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column'
  }
};

export default function DiscussionsView({ setCurrentView }) {
  const { currentUser, saveDiscussionThreadsToDb, getDiscussionThreadsFromDb } = useDatabase();
  const [isLoaded, setIsLoaded] = useState(false);

  const [threads, setThreads] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_discord_threads');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
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

  const [activeThreadId, setActiveThreadId] = useState('thread-1');
  const [threadSearch, setThreadSearch] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [viewMode, setViewMode] = useState('my_threads'); // 'my_threads' | 'search_public'
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

  // Join Private Thread Code State & Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [joinError, setJoinError] = useState('');

  // Create Thread State & Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerificationAlertModal, setShowVerificationAlertModal] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [isThreadPrivate, setIsThreadPrivate] = useState(false);

  // Thread Details & Exit Modal State
  const [showThreadDetailsModal, setShowThreadDetailsModal] = useState(false);

  // Message & Reply State
  const [messageText, setMessageText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

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

  // Categorize Threads into Public & My Threads
  const publicThreads = useMemo(() => {
    return threads.filter(t => !t.isPrivate);
  }, [threads]);

  const myThreads = useMemo(() => {
    return threads.filter(t => 
      joinedThreadIds.includes(t.id) || 
      t.author === activeDesignation || 
      t.messages?.some(m => m.sender === activeDesignation)
    );
  }, [threads, joinedThreadIds, activeDesignation]);

  const handleOpenCreateModal = () => {
    const canCreate = currentUser?.isVerified || currentUser?.role === 'creator' || currentUser?.role === 'admin' || currentUser?.role === 'owner';
    if (!canCreate) {
      setShowVerificationAlertModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleJoinThreadByCode = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setJoinMsg('');
    setJoinError('');

    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a thread code.');
      return;
    }

    const codeToMatch = joinCodeInput.trim().toUpperCase();
    const found = threads.find(t => t.code.toUpperCase() === codeToMatch);

    if (found) {
      if (!joinedThreadIds.includes(found.id)) {
        setJoinedThreadIds(prev => [...prev, found.id]);
      }
      setActiveThreadId(found.id);
      setJoinMsg(`Joined thread #${found.name} successfully!`);
      setJoinCodeInput('');
      setTimeout(() => {
        setJoinMsg('');
        setShowJoinModal(false);
        if (isMobile) setMobileView('chat');
        setViewMode('my_threads');
      }, 1200);
    } else {
      setJoinError('No thread found matching code ' + codeToMatch);
    }
  };

  const handleCreateThread = (e) => {
    e.preventDefault();
    if (!newThreadName.trim() || !newThreadTitle.trim()) return;

    const formattedName = newThreadName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const randomCode = `THREAD-${Math.floor(1000 + Math.random() * 9000)}`;

    const cleanSender = currentUser?.name || currentUser?.username || 'User';
    const isUserVerified = !!(currentUser?.isVerified || currentUser?.verificationStatus === 'verified');
    const userVerifType = currentUser?.verificationType || 'student';

    const newThread = {
      id: `thread-${Date.now()}`,
      code: randomCode,
      name: formattedName,
      title: newThreadTitle,
      isPrivate: isThreadPrivate,
      author: cleanSender,
      authorRole: currentUser?.role || 'learner',
      isVerified: isUserVerified,
      verificationType: userVerifType,
      createdAt: new Date().toISOString().split('T')[0],
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: cleanSender,
          role: currentUser?.role || 'learner',
          isVerified: isUserVerified,
          verificationType: userVerifType,
          text: `Thread #${formattedName} initialized by ${cleanSender}. Welcome!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setThreads([newThread, ...threads]);
    setJoinedThreadIds(prev => [...prev, newThread.id]);
    setActiveThreadId(newThread.id);
    setShowCreateModal(false);
    setNewThreadName('');
    setNewThreadTitle('');
    setIsThreadPrivate(false);
    if (isMobile) setMobileView('chat');
    setViewMode('my_threads');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeThread) return;

    // Auto-join thread on sending a message
    if (!joinedThreadIds.includes(activeThread.id)) {
      setJoinedThreadIds(prev => [...prev, activeThread.id]);
    }

    const cleanSender = currentUser?.name || currentUser?.username || 'User';
    const isUserVerified = !!(currentUser?.isVerified || currentUser?.verificationStatus === 'verified');
    const userVerifType = currentUser?.verificationType || 'student';

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: cleanSender,
      role: currentUser?.role || 'learner',
      isVerified: isUserVerified,
      verificationType: userVerifType,
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quotedMessage: replyingToMessage ? { sender: replyingToMessage.sender, text: replyingToMessage.text } : null
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );

    setMessageText('');
    setReplyingToMessage(null);
  };

  const handleExitThread = (threadId) => {
    setJoinedThreadIds(prev => prev.filter(id => id !== threadId));
    setShowThreadDetailsModal(false);
    if (isMobile) setMobileView('list');
    setViewMode('my_threads');
  };

  const handleCopyCode = (code) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Handle thread selection
  const handleThreadSelect = (threadId) => {
    setActiveThreadId(threadId);
    if (isMobile) setMobileView('chat');
  };

  // Filter threads based on search
  const filteredPublicThreads = useMemo(() => 
    publicThreads.filter(t => t.name.toLowerCase().includes(threadSearch.toLowerCase()) || t.title.toLowerCase().includes(threadSearch.toLowerCase()))
  , [publicThreads, threadSearch]);

  const filteredMyThreads = useMemo(() => 
    myThreads.filter(t => t.name.toLowerCase().includes(threadSearch.toLowerCase()) || t.title.toLowerCase().includes(threadSearch.toLowerCase()))
  , [myThreads, threadSearch]);

  const renderThreadList = () => (
    <div className="glass-panel" style={styles.sidebarCol}>
      {/* Search Public Threads View */}
      {viewMode === 'search_public' ? (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={15} /> Search All Public Threads
            </span>
            <button
              onClick={() => setViewMode('my_threads')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
            >
              Back to My Threads
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Type to search public threads..."
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.82rem', padding: '6px 10px 6px 32px', width: '100%' }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredPublicThreads.length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>No public threads found matching "{threadSearch}".</span>
            ) : (
              filteredPublicThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const isJoined = joinedThreadIds.includes(thread.id);
                return (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <Hash size={15} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: '#ffffff' }}>#{thread.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{thread.title}</span>
                      </div>
                    </div>
                    {isJoined ? (
                      <span style={{ fontSize: '0.68rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Joined</span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: 'var(--primary)', background: 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Explore</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* My Threads View (WhatsApp Style Main List) */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} /> My Joined Threads ({myThreads.length})
            </span>
            <button
              onClick={() => setViewMode('search_public')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Search size={13} /> Search All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {myThreads.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>You haven't joined any discussion threads yet.</p>
                <button
                  onClick={() => setViewMode('search_public')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <Search size={13} /> Explore Public Threads
                </button>
              </div>
            ) : (
              myThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const lastMsg = thread.messages && thread.messages.length > 0 ? thread.messages[thread.messages.length - 1] : null;
                return (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '10px', background: thread.isPrivate ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {thread.isPrivate ? <Lock size={16} color="#f59e0b" /> : <Hash size={16} color="var(--primary)" />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{thread.name}</span>
                          {lastMsg && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>{lastMsg.time}</span>}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {lastMsg ? lastMsg.text : thread.title}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderChatView = () => (
    <div className="glass-panel" style={styles.chatCol}>
      {activeThread ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Active Thread Bar Header - Clickable for Thread Info & Exit */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            {isMobile && (
              <button
                onClick={() => setMobileView('list')}
                style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Back to threads list"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            
            <div
              onClick={() => setShowThreadDetailsModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, cursor: 'pointer' }}
              title="Click to view Thread Details & Exit options"
            >
              <Hash size={22} color="var(--primary)" />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{activeThread.name}</h3>
                  <Info size={14} color="var(--text-muted)" />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{activeThread.title}</span>
              </div>
            </div>

            <div
              onClick={() => handleCopyCode(activeThread.code)}
              style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#ffffff', flexShrink: 0 }}
              title="Click to copy private thread code"
            >
              <Key size={13} color="var(--primary)" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{activeThread.code}</span>
              {copiedCode ? <Check size={12} color="var(--success)" /> : <Copy size={12} color="var(--text-muted)" />}
            </div>
          </div>

          {/* Chat Messages Stream Area (Fixed Height, Internal Scrollbar) */}
          <div style={{ flex: 1, height: '480px', maxHeight: 'calc(100vh - 280px)', minHeight: '350px', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeThread.messages?.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <User size={18} color="#ffffff" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                        {msg.sender?.replace(/^(Owner\.|Admin\.|Creator\.|Prof\.|St\.)\s*/i, '')}
                      </strong>
                      {msg.isVerified && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          background: msg.verificationType === 'professor' ? 'rgba(99, 102, 241, 0.15)' : msg.verificationType === 'creator' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: msg.verificationType === 'professor' ? '#a5b4fc' : msg.verificationType === 'creator' ? '#fcd34d' : '#6ee7b7',
                          border: `1px solid ${msg.verificationType === 'professor' ? 'rgba(99, 102, 241, 0.3)' : msg.verificationType === 'creator' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700
                        }}>
                          <CheckCircle2 size={11} /> {msg.verificationType === 'professor' ? 'Verified Professor' : msg.verificationType === 'creator' ? 'Verified Creator' : 'Verified Student'}
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                    </div>

                    {/* Reply Button */}
                    <button
                      onClick={() => setReplyingToMessage(msg)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.72rem', gap: 4 }}
                    >
                      <CornerDownRight size={12} /> Reply
                    </button>
                  </div>

                  {/* Quoted Message Block if this message is a reply */}
                  {msg.quotedMessage && (
                    <div style={{ margin: '6px 0', padding: '6px 12px', background: 'rgba(139,92,246,0.08)', borderLeft: '3px solid var(--primary)', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.73rem' }}>Replying to {msg.quotedMessage.sender}</strong>
                      <p style={{ margin: 0, fontStyle: 'italic' }}>"{msg.quotedMessage.text}"</p>
                    </div>
                  )}

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Replying Preview Bar */}
          {replyingToMessage && (
            <div style={{ padding: '8px 16px', background: 'rgba(139,92,246,0.12)', borderTop: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ffffff' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Replying to <strong>{replyingToMessage.sender}</strong>: "{replyingToMessage.text.substring(0, 50)}…"</span>
              <button onClick={() => setReplyingToMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>×</button>
            </div>
          )}

          {/* Message Input Bar Pinned at Bottom */}
          <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={`Message #${activeThread.name}…`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="form-input"
              style={{ flex: 1, padding: '10px 14px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', gap: 6 }}>
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p>Select a discussion thread from the list.</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#ffffff' }}>Academic Discussion Streams</h2>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Logged in as <strong>{activeDesignation}</strong>
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ gap: '6px' }}>
          <Plus size={16} /> Create Thread
        </button>
      </div>

      {/* WORKSPACE CONTENT: Mobile or Desktop Layout */}
      {(() => {
        if (isMobile) {
          return (
            <div style={{ minHeight: '550px', display: 'flex', flexDirection: 'column' }}>
              {mobileView === 'list' ? (
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {renderThreadList()}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {renderChatView()}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div style={styles.workspaceGrid}>
              <div style={{ flexShrink: 0 }}>
                {renderThreadList()}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {renderChatView()}
              </div>
            </div>
          );
        }
      })()}

      {/* WHATSAPP-STYLE FLOATING ACTION BUTTON (FAB) WITH 3 EXPANDABLE CIRCLES */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? '86px' : '30px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Expanded Stack of 3 Circular Actions */}
        {fabOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', marginBottom: '4px' }} className="animate-fade-in">
            {/* Option 1: Search Public Threads */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(12, 13, 22, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                Search Threads
              </span>
              <button
                onClick={() => { setViewMode('search_public'); setFabOpen(false); if (isMobile) setMobileView('list'); }}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none', color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(99,102,241,0.5)'
                }}
                title="Search All Public Threads"
              >
                <Search size={20} />
              </button>
            </div>

            {/* Option 2: Join Private Thread by Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(12, 13, 22, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                Join Thread Code
              </span>
              <button
                onClick={() => { setShowJoinModal(true); setFabOpen(false); }}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none', color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(245,158,11,0.5)'
                }}
                title="Join Private Thread with Code"
              >
                <Key size={20} />
              </button>
            </div>

            {/* Option 3: Create Thread */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'rgba(12, 13, 22, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                Create Thread
              </span>
              <button
                onClick={() => { handleOpenCreateModal(); setFabOpen(false); }}
                style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none', color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(16,185,129,0.5)'
                }}
                title="Create a New Thread"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Trigger Button (+ / ×) */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          style={{
            width: '56px',
            height: '56px',
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
          title={fabOpen ? "Close menu" : "Add or Explore Threads"}
        >
          {fabOpen ? <X size={26} color="#ffffff" /> : <Plus size={26} color="#ffffff" />}
        </button>
      </div>

      {/* JOIN THREAD BY CODE MODAL */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '400px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={18} color="#f59e0b" /> Enter Thread Access Code
              </h3>
              <button onClick={() => setShowJoinModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Paste the 6-character thread code (e.g. <strong>DS-9182</strong> or <strong>PYQ-4410</strong>) to unlock and join the discussion.
            </p>

            <form onSubmit={handleJoinThreadByCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DS-9182"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                required
                style={{ fontSize: '0.9rem', padding: '10px' }}
                autoFocus
              />

              {joinMsg && <span style={{ fontSize: '0.78rem', color: '#10b981' }}>{joinMsg}</span>}
              {joinError && <span style={{ fontSize: '0.78rem', color: 'var(--error)' }}>{joinError}</span>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Join Thread</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THREAD DETAILS & EXIT MODAL */}
      {showThreadDetailsModal && activeThread && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '440px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Hash size={18} color="var(--primary)" /> Thread Information & Details
              </h3>
              <button onClick={() => setShowThreadDetailsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>THREAD HASHTAG</strong>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>#{activeThread.name}</span>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>TOPIC DESCRIPTION</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{activeThread.title}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ACCESS CODE</strong>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{activeThread.code}</span>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>CREATED BY</strong>
                  <span style={{ color: '#ffffff' }}>{activeThread.author}</span>
                </div>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => handleExitThread(activeThread.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', gap: 6 }}
                >
                  <LogOut size={14} /> Exit & Leave Thread
                </button>

                <button
                  onClick={() => setShowThreadDetailsModal(false)}
                  className="btn btn-primary btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE THREAD MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Hash size={18} color="var(--primary)" /> Create Discussion Thread
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
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
                <span>Private Thread (Requires 6-Digit Access Code)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Thread</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFICATION ALERT MODAL */}
      {showVerificationAlertModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '420px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Shield size={24} color="var(--warning)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff' }}>Account Verification Required</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Only <strong>Verified Students</strong>, <strong>Professors</strong>, or <strong>Creators</strong> can publish discussion threads.
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
