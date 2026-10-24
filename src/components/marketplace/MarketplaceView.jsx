import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Tag,
  Star,
  ExternalLink,
  BookOpen,
  Cpu,
  FileCheck,
  Users,
  ShieldCheck,
  Check,
  Copy,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const MARKETPLACE_ITEMS = [
  {
    id: 'mkt-1',
    title: 'GATE CS 2027 Comprehensive Handwritten Master Notes',
    category: 'Handwritten Notes',
    price: 'Free / Open',
    author: 'Toppers Circle (IIT Kharagpur)',
    rating: 4.9,
    reviews: 142,
    badge: 'Verified Staff Pick',
    description: 'High-yield color-coded notes covering Discrete Mathematics, Algorithms, DBMS, and OS with previous 15 years solved questions.',
    tag: 'Computer Science',
    type: 'notes'
  },
  {
    id: 'mkt-2',
    title: 'ESP32 & STM32 IoT Starter Lab Kit with Breadboard & Sensors',
    category: 'Hardware Kits',
    price: '₹1,249',
    author: 'Embedded Systems Lab Club',
    rating: 4.8,
    reviews: 68,
    badge: 'Hardware Verified',
    description: 'Pre-soldered ESP32-WROOM-32 development board bundled with ultrasonic, temperature, and OLED I2C display for college minor projects.',
    tag: 'Electronics & IoT',
    type: 'hardware'
  },
  {
    id: 'mkt-3',
    title: 'MAKAUT 2nd Year B.Tech Complete Organizer (All Subjects)',
    category: 'Semester Organizers',
    price: 'Free / Open',
    author: 'Learn-O-Pia Academic Circle',
    rating: 4.95,
    reviews: 310,
    badge: 'Popular',
    description: 'Chapter-wise syllabus question banks with step-by-step mathematical proofs and university model answer guidelines.',
    tag: 'B.Tech Core',
    type: 'notes'
  },
  {
    id: 'mkt-4',
    title: 'Microprocessor 8085/8086 Physical Simulation Trainer Kit',
    category: 'Hardware Kits',
    price: '₹2,499',
    author: 'ECE Hardware Collective',
    rating: 4.7,
    reviews: 43,
    badge: 'Lab Equipment',
    description: 'Hex keypad microprocessor kit with 8255 PPI interface and pre-programmed monitor ROM for assembly language practicals.',
    tag: 'ECE & EE',
    type: 'hardware'
  },
  {
    id: 'mkt-5',
    title: 'Engineering Mathematics Calculus & Linear Algebra Cheat Sheet',
    category: 'Handwritten Notes',
    price: 'Free / Open',
    author: 'Prof. Miller Study Desk',
    rating: 5.0,
    reviews: 189,
    badge: 'Essential',
    description: '12-page laminated formula guide with vector calculus theorems (Green, Gauss, Stokes) and matrix eigenvalue tricks.',
    tag: 'Math & Physics',
    type: 'notes'
  },
  {
    id: 'mkt-6',
    title: '1-on-1 Code Review & Core Data Structures Mentorship',
    category: 'Peer Mentorship',
    price: '₹299 / hr',
    author: 'Rahul Sen (Senior Engineer @ Adobe)',
    rating: 4.9,
    reviews: 54,
    badge: 'Verified Mentor',
    description: 'Personalized 45-minute live debugging, dynamic programming intuition, and mock technical interview session via Google Meet.',
    tag: 'Mentorship',
    type: 'service'
  }
];

export default function MarketplaceView({ isSidebarCollapsed = false, setCurrentView }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const CATEGORIES = [
    { id: 'all', label: 'All Items' },
    { id: 'Handwritten Notes', label: 'Handwritten Notes' },
    { id: 'Hardware Kits', label: 'Hardware Kits' },
    { id: 'Semester Organizers', label: 'Semester Organizers' },
    { id: 'Peer Mentorship', label: 'Peer Mentorship' }
  ];

  const filteredItems = useMemo(() => {
    return MARKETPLACE_ITEMS.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopyLink = (item) => {
    const link = `${window.location.origin}/#marketplace-${item.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 space-y-6 animate-fade-in">
      {/* Top Header & Connected Platform Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-accent-forest/10 text-accent-forest border border-accent-forest/20">
              ACADEMIC EXCHANGE
            </span>
            <span className="text-xs text-text-muted font-mono-tabular">
              Connected Project Hub
            </span>
          </div>
          <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight font-editorial text-text-primary">
            Student Academic Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Discover peer-contributed handwritten notes, university exam organizers, and hardware laboratory kits.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-tabular transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-accent-ink text-text-on-dark font-bold'
                    : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover font-medium'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Listing Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search notes, hardware kits, mentors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-border-subtle bg-surface text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-border-strong font-mono-tabular"
          />
        </div>
        <div className="text-xs text-text-muted font-mono-tabular">
          SHOWING {filteredItems.length} VERIFIED ACADEMIC LISTINGS
        </div>
      </div>

      {/* Grid of Marketplace Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-xl p-5 border border-border-subtle bg-surface hover:border-border-strong hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded bg-subtle text-text-secondary border border-border-subtle">
                  {item.category}
                </span>
                <span className="text-xs font-bold text-accent-forest font-mono-tabular">
                  {item.price}
                </span>
              </div>

              {/* Title & Author */}
              <h3 className="text-base font-bold text-text-primary group-hover:text-accent-forest transition-colors line-clamp-2">
                {item.title}
              </h3>
              <p className="text-xs text-text-muted mt-1 font-mono-tabular flex items-center gap-1.5">
                <span>{item.author}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                  <Star size={11} fill="currentColor" /> {item.rating}
                </span>
                <span className="text-[11px]">({item.reviews})</span>
              </p>

              {/* Description */}
              <p className="text-xs text-text-secondary mt-2.5 line-clamp-3 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="mt-5 pt-3.5 border-t border-border-subtle flex items-center justify-between">
              <button
                onClick={() => handleCopyLink(item)}
                className="text-xs font-mono-tabular text-text-muted hover:text-text-primary flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy direct share link"
              >
                {copiedId === item.id ? (
                  <>
                    <Check size={13} className="text-accent-forest" />
                    <span className="text-accent-forest font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Share Link</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Connecting you to "${item.title}". Linked to your previous marketplace project!`)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Explore Item</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 p-8 rounded-xl border border-border-subtle bg-surface space-y-3">
          <ShoppingBag size={36} className="text-text-muted mx-auto" />
          <h3 className="text-base font-bold text-text-primary">No marketplace items found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Try adjusting your search terms or select "All Items" to browse all university kits and notes.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-ink text-text-on-dark hover:opacity-95 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
