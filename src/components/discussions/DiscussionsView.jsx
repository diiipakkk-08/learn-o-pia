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
  ArrowLeft,
  Flame,
  ThumbsUp,
  MessageCircle,
  Key,
  ChevronDown,
  CornerDownRight,
  Shield,
  X,
  AlertCircle
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
        time: '10:30 AM',
        likes: 14
      },
      {
        id: 'm-2',
        sender: 'St. Rahul Verma',
        role: 'learner',
        text: 'Could someone clarify the time complexity of QuickSort in the worst-case scenario?',
        time: '02:15 PM',
        likes: 5
      },
      {
        id: 'm-3',
        sender: 'Owner. Deepak Shaw',
        role: 'owner',
        text: 'In the worst case (when the pivot choice produces unbalanced partitions), QuickSort is O(n²). Average case remains O(n log n).',
        time: '03:00 PM',
        likes: 18,
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
        time: '11:00 AM',
        likes: 24
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerificationAlertModal, setShowVerificationAlertModal] = useState(false);

  const [showPrivateCodeInput, setShowPrivateCodeInput] = useState(false);
  const [enteredPrivateCode, setEnteredPrivateCode] = useState('');

  // Create Thread Form State
  const [newThreadName, setNewThreadName] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [isThreadPrivate, setIsThreadPrivate] = useState(false);

  // Active Message Input & Reply State
  const [messageText, setMessageText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('learnopia_discord_threads', JSON.stringify(threads));
    }
  }, [threads]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  const filteredThreads = useMemo(() => {
    if (!threadSearch.trim()) return threads;
    const q = threadSearch.toLowerCase().trim();
    return threads.filter(
      (t) => t.name.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
    );
  }, [threads, threadSearch]);

  const handleOpenCreateModal = () => {
    // Check if user is verified or holds creator/admin/owner role
    const canCreate = currentUser?.isVerified || currentUser?.role === 'creator' || currentUser?.role === 'admin' || currentUser?.role === 'owner';
    if (!canCreate) {
      setShowVerificationAlertModal(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateThread = (e) => {
    e.preventDefault();
    if (!newThreadName.trim() || !newThreadTitle.trim()) return;

    const formattedName = newThreadName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const randomCode = `THREAD-${Math.floor(1000 + Math.random() * 9000)}`;

    const designation = getUserDesignation(currentUser);

    const newThread = {
      id: `thread-${Date.now()}`,
      code: randomCode,
      name: formattedName,
      title: newThreadTitle,
      isPrivate: isThreadPrivate,
      author: designation,
      authorRole: currentUser?.role || 'learner',
      createdAt: new Date().toISOString().split('T')[0],
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: designation,
          role: currentUser?.role || 'learner',
          text: `Thread #${formattedName} initialized by ${designation}. Welcome!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          likes: 1
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

    const designation = getUserDesignation(currentUser);

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: designation,
      role: currentUser?.role || 'learner',
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 0,
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

  const handleLikeMessage = (msgId) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            messages: t.messages.map((m) => (m.id === msgId ? { ...m, likes: (m.likes || 0) + 1 } : m))
          };
        }
        return t;
      })
    );
  };

  const handleCopyCode = (code) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="discussions-container animate-fade-in" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Academic Discussions & Doubts Threads</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Public & Private Hashtag Discussion Streams · Logged in as <strong>{getUserDesignation(currentUser)}</strong>
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ gap: '6px' }}>
          <Plus size={16} /> Create Thread
        </button>
      </div>

      {/* Main Workspace Grid */}
      <div className="discord-workspace-grid">
        {/* LEFT SIDEBAR: Thread Hashtag List */}
        <div className="glass-panel discord-sidebar-panel">
          <div className="sidebar-search-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search threads or codes..."
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.82rem', padding: '6px 10px' }}
            />
          </div>

          <div className="threads-list-scroll">
            <span className="section-hdr-lbl">Public & Private Threads</span>
            {filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`thread-item-btn ${isActive ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hash size={16} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span className="thread-name-txt">{thread.name}</span>
                  </div>
                  {thread.isPrivate ? (
                    <Lock size={13} color="var(--warning)" />
                  ) : (
                    <span className="msg-cnt-badge">{thread.messages?.length || 0}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Thread Active Conversation Stream */}
        <div className="glass-panel discord-stream-panel">
          {activeThread ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Active Thread Bar */}
              <div className="active-thread-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Hash size={20} color="var(--primary)" />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#ffffff' }}>{activeThread.name}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{activeThread.title}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Private Code Badge */}
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
              </div>

              {/* Conversation Messages Stream */}
              <div className="messages-stream-list">
                {activeThread.messages?.map((msg) => (
                  <div key={msg.id} className="message-bubble-row">
                    <div className="msg-avatar-circle">
                      <User size={18} color="#ffffff" />
                    </div>

                    <div className="msg-content-body" style={{ width: '100%' }}>
                      <div className="msg-meta-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

                      {/* Quoted parent message block if this is a reply */}
                      {msg.quotedMessage && (
                        <div style={{ margin: '6px 0', padding: '6px 12px', background: 'rgba(139,92,246,0.08)', borderLeft: '3px solid var(--primary)', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.73rem' }}>Replying to {msg.quotedMessage.sender}</strong>
                          <p style={{ margin: 0, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{msg.quotedMessage.text}"</p>
                        </div>
                      )}

                      <p className="msg-text-p">{msg.text}</p>

                      <div className="msg-actions-row">
                        <button className="like-btn-action" onClick={() => handleLikeMessage(msg.id)}>
                          <ThumbsUp size={13} />
                          <span>{msg.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Replying indicator bar */}
              {replyingToMessage && (
                <div style={{ padding: '6px 14px', background: 'rgba(139,92,246,0.12)', borderTop: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ffffff' }}>
                  <span>Replying to <strong>{replyingToMessage.sender}</strong>: "{replyingToMessage.text.substring(0, 45)}…"</span>
                  <button onClick={() => setReplyingToMessage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                </div>
              )}

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  placeholder={`Message #${activeThread.name}…`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="form-input"
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
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

      {/* CREATE THREAD MODAL (Guarded for Verified Users) */}
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

      {/* VERIFICATION REQUIRED ALERT MODAL */}
      {showVerificationAlertModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-card animate-fade-in" style={{ maxWidth: '420px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Shield size={24} color="var(--warning)" />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#ffffff' }}>Account Verification Required</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Only <strong>Verified Students</strong>, <strong>Professors</strong>, or <strong>Creators</strong> can publish new discussion threads. Unverified accounts can view threads and reply in existing streams.
            </p>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Please head over to your <strong>Profile Settings</strong> to submit your student ID or educator designation document for verification.
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
