import React, { useState } from 'react';
import { 
  Code2, 
  Trophy, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Award,
  ChevronRight,
  Shield,
  BookOpen,
  UserCheck,
  Search,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Club, ClubWing, ClubCategory, ClubSubsector, ControllerApplication } from '../types.ts';
import { WingIcon } from '../components/WingIcon.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface ClubsPageProps {
  clubs: Club[];
  applications?: ControllerApplication[];
  onApplicationUpdated?: (updatedApp: ControllerApplication) => void;
  onApplicationAdded?: (newApp: ControllerApplication) => void;
  onRefreshData?: () => void;
  selectedWing: ClubWing | null;
  setSelectedWing: (wing: ClubWing | null) => void;
  setActiveTab: (tab: string) => void;
}

export const ClubsPage: React.FC<ClubsPageProps> = ({
  clubs,
  applications = [],
  onApplicationUpdated,
  onApplicationAdded,
  onRefreshData,
  selectedWing,
  setSelectedWing,
  setActiveTab
}) => {
  const { user } = useAuth();
  const [activeClubTab, setActiveClubTab] = useState<ClubCategory>('computer_club');
  const [activeWingSlug, setActiveWingSlug] = useState<ClubSubsector>('programming');

  // Approve Application System Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'pending' | 'admit_new'>('pending');
  const [modalWingFilter, setModalWingFilter] = useState<string>('all');
  const [modalSearch, setModalSearch] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminCustomNotes, setAdminCustomNotes] = useState<{ [appId: string]: string }>({});
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Direct Admission Form State (for Administrator/Controller)
  const [admitName, setAdmitName] = useState('');
  const [admitStudentId, setAdmitStudentId] = useState('');
  const [admitEmail, setAdmitEmail] = useState('');
  const [admitDepartment, setAdmitDepartment] = useState('Computer Science & Engineering');
  const [admitSemester, setAdmitSemester] = useState('3rd Semester');
  const [admitWing, setAdmitWing] = useState<ClubSubsector>('programming');
  const [admitNotes, setAdmitNotes] = useState('Directly admitted and approved into club.');

  // Handle outside navigation to specific wing
  React.useEffect(() => {
    if (selectedWing) {
      setActiveClubTab(selectedWing.clubId);
      setActiveWingSlug(selectedWing.slug);
      setSelectedWing(null);
    }
  }, [selectedWing, setSelectedWing]);

  // Keep modal wing synced with active wing by default
  React.useEffect(() => {
    setAdmitWing(activeWingSlug);
  }, [activeWingSlug]);

  const currentClub = clubs.find(c => c.id === activeClubTab) || clubs[0];
  const activeWing = currentClub.wings.find(w => w.slug === activeWingSlug) || currentClub.wings[0];

  const handleClubChange = (clubId: ClubCategory) => {
    setActiveClubTab(clubId);
    const targetClub = clubs.find(c => c.id === clubId);
    if (targetClub && targetClub.wings.length > 0) {
      setActiveWingSlug(targetClub.wings[0].slug);
      setAdmitWing(targetClub.wings[0].slug);
    }
  };

  // Applications metrics for active club
  const clubApplications = applications.filter(a => a.targetClub === activeClubTab);
  const pendingClubApplications = clubApplications.filter(a => a.status === 'pending');

  // Pending count for Computer Club vs Events & Clubs
  const pendingComputerClubCount = applications.filter(a => a.targetClub === 'computer_club' && a.status === 'pending').length;
  const pendingEventsClubsCount = applications.filter(a => a.targetClub === 'events_and_clubs' && a.status === 'pending').length;

  const getPendingCountForWing = (slug: ClubSubsector) => {
    return applications.filter(a => a.targetWing === slug && a.status === 'pending').length;
  };

  // Open Approval System Modal
  const handleOpenApprovalModal = (defaultTab: 'pending' | 'admit_new' = 'pending', wingSlug?: ClubSubsector) => {
    setModalTab(defaultTab);
    if (wingSlug) {
      setModalWingFilter(wingSlug);
      setAdmitWing(wingSlug);
    } else {
      setModalWingFilter('all');
    }
    setStatusFeedback(null);
    setApprovalModalOpen(true);
  };

  // Approve a pending application
  const handleApproveApplication = async (appId: string) => {
    setIsProcessing(true);
    setStatusFeedback(null);
    const customNote = adminCustomNotes[appId] || 'Application approved for official club membership.';

    try {
      const res = await api.approveApplication(appId, customNote, user?.id);
      setIsProcessing(false);

      if (res.success && res.application) {
        if (onApplicationUpdated) {
          onApplicationUpdated(res.application);
        }
        setStatusFeedback({
          type: 'success',
          text: `Joining request approved! ${res.application.applicantName} has been accepted into ${currentClub.name} (${res.application.targetWing.replace('_', ' ').toUpperCase()} Wing).`
        });
      } else {
        setStatusFeedback({
          type: 'error',
          text: res.message || 'Could not approve application.'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Network error occurred while approving application.'
      });
    }
  };

  // Reject a pending application
  const handleRejectApplication = async (appId: string) => {
    setIsProcessing(true);
    setStatusFeedback(null);
    const customNote = adminCustomNotes[appId] || 'Does not meet current membership criteria or wing prerequisites.';

    try {
      const res = await api.rejectApplication(appId, customNote, user?.id);
      setIsProcessing(false);

      if (res.success && res.application) {
        if (onApplicationUpdated) {
          onApplicationUpdated(res.application);
        }
        setStatusFeedback({
          type: 'success',
          text: `Application for ${res.application.applicantName} marked as rejected.`
        });
      } else {
        setStatusFeedback({
          type: 'error',
          text: res.message || 'Could not reject application.'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Network error occurred while rejecting application.'
      });
    }
  };

  // Direct admission by Administrator/Controller
  const handleDirectAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitName.trim() || !admitStudentId.trim() || !admitEmail.trim()) {
      setStatusFeedback({ type: 'error', text: 'Student name, ID, and email are required.' });
      return;
    }

    setIsProcessing(true);
    setStatusFeedback(null);

    try {
      const res = await api.directAdmitApplication({
        applicantName: admitName.trim(),
        applicantEmail: admitEmail.trim(),
        studentId: admitStudentId.trim(),
        department: admitDepartment,
        currentSemester: admitSemester,
        cgpa: '3.50',
        targetClub: activeClubTab,
        targetWing: admitWing,
        adminNotes: admitNotes || 'Directly admitted and approved into club.'
      }, user?.id);

      setIsProcessing(false);

      if (res.success && res.application) {
        if (onApplicationAdded) {
          onApplicationAdded(res.application);
        }
        setStatusFeedback({
          type: 'success',
          text: `Student ${res.application.applicantName} successfully admitted and approved into ${currentClub.name}!`
        });
        // Clear form
        setAdmitName('');
        setAdmitStudentId('');
        setAdmitEmail('');
      } else {
        setStatusFeedback({
          type: 'error',
          text: res.message || 'Could not complete direct admission.'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Error occurred while admitting student.'
      });
    }
  };

  // Filtered applications for modal view
  const modalFilteredPending = pendingClubApplications.filter(app => {
    if (modalWingFilter !== 'all' && app.targetWing !== modalWingFilter) return false;
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      const match =
        app.applicantName.toLowerCase().includes(q) ||
        app.studentId.toLowerCase().includes(q) ||
        app.applicantEmail.toLowerCase().includes(q) ||
        app.department.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
      
      {/* Page Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-8 text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-[#D40000] dark:text-red-300 text-xs font-bold uppercase tracking-wider">
          University Clubs & Wings Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-neutral-900 dark:text-white">
          Two Major University Clubs & Specialized Wings
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          City University Events & Club encompasses two premier organizations with dedicated subsectors. Manage joining applications, accept student requests, and oversee member rosters.
        </p>

        {/* Club Switcher Tabs - Side by Side (Left and Right) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4 max-w-2xl mx-auto w-full">
          <button
            onClick={() => handleClubChange('computer_club')}
            className={`w-full px-3 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer shadow-xs relative ${
              activeClubTab === 'computer_club'
                ? 'bg-[#D40000] text-white ring-2 ring-red-400/40 shadow-md'
                : 'bg-white dark:bg-[#161722] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Code2 className="w-4 h-4 shrink-0" />
              <span className="truncate">1. Computer Club</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                3 Wings
              </span>
              {pendingComputerClubCount > 0 && (
                <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-amber-400 text-red-950 text-[9px] sm:text-[10px] font-extrabold shadow-sm animate-pulse">
                  {pendingComputerClubCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => handleClubChange('events_and_clubs')}
            className={`w-full px-3 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer shadow-xs relative ${
              activeClubTab === 'events_and_clubs'
                ? 'bg-[#D40000] text-white ring-2 ring-red-400/40 shadow-md'
                : 'bg-white dark:bg-[#161722] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Trophy className="w-4 h-4 shrink-0" />
              <span className="truncate">2. Events & Clubs</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-black/20 text-white font-mono">
                3 Wings
              </span>
              {pendingEventsClubsCount > 0 && (
                <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-amber-400 text-red-950 text-[9px] sm:text-[10px] font-extrabold shadow-sm animate-pulse">
                  {pendingEventsClubsCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Club Meta Card with Direct Application Actions */}
      <div className="bg-gradient-to-r from-red-950 via-[#700000] to-[#D40000] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-2.5 py-0.5 rounded bg-amber-400 text-red-950 font-bold uppercase">
              {currentClub.shortCode}
            </span>
            <span className="text-red-200">Established {currentClub.establishedYear}</span>
            <span className="text-red-200">•</span>
            <span className="text-red-200 font-bold">{currentClub.totalMembers} Enrolled Student Members</span>
            {pendingClubApplications.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-neutral-900 font-bold text-[11px] flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3 text-red-700" />
                {pendingClubApplications.length} Joining Requests Pending
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">
            {currentClub.name}
          </h2>

          <p className="text-sm text-red-100 italic leading-relaxed">
            "{currentClub.motto}"
          </p>

          {/* Action Hub for Joining Applications */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenApprovalModal('pending')}
              className="px-5 py-2.5 rounded-xl bg-white text-[#D40000] hover:bg-red-50 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-98"
            >
              <UserCheck className="w-4 h-4 text-[#D40000]" />
              <span>
                Approve Applications {pendingClubApplications.length > 0 ? `(${pendingClubApplications.length} Pending)` : ''}
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-red-300/30 text-xs">
            <div>
              <span className="text-red-200 block text-[10px] uppercase font-semibold">Student President</span>
              <span className="font-bold text-white text-base">{currentClub.presidentName}</span>
              <span className="block text-red-200 text-[11px]">Central Student Council</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subsector Wings Interactive Navigation */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-lg font-heading text-neutral-900 dark:text-white">
            Specialized Wings for {currentClub.shortCode}
          </h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Select a wing below to inspect leadership, schedule, activities, and approve applications
          </span>
        </div>

        {/* 3 Wings Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentClub.wings.map((wing) => {
            const isSelected = activeWingSlug === wing.slug;
            const wingPendingCount = getPendingCountForWing(wing.slug);

            return (
              <button
                key={wing.id}
                onClick={() => setActiveWingSlug(wing.slug)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-red-50 dark:bg-[#230913] border-[#D40000] dark:border-red-600 ring-2 ring-red-400/30 shadow-md'
                    : 'bg-white dark:bg-[#18050E] border-neutral-200 dark:border-[#380E1C] hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#FDF0F3] dark:bg-[#2C0A17] flex items-center justify-center text-[#D40000] dark:text-[#E5486B] transition-transform group-hover:scale-105 shrink-0 shadow-xs">
                    <WingIcon slug={wing.slug} className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#D40000] dark:text-red-400 font-bold uppercase tracking-wider block">
                        {wing.kicker}
                      </span>
                      {wingPendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-red-950 font-bold text-[9px]">
                          {wingPendingCount} new
                        </span>
                      )}
                    </div>
                    <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-[#D40000] dark:text-red-300' : 'text-neutral-900 dark:text-white'}`}>
                      {wing.name}
                    </h4>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-medium truncate">
                      {wing.badge}
                    </span>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#D40000] dark:text-red-400' : 'text-neutral-400'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Wing Deep Dive Detail */}
      {activeWing && (
        <div className="bg-white dark:bg-[#17050E] border border-neutral-200 dark:border-[#3D101E] rounded-2xl overflow-hidden shadow-lg transition-all animate-in fade-in duration-200">
          
          {/* Banner & Title */}
          <div className="relative h-64 sm:h-72 overflow-hidden">
            <img
              src={activeWing.bannerUrl}
              alt={activeWing.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FDF0F3] dark:bg-[#2C0A17] flex items-center justify-center text-[#D40000] dark:text-[#E5486B] shadow-lg shrink-0">
                  <WingIcon slug={activeWing.slug} className="w-6 h-6" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded bg-[#D40000] text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                    {activeWing.badge}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-neutral-200 text-xs font-bold uppercase tracking-wider border border-white/20">
                    {activeWing.kicker}
                  </span>
                </div>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold font-heading">
                {activeWing.name}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-200 max-w-2xl line-clamp-2">
                {activeWing.fullDesc}
              </p>
            </div>
          </div>

          {/* Quick Schedule & Meeting Details Banner */}
          <div className="bg-neutral-50 dark:bg-[#1E0712] border-b border-neutral-200 dark:border-[#3D101E] p-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#D40000] dark:text-red-400 shrink-0" />
              <div>
                <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-bold">Weekly Schedule</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{activeWing.weeklySchedule}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#D40000] dark:text-red-400 shrink-0" />
              <div>
                <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-bold">Physical Base / Lab</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{activeWing.roomLocation}</span>
              </div>
            </div>

            <div className="flex items-center justify-start sm:justify-end gap-2">
              <button
                onClick={() => handleOpenApprovalModal('pending', activeWing.slug)}
                className="px-3.5 py-1.5 rounded-lg bg-[#D40000] hover:bg-[#A00000] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Approve Wing Applications</span>
              </button>
            </div>
          </div>

          {/* 3-Column Detailed Information */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Col 1: Vision & Key Activities (Col 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div>
                <h4 className="font-bold text-base font-heading text-neutral-900 dark:text-white flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-[#D40000] dark:text-red-400" />
                  Mission & Strategic Vision
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-[#1A1B27] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {activeWing.vision}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-base font-heading text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#D40000] dark:text-red-400" />
                  Regular Activities & Flagship Programs
                </h4>
                <div className="space-y-2">
                  {activeWing.keyActivities.map((act, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-[#1A1B28] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/80 text-[#D40000] dark:text-red-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past Laurels & Achievements */}
              <div>
                <h4 className="font-bold text-base font-heading text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-[#D40000] dark:text-red-400" />
                  Recent Achievements & University Honors
                </h4>
                <div className="space-y-3">
                  {activeWing.pastAchievements.map((ach, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-amber-200 dark:border-[#3E2818] bg-amber-50/50 dark:bg-[#1B140E] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                          {ach.title}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold font-mono text-[10px]">
                          {ach.year}
                        </span>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                        {ach.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Col 2: Leadership, Membership & Application Actions (Col 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Wing Membership & Joining Applications Card */}
              <div className="bg-red-50/70 dark:bg-[#1E0911] p-5 rounded-2xl border border-red-200 dark:border-[#451423] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#D40000] dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <UserCheck className="w-4 h-4" />
                    Wing Joining Applications
                  </h4>
                  {getPendingCountForWing(activeWing.slug) > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-red-950 font-bold text-[10px]">
                      {getPendingCountForWing(activeWing.slug)} Pending
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Administrator terminal for {activeWing.name}. Review candidate joining requests and accept applications.
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-[#14060C] border border-red-100 dark:border-red-950/60 text-center">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Pending Requests</span>
                  <strong className="text-lg font-bold text-[#D40000] dark:text-red-400">
                    {getPendingCountForWing(activeWing.slug)}
                  </strong>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => handleOpenApprovalModal('pending', activeWing.slug)}
                    className="w-full py-2.5 rounded-xl bg-[#D40000] hover:bg-[#A00000] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Approve Joining Requests</span>
                  </button>
                </div>
              </div>

              {/* Conveners & Leadership Card */}
              <div className="bg-neutral-50 dark:bg-[#181926] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Wing Leadership & Conveners
                </h4>

                <div className="space-y-3">
                  {activeWing.conveners.map((conv) => (
                    <div key={conv.id} className="flex items-center gap-3 bg-white dark:bg-[#12131C] p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                          {conv.name}
                        </p>
                        <p className="text-[#D40000] dark:text-red-400 font-semibold text-[11px]">
                          {conv.designation}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-[10px] truncate">
                          Dept. of {conv.department}
                        </p>
                        <p className="text-neutral-400 text-[10px] truncate mt-0.5">
                          {conv.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wing Objectives & Student Benefits */}
              <div className="bg-red-50/70 dark:bg-[#1C0D12] p-5 rounded-2xl border border-red-200 dark:border-[#3D141F] space-y-3">
                <h4 className="font-bold text-sm text-[#D40000] dark:text-red-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Wing Objectives & Student Benefits
                </h4>
                <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
                  {activeWing.membershipPerks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================================
          APPROVE APPLICATION SYSTEM MODAL FOR CLUBS
          ===================================================================== */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#D40000] via-[#850000] to-[#400000] p-6 text-white relative">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-red-950 text-[10px] font-extrabold uppercase tracking-wider">
                  {currentClub.shortCode} • OFFICIAL ADMISSIONS
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-100 bg-black/30 px-2.5 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-amber-300" /> Club Joining Terminal
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold font-heading">
                {currentClub.name}
              </h3>
              <p className="text-xs text-red-200 mt-1">
                Centralized application approval console. Review incoming joining requests, approve students to join wings, or directly admit new members.
              </p>

              <button
                onClick={() => setApprovalModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Notification Feedback */}
            {statusFeedback && (
              <div className={`p-3.5 text-xs flex items-center gap-2 border-b ${
                statusFeedback.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                  : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{statusFeedback.text}</span>
              </div>
            )}

            {/* Modal Tabs - 2 options: Pending Requests & Directly Admit & Approve */}
            <div className="flex flex-wrap border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1B28] px-4 sm:px-6 text-xs font-bold">
              <button
                onClick={() => setModalTab('pending')}
                className={`py-3 px-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  modalTab === 'pending'
                    ? 'border-[#D40000] text-[#D40000] dark:text-red-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Requests ({pendingClubApplications.length})</span>
              </button>

              <button
                onClick={() => setModalTab('admit_new')}
                className={`py-3 px-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  modalTab === 'admit_new'
                    ? 'border-[#D40000] text-[#D40000] dark:text-red-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Directly Admit & Approve</span>
              </button>
            </div>

            {/* Filter toolbar inside modal for Pending */}
            {modalTab === 'pending' && (
              <div className="px-6 py-3 bg-neutral-100/60 dark:bg-[#141520] border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-semibold">Filter Wing:</span>
                  <select
                    value={modalWingFilter}
                    onChange={(e) => setModalWingFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white"
                  >
                    <option value="all">All Wings in {currentClub.shortCode}</option>
                    {currentClub.wings.map(w => (
                      <option key={w.slug} value={w.slug}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search applicant name, ID..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              
              {/* TAB 1: PENDING JOINING REQUESTS */}
              {modalTab === 'pending' && (
                <div className="space-y-4">
                  {modalFilteredPending.length === 0 ? (
                    <div className="p-10 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                        All Applications Up to Date!
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                        There are currently no pending student joining applications waiting for approval in {modalWingFilter === 'all' ? currentClub.name : `${modalWingFilter.replace('_', ' ').toUpperCase()} Wing`}.
                      </p>
                      <button
                        onClick={() => setModalTab('admit_new')}
                        className="px-4 py-2 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Admit New Student Directly</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>Review candidate joining requests below to accept membership:</span>
                        <span className="font-bold text-neutral-900 dark:text-white">{modalFilteredPending.length} application(s) awaiting review</span>
                      </div>

                      {modalFilteredPending.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-[#1A1B28] border border-neutral-200 dark:border-neutral-800 space-y-3 hover:border-red-400 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                                  {app.applicantName}
                                </h4>
                                <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-[#D40000] dark:text-red-300 font-mono text-[10px] font-bold">
                                  {app.studentId}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                                  CGPA: {app.cgpa}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold text-[10px]">
                                  {app.targetWing.replace('_', ' ').toUpperCase()} WING
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Dept. of {app.department} • {app.currentSemester} • {app.applicantEmail}
                              </p>
                            </div>

                            <span className="text-[10px] text-neutral-400 shrink-0">
                              Applied: {new Date(app.submittedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Optional Admin Notes Input & Decision Controls */}
                          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <input
                              type="text"
                              placeholder="Reviewer notes (optional e.g. 'Approved with honor')"
                              value={adminCustomNotes[app.id] || ''}
                              onChange={(e) => setAdminCustomNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white"
                            />

                            <div className="flex items-center gap-2">
                              <button
                                disabled={isProcessing}
                                onClick={() => handleApproveApplication(app.id)}
                                className="px-4 py-2 rounded-xl bg-[#D40000] hover:bg-[#A00000] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-all active:scale-98"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Accept & Approve Request</span>
                              </button>

                              <button
                                disabled={isProcessing}
                                onClick={() => handleRejectApplication(app.id)}
                                className="px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DIRECTLY ADMIT & APPROVE STUDENT */}
              {modalTab === 'admit_new' && (
                <form onSubmit={handleDirectAdmitSubmit} className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-xl border border-red-200 dark:border-red-900/40 text-xs flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-[#D40000] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#D40000] dark:text-red-400 block mb-0.5">
                        Administrator / Controller Instant Admission:
                      </strong>
                      Provide student credentials below. Submitting will immediately approve their admission into {currentClub.name} and update total membership numbers.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={admitName}
                        onChange={(e) => setAdmitName(e.target.value)}
                        placeholder="e.g. Shakib Al Hasan"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Student ID Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={admitStudentId}
                        onChange={(e) => setAdmitStudentId(e.target.value)}
                        placeholder="e.g. CU-23-CSE-099"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={admitEmail}
                        onChange={(e) => setAdmitEmail(e.target.value)}
                        placeholder="student@cityuniversity.edu"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D40000]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Academic Department *
                      </label>
                      <select
                        value={admitDepartment}
                        onChange={(e) => setAdmitDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white"
                      >
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Electrical & Electronic Engineering">Electrical & Electronic Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Textile Engineering">Textile Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Business Administration (BBA)">Business Administration (BBA)</option>
                        <option value="English & Humanities">English & Humanities</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Law & Justice">Law & Justice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Target Wing *
                      </label>
                      <select
                        value={admitWing}
                        onChange={(e) => setAdmitWing(e.target.value as ClubSubsector)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white font-bold"
                      >
                        {currentClub.wings.map(w => (
                          <option key={w.slug} value={w.slug}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Semester *
                      </label>
                      <input
                        type="text"
                        value={admitSemester}
                        onChange={(e) => setAdmitSemester(e.target.value)}
                        placeholder="3rd Semester"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Admission Justification & Notes
                    </label>
                    <textarea
                      rows={2}
                      value={admitNotes}
                      onChange={(e) => setAdmitNotes(e.target.value)}
                      placeholder="e.g. Recommended by club convener; admitted directly."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#12131A] text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3 rounded-xl bg-[#D40000] hover:bg-[#A00000] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing Admission...' : 'Approve & Admit to Club'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
