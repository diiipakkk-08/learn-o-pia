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
  Clock,
  Sparkles,
  Key
} from 'lucide-react';

const DEFAULT_DISCUSSIONS = [
  {
    id: 'disc-1',
    code: 'DS-9182',
    title: 'Data Structures & Algorithms - GATE & Semester Exam Discussion',
    tag: 'data-structures',
    isPrivate: false,
    author: 'Prof. Deepak Shaw',
    authorRole: 'owner',
    createdAt: '2026-08-10',
    messages: [
      {
        id: 'm-1',
        sender: 'Prof. Deepak Shaw',
        role: 'owner',
        text: 'Welcome everyone! Use this stream to ask questions on Binary Search Trees, Graph Traversals, and Dynamic Programming algorithms.',
        time: 'Aug 10, 10:30 AM',
        likes: 12
      },
      {
        id: 'm-2',
        sender: 'Rahul Verma',
        role: 'learner',
        text: 'Could someone clarify the time complexity of QuickSort in the worst-case scenario?',
        time: 'Aug 11, 02:15 PM',
        likes: 5
      },
      {
        id: 'm-3',
        sender: 'Prof. Deepak Shaw',
        role: 'owner',
        text: 'In the worst case (when the pivot choice produces unbalanced partitions), QuickSort is O(n²). Average case remains O(n log n).',
        time: 'Aug 11, 03:00 PM',
        likes: 18
      }
    ]
  },
  {
    id: 'disc-2',
    code: 'PYQ-4410',
    title: 'MAKAUT Previous Year Questions & Answer Keys (Semester 1)',
    tag: 'makaut-pyq',
    isPrivate: false,
    author: 'Ananya Roy',
    authorRole: 'creator',
    createdAt: '2026-08-12',
    messages: [
      {
        id: 'm-4',
        sender: 'Ananya Roy',
        role: 'creator',
        text: 'Attached notes for Physics-I and C Programming 2024 paper solutions in the study materials section. Feel free to discuss doubts here!',
        time: 'Aug 12, 11:00 AM',
        likes: 24
      },
      {
        id: 'm-5',
        sender: 'Saurav Das',
        role: 'learner',
        text: 'Thanks! Question 4b on Matrix Diagonalization was tricky. Got it cleared now.',
        time: 'Aug 13, 09:45 AM',
        likes: 8
      }
    ]
  },
  {
    id: 'disc-3',
    code: 'WEB-7721',
    title: 'Fullstack Web Engineering - React & Node.js Projects',
    tag: 'web-development',
    isPrivate: false,
    author: 'Vikramaditya',
    authorRole: 'creator',
    createdAt: '2026-08-14',
    messages: [
      {
        id: 'm-6',
        sender: 'Vikramaditya',
        role: 'creator',
        text: 'Post your web application live links and GitHub repositories for peer code review!',
        time: 'Aug 14, 04:20 PM',
        likes: 15
      }
    ]
  }
];

export default function DiscussionsView({ setCurrentView }) {
  const { currentUser } = useDatabase();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my-discussions'
  const [searchQuery, setSearchQuery] = useState('');
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);

  // New Discussion Modal Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [initialMsg, setInitialMsg] = useState('');

  // Reply Input state inside active discussion thread
  const [replyText, setReplyText] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Discussions Data State
  const [discussions, setDiscussions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_discussions');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_DISCUSSIONS;
  });

  useEffect(() => {
    localStorage.setItem('learnopia_discussions', JSON.stringify(discussions));
  }, [discussions]);

  const activeDiscussion = discussions.find((d) => d.id === selectedDiscussionId);

  // Rank Public Discussions by Activity (Total messages count & recency)
  const rankedPublicDiscussions = useMemo(() => {
    return discussions
      .filter((d) => !d.isPrivate)
      .sort((a, b) => (b.messages?.length || 0) - (a.messages?.length || 0));
  }, [discussions]);

  // Filtered Public Discussions by Search
  const filteredPublicDiscussions = useMemo(() => {
    if (!searchQuery.trim()) return rankedPublicDiscussions;
    const q = searchQuery.toLowerCase().trim();
    return rankedPublicDiscussions.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.tag.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q)
    );
  }, [rankedPublicDiscussions, searchQuery]);

  // User's Joined / Created Discussions
  const myDiscussions = useMemo(() => {
    if (!currentUser) return [];
    return discussions.filter((d) => {
      const isAuthor = d.author === currentUser.name;
      const hasCommented = d.messages.some((m) => m.sender === currentUser.name);
      return isAuthor || hasCommented;
    });
  }, [discussions, currentUser]);

  // Create New Discussion Handler
  const handleCreateDiscussion = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTag.trim()) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `${newTag.substring(0, 3).toUpperCase()}-${randomNum}`;
    const formattedTag = newTag.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newDisc = {
      id: `disc-${Date.now()}`,
      code: generatedCode,
      title: newTitle.trim(),
      tag: formattedTag,
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

    setDiscussions((prev) => [newDisc, ...prev]);
    setSelectedDiscussionId(newDisc.id);
    setShowCreateModal(false);

    // Reset Form
    setNewTitle('');
    setNewTag('');
    setIsPrivate(false);
    setInitialMsg('');
  };

  // Join Private Discussion by Code
  const handleJoinPrivateCode = (e) => {
    e.preventDefault();
    setJoinError('');
    if (!privateCodeInput.trim()) return;

    const targetCode = privateCodeInput.trim().toUpperCase();
    const found = discussions.find((d) => d.code.toUpperCase() === targetCode);

    if (found) {
      setSelectedDiscussionId(found.id);
      setPrivateCodeInput('');
    } else {
      setJoinError('Invalid Private Code. Please check the code and try again.');
    }
  };

  // Post Reply to Thread
  const handlePostReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedDiscussionId) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: currentUser?.name || 'Learner Student',
      role: currentUser?.role || 'learner',
      text: replyText.trim(),
      time: 'Just now',
      likes: 0
    };

    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === selectedDiscussionId
          ? { ...d, messages: [...d.messages, newMsg] }
          : d
      )
    );

    setReplyText('');
  };

  // Like Message
  const handleLikeMessage = (msgId) => {
    if (!selectedDiscussionId) return;
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDiscussionId) return d;
        return {
          ...d,
          messages: d.messages.map((m) =>
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
    <div className="discussions-container animate-fade-in">
      {/* ── THREAD STREAM VIEW ── */}
      {activeDiscussion ? (
        <div className="thread-stream-card glass-panel animate-fade-in">
          {/* Thread Header Bar */}
          <div className="thread-head-bar">
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDiscussionId(null)}>
              <ArrowLeft size={16} /> Back to Discussions
            </button>

            <div className="thread-meta-pill">
              <span className="hashtag-badge">#{activeDiscussion.tag}</span>
              {activeDiscussion.isPrivate ? (
                <span className="privacy-pill private">
                  <Lock size={12} /> Private Thread
                </span>
              ) : (
                <span className="privacy-pill public">
                  <Globe size={12} /> Public Stream
                </span>
              )}
            </div>
          </div>

          <div className="thread-title-wrap">
            <h2>{activeDiscussion.title}</h2>
            <div className="thread-code-copy-row">
              <span className="code-lbl">Discussion Code:</span>
              <strong className="code-val">{activeDiscussion.code}</strong>
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => copyCode(activeDiscussion.code)}
              >
                {codeCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {codeCopied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="thread-messages-list">
            {activeDiscussion.messages.length === 0 ? (
              <div className="empty-stream-msg">
                <MessageCircle size={36} color="var(--text-muted)" />
                <p>No comments in this stream yet. Be the first to reply!</p>
              </div>
            ) : (
              activeDiscussion.messages.map((msg) => (
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

          {/* Post Comment Input Bar */}
          <form onSubmit={handlePostReply} className="thread-reply-input-bar">
            <input
              type="text"
              placeholder="Join the discussion... write a comment or question"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="form-input reply-field"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      ) : (
        /* ── DISCUSSIONS LISTING & EXPLORER VIEW ── */
        <>
          {/* Top Banner */}
          <div className="discussions-header glass-panel">
            <div className="disc-head-left">
              <h1>Threaded Discussions</h1>
              <p className="section-sub">Join public streams or start a private discussion with custom hashtag and join code.</p>
            </div>

            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Start New Discussion
            </button>
          </div>

          {/* Navigation Bar & Private Code Input */}
          <div className="disc-nav-row">
            <div className="disc-tabs-bar">
              <button
                className={`disc-tab-pill ${activeTab === 'explore' ? 'active' : ''}`}
                onClick={() => setActiveTab('explore')}
              >
                <Flame size={16} /> Public Discussions ({rankedPublicDiscussions.length})
              </button>
              <button
                className={`disc-tab-pill ${activeTab === 'my-discussions' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-discussions')}
              >
                <MessageSquare size={16} /> My Discussions ({myDiscussions.length})
              </button>
            </div>

            {/* Join Private Discussion by Code Box */}
            <form onSubmit={handleJoinPrivateCode} className="join-private-form">
              <div className="code-input-wrap">
                <Key size={15} className="key-icon" />
                <input
                  type="text"
                  placeholder="Enter Private Code (e.g. DS-9182)"
                  value={privateCodeInput}
                  onChange={(e) => setPrivateCodeInput(e.target.value)}
                  className="form-input code-field"
                />
                <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px' }}>
                  Join Thread
                </button>
              </div>
              {joinError && <span className="join-err-msg">{joinError}</span>}
            </form>
          </div>

          {/* EXPLORE PUBLIC DISCUSSIONS TAB */}
          {activeTab === 'explore' && (
            <div className="discussions-grid-workspace animate-fade-in">
              {/* Search Bar */}
              <div className="disc-search-bar glass-panel">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search discussions by title, #hashtag, or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input search-field"
                />
              </div>

              {/* Discussions Cards List (Ranked by Activity & Total Messages) */}
              <div className="disc-cards-grid">
                {filteredPublicDiscussions.length === 0 ? (
                  <div className="empty-disc-box glass-panel">
                    <Sparkles size={36} color="var(--text-muted)" />
                    <p>No public discussions match your search query.</p>
                  </div>
                ) : (
                  filteredPublicDiscussions.map((disc, idx) => (
                    <div
                      key={disc.id}
                      className="disc-card-box glass-panel"
                      onClick={() => setSelectedDiscussionId(disc.id)}
                    >
                      <div className="disc-card-top">
                        <span className="hashtag-badge">#{disc.tag}</span>
                        {idx === 0 && (
                          <span className="active-rank-pill">
                            <Flame size={12} /> #1 Most Active
                          </span>
                        )}
                      </div>

                      <h3 className="disc-card-title">{disc.title}</h3>

                      <div className="disc-card-footer">
                        <div className="disc-author-sub">
                          <User size={13} /> {disc.author}
                        </div>

                        <div className="disc-stats-pill">
                          <MessageCircle size={14} /> {disc.messages.length} replies
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MY DISCUSSIONS TAB */}
          {activeTab === 'my-discussions' && (
            <div className="discussions-grid-workspace animate-fade-in">
              <div className="disc-cards-grid">
                {myDiscussions.length === 0 ? (
                  <div className="empty-disc-box glass-panel">
                    <MessageSquare size={36} color="var(--text-muted)" />
                    <p>You haven't created or commented in any discussions yet.</p>
                  </div>
                ) : (
                  myDiscussions.map((disc) => (
                    <div
                      key={disc.id}
                      className="disc-card-box glass-panel"
                      onClick={() => setSelectedDiscussionId(disc.id)}
                    >
                      <div className="disc-card-top">
                        <span className="hashtag-badge">#{disc.tag}</span>
                        <span className="code-tag-sm">{disc.code}</span>
                      </div>

                      <h3 className="disc-card-title">{disc.title}</h3>

                      <div className="disc-card-footer">
                        <div className="disc-author-sub">
                          <User size={13} /> {disc.author}
                        </div>
                        <div className="disc-stats-pill">
                          <MessageCircle size={14} /> {disc.messages.length} replies
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CREATE DISCUSSION MODAL ── */}
      {showCreateModal && (
        <div style={modalStyles.overlay}>
          <div className="glass-panel" style={modalStyles.box}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', color: '#ffffff' }}>Start New Discussion</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Create a threaded discussion stream for your course or study topic.
            </p>

            <form onSubmit={handleCreateDiscussion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Discussion Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Graph Algorithms Doubts & PYQ Discussion"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Hashtag Topic (#tag)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Hash size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="data-structures"
                    style={{ paddingLeft: 34 }}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    required
                  />
                </div>
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
                    <Globe size={15} color="var(--primary)" /> Public (Listed for everyone)
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
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Initial Message / Question</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Ask a question or explain what this discussion stream is about..."
                  value={initialMsg}
                  onChange={(e) => setInitialMsg(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
