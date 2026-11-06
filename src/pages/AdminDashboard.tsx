import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserCheck, 
  Calendar, 
  Users, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Award,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  UserPlus,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  Clock,
  GraduationCap
} from 'lucide-react';
import { 
  Club, 
  ClubEvent, 
  ControllerApplication, 
  User, 
  ClubCategory, 
  ClubSubsector,
  UserRole 
} from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface AdminDashboardProps {
  clubs: Club[];
  events: ClubEvent[];
  applications: ControllerApplication[];
  onRefreshData: () => void;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Software Engineering',
  'Business Administration (BBA)',
  'Electrical & Electronic Engineering (EEE)',
  'Textile Engineering',
  'Civil Engineering',
  'Pharmacy',
  'English Language & Literature',
  'Law & Human Rights',
  'Directorate of Student Welfare (DSW)'
];

const WINGS: { slug: ClubSubsector; label: string; club: ClubCategory }[] = [
  { slug: 'programming', label: 'Programming Club', club: 'computer_club' },
  { slug: 'cyber_security', label: 'Cyber Security Wing', club: 'computer_club' },
  { slug: 'research', label: 'Research & Innovation Wing', club: 'computer_club' },
  { slug: 'sports', label: 'Sports & Athletics Wing', club: 'events_and_clubs' },
  { slug: 'cultural', label: 'Cultural & Performing Arts Wing', club: 'events_and_clubs' },
  { slug: 'tour', label: 'Tour & Picnic Club', club: 'events_and_clubs' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  clubs,
  events,
  applications,
  onRefreshData
}) => {
  const { user, role, loginAsDemo } = useAuth();
  
  // Active sub-tab inside Dashboard
  const [currentTab, setCurrentTab] = useState<
    'students' | 'controllers' | 'users' | 'events' | 'clubs'
  >('students');

  const [actionProcessing, setActionProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /* ==========================================================================
     1. USERS & CONTROLLERS MEMBERSHIP STATE & HANDLERS
     ========================================================================== */
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userStudentId, setUserStudentId] = useState('');
  const [userDepartment, setUserDepartment] = useState(DEPARTMENTS[0]);
  const [userBatch, setUserBatch] = useState('58th Batch');
  const [userSemester, setUserSemester] = useState('5th Semester');
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userClubAffiliation, setUserClubAffiliation] = useState<ClubCategory>('computer_club');
  const [userAssignedWing, setUserAssignedWing] = useState<ClubSubsector | ''>('programming');
  const [userPhone, setUserPhone] = useState('');
  const [userJoinedAt, setUserJoinedAt] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'administrator' | 'controller' | 'user'>('all');
  const [userDeptFilter, setUserDeptFilter] = useState<string>('all');
  const [userWingFilter, setUserWingFilter] = useState<string>('all');

  const formatJoinTime = (dateStr: string) => {
    if (!dateStr) return 'Not available';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const datePart = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const hasTime = dateStr.includes('T') || dateStr.includes(':');
      if (hasTime) {
        const timePart = d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        return `${datePart} • ${timePart}`;
      }
      return `${datePart} • 10:00 AM`;
    } catch {
      return dateStr;
    }
  };

  const getEffectiveBatch = (u: User) => {
    if (u.batch) return u.batch;
    if (u.role === 'administrator') return 'Faculty Admin';
    if (u.studentId.includes('21')) return '54th Batch';
    if (u.studentId.includes('22')) return '56th Batch';
    if (u.studentId.includes('23')) return '58th Batch';
    if (u.studentId.includes('24')) return '60th Batch';
    return '58th Batch';
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers(user?.id);
      if (res.success && res.users) {
        setUsersList(res.users);
      }
    } catch (e) {
      //
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role, user]);

  const handleOpenCreateStudent = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserStudentId('');
    setUserDepartment(DEPARTMENTS[0]);
    setUserBatch('58th Batch');
    setUserSemester('4th Semester');
    setUserRole('user');
    setUserClubAffiliation('computer_club');
    setUserAssignedWing('');
    setUserPhone('');
    setUserJoinedAt(new Date().toISOString().slice(0, 16));
    setUserModalOpen(true);
  };

  const handleOpenCreateController = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserStudentId('');
    setUserDepartment(DEPARTMENTS[0]);
    setUserBatch('55th Batch');
    setUserSemester('6th Semester');
    setUserRole('controller');
    setUserClubAffiliation('computer_club');
    setUserAssignedWing('programming');
    setUserPhone('');
    setUserJoinedAt(new Date().toISOString().slice(0, 16));
    setUserModalOpen(true);
  };

  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserStudentId('');
    setUserDepartment(DEPARTMENTS[0]);
    setUserBatch('58th Batch');
    setUserSemester('3rd Semester');
    setUserRole('user');
    setUserClubAffiliation('computer_club');
    setUserAssignedWing('');
    setUserPhone('');
    setUserJoinedAt(new Date().toISOString().slice(0, 16));
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserStudentId(u.studentId);
    setUserDepartment(u.department);
    setUserBatch(u.batch || getEffectiveBatch(u));
    setUserSemester(u.semester || '5th Semester');
    setUserRole(u.role);
    setUserClubAffiliation(u.clubAffiliation || 'computer_club');
    setUserAssignedWing(u.assignedWing || '');
    setUserPhone(u.phone || '');
    setUserJoinedAt(u.joinedAt ? u.joinedAt.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionProcessing(true);

    const payload = {
      name: userName.trim(),
      email: userEmail.trim(),
      studentId: userStudentId.trim(),
      department: userDepartment,
      batch: userBatch.trim() || '58th Batch',
      semester: userSemester,
      role: userRole,
      clubAffiliation: userClubAffiliation,
      assignedWing: (userRole === 'controller' && userAssignedWing) ? (userAssignedWing as ClubSubsector) : undefined,
      phone: userPhone.trim() || undefined,
      joinedAt: userJoinedAt || new Date().toISOString()
    };

    try {
      if (editingUserId) {
        const res = await api.updateUser(editingUserId, payload, user?.id);
        if (res.success) {
          setSuccessMessage(`User "${payload.name}" updated successfully.`);
        }
      } else {
        const res = await api.createUser(payload, user?.id);
        if (res.success) {
          setSuccessMessage(`New ${payload.role.toUpperCase()} "${payload.name}" added successfully.`);
        }
      }
      setActionProcessing(false);
      setUserModalOpen(false);
      fetchUsers();
      onRefreshData();
    } catch (e) {
      setActionProcessing(false);
    }
  };

  // In-app Delete Confirmation Modal State (replaces blocked window.confirm)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'user' | 'event' | 'application';
    id: string;
    title: string;
    subtitle: string;
  } | null>(null);

  const handleInitiateDeleteUser = (u: User) => {
    if (u.id === user?.id || u.role === 'administrator') {
      setSuccessMessage('Administrator accounts cannot be removed from the registry.');
      return;
    }
    setDeleteConfirmation({
      isOpen: true,
      type: 'user',
      id: u.id,
      title: `Delete User "${u.name}"?`,
      subtitle: `Are you sure you want to permanently remove "${u.name}" (${u.studentId} • ${u.role.toUpperCase()}) from the university registry?`
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmation) return;
    const { id, type, title } = deleteConfirmation;
    setActionProcessing(true);

    try {
      if (type === 'user') {
        // Optimistically remove from state immediately
        setUsersList(prev => prev.filter(u => u.id !== id));
        const res = await api.deleteUser(id, user?.id);
        setSuccessMessage(res.message || `User deleted successfully.`);
        fetchUsers();
        onRefreshData();
      } else if (type === 'event') {
        const res = await api.deleteEvent(id, user?.id);
        setSuccessMessage(res.message || `Event deleted successfully.`);
        onRefreshData();
      } else if (type === 'application') {
        const res = await api.deleteApplication(id, user?.id);
        setSuccessMessage('Application record removed.');
        onRefreshData();
      }
    } catch (e) {
      setSuccessMessage('Failed to complete delete request.');
    } finally {
      setActionProcessing(false);
      setDeleteConfirmation(null);
    }
  };

  const handleDeleteUser = (u: User) => {
    handleInitiateDeleteUser(u);
  };

  const handleQuickRoleChange = async (u: User, newRole: UserRole) => {
    try {
      const res = await api.updateUser(u.id, { role: newRole }, user?.id);
      if (res.success) {
        setSuccessMessage(`Role for ${u.name} changed to ${newRole.toUpperCase()}.`);
        fetchUsers();
        onRefreshData();
      }
    } catch (e) {
      //
    }
  };

  /* ==========================================================================
     4. CONTROLLER & MEMBERSHIP APPLICATIONS APPROVALS
     ========================================================================== */
  const [selectedApp, setSelectedApp] = useState<ControllerApplication | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const handleApproveApplication = async (appId: string) => {
    setActionProcessing(true);
    try {
      const res = await api.approveApplication(
        appId,
        adminNoteInput || 'Approved by University Directorate of Student Welfare.',
        user?.id
      );
      setActionProcessing(false);
      if (res.success) {
        setSuccessMessage('Application approved! Candidate promoted to Club Controller.');
        setSelectedApp(null);
        setAdminNoteInput('');
        fetchUsers();
        onRefreshData();
      }
    } catch (e) {
      setActionProcessing(false);
    }
  };

  const handleRejectApplication = async (appId: string) => {
    setActionProcessing(true);
    try {
      const res = await api.rejectApplication(
        appId,
        adminNoteInput || 'Candidate does not fulfill current trimester prerequisites.',
        user?.id
      );
      setActionProcessing(false);
      if (res.success) {
        setSuccessMessage('Application marked as rejected.');
        setSelectedApp(null);
        setAdminNoteInput('');
        onRefreshData();
      }
    } catch (e) {
      setActionProcessing(false);
    }
  };

  const handleDeleteApplication = (appId: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'application',
      id: appId,
      title: 'Delete Controller Application?',
      subtitle: 'Are you sure you want to remove this controller candidate application record?'
    });
  };

  /* ==========================================================================
     5. EVENTS MANAGEMENT STATE & HANDLERS
     ========================================================================== */
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventKicker, setEventKicker] = useState('');
  const [eventClubId, setEventClubId] = useState<ClubCategory>('computer_club');
  const [eventWingSlug, setEventWingSlug] = useState<ClubSubsector>('programming');
  const [eventCategory, setEventCategory] = useState('Competition');
  const [eventDate, setEventDate] = useState('2026-11-25');
  const [eventTime, setEventTime] = useState('10:00 AM');
  const [eventVenue, setEventVenue] = useState('Software Lab 402');
  const [eventCapacity, setEventCapacity] = useState('150');
  const [eventDesc, setEventDesc] = useState('');
  const [eventBanner, setEventBanner] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80');
  const [attendeeRosterEvent, setAttendeeRosterEvent] = useState<ClubEvent | null>(null);

  const handleOpenCreateEvent = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventKicker('');
    setEventClubId('computer_club');
    setEventWingSlug('programming');
    setEventCategory('Workshop');
    setEventDate(new Date().toISOString().split('T')[0]);
    setEventTime('10:00 AM');
    setEventVenue('Central Auditorium');
    setEventCapacity('100');
    setEventDesc('');
    setEventBanner('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80');
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: ClubEvent) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventKicker(evt.kicker || '');
    setEventClubId(evt.clubId);
    setEventWingSlug(evt.wingSlug);
    setEventCategory(evt.category);
    setEventDate(evt.date);
    setEventTime(evt.time);
    setEventVenue(evt.venue);
    setEventCapacity(String(evt.capacity));
    setEventDesc(evt.description);
    setEventBanner(evt.bannerUrl);
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionProcessing(true);

    const payload = {
      title: eventTitle.trim(),
      kicker: eventKicker.trim() || undefined,
      clubId: eventClubId,
      wingSlug: eventWingSlug,
      category: eventCategory,
      date: eventDate,
      time: eventTime,
      venue: eventVenue,
      capacity: Number(eventCapacity) || 100,
      description: eventDesc,
      bannerUrl: eventBanner
    };

    try {
      if (editingEventId) {
        await api.updateEvent(editingEventId, payload, user?.id);
        setSuccessMessage('Event updated successfully.');
      } else {
        await api.createEvent(payload, user?.id);
        setSuccessMessage('New event published successfully.');
      }
      setActionProcessing(false);
      setEventModalOpen(false);
      onRefreshData();
    } catch (err) {
      setActionProcessing(false);
    }
  };

  const handleDeleteEvent = (id: string, title: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'event',
      id,
      title: `Delete Event "${title}"?`,
      subtitle: `Are you sure you want to permanently delete event "${title}" and all its participant data?`
    });
  };

  // KPI Metrics
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const totalUsersCount = usersList.length;
  const controllersCount = usersList.filter(u => u.role === 'controller').length;
  const adminsCount = usersList.filter(u => u.role === 'administrator').length;

  // RESTRICT ACCESS: Administrator Dashboard can ONLY be accessed and used by users with role === 'administrator'
  if (role !== 'administrator') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white dark:bg-[#14050D] border-2 border-red-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />
          
          <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-950/80 text-[#D40000] border-2 border-red-200 dark:border-red-900 mx-auto flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-[#D40000] font-bold text-xs uppercase tracking-wider border border-red-300 dark:border-red-900">
              <Shield className="w-3.5 h-3.5" /> Administrator Access Restricted
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-neutral-900 dark:text-white">
              Administrator Central Command Dashboard
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
              This dashboard is strictly reserved for authorized City University Administrators (DSW Central Command). Only administrators can publish or remove announcements & notices, add or delete gallery images, add or remove students, and appoint or demote controllers.
            </p>
          </div>

          {/* Current Session status box */}
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#1C0A14] border border-neutral-200 dark:border-[#380E1C] max-w-md mx-auto text-left space-y-3 shadow-inner">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
              <span>Current Session Profile:</span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                role === 'controller' 
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' 
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}>
                {role}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                {user?.name || 'Guest User'}
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                {user?.email || 'Not authenticated'}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <button
                onClick={() => loginAsDemo('administrator')}
                className="w-full px-4 py-3 rounded-xl bg-[#D40000] hover:bg-[#A00000] active:scale-98 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Shield className="w-4 h-4 text-white" />
                <span>Authenticate as Administrator</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-400">
            City University Directorate of Student Welfare (DSW) • Administrative Operations Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      
      {/* Toast Alert for Operations */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Banner: Admin Executive Console */}
      <div className="bg-gradient-to-r from-[#D40000] via-[#850000] to-[#400000] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-red-500/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-xl ring-2 ring-white/80 flex items-center justify-center shrink-0">
            <img 
              src="/city-university-logo.jpg" 
              alt="City University Official Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/90 text-amber-300 font-bold text-[11px] uppercase tracking-wider border border-amber-300/40 shadow-xs">
                <Shield className="w-3.5 h-3.5" /> Full Administrator Authority
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight">
              Administrator Central Command Dashboard
            </h1>
          </div>
        </div>

        {/* Quick KPI Stat Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Events & Contests</span>
            <span className="text-xl font-bold font-mono text-white">{events.length}</span>
          </div>
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Controllers</span>
            <span className="text-xl font-bold font-mono text-amber-300">{controllersCount}</span>
          </div>
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Students</span>
            <span className="text-xl font-bold font-mono text-emerald-300">{usersList.filter(u => u.role === 'user').length}</span>
          </div>
        </div>
      </div>


      {/* Main Administrative Control Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs font-bold">
        {/* TAB 1: STUDENTS & MEMBERS */}
        <button
          onClick={() => {
            setCurrentTab('students');
            setUserRoleFilter('user');
          }}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            currentTab === 'students' || (currentTab === 'users' && userRoleFilter === 'user')
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white dark:bg-[#151620] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students & Members ({usersList.filter(u => u.role === 'user').length})</span>
        </button>

        {/* TAB 2: CLUB CONTROLLERS */}
        <button
          onClick={() => {
            setCurrentTab('controllers');
            setUserRoleFilter('controller');
          }}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            currentTab === 'controllers' || (currentTab === 'users' && userRoleFilter === 'controller')
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white dark:bg-[#151620] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-300" />
          <span>Club Controllers ({controllersCount})</span>
        </button>

        {/* TAB 3: EVENTS & COMPETITIONS */}
        <button
          onClick={() => setCurrentTab('events')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            currentTab === 'events'
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white dark:bg-[#151620] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events & Competitions ({events.length})</span>
        </button>

        {/* TAB 4: CLUBS & WINGS STRUCTURE */}
        <button
          onClick={() => setCurrentTab('clubs')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            currentTab === 'clubs'
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white dark:bg-[#151620] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Clubs Structure</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 3 & 4: STUDENTS, MEMBERS & CLUB CONTROLLERS DIRECTORY (FULL DETAILS)
          ===================================================================== */}
      {(currentTab === 'students' || currentTab === 'controllers' || currentTab === 'users') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {currentTab === 'controllers' ? (
                  <UserCheck className="w-5 h-5 text-amber-500" />
                ) : currentTab === 'students' ? (
                  <Users className="w-5 h-5 text-[#D40000]" />
                ) : (
                  <Users className="w-5 h-5 text-[#D40000]" />
                )}
                <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
                  {currentTab === 'controllers'
                    ? 'Club Controllers Leadership Directory'
                    : currentTab === 'students'
                    ? 'Students & General Members Registry'
                    : 'University Members & Controllers Directory'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {currentTab === 'controllers'
                  ? 'Official records of appointed club controllers with IDs, batch, department, join timestamp, and assigned subsector wings.'
                  : currentTab === 'students'
                  ? 'Complete records of enrolled students and active club members with student ID, batch, department, and join date/time.'
                  : 'Comprehensive administrator directory with full student credentials, batch, department, join time, and role controls.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentTab === 'controllers' ? (
                <button
                  onClick={handleOpenCreateController}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Club Controller</span>
                </button>
              ) : currentTab === 'students' ? (
                <button
                  onClick={handleOpenCreateStudent}
                  className="px-4 py-2.5 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Student / Member</span>
                </button>
              ) : (
                <button
                  onClick={handleOpenCreateUser}
                  className="px-4 py-2.5 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member / Controller</span>
                </button>
              )}
            </div>
          </div>

          {/* User Search & Multi-Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] p-3 rounded-2xl shadow-xs text-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, student ID, batch, department, email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <select
                value={userDeptFilter}
                onChange={e => setUserDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-medium"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'user', 'controller', 'administrator'] as const).map(roleKey => {
                const label = roleKey === 'all' 
                  ? 'All Roles' 
                  : roleKey === 'user' 
                  ? 'Students' 
                  : roleKey === 'controller' 
                  ? 'Controllers' 
                  : 'Admins';
                return (
                  <button
                    key={roleKey}
                    onClick={() => setUserRoleFilter(roleKey)}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] cursor-pointer transition-colors whitespace-nowrap ${
                      userRoleFilter === roleKey
                        ? 'bg-[#D40000] text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Details Table */}
          <div className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-[#1A1B28] border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="p-3.5">Name & Profile</th>
                    <th className="p-3.5">Student / Official ID</th>
                    <th className="p-3.5">Academic Batch</th>
                    <th className="p-3.5">Department & Sem</th>
                    <th className="p-3.5">Join Time & Date</th>
                    <th className="p-3.5">Wing / Club Affiliation</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                  {usersList
                    .filter(u => {
                      // Filter by current tab if role filter is 'all'
                      if (currentTab === 'students' && userRoleFilter === 'all' && u.role !== 'user') return false;
                      if (currentTab === 'controllers' && userRoleFilter === 'all' && u.role !== 'controller') return false;
                      // Filter by explicit role selector
                      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
                      // Filter by department
                      if (userDeptFilter !== 'all' && u.department !== userDeptFilter) return false;
                      // Filter by search query
                      if (userSearch.trim()) {
                        const q = userSearch.toLowerCase();
                        const effectiveBatch = (u.batch || getEffectiveBatch(u)).toLowerCase();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q) ||
                          u.studentId.toLowerCase().includes(q) ||
                          u.department.toLowerCase().includes(q) ||
                          effectiveBatch.includes(q)
                        );
                      }
                      return true;
                    })
                    .map((u) => {
                      const effectiveBatch = u.batch || getEffectiveBatch(u);
                      return (
                        <tr key={u.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition-colors">
                          {/* 1. Name & Profile */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950 text-[#D40000] dark:text-red-300 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0 ring-1 ring-red-200 dark:ring-red-900">
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  u.name.substring(0, 2)
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {u.id === user?.id && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{u.email}</div>
                                {u.phone && (
                                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{u.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Student / Member ID */}
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono font-bold text-xs border border-neutral-200 dark:border-neutral-700">
                              {u.studentId}
                            </span>
                          </td>

                          {/* 3. Academic Batch */}
                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-900">
                              <GraduationCap className="w-3.5 h-3.5 text-rose-500" />
                              <span>{effectiveBatch}</span>
                            </span>
                          </td>

                          {/* 4. Department & Semester */}
                          <td className="p-3.5">
                            <div className="font-medium text-neutral-900 dark:text-white">{u.department}</div>
                            {u.semester && (
                              <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold">
                                {u.semester}
                              </div>
                            )}
                          </td>

                          {/* 5. Join Time & Date */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-mono text-[11px] bg-neutral-50 dark:bg-[#161722] px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                              <span>{formatJoinTime(u.joinedAt || '')}</span>
                            </div>
                          </td>

                          {/* 6. Wing / Club Affiliation */}
                          <td className="p-3.5">
                            {u.assignedWing ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold text-[11px] border border-amber-200 dark:border-amber-800">
                                {u.assignedWing.replace('_', ' ').toUpperCase()} WING
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px]">
                                {u.clubAffiliation === 'computer_club' ? 'Computer Club' : 'Events & Clubs'}
                              </span>
                            )}
                          </td>

                          {/* 7. Role Status */}
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] inline-flex items-center gap-1 ${
                              u.role === 'administrator'
                                ? 'bg-red-100 dark:bg-red-950 text-[#D40000] dark:text-red-300 border border-red-200 dark:border-red-900'
                                : u.role === 'controller'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {u.role === 'administrator' && <Shield className="w-3 h-3" />}
                              {u.role === 'controller' && <UserCheck className="w-3 h-3" />}
                              {u.role === 'user' && <Users className="w-3 h-3" />}
                              <span>{u.role === 'user' ? 'Student' : u.role}</span>
                            </span>
                          </td>

                          {/* 8. Administrative Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details Dossier Button */}
                              <button
                                onClick={() => setSelectedUserForDetails(u)}
                                className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[10px] cursor-pointer inline-flex items-center gap-1 transition-colors border border-neutral-300 dark:border-neutral-700"
                                title="View Complete Identity Dossier"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>

                              {/* Quick Role Toggle */}
                              {u.role === 'user' ? (
                                <button
                                  onClick={() => handleQuickRoleChange(u, 'controller')}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-[10px] hover:bg-amber-100 cursor-pointer transition-colors"
                                  title="Promote student to Controller"
                                >
                                  Make Controller
                                </button>
                              ) : u.role === 'controller' ? (
                                <button
                                  onClick={() => handleQuickRoleChange(u, 'user')}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-[10px] hover:bg-neutral-200 cursor-pointer transition-colors"
                                  title="Demote to Student Member"
                                >
                                  Demote to Student
                                </button>
                              ) : null}

                              {/* Edit User Button */}
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 cursor-pointer transition-colors"
                                title="Edit record, batch, and assigned wing"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User Button */}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={u.id === user?.id}
                                className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={u.id === user?.id ? "Cannot remove yourself" : "Remove user from database"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* =====================================================================
          TAB 5: EVENTS & COMPETITIONS MANAGEMENT
          ===================================================================== */}
      {currentTab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D40000]" />
                University Events & Competitions Management
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Publish new hackathons, tournaments, tours, and seminars. View registered student rosters.
              </p>
            </div>

            <button
              onClick={handleOpenCreateEvent}
              className="px-4 py-2.5 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-red-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold text-[10px] uppercase">
                      {evt.wingSlug.replace('_', ' ')} • {evt.category}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">{evt.date}</span>
                  </div>

                  <h4 className="font-bold text-base text-neutral-900 dark:text-white mt-2">
                    {evt.title}
                  </h4>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                    {evt.description}
                  </p>

                  <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span>Venue: <strong>{evt.venue}</strong></span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {evt.registeredCount} approved members
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setAttendeeRosterEvent(evt)}
                    className="text-[#D40000] dark:text-red-400 font-semibold hover:underline cursor-pointer"
                  >
                    View Attendees ({evt.registrations?.length || 0})
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditEvent(evt)}
                      className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt.id, evt.title)}
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: CLUBS METADATA (TWO MAJOR CLUBS STRUCTURE)
          ===================================================================== */}
      {currentTab === 'clubs' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D40000]" />
              City University Clubs Governance Structure
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Two central university organizations, advisory leadership, and affiliated subsector wings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clubs.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-[#D40000] dark:text-red-300 font-mono">
                    {c.shortCode}
                  </span>
                  <span className="text-xs text-neutral-500 font-semibold">{c.totalMembers} Members</span>
                </div>

                <h4 className="font-bold text-lg font-heading text-neutral-900 dark:text-white">{c.name}</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">"{c.motto}"</p>

                <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <p>Faculty Advisor: <strong>{c.advisorName}</strong> ({c.advisorDesignation})</p>
                  <p>Student President: <strong>{c.presidentName}</strong></p>
                  <p>Official Email: <strong>{c.email}</strong></p>
                  <p>Hotline: <strong>{c.hotline}</strong></p>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Active Subsector Wings:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.wings.map(w => (
                      <span key={w.id} className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                        {w.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: USER / CONTROLLER CREATE & EDIT
          ===================================================================== */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="bg-[#D40000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="font-bold font-heading text-base">
                  {editingUserId ? 'Edit User / Controller Profile' : 'Add New User or Controller'}
                </h3>
              </div>
              <button onClick={() => setUserModalOpen(false)} className="text-white cursor-pointer hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-3.5 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arifuzzaman Abir"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    University Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. arifuzzamanabir2025@gmail.com"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Student / Faculty ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CU-23-CSE-099"
                    value={userStudentId}
                    onChange={e => setUserStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Assigned Role *
                  </label>
                  <select
                    value={userRole}
                    onChange={e => setUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-bold"
                  >
                    <option value="user">Regular Student / Member</option>
                    <option value="controller">Club Controller (Manage Events & Notices)</option>
                    <option value="administrator">Full University Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Department *
                  </label>
                  <select
                    value={userDepartment}
                    onChange={e => setUserDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white text-xs"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Academic Batch *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 58th Batch"
                    value={userBatch}
                    onChange={e => setUserBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Trimester / Semester
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5th Semester"
                    value={userSemester}
                    onChange={e => setUserSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Wing assignment for controllers */}
              {userRole === 'controller' && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                  <label className="block font-bold text-amber-900 dark:text-amber-300">
                    Controller Assigned Subsector Wing:
                  </label>
                  <select
                    value={userAssignedWing}
                    onChange={e => setUserAssignedWing(e.target.value as ClubSubsector)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#11121A] text-neutral-900 dark:text-white font-semibold"
                  >
                    {WINGS.map(w => (
                      <option key={w.slug} value={w.slug}>
                        {w.label} ({w.club === 'computer_club' ? 'CUCC' : 'Events & Clubs'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-500">
                    This controller will have administrative authority over competitions, announcements, and albums for this wing.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Join Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={userJoinedAt}
                    onChange={e => setUserJoinedAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+880 17..."
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-5 py-2 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'Save Profile Changes' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3B: STUDENT / CONTROLLER DETAILS IDENTITY DOSSIER
          ===================================================================== */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#D40000] to-[#800000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white text-[#D40000] flex items-center justify-center font-bold text-base uppercase overflow-hidden shrink-0 shadow-md">
                  {selectedUserForDetails.avatar ? (
                    <img src={selectedUserForDetails.avatar} alt={selectedUserForDetails.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedUserForDetails.name.substring(0, 2)
                  )}
                </div>
                <div>
                  <h3 className="font-bold font-heading text-lg leading-tight">
                    {selectedUserForDetails.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                      {selectedUserForDetails.role === 'controller'
                        ? 'Club Controller'
                        : selectedUserForDetails.role === 'administrator'
                        ? 'System Administrator'
                        : 'Student / Club Member'}
                    </span>
                    <span className="text-[11px] text-red-100 font-mono">
                      {selectedUserForDetails.studentId}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="text-white cursor-pointer hover:opacity-80 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Highlight Card: 5 Primary Requested Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-[#10111A] border border-neutral-200 dark:border-neutral-800">
                {/* 1. Name */}
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wide">Full Name</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-sm">{selectedUserForDetails.name}</span>
                </div>

                {/* 2. Student ID */}
                <div>
                  <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wide">Identity ID</span>
                  <span className="font-mono font-bold text-sm text-[#D40000] dark:text-red-400">
                    {selectedUserForDetails.studentId}
                  </span>
                </div>

                {/* 3. Batch */}
                <div>
                  <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wide">Academic Batch</span>
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{selectedUserForDetails.batch || getEffectiveBatch(selectedUserForDetails)}</span>
                  </span>
                </div>

                {/* 4. Department */}
                <div className="col-span-2 sm:col-span-2">
                  <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wide">Department & Semester</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {selectedUserForDetails.department}
                    {selectedUserForDetails.semester ? ` • ${selectedUserForDetails.semester}` : ''}
                  </span>
                </div>

                {/* 5. Join Time & Date */}
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-neutral-400 uppercase font-bold tracking-wide">Registration Join Time</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                    <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{formatJoinTime(selectedUserForDetails.joinedAt || '')}</span>
                  </span>
                </div>
              </div>

              {/* Extended Identity & Affiliation Details */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-200 dark:divide-neutral-800">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">University Email</span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {selectedUserForDetails.email}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Contact Phone</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {selectedUserForDetails.phone || 'Not provided'}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Club Affiliation</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {selectedUserForDetails.clubAffiliation === 'computer_club'
                      ? 'City University Computer Club (CUCC)'
                      : 'City University Events & Clubs'}
                  </span>
                </div>

                {selectedUserForDetails.assignedWing && (
                  <div className="p-3 flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Assigned Subsector Wing</span>
                    <span className="font-bold text-[#D40000] dark:text-red-400 uppercase">
                      {selectedUserForDetails.assignedWing.replace('_', ' ')} WING
                    </span>
                  </div>
                )}

                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">System Authorization Level</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {selectedUserForDetails.role}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Membership Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active & Verified by DSW</span>
                  </span>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const targetUser = selectedUserForDetails;
                    setSelectedUserForDetails(null);
                    handleOpenEditUser(targetUser);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors border border-neutral-300 dark:border-neutral-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUserForDetails(null)}
                  className="px-5 py-2 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: EVENT CREATE & EDIT
          ===================================================================== */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="bg-[#D40000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold font-heading text-base">
                  {editingEventId ? 'Edit Event Details' : 'Create New University Event'}
                </h3>
              </div>
              <button onClick={() => setEventModalOpen(false)} className="text-white cursor-pointer hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-3.5 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intra University Programming Contest"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Kicker / Header Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WORKSHOP · PROGRAMMING"
                    value={eventKicker}
                    onChange={e => setEventKicker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Club Organization
                  </label>
                  <select
                    value={eventClubId}
                    onChange={e => setEventClubId(e.target.value as ClubCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  >
                    <option value="computer_club">Computer Club (CUCC)</option>
                    <option value="events_and_clubs">Events & Clubs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Subsector Wing
                  </label>
                  <select
                    value={eventWingSlug}
                    onChange={e => setEventWingSlug(e.target.value as ClubSubsector)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  >
                    {WINGS.map(w => (
                      <option key={w.slug} value={w.slug}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Capacity</label>
                  <input
                    type="number"
                    value={eventCapacity}
                    onChange={e => setEventCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Software Lab 402 or Central Playground"
                  value={eventVenue}
                  onChange={e => setEventVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Banner Image URL</label>
                <input
                  type="text"
                  value={eventBanner}
                  onChange={e => setEventBanner(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">Description</label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={e => setEventDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#11121A] text-neutral-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-5 py-2 rounded-xl bg-[#D40000] hover:bg-red-800 text-white font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEventId ? 'Save Event' : 'Create Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: ATTENDEE ROSTER MODAL
          ===================================================================== */}
      {attendeeRosterEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="bg-[#D40000] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-heading text-base">{attendeeRosterEvent.title}</h3>
                <p className="text-xs text-red-100">Registered Student Attendee Pass Roster</p>
              </div>
              <button onClick={() => setAttendeeRosterEvent(null)} className="text-white cursor-pointer hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs space-y-3">
              {attendeeRosterEvent.registrations?.length ? (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {attendeeRosterEvent.registrations.map(r => (
                    <div key={r.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-white block">{r.userName}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">{r.studentId} • {r.department}</span>
                      </div>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {r.ticketCode}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-neutral-400">No students registered yet for this event.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 6: IN-APP DELETE CONFIRMATION MODAL
          ===================================================================== */}
      {deleteConfirmation && deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151620] border-2 border-red-500/40 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 text-[#D40000] dark:text-red-300 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold font-heading text-lg text-neutral-900 dark:text-white leading-tight">
                  {deleteConfirmation.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {deleteConfirmation.subtitle}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                disabled={actionProcessing}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={actionProcessing}
                className="px-5 py-2 rounded-xl bg-[#D40000] hover:bg-red-800 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{actionProcessing ? 'Deleting...' : 'Yes, Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
