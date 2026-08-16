import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
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
  ArrowLeft,
  Flame,
  ThumbsUp,
  MessageCircle,
  Key,
  ChevronDown
} from 'lucide-react';

const DEFAULT_THREADS = [
  {
    id: 'thread-1',
    code: 'DS-9182',
    name: 'data-structures-doubts',
    title: 'Data Structures & Algorithms Doubts & Solutions',
    isPrivate: false,
    author: 'Prof. Deepak Shaw',
    authorRole: 'owner',
    createdAt: '2026-08-10',
    messages: [
      {
        id: 'm-1',
        sender: 'Prof. Deepak Shaw',
        role: 'owner',
        text: 'Welcome to the #data-structures-doubts thread! Ask any queries regarding Binary Search Trees, Graph Traversals, and Dynamic Programming algorithms here.',
        time: '10:30 AM',
        likes: 14
      },
      {
        id: 'm-2',
        sender: 'Rahul Verma',
        role: 'learner',
        text: 'Could someone clarify the time complexity of QuickSort in the worst-case scenario?',
        time: '02:15 PM',
        likes: 5
      },
      {
        id: 'm-3',
        sender: 'Prof. Deepak Shaw',
        role: 'owner',
        text: 'In the worst case (when the pivot choice produces unbalanced partitions), QuickSort is O(n²). Average case remains O(n log n).',
        time: '03:00 PM',
        likes: 18
      }
    ]
  },
  {
    id: 'thread-2',
    code: 'PYQ-4410',
    name: 'pyq-solutions',
    title: 'MAKAUT Previous Year Paper Solutions',
    isPrivate: false,
    author: 'Ananya Roy',
    authorRole: 'creator',
    createdAt: '2026-08-12',
    messages: [
      {
        id: 'm-4',
        sender: 'Ananya Roy',
        role: 'creator',
        text: 'Shared solution notes for Physics-I and C Programming 2024 papers. Feel free to discuss any doubts in this thread!',
        time: '11:00 AM',
        likes: 24
      },
      {
        id: 'm-5',
        sender: 'Saurav Das',
        role: 'learner',
        text: 'Thanks! Question 4b on Matrix Diagonalization was tricky. Got it cleared now.',
        time: '09:45 AM',
        likes: 8
      }
    ]
  },
  {
    id: 'thread-3',
    code: 'WEB-7721',
    name: 'code-review',
    title: 'Fullstack Web Projects & Code Review',
    isPrivate: false,
    author: 'Vikramaditya',
    authorRole: 'creator',
    createdAt: '2026-08-14',
    messages: [
      {
        id: 'm-6',
        sender: 'Vikramaditya',
        role: 'creator',
        text: 'Post your web application links and GitHub repositories in #code-review for peer feedback!',
        time: '04:20 PM',
        likes: 15
      }
    ]
  },
  {
    id: 'thread-4',
    code: 'ENG-1001',
    name: 'engineering-chat',
    title: 'General Engineering Student Discussions',
    isPrivate: false,
    author: 'Learn-o-pia Team',
    authorRole: 'owner',
    createdAt: '2026-08-01',
    messages: [
      {
        id: 'm-7',
        sender: 'Learn-o-pia Team',
        role: 'owner',
        text: 'Welcome to the #engineering-chat thread! Connect with fellow learners and ask any general academic questions.',
        time: '09:00 AM',
        likes: 32
      }
    ]
  }
];

export default function DiscussionsView({ setCurrentView }) {
  const { currentUser } = useDatabase();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my-threads'
  const [searchQuery, setSearchQuery] = useState('');
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState('thread-1');

  // New Thread Modal Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [initialMsg, setInitialMsg] = useState('');

  // Reply Input state inside active thread
  const [replyText, setReplyText] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Threads Data State
  const [threads, setThreads] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_discord_threads');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_THREADS;
  });

  useEffect(() => {
    localStorage.setItem('learnopia_discord_threads', JSON.stringify(threads));
  }, [threads]);

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  // Rank Public Threads by Message Count / Activity
  const rankedPublicThreads = useMemo(() => {
    return threads
      .filter((t) => !t.isPrivate)
      .sort((a, b) => (b.messages?.length || 0) - (a.messages?.length || 0));
  }, [threads]);

  // Filtered Public Threads
  const filteredPublicThreads = useMemo(() => {
    if (!searchQuery.trim()) return rankedPublicThreads;
    const q = searchQuery.toLowerCase().trim();
    return rankedPublicThreads.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
    );
  }, [rankedPublicThreads, searchQuery]);

  // My Joined / Created Threads
  const myThreads = useMemo(() => {
    if (!currentUser) return [];
    return threads.filter((t) => {
      const isAuthor = t.author === currentUser.name;
      const hasCommented = t.messages.some((m) => m.sender === currentUser.name);
      return isAuthor || hasCommented;
    });
  }, [threads, currentUser]);

  // Create New Thread Handler
  const handleCreateThread = (e) => {
    e.preventDefault();
    if (!newThreadName.trim()) return;

    const formattedName = newThreadName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `THREAD-${randomNum}`;

    const newThreadObj = {
      id: `thread-${Date.now()}`,
      code: generatedCode,
      name: formattedName,
      title: newTitle.trim() || `#${formattedName} Discussion Thread`,
      isPrivate,
      author: currentUser?.name || 'Anonymous Learner',
      authorRole: currentUser?.role || 'learner',
      createdAt: new Date().toISOString().split('T')[0],
      messages: initialMsg.trim()
        ? [
            {
              id: `m-${Date.now()}`,
              sender: currentUser?.name || 'Anonymous Learner',
              role: currentUser?.role || 'learner',
              text: initialMsg.trim(),
              time: 'Just now',
              likes: 1
            }
          ]
        : []
    };

    setThreads((prev) => [newThreadObj, ...prev]);
    setSelectedThreadId(newThreadObj.id);
    setShowCreateModal(false);

    setNewThreadName('');
    setNewTitle('');
    setIsPrivate(false);
    setInitialMsg('');
  };

  // Join Private Thread by Code
  const handleJoinPrivateCode = (e) => {
    e.preventDefault();
    setJoinError('');
    if (!privateCodeInput.trim()) return;

    const targetCode = privateCodeInput.trim().toUpperCase();
    const found = threads.find((t) => t.code.toUpperCase() === targetCode);

    if (found) {
      setSelectedThreadId(found.id);
      setPrivateCodeInput('');
    } else {
      setJoinError('Invalid Private Thread Code. Please check the code.');
    }
  };

  // Post Reply to Thread
  const handlePostReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThreadId) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: currentUser?.name || 'Learner Student',
      role: currentUser?.role || 'learner',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 0
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedThreadId
          ? { ...t, messages: [...t.messages, newMsg] }
          : t
      )
    );

    setReplyText('');
  };

  // Like Message
  const handleLikeMessage = (msgId) => {
    if (!selectedThreadId) return;
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== selectedThreadId) return t;
        return {
          ...t,
          messages: t.messages.map((m) =>
            m.id === msgId ? { ...m, likes: m.likes + 1 } : m
          )
        };
      })
    );
  };

  const copyCode = (codeStr) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(codeStr);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div className="discussions-container animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── TOP HEADER BAR ── */}
      <div className="discussions-header glass-panel" style={{ padding: '16px 20px', borderRadius: '14px' }}>
        <div className="disc-head-left">
          <h1 style={{ fontSize: '1.4rem' }}>Discord Threads & Discussion Streams</h1>
          <p className="section-sub" style={{ fontSize: '0.82rem' }}>
            Ask queries, post answers, and collaborate in hashtag threads.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Join Private Code Form */}
          <form onSubmit={handleJoinPrivateCode} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="code-input-wrap">
              <Key size={14} className="key-icon" />
              <input
                type="text"
                placeholder="Private Code (THREAD-8921)"
                value={privateCodeInput}
                onChange={(e) => setPrivateCodeInput(e.target.value)}
                className="form-input code-field"
                style={{ width: '190px', height: '36px', fontSize: '0.78rem' }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', height: '36px' }}>
                Join Thread
              </button>
            </div>
          </form>

          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Plus size={15} /> Create Thread
          </button>
        </div>
      </div>
      {joinError && <span className="join-err-msg" style={{ marginTop: '-10px' }}>{joinError}</span>}

      {/* ── DISCORD THREADS LAYOUT: SIDEBAR + CONVERSATION STREAM ── */}
      <div className="discord-workspace-grid" style={styles.discordGrid}>
        
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: Discord Threads List                       */}
        {/* ========================================================= */}
        <div className="glass-panel" style={styles.sidebarCard}>
          {/* Sidebar Header */}
          <div style={styles.sidebarHeader}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronDown size={14} /> LEARNING THREADS
            </span>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
              <button
                onClick={() => setActiveTab('explore')}
                style={{
                  flex: 1, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600,
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: activeTab === 'explore' ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                  color: activeTab === 'explore' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                Public ({rankedPublicThreads.length})
              </button>
              <button
                onClick={() => setActiveTab('my-threads')}
                style={{
                  flex: 1, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600,
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: activeTab === 'my-threads' ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                  color: activeTab === 'my-threads' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                Mine ({myThreads.length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={{ padding: '0 12px 10px 12px' }}>
            <div className="playlist-search-wrap" style={{ margin: 0 }}>
              <Search size={14} className="search-icon-fixed" />
              <input
                type="text"
                placeholder="Filter threads…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input playlist-search-input"
                style={{ height: '34px', fontSize: '0.78rem' }}
              />
            </div>
          </div>

          {/* Discord Hashtag Thread List */}
          <div style={styles.threadsScrollList}>
            {(activeTab === 'explore' ? filteredPublicThreads : myThreads).map((thread) => {
              const isSelected = activeThread?.id === thread.id;

              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  style={{
                    ...styles.threadItemRow,
                    background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    borderLeftColor: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    {thread.isPrivate ? <Lock size={13} color="#a78bfa" /> : <Hash size={15} color="#a78bfa" />}
                    <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {thread.name}
                    </span>
                  </span>

                  <span style={{ fontSize: '0.7rem', opacity: 0.7, flexShrink: 0 }}>
                    {thread.messages.length} msg
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT MAIN PANEL: Discord Thread Conversation Stream      */}
        {/* ========================================================= */}
        <div className="glass-panel" style={styles.mainStreamCard}>
          {activeThread ? (
            <>
              {/* Thread Header Bar */}
              <div style={styles.threadStreamHead}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                      #{activeThread.name}
                    </h2>
                    {activeThread.isPrivate ? (
                      <span className="privacy-pill private"><Lock size={12} /> Private Thread</span>
                    ) : (
                      <span className="privacy-pill public"><Globe size={12} /> Public Stream</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{activeThread.title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: <code>{activeThread.code}</code></span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => copyCode(activeThread.code)}
                  >
                    {codeCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Message Feed Stream */}
              <div className="thread-messages-list" style={{ flex: 1, minHeight: '380px', maxHeight: '520px' }}>
                {activeThread.messages.length === 0 ? (
                  <div className="empty-stream-msg">
                    <MessageCircle size={36} color="var(--text-muted)" />
                    <p>Welcome to #{activeThread.name}! Send a message to start discussing.</p>
                  </div>
                ) : (
                  activeThread.messages.map((msg) => (
                    <div key={msg.id} className="message-bubble-row">
                      <div className="msg-avatar-circle">
                        <User size={18} color="#ffffff" />
                      </div>
                      <div className="msg-content-box">
                        <div className="msg-head-meta">
                          <strong>{msg.sender}</strong>
                          <span className={`badge badge-${msg.role}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                            {msg.role}
                          </span>
                          <span className="msg-time-stamp">{msg.time}</span>
                        </div>
                        <p className="msg-body-text">{msg.text}</p>

                        <div className="msg-actions-row">
                          <button className="like-btn" onClick={() => handleLikeMessage(msg.id)}>
                            <ThumbsUp size={13} /> {msg.likes}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Thread Reply Input Bar */}
              <form onSubmit={handlePostReply} className="thread-reply-input-bar">
                <input
                  type="text"
                  placeholder={`Reply in #${activeThread.name}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="form-input reply-field"
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                  <Send size={15} /> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Hash size={40} style={{ marginBottom: 12 }} />
              <p>Select a thread from the sidebar to open the discussion stream.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── CREATE THREAD MODAL ── */}
      {showCreateModal && (
        <div style={modalStyles.overlay}>
          <div className="glass-panel" style={modalStyles.box}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', color: '#ffffff' }}>Create New # Thread</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Publish a hashtag discussion thread for your course or study query.
            </p>

            <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Hashtag Slug (#thread-name)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Hash size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="data-structures-doubts"
                    style={{ paddingLeft: 34 }}
                    value={newThreadName}
                    onChange={(e) => setNewThreadName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Thread Topic / Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Binary Search Trees & Graph Queries"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Privacy Option</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="privacy"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                    />
                    <Globe size={15} color="var(--primary)" /> Public Thread
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="privacy"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                    />
                    <Lock size={15} color="#a78bfa" /> Private (Join via Code only)
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Initial Question / Message</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Write your doubt or opening question for this thread..."
                  value={initialMsg}
                  onChange={(e) => setInitialMsg(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  discordGrid: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '20px',
    alignItems: 'start',
    marginTop: '16px',
    width: '100%'
  },
  sidebarCard: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    textAlign: 'left'
  },
  sidebarHeader: {
    padding: '16px 14px 12px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  },
  threadsScrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '6px',
    maxHeight: '540px',
    overflowY: 'auto'
  },
  threadItemRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    border: 'none',
    borderLeft: '3px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.12s ease'
  },
  mainStreamCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left'
  },
  threadStreamHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexWrap: 'wrap'
  }
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  box: {
    maxWidth: '500px',
    width: '100%',
    padding: '24px',
    textAlign: 'left'
  }
};
