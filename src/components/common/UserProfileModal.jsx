/**
 * UserProfileModal.jsx
 * Standalone, high-craft modal for inspecting any student, creator, or seller profile.
 * Accessible across the Admin User Directories, Verification Queues, and Marketplace.
 */

import React, { useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Sparkles,
  Award,
  BookOpen,
  ShoppingBag,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useDatabase, getUserDesignation } from '../../context/DatabaseContext';

export default function UserProfileModal({ user, onClose }) {
  const {
    currentUser,
    users,
    adminVerifyUser,
    makeAdmin,
    changeUserRole,
    suspendUser,
    activateUser,
    marketplaceItems
  } = useDatabase();

  // Find latest record from database users list if available
  const activeUser = users?.find(u => u.id === user?.id || u.email === user?.email) || user;

  const isAdminOrOwner = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.isAdmin);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!activeUser) return null;

  const formattedDesignation = getUserDesignation ? getUserDesignation(activeUser) : (activeUser.name || 'User');
  const userInitials = activeUser.name
    ? activeUser.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Count marketplace items listed by this user
  const sellerListings = marketplaceItems
    ? marketplaceItems.filter(item => item.sellerId === activeUser.id || item.author === activeUser.name)
    : [];

  const calculatedSemesters = activeUser.totalSemesters ||
    (activeUser.passingYear && activeUser.joiningYear
      ? Math.max(1, (parseInt(activeUser.passingYear, 10) - parseInt(activeUser.joiningYear, 10)) * 2)
      : 8);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-surface border border-border-subtle rounded-2xl shadow-modal text-text-primary my-auto relative space-y-5 p-5 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer shadow-xs z-10"
          title="Close profile (Esc)"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Profile Hero Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1 border-b border-border-subtle pb-5">
          {/* Centered & Cropped DP Frame */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border-strong bg-subtle shrink-0 shadow-md relative flex items-center justify-center">
            {activeUser.picture ? (
              <img
                src={activeUser.picture}
                alt={activeUser.name}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="font-mono-tabular font-bold text-xl sm:text-2xl text-text-primary">
                {userInitials}
              </span>
            )}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                {formattedDesignation}
              </h2>

              {/* Verification Badge */}
              {activeUser.isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-forest-bg text-accent-forest border border-border-pill-safe">
                  <CheckCircle2 size={12} />
                  <span>
                    {activeUser.verificationType === 'professor'
                      ? 'Verified Professor'
                      : activeUser.verificationType === 'creator'
                      ? 'Verified Creator'
                      : 'Verified Student'}
                  </span>
                </span>
              ) : activeUser.verificationStatus === 'pending' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-amber-bg text-accent-amber border border-border-pill-alert">
                  <Clock size={12} />
                  <span>ID Verification Pending</span>
                </span>
              ) : activeUser.verificationStatus === 'rejected' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-danger-bg text-accent-danger border border-border-pill-danger">
                  <XCircle size={12} />
                  <span>Verification Rejected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-subtle text-text-muted border border-border-subtle">
                  Unverified Account
                </span>
              )}

              {/* Status Badge */}
              {activeUser.status === 'suspended' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-danger-bg text-accent-danger border border-border-pill-danger">
                  Suspended
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-subtle text-text-secondary border border-border-subtle">
                  Active
                </span>
              )}
            </div>

            <p className="text-xs font-mono-tabular text-text-muted truncate">
              {activeUser.username || `@${(activeUser.name || 'user').toLowerCase().replace(/\s+/g, '')}`}
              {activeUser.role && (
                <span className="ml-2 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-subtle text-text-secondary border border-border-subtle">
                  {activeUser.role}
                </span>
              )}
            </p>

            {activeUser.college && (
              <p className="text-xs text-text-secondary flex items-center gap-1.5 pt-0.5">
                <Building size={13} className="shrink-0 text-text-muted" />
                <span className="truncate">{activeUser.college}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl border border-border-subtle bg-surface-sunken space-y-1">
            <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-text-muted flex items-center gap-1">
              <Mail size={12} /> Email Address
            </span>
            <a
              href={`mailto:${activeUser.email}`}
              className="font-mono-tabular font-medium text-text-primary hover:underline truncate block"
            >
              {activeUser.email || 'Not provided'}
            </a>
          </div>

          <div className="p-3 rounded-xl border border-border-subtle bg-surface-sunken space-y-1">
            <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-text-muted flex items-center gap-1">
              <Phone size={12} /> WhatsApp / Phone
            </span>
            <p className="font-mono-tabular font-medium text-text-primary truncate">
              {activeUser.phone || 'Not provided'}
            </p>
          </div>
        </div>

        {/* Academic Profile Details */}
        <div className="p-4 rounded-xl border border-border-subtle bg-surface-sunken space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 font-mono-tabular">
              <GraduationCap size={14} className="text-accent-forest" />
              <span>Academic & University Credentials</span>
            </h4>
            <span className="text-[10px] font-mono-tabular font-semibold text-text-muted">
              {calculatedSemesters} Semesters Program
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-text-muted block font-mono-tabular">COURSE / DEGREE</span>
              <span className="font-semibold text-text-primary block">
                {activeUser.courseName || 'Not specified'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-muted block font-mono-tabular">DEPARTMENT / BRANCH</span>
              <span className="font-semibold text-text-primary block">
                {activeUser.department || 'Not specified'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-muted block font-mono-tabular">ACADEMIC TENURE</span>
              <span className="font-semibold text-text-primary font-mono-tabular block">
                {activeUser.joiningYear || '2023'} &rarr; {activeUser.passingYear || '2027'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-text-muted block font-mono-tabular">DATE OF BIRTH</span>
              <span className="font-semibold text-text-primary font-mono-tabular block">
                {activeUser.dob || 'Not provided'}
              </span>
            </div>

            {activeUser.interests && (
              <div className="col-span-full pt-1">
                <span className="text-[10px] text-text-muted block font-mono-tabular mb-1">AREAS OF INTEREST</span>
                <p className="text-xs text-text-secondary leading-relaxed bg-surface p-2.5 rounded-lg border border-border-subtle">
                  {activeUser.interests}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submitted ID Document Link (For Verification Review) */}
        {activeUser.idCardLink && (
          <div className="p-3.5 rounded-xl border border-accent-forest/30 bg-accent-forest/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent-forest font-mono-tabular">
                <ShieldCheck size={14} />
                <span>Submitted Identity Card / Document Link</span>
              </div>
              <span className="text-[10px] font-mono-tabular uppercase px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-text-secondary">
                {activeUser.verificationType || 'Student'}
              </span>
            </div>
            <p className="text-xs text-text-secondary truncate font-mono-tabular">
              {activeUser.idCardLink}
            </p>
            <div className="pt-1">
              <a
                href={activeUser.idCardLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 shadow-xs transition-opacity"
              >
                <span>Inspect Document Link</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Marketplace Listings (if user is a seller) */}
        {sellerListings.length > 0 && (
          <div className="p-3.5 rounded-xl border border-border-subtle bg-surface-sunken space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-text-primary">
                <ShoppingBag size={14} className="text-accent-forest" />
                <span>Active Marketplace Listings</span>
              </div>
              <span className="text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded-full bg-subtle text-text-secondary">
                {sellerListings.length} {sellerListings.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {sellerListings.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg border border-border-subtle bg-surface flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-text-primary truncate">{item.title}</span>
                  <span className="font-mono-tabular font-bold text-accent-forest shrink-0 ml-2">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Administrative Quick Actions (Only rendered if viewer is Admin or Owner) */}
        {isAdminOrOwner && (
          <div className="p-4 rounded-xl border border-border-strong bg-subtle/50 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted font-mono-tabular">
              <span className="flex items-center gap-1.5">
                <Shield size={14} className="text-accent-amber" />
                <span>Admin Moderation Controls</span>
              </span>
              <span className="text-[10px] text-text-muted lowercase">Role: {activeUser.role}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Verification Actions */}
              {activeUser.verificationStatus === 'pending' || !activeUser.isVerified ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (adminVerifyUser) await adminVerifyUser(activeUser.id, 'verified');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-forest-bg text-accent-forest border border-border-pill-safe hover:opacity-90 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Check size={13} />
                  <span>Approve & Verify Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (adminVerifyUser) await adminVerifyUser(activeUser.id, 'unverified');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-secondary cursor-pointer"
                >
                  Reset Verification
                </button>
              )}

              {activeUser.verificationStatus === 'pending' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (adminVerifyUser) await adminVerifyUser(activeUser.id, 'rejected');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-danger-bg text-accent-danger border border-border-pill-danger hover:opacity-90 cursor-pointer flex items-center gap-1.5"
                >
                  <X size={13} />
                  <span>Reject Application</span>
                </button>
              )}

              {/* Promote to Admin */}
              {activeUser.role !== 'admin' && activeUser.role !== 'owner' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (makeAdmin) await makeAdmin(activeUser.id);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-subtle hover:bg-surface-hover text-text-primary cursor-pointer flex items-center gap-1"
                >
                  <Award size={13} />
                  <span>Promote Admin</span>
                </button>
              )}

              {/* Suspend or Activate Account */}
              {activeUser.role !== 'owner' && (
                activeUser.status === 'suspended' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (activateUser) await activateUser(activeUser.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-accent-forest-bg text-accent-forest border border-border-pill-safe hover:opacity-90 cursor-pointer"
                  >
                    Activate Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (suspendUser) await suspendUser(activeUser.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/30 cursor-pointer"
                  >
                    Suspend Account
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 flex justify-end border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-accent-ink text-text-on-dark hover:opacity-95 transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
