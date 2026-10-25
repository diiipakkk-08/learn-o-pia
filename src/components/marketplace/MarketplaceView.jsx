/**
 * MarketplaceView.jsx
 * Campus academic buy/sell/resell exchange for books, hardware kits, engineering drafters, and student services.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDatabase } from '../../context/DatabaseContext';
import {
  ShoppingBag,
  Search,
  Tag,
  ExternalLink,
  BookOpen,
  Cpu,
  Wrench,
  Sparkles,
  Check,
  Copy,
  Plus,
  X,
  Phone,
  MessageCircle,
  Share2,
  Trash2,
  User,
  ArrowLeft
} from 'lucide-react';
import { getActiveMarketplaceItems, deleteMarketplaceListing } from '../../utils/marketplaceStorage';

export default function MarketplaceView({ setCurrentView }) {
  const { currentUser, globalSearchQuery, setGlobalSearchQuery } = useDatabase();

  const [items, setItems] = useState(() => getActiveMarketplaceItems());

  useEffect(() => {
    const handleSync = () => {
      setItems(getActiveMarketplaceItems());
    };
    window.addEventListener('learnopia_marketplace_updated', handleSync);
    return () => window.removeEventListener('learnopia_marketplace_updated', handleSync);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [copiedId, setCopiedId] = useState(null);
  const [toastNotice, setToastNotice] = useState(null);

  // Modal States
  const [activeBuyItem, setActiveBuyItem] = useState(null);
  const [inquiryCopied, setInquiryCopied] = useState(false);

  // Synchronize global search query from navigation bar
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setLocalSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Lock body scroll while Contact/Buy modal is open
  useEffect(() => {
    if (activeBuyItem) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [activeBuyItem]);

  const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: <ShoppingBag size={14} /> },
    { id: 'Study Material', label: 'Study Material', icon: <BookOpen size={14} /> },
    { id: 'Hardware Kits', label: 'Hardware Kits', icon: <Cpu size={14} /> },
    { id: 'Tools & Gear', label: 'Tools & Gear', icon: <Wrench size={14} /> },
    { id: 'Services', label: 'Services', icon: <Sparkles size={14} /> },
    { id: 'Others', label: 'Others', icon: <Tag size={14} /> }
  ];

  const query = (localSearch || '').trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchCat = false;
      if (selectedCategory === 'all') {
        matchCat = true;
      } else if (selectedCategory === 'Study Material') {
        matchCat = item.category === 'Study Material' || item.category === 'Books & Notes';
      } else if (selectedCategory === 'Others') {
        matchCat = item.category === 'Others' || !['Study Material', 'Books & Notes', 'Hardware Kits', 'Tools & Gear', 'Services'].includes(item.category);
      } else {
        matchCat = item.category === selectedCategory;
      }
      const matchSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        (item.tag && item.tag.toLowerCase().includes(query)) ||
        (item.keywords && item.keywords.toLowerCase().includes(query));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, query]);

  const showToast = (msg) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  const handleCopyLink = (item, e) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/#marketplace-${item.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id);
    showToast('Direct item link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open "Buy Item" and copy inquiry template to clipboard
  const handleOpenBuy = (item) => {
    setActiveBuyItem(item);
    const textToCopy = `Hi ${item.author}! I found your listing "${item.title}" on Learn-O-Pia for ${item.price}. Is it still available?`;
    navigator.clipboard.writeText(textToCopy);
    setInquiryCopied(true);
    setTimeout(() => setInquiryCopied(false), 3500);
  };

  const copyInquiryAgain = (item) => {
    const textToCopy = `Hi ${item.author}! I found your listing "${item.title}" on Learn-O-Pia for ${item.price}. Is it still available?`;
    navigator.clipboard.writeText(textToCopy);
    setInquiryCopied(true);
    showToast('Inquiry details copied to clipboard!');
    setTimeout(() => setInquiryCopied(false), 3000);
  };

  // Build direct contact URL based on seller's preferred method
  const getContactLink = (item) => {
    const method = item.contactMethod || 'whatsapp';
    const detail = (item.contactDetail || '').trim();
    const inquiryText = `Hi ${item.author}! I'm interested in buying your "${item.title}" listed on Learn-O-Pia for ${item.price}. Is it still available?`;

    if (method === 'whatsapp') {
      const cleanPhone = detail.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      return `https://wa.me/${fullPhone}?text=${encodeURIComponent(inquiryText)}`;
    }

    if (method === 'telegram') {
      const handle = detail.replace('@', '').replace('https://t.me/', '');
      return `https://t.me/${handle}`;
    }

    if (method === 'phone') {
      return `tel:${detail.replace(/[^0-9+]/g, '')}`;
    }

    // LinkedIn or Instagram profile URL
    return detail.startsWith('http') ? detail : `https://${detail}`;
  };

  // Delete listing
  const handleDeleteListing = (itemId) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    deleteMarketplaceListing(itemId);
    setItems(getActiveMarketplaceItems());
    showToast('Listing removed from Marketplace');
    if (activeBuyItem?.id === itemId) setActiveBuyItem(null);
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 space-y-6 animate-fade-in">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-accent-ink text-text-on-dark text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check size={14} className="text-accent-forest" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Clean Marketplace Header */}
      <div className="border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-accent-forest/10 text-accent-forest border border-accent-forest/20 uppercase tracking-wider">
            CAMPUS RESELLER & EXCHANGE
          </span>
          <span className="text-xs text-text-muted font-mono-tabular">
            Student-to-Student
          </span>
        </div>
        <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight font-editorial text-text-primary">
          Student Academic Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Buy & sell textbooks, lab kits, drawing drafters, and study tools across campus.
        </p>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 max-w-full">
        <div className="flex items-center gap-1.5 shrink-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-accent-ink text-text-on-dark border-transparent shadow-xs'
                    : 'bg-surface text-text-secondary border-border-subtle hover:border-border-strong hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter Info on Desktop */}
        <div className="hidden md:block text-[11px] font-mono-tabular text-text-muted shrink-0">
          SHOWING {filteredItems.length} LISTINGS
        </div>
      </div>

      {/* Mobile-Only In-Page Search Bar (Desktop uses top navigation bar) */}
      <div className="relative max-w-lg md:hidden">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search books, hardware, drafters, services..."
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value);
            if (setGlobalSearchQuery) setGlobalSearchQuery(e.target.value);
          }}
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-border-subtle bg-surface text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-border-strong font-mono-tabular"
        />
        {localSearch && (
          <button
            onClick={() => {
              setLocalSearch('');
              if (setGlobalSearchQuery) setGlobalSearchQuery('');
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Active Query Pill on Desktop */}
      {query && (
        <div className="hidden md:flex items-center gap-2 text-xs font-mono-tabular text-text-muted">
          <span>Active filter:</span>
          <span className="px-2 py-0.5 rounded-md bg-accent-forest/10 text-accent-forest font-semibold border border-accent-forest/20">
            "{query}"
          </span>
          <button
            onClick={() => {
              setLocalSearch('');
              if (setGlobalSearchQuery) setGlobalSearchQuery('');
            }}
            className="hover:text-text-primary underline cursor-pointer text-[11px]"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Marketplace Listings Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const isAdminOrOwner = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.isAdmin);
            const isOwner = item.isUserCreated || (currentUser && item.sellerId === currentUser.id);
            const canDelete = isOwner || isAdminOrOwner || !item.sellerId || Boolean(currentUser);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border-subtle bg-surface hover:border-border-strong hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Image Header (if provided) or Category Hero Banner */}
                  {item.imageUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-black/5 border-b border-border-subtle">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded-md bg-black/80 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                      <span className="absolute bottom-2.5 right-2.5 text-xs font-mono-tabular font-bold px-2.5 py-0.5 rounded-md bg-accent-ink text-text-on-dark shadow-sm">
                        {item.price}
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 pb-2 flex items-center justify-between border-b border-border-subtle bg-surface-sunken">
                      <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-subtle text-text-secondary border border-border-subtle">
                        {item.category}
                      </span>
                      <span className="text-sm font-bold text-accent-forest font-mono-tabular">
                        {item.price}
                      </span>
                    </div>
                  )}

                  {/* Clean, Distraction-Free Card Body */}
                  <div className="p-4 sm:p-5 space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent-forest transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Simple Author Line */}
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <User size={13} className="shrink-0" />
                      <span className="truncate">By {item.author}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2 border-t border-border-subtle/60 mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopyLink(item, e)}
                      className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      title="Share Listing Link"
                    >
                      {copiedId === item.id ? (
                        <Check size={13} className="text-accent-forest" />
                      ) : (
                        <Share2 size={13} />
                      )}
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-red-50 hover:text-red-600 text-text-muted transition-colors cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Primary Buy / Contact Seller CTA */}
                  <button
                    onClick={() => handleOpenBuy(item)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <ShoppingBag size={13} />
                    <span>Buy Item</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 p-8 rounded-2xl border border-border-subtle bg-surface space-y-3">
          <ShoppingBag size={36} className="text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No marketplace listings match your filter</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search terms or switch to "All Items" to browse campus textbooks, kits, and tools.
          </p>
          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={() => {
                setLocalSearch('');
                setSelectedCategory('all');
                if (setGlobalSearchQuery) setGlobalSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-surface hover:bg-surface-hover text-text-primary cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL: BUY ITEM / CONNECT WITH SELLER (Mounted via Portal at Body, Centered Viewport)
      ================================================================= */}
      {activeBuyItem &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-start justify-center pt-8 sm:pt-12 p-4 sm:p-6 bg-black/75 overflow-y-auto animate-in fade-in duration-150"
            onClick={() => setActiveBuyItem(null)}
          >
            <div
              className="w-full max-w-md max-h-[90vh] bg-surface border border-border-strong rounded-2xl shadow-2xl p-5 sm:p-6 relative mb-8 overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-sunken border border-border-subtle flex items-center justify-center text-text-primary">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Contact Seller</h3>
                    <p className="text-[11px] text-text-muted">Instant campus connection</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveBuyItem(null)}
                  className="w-7 h-7 rounded-lg border border-border-subtle hover:bg-surface-hover flex items-center justify-center text-text-muted cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Item Snapshot */}
              <div className="p-3.5 rounded-xl bg-surface-sunken border border-border-subtle space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono-tabular uppercase tracking-wider text-text-muted">
                    {activeBuyItem.category}
                  </span>
                  <span className="text-sm font-bold text-accent-forest font-mono-tabular">
                    {activeBuyItem.price}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-text-primary">
                  {activeBuyItem.title}
                </h4>
                <p className="text-[11px] text-text-muted">
                  Seller: <strong>{activeBuyItem.author}</strong>
                </p>
              </div>

              {/* Item Details / Description */}
              {activeBuyItem.description && (
                <div className="p-3 rounded-xl bg-surface-sunken border border-border-subtle text-xs text-text-secondary leading-relaxed space-y-1">
                  <div className="text-[10px] font-bold font-mono-tabular uppercase tracking-wider text-text-muted">
                    Description & Condition
                  </div>
                  <p className="text-text-primary whitespace-pre-line">{activeBuyItem.description}</p>
                </div>
              )}

              {/* Automatic Copy Notification */}
              <div className="p-3 rounded-xl border border-accent-forest/30 bg-accent-forest/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent-forest">
                  <Check size={14} />
                  <span>Inquiry message copied to clipboard!</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  When you click to chat below, simply paste your clipboard message directly to the seller.
                </p>
              </div>

              {/* Message Preview Box */}
              <div className="relative p-2.5 rounded-lg border border-border-subtle bg-surface text-xs font-mono-tabular text-text-secondary text-[11px] leading-relaxed">
                "Hi {activeBuyItem.author}! I found your listing '{activeBuyItem.title}' on Learn-O-Pia for {activeBuyItem.price}. Is it still available?"
                <button
                  type="button"
                  onClick={() => copyInquiryAgain(activeBuyItem)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-surface-sunken text-text-muted hover:text-text-primary cursor-pointer"
                  title="Copy Inquiry Text"
                >
                  {inquiryCopied ? <Check size={12} className="text-accent-forest" /> : <Copy size={12} />}
                </button>
              </div>

              {/* Direct Connect Buttons */}
              <div className="pt-2 space-y-2">
                <a
                  href={getContactLink(activeBuyItem)}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    activeBuyItem.contactMethod === 'telegram'
                      ? 'bg-[#0088cc] hover:bg-[#0077b5] text-white'
                      : activeBuyItem.contactMethod === 'phone'
                      ? 'bg-accent-ink hover:opacity-95 text-text-on-dark'
                      : 'bg-[#25D366] hover:bg-[#20ba5a] text-white'
                  }`}
                >
                  {activeBuyItem.contactMethod === 'telegram' ? (
                    <>
                      <ExternalLink size={14} />
                      <span>Open Telegram Chat (@{activeBuyItem.contactDetail})</span>
                    </>
                  ) : activeBuyItem.contactMethod === 'phone' ? (
                    <>
                      <Phone size={14} />
                      <span>Call Seller ({activeBuyItem.contactDetail})</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={15} />
                      <span>Chat on WhatsApp (+91 {activeBuyItem.contactDetail})</span>
                    </>
                  )}
                </a>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyInquiryAgain(activeBuyItem)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border border-border-subtle bg-surface hover:bg-surface-hover text-text-secondary cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy size={12} />
                    <span>Copy Message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBuyItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-muted cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
