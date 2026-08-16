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
  Sparkles
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
  const { currentUser } = useDatabase();

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

  const [activeThreadId, setActiveThreadId] = useState('thread-1');
  const [threadSearch, setThreadSearch] = useState('');

  // Join Private Thread Code State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [joinError, setJoinError] = useState('');

  // Create Thread State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerificationAlertModal, setShowVerificationAlertModal] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [isThreadPrivate, setIsThreadPrivate] = useState(false);

  // Message & Reply State
  const [messageText, setMessageText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeDesignation = getUserDesignation(currentUser);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnopia_discord_threads', JSON.stringify(threads));
    }
  }, [threads]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  // Categorize Threads into Public & My Threads
  const publicThreads = useMemo(() => {
    return threads.filter(t => !t.isPrivate);
  }, [threads]);

  const myThreads = useMemo(() => {
    return threads.filter(t => t.author === activeDesignation || t.isPrivate);
  }, [threads, activeDesignation]);

  const handleOpenCreateModal = () => {
    const canCreate = currentUser?.isVerified || currentUser?.role === 'creator' || currentUser?.role === 'admin' || currentUser?.role === 'owner';
    if (!canCreate) {
      setShowVerificationAlertModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleJoinThreadByCode = (e) => {
    e.preventDefault();
    setJoinMsg('');
    setJoinError('');

    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a thread code.');
      return;
    }

    const codeToMatch = joinCodeInput.trim().toUpperCase();
    const found = threads.find(t => t.code.toUpperCase() === codeToMatch);

    if (found) {
      setActiveThreadId(found.id);
      setJoinMsg(`Joined thread #${found.name} successfully!`);
      setJoinCodeInput('');
      setTimeout(() => setJoinMsg(''), 3000);
    } else {
      setJoinError('No thread found matching code ' + codeToMatch);
    }
  };

  const handleCreateThread = (e) => {
    e.preventDefault();
    if (!newThreadName.trim() || !newThreadTitle.trim()) return;

    const formattedName = newThreadName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const randomCode = `THREAD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newThread = {
      id: `thread-${Date.now()}`,
      code: randomCode,
      name: formattedName,
      title: newThreadTitle,
      isPrivate: isThreadPrivate,
      author: activeDesignation,
      authorRole: currentUser?.role || 'learner',
      createdAt: new Date().toISOString().split('T')[0],
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: activeDesignation,
          role: currentUser?.role || 'learner',
          text: `Thread #${formattedName} initialized by ${activeDesignation}. Welcome!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setThreads([newThread, ...threads]);
    setActiveThreadId(newThread.id);
    setShowCreateModal(false);
    setNewThreadName('');
    setNewThreadTitle('');
    setIsThreadPrivate(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeThread) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: activeDesignation,
      role: currentUser?.role || 'learner',
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

  const handleCopyCode = (code) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

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

      {/* Main 2-Column Grid Layout */}
      <div style={styles.workspaceGrid}>
        
        {/* LEFT SIDEBAR COLUMN: Thread Code Joiner & Vertical Lists */}
        <div className="glass-panel" style={styles.sidebarCol}>
          
          {/* 1. Join Thread with Code Box */}
          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '8px' }}>
              <Key size={13} /> Join Private Thread with Code
            </span>
            
            <form onSubmit={handleJoinThreadByCode} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DS-9182"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '6px 10px', flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                Join
              </button>
            </form>

            {joinMsg && <span style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px', display: 'block' }}>{joinMsg}</span>}
            {joinError && <span style={{ fontSize: '0.72rem', color: 'var(--error)', marginTop: '4px', display: 'block' }}>{joinError}</span>}
          </div>

          {/* 2. Thread Search Input */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search threads..."
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.82rem', padding: '6px 10px 6px 32px', width: '100%' }}
            />
          </div>

          {/* 3. VERTICAL LIST SECTION 1: PUBLIC THREADS */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Globe size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Public Threads ({publicThreads.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {publicThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                      border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-heading)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <Hash size={15} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: '0.83rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {thread.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                      {thread.messages?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. VERTICAL LIST SECTION 2: MY THREADS & PRIVATE THREADS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <User size={13} color="#f59e0b" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                My Threads & Private ({myThreads.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {myThreads.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: 8 }}>No joined private threads.</span>
              ) : (
                myThreads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(245,158,11,0.15)' : 'transparent',
                        border: isActive ? '1px solid #f59e0b' : '1px solid transparent',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-heading)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {thread.isPrivate ? <Lock size={14} color="#f59e0b" /> : <Hash size={14} color="var(--text-muted)" />}
                        <span style={{ fontSize: '0.83rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {thread.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {thread.code}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Chat Stream Area (Spans entire remaining workspace width) */}
        <div className="glass-panel" style={styles.chatCol}>
          {activeThread ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Active Thread Bar Header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Hash size={22} color="var(--primary)" />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff' }}>{activeThread.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activeThread.title}</span>
                  </div>
                </div>

                <div
                  onClick={() => handleCopyCode(activeThread.code)}
                  style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#ffffff' }}
                  title="Click to copy private thread code"
                >
                  <Key size={13} color="var(--primary)" />
                  <span>{activeThread.code}</span>
                  {copiedCode ? <Check size={12} color="var(--success)" /> : <Copy size={12} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Chat Messages Stream Area */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeThread.messages?.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', gap: '12px', textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <User size={18} color="#ffffff" />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{msg.sender}</strong>
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
                  <span>Replying to <strong>{replyingToMessage.sender}</strong>: "{replyingToMessage.text.substring(0, 50)}…"</span>
                  <button onClick={() => setReplyingToMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
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
              <p>Select a discussion thread from the sidebar.</p>
            </div>
          )}
        </div>
      </div>

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
              Only <strong>Verified Students</strong>, <strong>Professors</strong>, or <strong>Creators</strong> can publish new discussion threads.
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
