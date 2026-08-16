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
  Users,
  Radio
} from 'lucide-react';

const DEFAULT_CHANNELS = [
  {
    id: 'chan-1',
    code: 'DS-9182',
    name: 'data-structures-algo',
    title: 'Data Structures & Algorithms Chat',
    isPrivate: false,
    author: 'Prof. Deepak Shaw',
    authorRole: 'owner',
    createdAt: '2026-08-10',
    messages: [
      {
        id: 'm-1',
        sender: 'Prof. Deepak Shaw',
        role: 'owner',
        text: 'Welcome to #data-structures-algo! Post your doubts on Trees, Graphs, and Dynamic Programming algorithms here.',
        time: '10:30 AM',
        likes: 12
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
    id: 'chan-2',
    code: 'PYQ-4410',
    name: 'makaut-pyq-solutions',
    title: 'MAKAUT PYQ & Exam Solutions Chat',
    isPrivate: false,
    author: 'Ananya Roy',
    authorRole: 'creator',
    createdAt: '2026-08-12',
    messages: [
      {
        id: 'm-4',
        sender: 'Ananya Roy',
        role: 'creator',
        text: 'Shared solution notes for Physics-I and C Programming 2024 papers in the materials section. Ask doubts in this chat!',
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
    id: 'chan-3',
    code: 'WEB-7721',
    name: 'web-dev-projects',
    title: 'Fullstack Web Engineering Chat',
    isPrivate: false,
    author: 'Vikramaditya',
    authorRole: 'creator',
    createdAt: '2026-08-14',
    messages: [
      {
        id: 'm-6',
        sender: 'Vikramaditya',
        role: 'creator',
        text: 'Post your web project links and GitHub repositories in #web-dev-projects for peer code review!',
        time: '04:20 PM',
        likes: 15
      }
    ]
  },
  {
    id: 'chan-4',
    code: 'GEN-1001',
    name: 'general-discussion',
    title: 'General Learner Community Lounge',
    isPrivate: false,
    author: 'Learn-o-pia Team',
    authorRole: 'owner',
    createdAt: '2026-08-01',
    messages: [
      {
        id: 'm-7',
        sender: 'Learn-o-pia Team',
        role: 'owner',
        text: 'Welcome to the #general-discussion channel! Feel free to introduce yourself and connect with fellow engineering students.',
        time: '09:00 AM',
        likes: 30
      }
    ]
  }
];

export default function DiscussionsView({ setCurrentView }) {
  const { currentUser } = useDatabase();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'my-channels'
  const [searchQuery, setSearchQuery] = useState('');
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // New Channel Modal Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [initialMsg, setInitialMsg] = useState('');

  // Reply Input state inside active channel
  const [replyText, setReplyText] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Channels Data State
  const [channels, setChannels] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learnopia_chat_channels');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_CHANNELS;
  });

  useEffect(() => {
    localStorage.setItem('learnopia_chat_channels', JSON.stringify(channels));
  }, [channels]);

  const activeChannel = channels.find((c) => c.id === selectedChannelId);

  // Rank Public Channels by Message Count / Activity
  const rankedPublicChannels = useMemo(() => {
    return channels
      .filter((c) => !c.isPrivate)
      .sort((a, b) => (b.messages?.length || 0) - (a.messages?.length || 0));
  }, [channels]);

  // Filtered Public Channels
  const filteredPublicChannels = useMemo(() => {
    if (!searchQuery.trim()) return rankedPublicChannels;
    const q = searchQuery.toLowerCase().trim();
    return rankedPublicChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [rankedPublicChannels, searchQuery]);

  // My Joined / Created Channels
  const myChannels = useMemo(() => {
    if (!currentUser) return [];
    return channels.filter((c) => {
      const isAuthor = c.author === currentUser.name;
      const hasCommented = c.messages.some((m) => m.sender === currentUser.name);
      return isAuthor || hasCommented;
    });
  }, [channels, currentUser]);

  // Create New Channel Handler
  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const formattedName = newChannelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `${formattedName.substring(0, 3).toUpperCase()}-${randomNum}`;

    const newChan = {
      id: `chan-${Date.now()}`,
      code: generatedCode,
      name: formattedName,
      title: newTitle.trim() || `#${formattedName} Channel`,
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

    setChannels((prev) => [newChan, ...prev]);
    setSelectedChannelId(newChan.id);
    setShowCreateModal(false);

    setNewChannelName('');
    setNewTitle('');
    setIsPrivate(false);
    setInitialMsg('');
  };

  // Join Private Channel by Code
  const handleJoinPrivateCode = (e) => {
    e.preventDefault();
    setJoinError('');
    if (!privateCodeInput.trim()) return;

    const targetCode = privateCodeInput.trim().toUpperCase();
    const found = channels.find((c) => c.code.toUpperCase() === targetCode);

    if (found) {
      setSelectedChannelId(found.id);
      setPrivateCodeInput('');
    } else {
      setJoinError('Invalid Private Channel Code. Please check the code.');
    }
  };

  // Post Chat Message to Channel
  const handlePostMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChannelId) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: currentUser?.name || 'Learner Student',
      role: currentUser?.role || 'learner',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 0
    };

    setChannels((prev) =>
      prev.map((c) =>
        c.id === selectedChannelId
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      )
    );

    setReplyText('');
  };

  // Like Message
  const handleLikeMessage = (msgId) => {
    if (!selectedChannelId) return;
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id !== selectedChannelId) return c;
        return {
          ...c,
          messages: c.messages.map((m) =>
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
      {/* ── DISCORD-STYLE CHAT CHANNEL STREAM VIEW ── */}
      {activeChannel ? (
        <div className="thread-stream-card glass-panel animate-fade-in">
          {/* Channel Header Bar */}
          <div className="thread-head-bar">
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedChannelId(null)}>
              <ArrowLeft size={16} /> Back to Channels
            </button>

            <div className="thread-meta-pill">
              <span className="hashtag-badge">#{activeChannel.name}</span>
              {activeChannel.isPrivate ? (
                <span className="privacy-pill private">
                  <Lock size={12} /> Private Channel
                </span>
              ) : (
                <span className="privacy-pill public">
                  <Globe size={12} /> Public Channel
                </span>
              )}
            </div>
          </div>

          <div className="thread-title-wrap">
            <h2>#{activeChannel.name}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 6px 0' }}>
              {activeChannel.title}
            </p>
            <div className="thread-code-copy-row">
              <span className="code-lbl">Channel Code:</span>
              <strong className="code-val">{activeChannel.code}</strong>
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => copyCode(activeChannel.code)}
              >
                {codeCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {codeCopied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Live Chat Stream */}
          <div className="thread-messages-list">
            {activeChannel.messages.length === 0 ? (
              <div className="empty-stream-msg">
                <MessageCircle size={36} color="var(--text-muted)" />
                <p>Welcome to #{activeChannel.name}! Send a message to start chatting.</p>
              </div>
            ) : (
              activeChannel.messages.map((msg) => (
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

          {/* Chat Message Input Bar */}
          <form onSubmit={handlePostMessage} className="thread-reply-input-bar">
            <input
              type="text"
              placeholder={`Message #${activeChannel.name}...`}
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
        /* ── DISCORD-STYLE CHANNELS LISTING VIEW ── */
        <>
          {/* Top Header */}
          <div className="discussions-header glass-panel">
            <div className="disc-head-left">
              <h1>Discussions & Chat Channels</h1>
              <p className="section-sub">Connect in hashtag chat channels. Join public streams or enter a private channel code.</p>
            </div>

            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Create # Channel
            </button>
          </div>

          {/* Channels Navigation Tabs & Private Code Join Box */}
          <div className="disc-nav-row">
            <div className="disc-tabs-bar">
              <button
                className={`disc-tab-pill ${activeTab === 'explore' ? 'active' : ''}`}
                onClick={() => setActiveTab('explore')}
              >
                <Hash size={16} /> Public Channels ({rankedPublicChannels.length})
              </button>
              <button
                className={`disc-tab-pill ${activeTab === 'my-channels' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-channels')}
              >
                <MessageSquare size={16} /> My Channels ({myChannels.length})
              </button>
            </div>

            {/* Join Private Channel Box */}
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
                  Join Channel
                </button>
              </div>
              {joinError && <span className="join-err-msg">{joinError}</span>}
            </form>
          </div>

          {/* PUBLIC CHANNELS TAB */}
          {activeTab === 'explore' && (
            <div className="discussions-grid-workspace animate-fade-in">
              {/* Search Bar */}
              <div className="disc-search-bar glass-panel">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search channels by #name, topic, or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input search-field"
                />
              </div>

              {/* Channels List (Discord Channel Format) */}
              <div className="disc-cards-grid">
                {filteredPublicChannels.length === 0 ? (
                  <div className="empty-disc-box glass-panel">
                    <Hash size={36} color="var(--text-muted)" />
                    <p>No public chat channels match your search.</p>
                  </div>
                ) : (
                  filteredPublicChannels.map((chan, idx) => (
                    <div
                      key={chan.id}
                      className="disc-card-box glass-panel"
                      onClick={() => setSelectedChannelId(chan.id)}
                    >
                      <div className="disc-card-top">
                        <span className="hashtag-badge">#{chan.name}</span>
                        {idx === 0 && (
                          <span className="active-rank-pill">
                            <Flame size={12} /> #1 Most Active
                          </span>
                        )}
                      </div>

                      <h3 className="disc-card-title">{chan.title}</h3>

                      <div className="disc-card-footer">
                        <div className="disc-author-sub">
                          <User size={13} /> {chan.author}
                        </div>

                        <div className="disc-stats-pill">
                          <MessageCircle size={14} /> {chan.messages.length} messages
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MY CHANNELS TAB */}
          {activeTab === 'my-channels' && (
            <div className="discussions-grid-workspace animate-fade-in">
              <div className="disc-cards-grid">
                {myChannels.length === 0 ? (
                  <div className="empty-disc-box glass-panel">
                    <MessageSquare size={36} color="var(--text-muted)" />
                    <p>You haven't joined or posted in any channels yet.</p>
                  </div>
                ) : (
                  myChannels.map((chan) => (
                    <div
                      key={chan.id}
                      className="disc-card-box glass-panel"
                      onClick={() => setSelectedChannelId(chan.id)}
                    >
                      <div className="disc-card-top">
                        <span className="hashtag-badge">#{chan.name}</span>
                        <span className="code-tag-sm">{chan.code}</span>
                      </div>

                      <h3 className="disc-card-title">{chan.title}</h3>

                      <div className="disc-card-footer">
                        <div className="disc-author-sub">
                          <User size={13} /> {chan.author}
                        </div>
                        <div className="disc-stats-pill">
                          <MessageCircle size={14} /> {chan.messages.length} messages
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

      {/* ── CREATE CHANNEL MODAL ── */}
      {showCreateModal && (
        <div style={modalStyles.overlay}>
          <div className="glass-panel" style={modalStyles.box}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', color: '#ffffff' }}>Create New # Channel</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Start a hashtag chat channel for your course or study group.
            </p>

            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Channel Name (#hashtag)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Hash size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="c-programming-doubts"
                    style={{ paddingLeft: 34 }}
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Channel Description / Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Doubts & Discussion for C Programming Lab"
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
                    <Globe size={15} color="var(--primary)" /> Public Channel
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
                <label className="form-label" style={{ fontSize: '0.78rem' }}>First Message</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Send an opening welcome message to the channel..."
                  value={initialMsg}
                  onChange={(e) => setInitialMsg(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create # Channel
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
