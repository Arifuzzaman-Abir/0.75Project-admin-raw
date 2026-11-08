import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  FileText, 
  Download, 
  Pin, 
  Search, 
  Calendar, 
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Bell,
  Shield
} from 'lucide-react';
import { Announcement, ClubCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface AnnouncementsPageProps {
  announcements: Announcement[];
  selectedNotice: Announcement | null;
  setSelectedNotice: (notice: Announcement | null) => void;
  setActiveTab: (tab: string) => void;
  onRefreshAnnouncements?: () => void;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({
  announcements,
  selectedNotice,
  setSelectedNotice,
  setActiveTab,
  onRefreshAnnouncements
}) => {
  const { user, role, loginAsDemo } = useAuth();
  const isAdmin = role === 'administrator';

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [clubFilter, setClubFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation & Editing Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'important' | 'general' | 'competition'>('general');
  const [category, setCategory] = useState('Official Circular');
  const [clubId, setClubId] = useState<ClubCategory | 'all'>('all');
  const [imageUrl, setImageUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [pinned, setPinned] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');

  // Processing & Toast feedback
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (selectedNotice) {
      setSearchQuery(selectedNotice.title);
      setSelectedNotice(null);
    }
  }, [selectedNotice, setSelectedNotice]);

  // Open creation modal
  const handleOpenCreateModal = () => {
    setEditingNoticeId(null);
    setTitle('');
    setContent('');
    setPriority('general');
    setCategory('Official Circular');
    setClubId('all');
    setImageUrl('');
    setAttachmentName('');
    setPinned(false);
    setAuthorName(user?.name || 'Md Arifuzzaman Abir');
    setAuthorRole('Chief Administrator');
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (notice: Announcement) => {
    setEditingNoticeId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setPriority(notice.priority);
    setCategory(notice.category);
    setClubId(notice.clubId);
    setImageUrl(notice.imageUrl || '');
    setAttachmentName(notice.attachmentName || '');
    setPinned(notice.pinned);
    setAuthorName(notice.authorName);
    setAuthorRole(notice.authorRole);
    setIsModalOpen(true);
  };

  // Handle image upload from computer
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save (Create or Update) Notice
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setToastMessage({ type: 'error', text: 'Please fill in both title and content.' });
      return;
    }

    setIsProcessing(true);
    const payload = {
      title: title.trim(),
      content: content.trim(),
      priority,
      category,
      clubId,
      imageUrl: imageUrl.trim() || undefined,
      attachmentName: attachmentName.trim() || undefined,
      pinned,
      authorName: authorName.trim() || user?.name || 'Md Arifuzzaman Abir',
      authorRole: authorRole.trim() || 'Chief Administrator'
    };

    try {
      if (editingNoticeId) {
        const res = await api.updateAnnouncement(editingNoticeId, payload, user?.id);
        if (res.success) {
          setToastMessage({ type: 'success', text: 'Notice updated & re-announced successfully!' });
        } else {
          setToastMessage({ type: 'error', text: res.message || 'Failed to update notice.' });
        }
      } else {
        const res = await api.createAnnouncement(payload, user?.id);
        if (res.success) {
          setToastMessage({ type: 'success', text: 'New notice announced & published to notice board!' });
        } else {
          setToastMessage({ type: 'error', text: res.message || 'Failed to announce notice.' });
        }
      }

      setIsProcessing(false);
      setIsModalOpen(false);
      if (onRefreshAnnouncements) onRefreshAnnouncements();
    } catch (err: any) {
      setIsProcessing(false);
      setToastMessage({ type: 'error', text: err.message || 'Network error saving notice.' });
    }
  };

  // Remove Notice (direct removal without blocked window.confirm)
  const handleRemoveNotice = async (notice: Announcement) => {
    try {
      const res = await api.deleteAnnouncement(notice.id, user?.id);
      if (res.success) {
        setToastMessage({ type: 'success', text: `Notice "${notice.title.slice(0, 30)}..." removed successfully.` });
        if (onRefreshAnnouncements) onRefreshAnnouncements();
      } else {
        setToastMessage({ type: 'error', text: res.message || 'Failed to remove notice.' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error removing notice.' });
    }
  };

  // Toggle Pinned
  const handleTogglePin = async (notice: Announcement) => {
    try {
      const res = await api.updateAnnouncement(notice.id, { pinned: !notice.pinned }, user?.id);
      if (res.success) {
        setToastMessage({ 
          type: 'success', 
          text: notice.pinned ? 'Notice unpinned from top.' : 'Notice pinned to top of board!' 
        });
        if (onRefreshAnnouncements) onRefreshAnnouncements();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: 'Could not toggle pinned status.' });
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
    if (clubFilter !== 'all' && a.clubId !== clubFilter && a.clubId !== 'all') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500'
            : 'bg-red-600 text-white border-red-500'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-8">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-[#D40000] dark:text-red-300 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" /> Official University Circulars
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono font-semibold">
              {announcements.length} Total Notices
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-neutral-900 dark:text-white">
            CUEC Notice Board & Press Releases
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Central circulars, official notifications, and press releases governed by City University Student Welfare and Club Directorate.
          </p>
        </div>

        {/* Administrator Actions Header Cluster */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          {isAdmin ? (
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-[#D40000] hover:bg-red-800 active:scale-98 text-white font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-2"
              title="Publish and announce a new official circular"
            >
              <Plus className="w-4 h-4" />
              <span>Announce Notice</span>
            </button>
          ) : (
            <button
              onClick={() => loginAsDemo('administrator')}
              className="px-4 py-2.5 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-2"
              title="Authenticate as Administrator to create and manage notices"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Mode (Create / Remove Notices)</span>
            </button>
          )}
        </div>
      </div>



      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search notices by keyword, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
            />
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent Circulars</option>
              <option value="competition">🏆 Contests & Auditions</option>
              <option value="important">⚠️ Important Notices</option>
              <option value="general">ℹ️ General Updates</option>
            </select>
          </div>

          <div>
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-medium"
            >
              <option value="all">All Club Entities</option>
              <option value="computer_club">Computer Club (CUCC)</option>
              <option value="events_and_clubs">Events & Clubs</option>
            </select>
          </div>

        </div>
      </div>

      {/* Notice Board List Layout */}
      {filteredAnnouncements.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#141520] border border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
          <Bell className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="font-bold text-base text-neutral-900 dark:text-white">
            No notices match your filters
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search query or priority filters, or create a new notice as administrator.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#D40000] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Announce First Notice</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((item) => {
            const isUrgent = item.priority === 'urgent';
            const isCompetition = item.priority === 'competition';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all p-5 sm:p-6 shadow-xs relative ${
                  item.pinned
                    ? 'bg-red-50/50 dark:bg-[#200A13] border-red-300 dark:border-red-900/70 ring-1 ring-red-400/20'
                    : 'bg-white dark:bg-[#18050E] border-neutral-200 dark:border-[#380E1C] hover:border-red-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D40000] text-white font-bold text-[10px] uppercase shadow-xs">
                        <Pin className="w-3 h-3 fill-current" /> Pinned
                      </span>
                    )}
                    {isUrgent && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px] uppercase shadow-xs">
                        <Flame className="w-3 h-3 text-amber-300" /> Urgent
                      </span>
                    )}
                    {isCompetition && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px] uppercase shadow-xs">
                        Contest Alert
                      </span>
                    )}
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                      {item.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                      {item.clubId === 'all' ? 'All Wings' : item.clubId === 'computer_club' ? 'Computer Club' : 'Events & Clubs'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span>
                      Ref: #{item.id.toUpperCase()}
                    </span>

                    {/* Administrator In-Place Card Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 pl-2 border-l border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={() => handleTogglePin(item)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.pinned 
                              ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-950/60' 
                              : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                          }`}
                          title={item.pinned ? 'Unpin Notice' : 'Pin Notice to Top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Edit Notice"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveNotice(item)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors cursor-pointer"
                          title="Remove Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Body */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white font-heading">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>

                  {/* Attached Notice Poster Image */}
                  {item.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-h-80 w-full max-w-2xl bg-neutral-900 shadow-xs">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover max-h-80"
                      />
                    </div>
                  )}

                  {/* Attachment Simulation */}
                  {item.attachmentName && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                      <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="font-semibold">{item.attachmentName}</span>
                      <span className="text-[10px] text-neutral-500">(Official Circular PDF)</span>
                      <Download className="w-3.5 h-3.5 ml-2 text-neutral-500" />
                    </div>
                  )}
                </div>

                {/* Author & Verification Footer */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between text-xs text-neutral-500 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950 text-[#D40000] dark:text-red-400 flex items-center justify-center font-bold text-[10px]">
                      CU
                    </div>
                    <span>
                      Signatory: <strong className="text-neutral-800 dark:text-neutral-200">{item.authorName}</strong> ({item.authorRole})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleRemoveNotice(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900/60 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          ADMINISTRATOR CREATE / EDIT NOTICE MODAL
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151622] border border-neutral-200 dark:border-[#382026] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#D40000] via-[#8F0000] to-[#500000] p-6 text-white relative">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-red-950 text-[10px] font-extrabold uppercase tracking-wider">
                  {editingNoticeId ? 'Update Circular' : 'New Circular Announcement'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-100 bg-black/30 px-2.5 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-amber-300" /> Administrator Console
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold font-heading">
                {editingNoticeId ? 'Edit & Re-announce Notice' : 'Announce Official Notice'}
              </h3>
              <p className="text-xs text-red-100 mt-1">
                Announcements published here appear immediately across the Official Notice Board and Ticker.
              </p>

              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNotice} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule of 2026 Intra-University Programming Contest (IUPC)"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10111A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10111A] text-neutral-900 dark:text-white"
                  >
                    <option value="general">ℹ️ General Notice</option>
                    <option value="important">⚠️ Important</option>
                    <option value="urgent">🔴 Urgent Circular</option>
                    <option value="competition">🏆 Contest / Audition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Circular, Contest, Workshop"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10111A] text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Target Club Wing
                  </label>
                  <select
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10111A] text-neutral-900 dark:text-white font-medium"
                  >
                    <option value="all">All Clubs & Wings</option>
                    <option value="computer_club">Computer Club (CUCC)</option>
                    <option value="events_and_clubs">Events & Clubs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Notice Content / Circular Body *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide complete official details of the announcement, instructions for students, dates, and requirements..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10111A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Signatory / Author Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Md Arifuzzaman Abir"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10111A] text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Signatory Designation
                  </label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="Chief Administrator & Central Convener"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10111A] text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Poster Image / Attachment Upload & URL */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#11121C] border border-neutral-200 dark:border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                  Media & Circular Poster Attachment (Optional)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">
                      Poster Image URL
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#171824] text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-500 mb-1">
                      Upload Poster Image
                    </label>
                    <label className="w-full px-3 py-1.5 text-xs rounded-xl border border-dashed border-neutral-400 dark:border-neutral-600 bg-white dark:bg-[#171824] text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-1.5 cursor-pointer hover:border-[#D40000]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imageUrl ? 'Replace Image File' : 'Browse Local Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">
                    Downloadable Attachment Name
                  </label>
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="e.g. Official_Circular_Schedule_2026.pdf"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#171824] text-neutral-900 dark:text-white"
                  />
                </div>

                {imageUrl && (
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-700 shadow-xs">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Pin to Top Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinned-checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded text-[#D40000] focus:ring-[#D40000] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pinned-checkbox" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-[#D40000]" />
                  <span>Pin this notice to the top of the Notice Board</span>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-[#D40000] hover:bg-red-800 active:scale-98 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>{isProcessing ? 'Publishing...' : editingNoticeId ? 'Save & Announce Changes' : 'Announce Notice Now'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
