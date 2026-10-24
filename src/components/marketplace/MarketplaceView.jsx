import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  ShoppingBag,
  Search,
  Tag,
  Star,
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
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const SEEDED_MARKETPLACE_ITEMS = [
  {
    id: 'mkt-1',
    title: 'MAKAUT 1st & 2nd Year B.Tech Complete Organizer & Solved PYQs',
    category: 'Books & Notes',
    price: '₹150',
    author: 'Sneha Roy (CSE, 3rd Year)',
    rating: 4.9,
    reviews: 142,
    badge: 'Verified Notes',
    description: 'Complete physical semester organizers for Engineering Mathematics, Basic Electrical, Physics, and Data Structures with handwritten step-by-step solutions.',
    tag: 'CSE & IT',
    keywords: 'organizer, pyq, makaut, mathematics, physics',
    contactMethod: 'whatsapp',
    contactDetail: '9876543210',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-20'
  },
  {
    id: 'mkt-2',
    title: 'GATE CSE Comprehensive Handwritten Master Notebooks',
    category: 'Books & Notes',
    price: '₹299',
    author: 'Arjun Banerjee (Topper)',
    rating: 5.0,
    reviews: 87,
    badge: 'Staff Pick',
    description: 'Color-coded handwritten notebooks covering Discrete Math, Algorithms, DBMS, OS, and CN with 15-year past question analysis.',
    tag: 'GATE Exam',
    keywords: 'gate, cse, algorithms, handwritten notes',
    contactMethod: 'telegram',
    contactDetail: 'arjun_gate_cse',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-21'
  },
  {
    id: 'mkt-3',
    title: 'ESP32-WROOM & STM32 Microcontroller IoT Lab Starter Kit',
    category: 'Hardware Kits',
    price: '₹1,199',
    author: 'Robotics & Embedded Club',
    rating: 4.8,
    reviews: 64,
    badge: 'Tested & Working',
    description: 'Complete working kit with pre-soldered ESP32 development board, breadboard, OLED I2C display, DHT11, and ultrasonic distance sensors for college projects.',
    tag: 'Electronics & IoT',
    keywords: 'esp32, stm32, iot, breadboard, sensors, robotics',
    contactMethod: 'whatsapp',
    contactDetail: '9830123456',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-22'
  },
  {
    id: 'mkt-4',
    title: 'Microprocessor 8085 Physical Simulation Trainer Kit with Keypad',
    category: 'Hardware Kits',
    price: '₹2,450',
    author: 'ECE Hardware Collective',
    rating: 4.7,
    reviews: 38,
    badge: 'Lab Equipment',
    description: 'Physical 8085 trainer kit with 8255 PPI interface, pre-programmed monitor ROM, and 7-segment display for college assembly language practicals.',
    tag: 'ECE & EE',
    keywords: '8085, microprocessor, assembly language, trainer kit',
    contactMethod: 'whatsapp',
    contactDetail: '9831987654',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-22'
  },
  {
    id: 'mkt-5',
    title: 'Omega Mini Drafter with Precision Compass & Pine Drawing Board',
    category: 'Tools & Gear',
    price: '₹450',
    author: 'Subhashis Ghosh (Mechanical)',
    rating: 4.9,
    reviews: 95,
    badge: 'Good Condition',
    description: 'Pristine condition mini drafter with clamp, steel rule, and 24x36 inch pine-wood drawing board used for Engineering Graphics & Design.',
    tag: 'Mechanical & Civil',
    keywords: 'mini drafter, drawing board, engineering graphics, edg',
    contactMethod: 'whatsapp',
    contactDetail: '9874561230',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-23'
  },
  {
    id: 'mkt-6',
    title: 'Standard White University Lab Coat & Safety Glasses (Size 40)',
    category: 'Tools & Gear',
    price: '₹180',
    author: 'Debolina Paul (EE Dept)',
    rating: 4.8,
    reviews: 42,
    badge: 'Clean & Washed',
    description: '100% cotton laboratory apron required for Chemistry, Physics, and Electrical Workshop practicals. Clean, washed, no stains.',
    tag: 'Workshop',
    keywords: 'lab coat, apron, safety glasses, chemistry lab',
    contactMethod: 'whatsapp',
    contactDetail: '9832145678',
    imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-23'
  },
  {
    id: 'mkt-7',
    title: '1-on-1 DSA Problem-Solving & Technical Mock Interview Mentorship',
    category: 'Services',
    price: '₹199 / hr',
    author: 'Rahul Sen (Adobe SDE Intern)',
    rating: 4.95,
    reviews: 58,
    badge: 'Verified Mentor',
    description: 'Personalized 45-minute live debugging, dynamic programming intuition, and mock technical interview practice session on Google Meet.',
    tag: 'Mentorship',
    keywords: 'dsa, interview, coding, mentorship, leetcode',
    contactMethod: 'whatsapp',
    contactDetail: '9876501234',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-24'
  },
  {
    id: 'mkt-8',
    title: 'B.Tech Minor/Major Project Circuit Debugging & KiCad Review',
    category: 'Services',
    price: '₹350',
    author: 'Tech Support Guild',
    rating: 4.9,
    reviews: 29,
    badge: 'Project Support',
    description: 'Hardware circuit troubleshooting, schematic review in KiCad, and debugging Arduino/ESP32 sensor code before final college semester presentations.',
    tag: 'Project Guidance',
    keywords: 'project, circuit, debugging, kicad, arduino',
    contactMethod: 'whatsapp',
    contactDetail: '9876512345',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-24'
  }
];

export default function MarketplaceView({ isSidebarCollapsed = false, setCurrentView }) {
  const { currentUser, globalSearchQuery, setGlobalSearchQuery } = useDatabase();

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('learnopia_marketplace_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SEEDED_MARKETPLACE_ITEMS;
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localSearch, setLocalSearch] = useState(globalSearchQuery || '');
  const [copiedId, setCopiedId] = useState(null);
  const [toastNotice, setToastNotice] = useState(null);

  // Modal States
  const [showSellModal, setShowSellModal] = useState(false);
  const [activeBuyItem, setActiveBuyItem] = useState(null);
  const [inquiryCopied, setInquiryCopied] = useState(false);

  // New Listing Form State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Books & Notes');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemKeywords, setNewItemKeywords] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [newItemContactMethod, setNewItemContactMethod] = useState('whatsapp');
  const [newItemContactDetail, setNewItemContactDetail] = useState('');
  const [sellerName, setSellerName] = useState(currentUser?.name || '');

  // Synchronize global search query from navigation bar
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setLocalSearch(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  const CATEGORIES = [
    { id: 'all', label: 'All Items', icon: <ShoppingBag size={14} /> },
    { id: 'Books & Notes', label: 'Books & Notes', icon: <BookOpen size={14} /> },
    { id: 'Hardware Kits', label: 'Hardware Kits', icon: <Cpu size={14} /> },
    { id: 'Tools & Gear', label: 'Tools & Gear', icon: <Wrench size={14} /> },
    { id: 'Services', label: 'Services', icon: <Sparkles size={14} /> }
  ];

  const query = (localSearch || '').trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
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

  // Handle publishing new item
  const handlePublishListing = (e) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !newItemPrice.trim()) return;

    const formattedPrice = newItemPrice.startsWith('₹') || newItemPrice.toLowerCase().includes('free')
      ? newItemPrice
      : `₹${newItemPrice}`;

    const newListing = {
      id: `mkt-user-${Date.now()}`,
      title: newItemTitle.trim(),
      category: newItemCategory,
      price: formattedPrice,
      author: sellerName.trim() || currentUser?.name || 'Campus Student',
      sellerId: currentUser?.id || 'guest',
      rating: 5.0,
      reviews: 1,
      badge: 'Student Listing',
      description: newItemDesc.trim() || 'Verified student listing on campus exchange.',
      tag: newItemCategory,
      keywords: newItemKeywords.trim(),
      contactMethod: newItemContactMethod,
      contactDetail: newItemContactDetail.trim() || '9876543210',
      imageUrl: newItemImageUrl.trim() || null,
      isUserCreated: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newListing, ...items];
    setItems(updated);
    try {
      localStorage.setItem('learnopia_marketplace_items', JSON.stringify(updated));
    } catch {}

    showToast(`"${newItemTitle}" published to Marketplace!`);
    setShowSellModal(false);

    // Reset Form
    setNewItemTitle('');
    setNewItemPrice('');
    setNewItemDesc('');
    setNewItemKeywords('');
    setNewItemImageUrl('');
    setNewItemContactDetail('');
  };

  // Delete own listing
  const handleDeleteListing = (itemId) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    const updated = items.filter((i) => i.id !== itemId);
    setItems(updated);
    try {
      localStorage.setItem('learnopia_marketplace_items', JSON.stringify(updated));
    } catch {}
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

      {/* Header & Sell CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
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
            Buy & sell textbooks, lab kits, drawing drafters, and peer mentoring gear across campus.
          </p>
        </div>

        {/* Action: Sell Something Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowSellModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus size={15} />
            <span>Sell Something</span>
          </button>
        </div>
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
            const isOwner = item.isUserCreated || (currentUser && item.sellerId === currentUser.id);

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

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent-forest transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Author & Contact Info */}
                    <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono-tabular">
                      <User size={12} />
                      <span className="truncate max-w-[150px]">{item.author}</span>
                      <span>•</span>
                      <span className="capitalize">{item.contactMethod || 'WhatsApp'}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Keywords / Tags */}
                    {item.keywords && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.keywords.split(',').slice(0, 3).map((kw, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono-tabular px-1.5 py-0.2 rounded bg-subtle text-text-muted border border-border-subtle"
                          >
                            #{kw.trim()}
                          </span>
                        ))}
                      </div>
                    )}
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

                    {isOwner && (
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-red-50 hover:text-red-600 text-text-muted transition-colors cursor-pointer"
                        title="Remove My Listing"
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
          <div className="pt-2 flex items-center justify-center gap-3">
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
            <button
              onClick={() => setShowSellModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer"
            >
              List an Item
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL 1: BUY ITEM / CONNECT WITH SELLER
      ================================================================= */}
      {activeBuyItem && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setActiveBuyItem(null)}
        >
          <div
            className="w-full max-w-md bg-canvas border border-border-strong rounded-2xl shadow-2xl p-5 sm:p-6 relative space-y-4"
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
              <h4 className="text-sm font-bold text-text-primary line-clamp-1">
                {activeBuyItem.title}
              </h4>
              <p className="text-[11px] text-text-muted">
                Seller: <strong>{activeBuyItem.author}</strong>
              </p>
            </div>

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
                  <span>Copy Message Again</span>
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
        </div>
      )}

      {/* =================================================================
          MODAL 2: SELL SOMETHING (ADD NEW LISTING)
      ================================================================= */}
      {showSellModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-14 px-4 bg-black/40 backdrop-blur-xs overflow-y-auto pb-10 animate-in fade-in duration-150"
          onClick={() => setShowSellModal(false)}
        >
          <div
            className="w-full max-w-lg bg-canvas border border-border-strong rounded-2xl shadow-2xl p-5 sm:p-6 relative space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-sunken border border-border-subtle flex items-center justify-center text-text-primary">
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">List an Item for Sale</h3>
                  <p className="text-[11px] text-text-muted">Post your gear to the campus marketplace</p>
                </div>
              </div>
              <button
                onClick={() => setShowSellModal(false)}
                className="w-7 h-7 rounded-lg border border-border-subtle hover:bg-surface-hover flex items-center justify-center text-text-muted cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handlePublishListing} className="space-y-3.5">
              {/* Item Title */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Item Title / Heading *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omega Mini Drafter with Board, ESP32 Kit, GATE Notes..."
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-strong text-xs sm:text-sm bg-surface text-text-primary focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Category *
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-strong text-xs bg-surface text-text-primary focus:outline-none"
                  >
                    <option value="Books & Notes">Books & Notes</option>
                    <option value="Hardware Kits">Hardware Kits</option>
                    <option value="Tools & Gear">Tools & Gear</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Price (₹ or Free) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 450 or Free / Open"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-strong text-xs bg-surface text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Condition & Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the condition, semester used, included accessories..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-strong text-xs bg-surface text-text-primary focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Keywords / Tags */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Keywords & Search Tags (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. drafter, drawing, scale, first year (comma-separated)"
                  value={newItemKeywords}
                  onChange={(e) => setNewItemKeywords(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface text-text-primary text-xs focus:outline-none"
                />
              </div>

              {/* Image URL (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Image Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or leave empty"
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-surface text-text-primary text-xs focus:outline-none"
                />
                <p className="text-[10px] text-text-muted mt-0.5">
                  Share a direct web link or Unsplash image to showcase your gear.
                </p>
              </div>

              {/* Seller Name & Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border-subtle">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Your Name / Display *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subhashis (ME)"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-strong text-xs bg-surface text-text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Contact Method *
                  </label>
                  <select
                    value={newItemContactMethod}
                    onChange={(e) => setNewItemContactMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-strong text-xs bg-surface text-text-primary focus:outline-none"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="phone">Direct Phone Call</option>
                    <option value="linkedin">LinkedIn / Profile Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {newItemContactMethod === 'whatsapp'
                    ? 'WhatsApp Number (10 digits) *'
                    : newItemContactMethod === 'telegram'
                    ? 'Telegram Username or Link *'
                    : newItemContactMethod === 'phone'
                    ? 'Phone Number *'
                    : 'Profile / Contact Web Link *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    newItemContactMethod === 'whatsapp'
                      ? 'e.g. 9876543210'
                      : newItemContactMethod === 'telegram'
                      ? 'e.g. @username or t.me/username'
                      : newItemContactMethod === 'phone'
                      ? 'e.g. 9876543210'
                      : 'e.g. linkedin.com/in/username'
                  }
                  value={newItemContactDetail}
                  onChange={(e) => setNewItemContactDetail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border-strong text-xs bg-surface text-text-primary focus:outline-none font-mono-tabular"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Tag size={13} />
                  <span>Publish to Marketplace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
