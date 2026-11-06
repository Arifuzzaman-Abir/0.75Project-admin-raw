import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  CheckCircle, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserPlus,
  Users,
  Shield,
  Filter,
  CalendarDays,
  Check,
  Trash2,
  Lock
} from 'lucide-react';
import { ClubEvent, EventRegistration, ClubSubsector } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface EventsPageProps {
  events: ClubEvent[];
  onEventRegistered: (updatedEvent: ClubEvent, registration: EventRegistration) => void;
  selectedEventForModal: ClubEvent | null;
  setSelectedEventForModal: (evt: ClubEvent | null) => void;
  openTicketModal: (evt: ClubEvent, reg: EventRegistration) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  onEventRegistered,
  selectedEventForModal,
  setSelectedEventForModal,
}) => {
  const { user, role, loginAsDemo } = useAuth();
  const isAdmin = role === 'administrator';

  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedWing, setSelectedWing] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  // Approval Modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ClubEvent | null>(null);
  const [modalTab, setModalTab] = useState<'pending' | 'admit_new' | 'roster'>('pending');

  // Direct Admission Form state (for Administrator to approve and admit new users)
  const [admitName, setAdmitName] = useState('');
  const [admitStudentId, setAdmitStudentId] = useState('');
  const [admitEmail, setAdmitEmail] = useState('');
  const [admitDepartment, setAdmitDepartment] = useState('Computer Science & Engineering');
  const [admitWing, setAdmitWing] = useState<ClubSubsector>('programming');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync if selectedEventForModal is passed
  useEffect(() => {
    if (selectedEventForModal) {
      setCurrentEvent(selectedEventForModal);
      setAdmitWing(selectedEventForModal.wingSlug);
      setStatusMessage(null);
      setApprovalModalOpen(true);
      setSelectedEventForModal(null);
    }
  }, [selectedEventForModal, setSelectedEventForModal]);

  // Keep currentEvent in sync when events list updates
  useEffect(() => {
    if (currentEvent) {
      const refreshed = events.find(e => e.id === currentEvent.id);
      if (refreshed) {
        setCurrentEvent(refreshed);
      }
    }
  }, [events]);

  // Subsector wings definition for filtering and metrics
  const WINGS: { slug: ClubSubsector; label: string; club: string; color: string }[] = [
    { slug: 'programming', label: 'Programming Wing', club: 'Computer Club', color: 'from-blue-600 to-indigo-600' },
    { slug: 'cyber_security', label: 'Cyber Security Wing', club: 'Computer Club', color: 'from-emerald-600 to-teal-700' },
    { slug: 'research', label: 'Research Wing', club: 'Computer Club', color: 'from-purple-600 to-pink-600' },
    { slug: 'sports', label: 'Sports Wing', club: 'Events & Clubs', color: 'from-amber-600 to-orange-600' },
    { slug: 'cultural', label: 'Cultural Wing', club: 'Events & Clubs', color: 'from-rose-600 to-red-600' },
    { slug: 'tour', label: 'Tour & Picnic Club', club: 'Events & Clubs', color: 'from-cyan-600 to-blue-700' },
  ];

  // Calculate pending applications across all subsector wings
  const totalPendingAcrossAllWings = events.reduce((acc, evt) => {
    const pendingInEvt = evt.registrations ? evt.registrations.filter(r => r.status === 'pending').length : 0;
    return acc + pendingInEvt;
  }, 0);

  const getPendingCountForWing = (wingSlug: string) => {
    return events
      .filter(evt => evt.wingSlug === wingSlug)
      .reduce((acc, evt) => {
        const pending = evt.registrations ? evt.registrations.filter(r => r.status === 'pending').length : 0;
        return acc + pending;
      }, 0);
  };

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    if (selectedClub !== 'all' && evt.clubId !== selectedClub) return false;
    if (selectedWing !== 'all' && evt.wingSlug !== selectedWing) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q) ||
        evt.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Open Approval Modal
  const handleOpenApprovalModal = (evt: ClubEvent) => {
    setCurrentEvent(evt);
    setAdmitWing(evt.wingSlug);
    setStatusMessage(null);
    const pendingList = evt.registrations ? evt.registrations.filter(r => r.status === 'pending') : [];
    setModalTab(pendingList.length > 0 ? 'pending' : 'admit_new');
    setApprovalModalOpen(true);
  };

  // Approve an existing pending application
  const handleApprovePendingApplication = async (regId: string) => {
    if (!currentEvent) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await api.approveEventApplication(currentEvent.id, {
        regId,
        adminName: user?.name || 'Administrator'
      });
      setIsProcessing(false);

      if (res.success && res.event && res.registration) {
        setStatusMessage({
          type: 'success',
          text: `Application approved! ${res.registration.userName} has been admitted into ${res.event.title}.`
        });
        onEventRegistered(res.event, res.registration);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Could not approve application.'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to connect to backend service.'
      });
    }
  };

  // Reject a pending application
  const handleRejectApplication = async (regId: string) => {
    if (!currentEvent) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await api.rejectEventApplication(currentEvent.id, regId);
      setIsProcessing(false);
      if (res.success && res.event) {
        setStatusMessage({ type: 'success', text: 'Application marked as rejected.' });
        // update local list
        onEventRegistered(res.event, { id: regId } as any);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({ type: 'error', text: 'Failed to reject application.' });
    }
  };

  // Direct Admission: Admin enters new user details and approves immediately
  const handleDirectAdmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await api.approveEventApplication(currentEvent.id, {
        userName: admitName.trim(),
        studentId: admitStudentId.trim(),
        email: admitEmail.trim(),
        department: admitDepartment,
        wingSlug: admitWing,
        adminName: user?.name || 'Administrator'
      });
      setIsProcessing(false);

      if (res.success && res.event && res.registration) {
        setStatusMessage({
          type: 'success',
          text: `Application approved & user admitted! ${res.registration.userName} is now enrolled with ticket ${res.registration.ticketCode}.`
        });
        onEventRegistered(res.event, res.registration);
        // Clear form
        setAdmitName('');
        setAdmitStudentId('');
        setAdmitEmail('');
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Could not admit user.'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error admitting user to event.'
      });
    }
  };

  // Remove a registration from roster (immediate without blocked window.confirm)
  const handleDeleteRegistration = async (regId: string) => {
    if (!currentEvent) return;
    try {
      const res = await api.deleteEventRegistration(currentEvent.id, regId);
      if (res.success && res.event) {
        setStatusMessage({ type: 'success', text: 'User removed from roster.' });
        onEventRegistered(res.event, { id: regId } as any);
      }
    } catch (e) {
      //
    }
  };

  // Helper counts for currentEvent in modal
  const currentPendingList = currentEvent?.registrations ? currentEvent.registrations.filter(r => r.status === 'pending') : [];
  const currentApprovedList = currentEvent?.registrations ? currentEvent.registrations.filter(r => r.status === 'approved' || !r.status) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-[#D40000] dark:text-red-300 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/40">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator Event & Wing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-neutral-900 dark:text-white tracking-tight">
            Events & Wing Participation Applications
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Centralized administrator approval terminal. Review incoming participation applications, admit and approve new users to join competitions, workshops, and expeditions across all specialized subsector wings.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search event, topic, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
            />
          </div>

          {/* Club Filter */}
          <div>
            <select
              value={selectedClub}
              onChange={(e) => {
                setSelectedClub(e.target.value);
                setSelectedWing('all');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
            >
              <option value="all">All Major Clubs</option>
              <option value="computer_club">1. Computer Club (CUCC)</option>
              <option value="events_and_clubs">2. Events & Clubs</option>
            </select>
          </div>

          {/* Wing Subsector Filter */}
          <div>
            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-semibold"
            >
              <option value="all">All 6 Subsector Wings</option>
              <option value="programming">Programming Wing (CUCC)</option>
              <option value="cyber_security">Cyber Security Wing (CUCC)</option>
              <option value="research">Research Wing (CUCC)</option>
              <option value="sports">Sports Wing (Events & Clubs)</option>
              <option value="cultural">Cultural Wing (Events & Clubs)</option>
              <option value="tour">Tour & Picnic Club (Events & Clubs)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-xs text-neutral-500">
              Showing <strong>{filteredEvents.length}</strong> events
            </span>
            <button
              onClick={() => {
                setSelectedClub('all');
                setSelectedWing('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#D40000] dark:text-red-400 hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isFull = evt.registeredCount >= evt.capacity;
            const pctFilled = Math.min(100, (evt.registeredCount / evt.capacity) * 100);
            const pendingCount = evt.registrations ? evt.registrations.filter(r => r.status === 'pending').length : 0;
            const approvedCount = evt.registrations ? evt.registrations.filter(r => r.status === 'approved' || !r.status).length : evt.registeredCount;

            return (
              <div
                key={evt.id}
                className="bg-white dark:bg-[#18050E] rounded-2xl border border-neutral-200 dark:border-[#380E1C] overflow-hidden shadow-xs hover:shadow-xl hover:border-red-400 dark:hover:border-red-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#D40000] text-white font-bold text-[10px] uppercase shadow-xs">
                        {evt.wingSlug.replace('_', ' ').toUpperCase()} WING
                      </span>
                      {pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-red-950 font-extrabold text-[10px] uppercase shadow-xs flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          {pendingCount} Pending Approval
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <div className="flex items-center gap-3 text-xs text-neutral-200 mb-1">
                        <span className="flex items-center gap-1 font-semibold text-amber-300">
                          <Calendar className="w-3.5 h-3.5" /> {evt.date}
                        </span>
                        <span className="text-neutral-300 font-mono text-[11px]">{evt.time}</span>
                      </div>
                      <h3 className="font-bold text-base font-heading text-white line-clamp-2">
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#D40000] dark:text-red-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Deadline: {evt.registrationDeadline}</span>
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {evt.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#D40000]" />
                        <span>Approved Members: <strong className="font-bold text-neutral-900 dark:text-white">{approvedCount}</strong></span>
                      </span>
                    </div>

                  </div>
                </div>

                {/* Primary Action Button: Approve Application */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleOpenApprovalModal(evt)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm bg-[#D40000] hover:bg-[#A00000] active:scale-98 text-white"
                    title="Review applications and approve new user admissions into this wing event"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>
                      {pendingCount > 0 
                        ? `Approve Application (${pendingCount} Pending)` 
                        : 'Approve Application'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <h3 className="font-bold text-lg font-heading text-neutral-900 dark:text-white">
              CUEC Semester Calendar Schedule across all Wings
            </h3>
            <span className="text-xs text-neutral-500 font-mono">Administrator Approval Hub</span>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((evt) => {
              const pendingCount = evt.registrations ? evt.registrations.filter(r => r.status === 'pending').length : 0;

              return (
                <div
                  key={evt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-[#1A1B28] border border-neutral-200 dark:border-neutral-800 hover:border-red-400 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#D40000] text-white flex flex-col items-center justify-center shrink-0 text-center font-heading shadow-xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold leading-none mt-0.5">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-[#D40000] dark:text-red-300">
                          {evt.wingSlug.replace('_', ' ').toUpperCase()} WING
                        </span>
                        {pendingCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-red-950">
                            {pendingCount} Pending
                          </span>
                        )}
                        <span className="text-xs text-neutral-500">{evt.time}</span>
                      </div>

                      <h4 className="font-bold text-base text-neutral-900 dark:text-white mt-1">
                        {evt.title}
                      </h4>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span>{evt.venue}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenApprovalModal(evt)}
                      className="px-4 py-2 rounded-lg bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve Application</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          ADMINISTRATOR APPLICATION APPROVAL & USER ADMISSION MODAL
          ===================================================================== */}
      {approvalModalOpen && currentEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#D40000] via-[#850000] to-[#400000] p-6 text-white relative">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-red-950 text-[10px] font-extrabold uppercase tracking-wider">
                  {currentEvent.wingSlug.replace('_', ' ').toUpperCase()} WING • {currentEvent.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-100 bg-black/30 px-2.5 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-amber-300" /> Administrator Console
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold font-heading">{currentEvent.title}</h3>
              <p className="text-xs text-red-200 mt-1 flex flex-wrap items-center gap-3">
                <span><Calendar className="w-3.5 h-3.5 inline mr-1" />{currentEvent.date} ({currentEvent.time})</span>
                <span><MapPin className="w-3.5 h-3.5 inline mr-1" />{currentEvent.venue}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-bold">
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Approved Members: {currentApprovedList.length}
                </span>
              </p>

              <button
                onClick={() => setApprovalModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notification Feedback */}
            {statusMessage && (
              <div className={`p-3.5 text-xs flex items-center gap-2 border-b ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                  : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1B28] px-6 text-xs font-bold">
              <button
                onClick={() => setModalTab('pending')}
                className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  modalTab === 'pending'
                    ? 'border-[#D40000] text-[#D40000] dark:text-red-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Applications ({currentPendingList.length})</span>
              </button>

              <button
                onClick={() => setModalTab('admit_new')}
                className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  modalTab === 'admit_new'
                    ? 'border-[#D40000] text-[#D40000] dark:text-red-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Approve & Admit New User</span>
              </button>

              <button
                onClick={() => setModalTab('roster')}
                className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                  modalTab === 'roster'
                    ? 'border-[#D40000] text-[#D40000] dark:text-red-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Approved Roster ({currentApprovedList.length})</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* TAB 1: PENDING APPLICATIONS */}
              {modalTab === 'pending' && (
                <div className="space-y-4">
                  {currentPendingList.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-neutral-50 dark:bg-[#181926] border border-dashed border-neutral-300 dark:border-neutral-700 space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                        All Applications Up to Date
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                        There are currently no unreviewed student applications for this wing event. You can admit new students directly using the "Approve & Admit New User" tab.
                      </p>
                      <button
                        onClick={() => setModalTab('admit_new')}
                        className="px-4 py-2 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Admit a New User Directly</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>Review candidate applications below to approve joining:</span>
                        <span className="font-bold">{currentPendingList.length} applicant(s) waiting</span>
                      </div>

                      {currentPendingList.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1B28] border border-neutral-200 dark:border-neutral-800 hover:border-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {app.userName}
                              </h5>
                              <span className="text-xs font-mono font-bold text-[#D40000] dark:text-red-400 bg-red-50 dark:bg-red-950/80 px-2 py-0.5 rounded">
                                {app.studentId}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {app.department} • {app.email}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Applied on {new Date(app.registeredAt).toLocaleDateString()} • Ticket Reference: #{app.ticketCode}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleRejectApplication(app.id)}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprovePendingApplication(app.id)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve Application</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: APPROVE & ADMIT NEW USER DIRECTLY */}
              {modalTab === 'admit_new' && (
                <form onSubmit={handleDirectAdmitNewUser} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-[#1D0810] border border-red-200 dark:border-[#3E111F] text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-[#D40000] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#D40000] dark:text-red-400 block mb-0.5">
                        Administrator Instant Admission:
                      </strong>
                      Provide student details below. Submitting will immediately approve their admission into this wing event.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={admitName}
                      onChange={(e) => setAdmitName(e.target.value)}
                      placeholder="e.g. Arifuzzaman Abir"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Student ID Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={admitStudentId}
                        onChange={(e) => setAdmitStudentId(e.target.value)}
                        placeholder="e.g. CU-23-CSE-105"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Department
                      </label>
                      <select
                        value={admitDepartment}
                        onChange={(e) => setAdmitDepartment(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                      >
                        <option value="Computer Science & Engineering">Computer Science & Engineering (CSE)</option>
                        <option value="Electrical & Electronic Engineering">Electrical & Electronic Engineering (EEE)</option>
                        <option value="Bachelor of Business Administration">Business Administration (BBA)</option>
                        <option value="English Literature">English Literature</option>
                        <option value="Law & Justice">Law & Justice</option>
                        <option value="Textile Engineering">Textile Engineering</option>
                        <option value="Pharmacy">Pharmacy</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        University Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={admitEmail}
                        onChange={(e) => setAdmitEmail(e.target.value)}
                        placeholder="student@cityuniversity.edu"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Assigned Subsector Wing
                      </label>
                      <select
                        value={admitWing}
                        onChange={(e) => setAdmitWing(e.target.value as ClubSubsector)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-bold"
                      >
                        <option value="programming">Programming Wing</option>
                        <option value="cyber_security">Cyber Security Wing</option>
                        <option value="research">Research Wing</option>
                        <option value="sports">Sports Wing</option>
                        <option value="cultural">Cultural Wing</option>
                        <option value="tour">Tour & Picnic Club</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setApprovalModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-6 py-2.5 rounded-xl bg-[#D40000] hover:bg-red-800 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isProcessing ? 'Approving User...' : 'Approve Application & Admit User'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: APPROVED ROSTER */}
              {modalTab === 'roster' && (
                <div className="space-y-4">
                  {currentApprovedList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500">
                      No approved users on roster yet. Use the "Approve & Admit New User" tab to add students.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {currentApprovedList.map((reg) => (
                        <div
                          key={reg.id}
                          className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1A1B28] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900 dark:text-white">
                                {reg.userName}
                              </span>
                              <span className="font-mono text-[10px] text-neutral-500">
                                ({reg.studentId})
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[9px] uppercase">
                                Approved
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500">
                              {reg.department} • Ticket: <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">#{reg.ticketCode}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteRegistration(reg.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                            title="Remove user from approved roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
