/**
 * marketplaceStorage.js
 * Centralized marketplace lifecycle and persistence layer for Learn-O-Pia.
 *
 * Rules & Lifecycles:
 * 1. An item listed for sale is available on the public Marketplace for 5 months (150 days).
 * 2. After 5 months, it is hidden from the public Marketplace and remains in the seller's Studio for 1 month (30 days) grace period.
 * 3. During this 1-month Studio grace period, the seller can click "Relist in Marketplace" to renew it for another 5 months.
 * 4. If the seller does not relist it within that 1 month (180 days total), it is permanently purged/deleted from the database.
 */

export const MARKETPLACE_ACTIVE_MS = 150 * 24 * 60 * 60 * 1000; // 5 months (~150 days)
export const STUDIO_GRACE_MS = 30 * 24 * 60 * 60 * 1000;        // 1 month (~30 days)
export const PURGE_THRESHOLD_MS = MARKETPLACE_ACTIVE_MS + STUDIO_GRACE_MS; // 180 days total

export const SEEDED_MARKETPLACE_ITEMS = [
  {
    id: 'mkt-1',
    title: 'MAKAUT 1st & 2nd Year B.Tech Complete Organizer & Solved PYQs',
    category: 'Books & Notes',
    price: '₹150',
    author: 'Sneha Roy (CSE, 3rd Year)',
    sellerId: 'user-sneha',
    rating: 4.9,
    reviews: 142,
    badge: 'Verified Notes',
    description: 'Complete physical semester organizers for Engineering Mathematics, Basic Electrical, Physics, and Data Structures with handwritten step-by-step solutions.',
    tag: 'CSE & IT',
    keywords: 'organizer, pyq, makaut, mathematics, physics',
    contactMethod: 'whatsapp',
    contactDetail: '9876543210',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-20',
    listedAt: Date.now() - (4 * 86400000) // 4 days ago
  },
  {
    id: 'mkt-2',
    title: 'GATE CSE Comprehensive Handwritten Master Notebooks',
    category: 'Books & Notes',
    price: '₹299',
    author: 'Arjun Banerjee (Topper)',
    sellerId: 'user-arjun',
    rating: 5.0,
    reviews: 87,
    badge: 'Staff Pick',
    description: 'Color-coded handwritten notebooks covering Discrete Math, Algorithms, DBMS, OS, and CN with 15-year past question analysis.',
    tag: 'GATE Exam',
    keywords: 'gate, cse, algorithms, handwritten notes',
    contactMethod: 'telegram',
    contactDetail: 'arjun_gate_cse',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-21',
    listedAt: Date.now() - (3 * 86400000)
  },
  {
    id: 'mkt-3',
    title: 'ESP32-WROOM & STM32 Microcontroller IoT Lab Starter Kit',
    category: 'Hardware Kits',
    price: '₹1,199',
    author: 'Robotics & Embedded Club',
    sellerId: 'user-robotics',
    rating: 4.8,
    reviews: 64,
    badge: 'Tested & Working',
    description: 'Complete working kit with pre-soldered ESP32 development board, breadboard, OLED I2C display, DHT11, and ultrasonic distance sensors for college projects.',
    tag: 'Electronics & IoT',
    keywords: 'esp32, stm32, iot, breadboard, sensors, robotics',
    contactMethod: 'whatsapp',
    contactDetail: '9830123456',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-22',
    listedAt: Date.now() - (2 * 86400000)
  },
  {
    id: 'mkt-4',
    title: 'Microprocessor 8085 Physical Simulation Trainer Kit with Keypad',
    category: 'Hardware Kits',
    price: '₹2,450',
    author: 'ECE Hardware Collective',
    sellerId: 'user-ece',
    rating: 4.7,
    reviews: 38,
    badge: 'Lab Equipment',
    description: 'Physical 8085 trainer kit with 8255 PPI interface, pre-programmed monitor ROM, and 7-segment display for college assembly language practicals.',
    tag: 'ECE & EE',
    keywords: '8085, microprocessor, assembly language, trainer kit',
    contactMethod: 'whatsapp',
    contactDetail: '9831987654',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-22',
    listedAt: Date.now() - (2 * 86400000)
  },
  {
    id: 'mkt-5',
    title: 'Omega Mini Drafter with Precision Compass & Pine Drawing Board',
    category: 'Tools & Gear',
    price: '₹450',
    author: 'Subhashis Ghosh (Mechanical)',
    sellerId: 'user-subhashis',
    rating: 4.9,
    reviews: 95,
    badge: 'Good Condition',
    description: 'Pristine condition mini drafter with clamp, steel rule, and 24x36 inch pine-wood drawing board used for Engineering Graphics & Design.',
    tag: 'Mechanical & Civil',
    keywords: 'mini drafter, drawing board, engineering graphics, edg',
    contactMethod: 'whatsapp',
    contactDetail: '9874561230',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-23',
    listedAt: Date.now() - (1 * 86400000)
  },
  {
    id: 'mkt-6',
    title: 'Standard White University Lab Coat & Safety Glasses (Size 40)',
    category: 'Tools & Gear',
    price: '₹180',
    author: 'Debolina Paul (EE Dept)',
    sellerId: 'user-debolina',
    rating: 4.8,
    reviews: 42,
    badge: 'Clean & Washed',
    description: '100% cotton laboratory apron required for Chemistry, Physics, and Electrical Workshop practicals. Clean, washed, no stains.',
    tag: 'Workshop',
    keywords: 'lab coat, apron, safety glasses, chemistry lab',
    contactMethod: 'whatsapp',
    contactDetail: '9832145678',
    imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-23',
    listedAt: Date.now() - (1 * 86400000)
  },
  {
    id: 'mkt-7',
    title: '1-on-1 DSA Problem-Solving & Technical Mock Interview Mentorship',
    category: 'Services',
    price: '₹199 / hr',
    author: 'Rahul Sen (Adobe SDE Intern)',
    sellerId: 'user-rahul',
    rating: 4.95,
    reviews: 58,
    badge: 'Verified Mentor',
    description: 'Personalized 45-minute live debugging, dynamic programming intuition, and mock technical interview practice session on Google Meet.',
    tag: 'Mentorship',
    keywords: 'dsa, interview, coding, mentorship, leetcode',
    contactMethod: 'whatsapp',
    contactDetail: '9876501234',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-24',
    listedAt: Date.now() - 3600000
  },
  {
    id: 'mkt-8',
    title: 'B.Tech Minor/Major Project Circuit Debugging & KiCad Review',
    category: 'Services',
    price: '₹350',
    author: 'Tech Support Guild',
    sellerId: 'user-guild',
    rating: 4.9,
    reviews: 29,
    badge: 'Project Support',
    description: 'Hardware circuit troubleshooting, schematic review in KiCad, and debugging Arduino/ESP32 sensor code before final college semester presentations.',
    tag: 'Project Guidance',
    keywords: 'project, circuit, debugging, kicad, arduino',
    contactMethod: 'whatsapp',
    contactDetail: '9876512345',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    createdAt: '2026-10-24',
    listedAt: Date.now() - 1800000
  }
];

const STORAGE_KEY = 'learnopia_marketplace_items';

/**
 * Load all items, purging any item whose total lifetime >= 180 days (5 months + 1 month).
 */
export function getAllMarketplaceItems() {
  const now = Date.now();
  let items = [];

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      items = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading marketplace items:', err);
  }

  if (!Array.isArray(items) || items.length === 0) {
    items = SEEDED_MARKETPLACE_ITEMS;
    saveAllMarketplaceItems(items);
    return items;
  }

  // Ensure all items have listedAt timestamp
  let updatedAny = false;
  items = items.map(item => {
    if (!item.listedAt) {
      item.listedAt = item.createdAt ? new Date(item.createdAt).getTime() : now;
      updatedAny = true;
    }
    return item;
  });

  // Purge items that exceeded 180 days total (5 months active + 1 month Studio grace period)
  const nonPurgedItems = items.filter(item => {
    const age = now - (item.listedAt || now);
    return age < PURGE_THRESHOLD_MS;
  });

  if (nonPurgedItems.length !== items.length || updatedAny) {
    saveAllMarketplaceItems(nonPurgedItems);
  }

  return nonPurgedItems;
}

/**
 * Save all items to localStorage and notify all listeners.
 */
export function saveAllMarketplaceItems(items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('learnopia_marketplace_updated'));
  } catch (err) {
    console.error('Failed to save marketplace items:', err);
  }
}

/**
 * Get only items currently active on the public Marketplace (< 5 months / 150 days).
 */
export function getActiveMarketplaceItems() {
  const now = Date.now();
  const all = getAllMarketplaceItems();
  return all.filter(item => {
    const age = now - (item.listedAt || now);
    return age < MARKETPLACE_ACTIVE_MS;
  });
}

/**
 * Get items belonging to the current user (active or in Studio grace period).
 */
export function getUserStudioListings(user) {
  const now = Date.now();
  const all = getAllMarketplaceItems();
  const userId = user?.id || '';
  const userName = (user?.name || '').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();

  return all
    .filter(item => {
      const matchId = item.sellerId && item.sellerId === userId;
      const matchAuthor = (item.author || '').toLowerCase() === userName;
      const matchContact = (item.contactDetail || '').toLowerCase() === userEmail;
      const isUserCreated = item.isUserCreated && (userId === 'guest' || !item.sellerId || item.sellerId === userId);
      return matchId || matchAuthor || matchContact || isUserCreated;
    })
    .map(item => {
      const listedAt = item.listedAt || now;
      const ageMs = now - listedAt;
      const isMarketplaceActive = ageMs < MARKETPLACE_ACTIVE_MS;
      const isInStudioGrace = ageMs >= MARKETPLACE_ACTIVE_MS && ageMs < PURGE_THRESHOLD_MS;

      const daysLeftOnMarketplace = Math.max(0, Math.ceil((MARKETPLACE_ACTIVE_MS - ageMs) / (24 * 60 * 60 * 1000)));
      const daysLeftInGrace = Math.max(0, Math.ceil((PURGE_THRESHOLD_MS - ageMs) / (24 * 60 * 60 * 1000)));

      return {
        ...item,
        ageMs,
        isMarketplaceActive,
        isInStudioGrace,
        daysLeftOnMarketplace,
        daysLeftInGrace
      };
    });
}

/**
 * Add a new listing directly from Studio.
 */
export function addMarketplaceListing(itemData) {
  const now = Date.now();
  const all = getAllMarketplaceItems();
  const newListing = {
    id: `mkt-${now}`,
    listedAt: now,
    createdAt: new Date().toISOString().split('T')[0],
    isUserCreated: true,
    rating: 5.0,
    reviews: 0,
    ...itemData
  };

  const updated = [newListing, ...all];
  saveAllMarketplaceItems(updated);
  return newListing;
}

/**
 * Renew / Relist an item for another 5 months on the public Marketplace.
 */
export function relistMarketplaceListing(itemId) {
  const now = Date.now();
  const all = getAllMarketplaceItems();
  const updated = all.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        listedAt: now,
        renewedAt: now
      };
    }
    return item;
  });
  saveAllMarketplaceItems(updated);
}

/**
 * Delete an item from the database.
 */
export function deleteMarketplaceListing(itemId) {
  const all = getAllMarketplaceItems();
  const updated = all.filter(item => item.id !== itemId);
  saveAllMarketplaceItems(updated);
}
