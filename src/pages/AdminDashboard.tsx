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
  Layers, 
  Search, 
  Filter, 
  UserPlus, 
  Upload, 
  CheckCircle2, 
  Lock, 
  Eye, 
  Clock, 
  GraduationCap, 
  Bell, 
  Image as ImageIcon, 
  FileText, 
  Camera
} from 'lucide-react';
import { 
  Club, 
  ClubEvent, 
  ControllerApplication, 
  User, 
  ClubCategory, 
  ClubSubsector,
  UserRole,
  Announcement,
  GalleryItem,
  ClubWing
} from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface AdminDashboardProps {
  clubs: Club[];
  events: ClubEvent[];
  announcements?: Announcement[];
  gallery?: GalleryItem[];
  applications: ControllerApplication[];
  onRefreshData: () => void;
  onUpdateClub?: (club: Club) => void;
  onEventCreated?: (evt: ClubEvent) => void;
  onEventUpdated?: (evt: ClubEvent) => void;
  onEventDeleted?: (id: string) => void;
  onAnnouncementCreated?: (ann: Announcement) => void;
  onAnnouncementUpdated?: (ann: Announcement) => void;
  onAnnouncementDeleted?: (id: string) => void;
  onGalleryAdded?: (item: GalleryItem) => void;
  onGalleryDeleted?: (id: string) => void;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Business Administration (BBA)',
  'Electrical & Electronic Engineering (EEE)',
  'Textile Engineering',
  'Civil Engineering',
  'Pharmacy',
  'English Language & Literature',
  'Law & Human Rights'
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
  announcements = [],
  gallery = [],
  applications,
  onRefreshData,
  onUpdateClub,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  onAnnouncementCreated,
  onAnnouncementUpdated,
  onAnnouncementDeleted,
  onGalleryAdded,
  onGalleryDeleted
}) => {
  const { user, role, loginAsDemo } = useAuth();
  
  // Active sub-tab inside Dashboard
  const [currentTab, setCurrentTab] = useState<
    'students' | 'controllers' | 'users' | 'events' | 'clubs' | 'notices' | 'gallery'
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
    type: 'user' | 'event' | 'application' | 'announcement' | 'gallery' | 'wing';
    id: string;
    clubId?: string;
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
    const { id, type, title, clubId } = deleteConfirmation;
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
        onEventDeleted?.(id);
        setSuccessMessage(res.message || `Event deleted successfully.`);
        onRefreshData();
      } else if (type === 'application') {
        const res = await api.deleteApplication(id, user?.id);
        setSuccessMessage('Application record removed.');
        onRefreshData();
      } else if (type === 'announcement') {
        const res = await api.deleteAnnouncement(id, user?.id);
        onAnnouncementDeleted?.(id);
        setSuccessMessage(res.message || 'Notice circular removed.');
        onRefreshData();
      } else if (type === 'gallery') {
        const res = await api.deleteGalleryItem(id, user?.id);
        onGalleryDeleted?.(id);
        setSuccessMessage('Photo removed from campus gallery.');
        onRefreshData();
      } else if (type === 'wing' && clubId) {
        const res = await api.deleteClubWing(clubId, id, user?.id);
        if (res.success && res.club) {
          onUpdateClub?.(res.club);
        }
        setSuccessMessage('Subsector wing removed successfully.');
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
        adminNoteInput || 'Approved by University Administration.',
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
        const res = await api.updateEvent(editingEventId, payload, user?.id);
        if (res.success && res.event) {
          onEventUpdated?.(res.event);
        }
        setSuccessMessage('Event updated successfully.');
      } else {
        const res = await api.createEvent(payload, user?.id);
        if (res.success && res.event) {
          onEventCreated?.(res.event);
        }
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

  /* ==========================================================================
     5. CLUBS & WINGS GOVERNANCE STATE & HANDLERS
     ========================================================================== */
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [clubName, setClubName] = useState('');
  const [clubMotto, setClubMotto] = useState('');
  const [clubAdvisorName, setClubAdvisorName] = useState('');
  const [clubAdvisorDesignation, setClubAdvisorDesignation] = useState('');
  const [clubPresidentName, setClubPresidentName] = useState('');
  const [clubEmail, setClubEmail] = useState('');
  const [clubHotline, setClubHotline] = useState('');

  const handleOpenEditClub = (c: Club) => {
    setEditingClub(c);
    setClubName(c.name);
    setClubMotto(c.motto);
    setClubAdvisorName(c.advisorName);
    setClubAdvisorDesignation(c.advisorDesignation);
    setClubPresidentName(c.presidentName);
    setClubEmail(c.email);
    setClubHotline(c.hotline);
    setClubModalOpen(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;
    setActionProcessing(true);
    try {
      const payload = {
        name: clubName.trim(),
        motto: clubMotto.trim(),
        advisorName: clubAdvisorName.trim(),
        advisorDesignation: clubAdvisorDesignation.trim(),
        presidentName: clubPresidentName.trim(),
        email: clubEmail.trim(),
        hotline: clubHotline.trim()
      };
      const res = await api.updateClub(editingClub.id, payload, user?.id);
      if (res.success && res.club) {
        onUpdateClub?.(res.club);
        setSuccessMessage(`Club "${res.club.name}" updated successfully.`);
      }
      setClubModalOpen(false);
      onRefreshData();
    } catch (err) {
      //
    } finally {
      setActionProcessing(false);
    }
  };

  // Wing management
  const [wingModalOpen, setWingModalOpen] = useState(false);
  const [selectedClubForWing, setSelectedClubForWing] = useState<Club | null>(null);
  const [editingWingId, setEditingWingId] = useState<string | null>(null);
  const [wingName, setWingName] = useState('');
  const [wingSlug, setWingSlug] = useState<ClubSubsector>('programming');
  const [wingShortDesc, setWingShortDesc] = useState('');
  const [wingWeeklySchedule, setWingWeeklySchedule] = useState('');
  const [wingRoomLocation, setWingRoomLocation] = useState('');

  const handleOpenAddWing = (c: Club) => {
    setSelectedClubForWing(c);
    setEditingWingId(null);
    setWingName('');
    setWingSlug(c.id === 'computer_club' ? 'programming' : 'sports');
    setWingShortDesc('');
    setWingWeeklySchedule('Fridays 4:00 PM');
    setWingRoomLocation('Campus Hub 304');
    setWingModalOpen(true);
  };

  const handleOpenEditWing = (c: Club, w: ClubWing) => {
    setSelectedClubForWing(c);
    setEditingWingId(w.id);
    setWingName(w.name);
    setWingSlug(w.slug);
    setWingShortDesc(w.shortDesc);
    setWingWeeklySchedule(w.weeklySchedule);
    setWingRoomLocation(w.roomLocation);
    setWingModalOpen(true);
  };

  const handleSaveWing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubForWing) return;
    setActionProcessing(true);
    try {
      const payload: Partial<ClubWing> = {
        name: wingName.trim(),
        slug: wingSlug,
        shortDesc: wingShortDesc.trim(),
        fullDesc: wingShortDesc.trim(),
        weeklySchedule: wingWeeklySchedule.trim() || 'Weekly',
        roomLocation: wingRoomLocation.trim() || 'Campus Hub'
      };
      if (editingWingId) {
        const res = await api.updateClubWing(selectedClubForWing.id, editingWingId, payload, user?.id);
        if (res.success && res.club) {
          onUpdateClub?.(res.club);
          setSuccessMessage(`Wing "${payload.name}" updated successfully.`);
        }
      } else {
        const res = await api.addClubWing(selectedClubForWing.id, payload, user?.id);
        if (res.success && res.club) {
          onUpdateClub?.(res.club);
          setSuccessMessage(`New wing "${payload.name}" added to ${selectedClubForWing.name}.`);
        }
      }
      setWingModalOpen(false);
      onRefreshData();
    } catch (err) {
      //
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDeleteWingPrompt = (c: Club, w: ClubWing) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'wing',
      id: w.id,
      clubId: c.id,
      title: `Delete Wing "${w.name}"?`,
      subtitle: `Are you sure you want to permanently remove "${w.name}" from ${c.name}? This will update the club structure across the website.`
    });
  };

  /* ==========================================================================
     6. NOTICES & CIRCULARS STATE & HANDLERS
     ========================================================================== */
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'urgent' | 'important' | 'general'>('general');
  const [noticeCategory, setNoticeCategory] = useState('Official Circular');
  const [noticeClubId, setNoticeClubId] = useState<'all' | ClubCategory>('all');
  const [noticeWingSlug, setNoticeWingSlug] = useState<'all' | ClubSubsector>('all');
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeAttachmentName, setNoticeAttachmentName] = useState('');
  const [noticeSearch, setNoticeSearch] = useState('');

  const handleOpenCreateNotice = () => {
    setEditingNoticeId(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticePriority('general');
    setNoticeCategory('Official Notice');
    setNoticeClubId('all');
    setNoticeWingSlug('all');
    setNoticePinned(false);
    setNoticeAttachmentName('');
    setNoticeModalOpen(true);
  };

  const handleOpenEditNotice = (n: Announcement) => {
    setEditingNoticeId(n.id);
    setNoticeTitle(n.title);
    setNoticeContent(n.content);
    setNoticePriority(n.priority as any);
    setNoticeCategory(n.category || 'Official Notice');
    setNoticeClubId(n.clubId as any);
    setNoticeWingSlug(n.wingSlug as any);
    setNoticePinned(!!n.pinned);
    setNoticeAttachmentName(n.attachmentName || '');
    setNoticeModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionProcessing(true);
    try {
      const payload: Partial<Announcement> = {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        priority: noticePriority,
        category: noticeCategory,
        clubId: noticeClubId,
        wingSlug: noticeWingSlug,
        pinned: noticePinned,
        attachmentName: noticeAttachmentName.trim() || undefined
      };
      if (editingNoticeId) {
        const res = await api.updateAnnouncement(editingNoticeId, payload, user?.id);
        if (res.success && res.announcement) {
          onAnnouncementUpdated?.(res.announcement);
          setSuccessMessage(`Notice "${payload.title}" updated.`);
        }
      } else {
        const res = await api.createAnnouncement(payload, user?.id);
        if (res.success && res.announcement) {
          onAnnouncementCreated?.(res.announcement);
          setSuccessMessage(`New circular published across website & ticker.`);
        }
      }
      setNoticeModalOpen(false);
      onRefreshData();
    } catch (err) {
      //
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDeleteNoticePrompt = (n: Announcement) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'announcement',
      id: n.id,
      title: `Delete Notice "${n.title}"?`,
      subtitle: `Are you sure you want to permanently remove this announcement? It will be removed from the top marquee and notice board.`
    });
  };

  /* ==========================================================================
     7. CAMPUS GALLERY STATE & HANDLERS
     ========================================================================== */
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryImageUrl, setGalleryImageUrl] = useState('');
  const [galleryClubId, setGalleryClubId] = useState<ClubCategory>('computer_club');
  const [galleryWingSlug, setGalleryWingSlug] = useState<ClubSubsector>('programming');
  const [galleryEventName, setGalleryEventName] = useState('');

  const handleOpenAddGallery = () => {
    setGalleryTitle('');
    setGalleryCaption('');
    setGalleryImageUrl('');
    setGalleryClubId('computer_club');
    setGalleryWingSlug('programming');
    setGalleryEventName('');
    setGalleryModalOpen(true);
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryImageUrl.trim()) return;
    setActionProcessing(true);
    try {
      const payload: Partial<GalleryItem> = {
        title: galleryTitle.trim() || 'Campus Event Photograph',
        caption: galleryCaption.trim(),
        imageUrl: galleryImageUrl.trim(),
        clubId: galleryClubId,
        wingSlug: galleryWingSlug,
        eventName: galleryEventName.trim() || 'Campus Highlights'
      };
      const res = await api.createGalleryItem(payload, user?.id);
      if (res.success && res.item) {
        onGalleryAdded?.(res.item);
        setSuccessMessage('Photo published to campus gallery.');
      }
      setGalleryModalOpen(false);
      onRefreshData();
    } catch (err) {
      //
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDeleteGalleryPrompt = (g: GalleryItem) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'gallery',
      id: g.id,
      title: `Delete Photo "${g.title}"?`,
      subtitle: `Are you sure you want to remove this photo from the campus gallery?`
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
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 pt-0.5">
              <span>Admin: <strong className="text-neutral-900 dark:text-white font-semibold">Md Arifuzzaman Abir</strong></span>
              <span>•</span>
              <span className="font-mono text-neutral-500 dark:text-neutral-400">arifuzzamanabir2025@gmail.com</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
              This dashboard is strictly reserved for authorized City University Administrators (Central Command). Only administrators can publish or remove announcements & notices, add or delete gallery images, add or remove students, and appoint or demote controllers.
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
            City University • Administrative Operations Only
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
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs pt-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs"></span>
                <span>Admin: {user?.name || 'Md Arifuzzaman Abir'}</span>
              </span>
              <span className="text-red-300 hidden sm:inline">•</span>
              <span className="text-red-200 font-mono text-[11px] bg-black/30 px-2.5 py-0.5 rounded-md border border-white/10">
                {user?.email || 'arifuzzamanabir2025@gmail.com'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Events</span>
            <span className="text-lg font-bold font-mono text-white">{events.length}</span>
          </div>
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Controllers</span>
            <span className="text-lg font-bold font-mono text-amber-300">{controllersCount}</span>
          </div>
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Students</span>
            <span className="text-lg font-bold font-mono text-emerald-300">{usersList.filter(u => u.role === 'user').length}</span>
          </div>
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Notices</span>
            <span className="text-lg font-bold font-mono text-cyan-300">{announcements.length}</span>
          </div>
          <div className="bg-black/35 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center col-span-2 sm:col-span-1">
            <span className="block text-[10px] text-red-200 uppercase font-bold">Gallery</span>
            <span className="text-lg font-bold font-mono text-purple-300">{gallery.length}</span>
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

        {/* TAB 5: NOTICES & CIRCULARS */}
        <button
          onClick={() => setCurrentTab('notices')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            currentTab === 'notices'
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white dark:bg-[#151620] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Circulars & Notices ({announcements.length})</span>
        </button>

        {/* TAB 6: CAMPUS GALLERY */}
        <button
          onClick={() => setCurrentTab('gallery')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            currentTab === 'gallery'
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white dark:bg-[#151620] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-red-400'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Campus Gallery ({gallery.length})</span>
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
                  {userRoleFilter === 'all'
                    ? 'All University Members & Leadership Registry'
                    : userRoleFilter === 'controller' || currentTab === 'controllers'
                    ? 'Club Controllers Leadership Directory'
                    : userRoleFilter === 'user' || currentTab === 'students'
                    ? 'Students & General Members Registry'
                    : 'University Members & Controllers Directory'}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {userRoleFilter === 'all'
                  ? 'Showing all registered accounts across all roles: Students, Club Controllers, and Administrators.'
                  : userRoleFilter === 'controller' || currentTab === 'controllers'
                  ? 'Official records of appointed club controllers with IDs, batch, department, join timestamp, and assigned subsector wings.'
                  : userRoleFilter === 'user' || currentTab === 'students'
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
                    onClick={() => {
                      setUserRoleFilter(roleKey);
                      if (roleKey === 'all') {
                        setCurrentTab('users');
                      }
                    }}
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
                    <th className="p-3.5">Wing / Club Affiliation</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-800 dark:text-neutral-200">
                  {usersList
                    .filter(u => {
                      // Filter by role: when userRoleFilter is 'all', show all roles (students, controllers, administrators)
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

                          {/* 2. Wing / Club Affiliation */}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-100 dark:bg-red-950 text-[#D40000] dark:text-red-300 font-mono">
                      {c.shortCode}
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold">{c.totalMembers} Members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditClub(c)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#D40000]" />
                      <span>Edit Governance</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddWing(c)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#D40000] hover:bg-red-800 text-white cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Wing</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg font-heading text-neutral-900 dark:text-white">{c.name}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 italic mt-0.5">"{c.motto}"</p>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <p>Student President: <strong>{c.presidentName}</strong></p>
                  <p>Official Email: <strong>{c.email}</strong></p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Active Subsector Wings ({c.wings.length}):
                    </span>
                  </div>
                  <div className="space-y-2">
                    {c.wings.map(w => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                              {w.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 font-mono text-neutral-600 dark:text-neutral-300">
                              {w.slug}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {w.shortDesc || w.roomLocation || w.weeklySchedule}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditWing(c, w)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                            title="Edit Wing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWingPrompt(c, w)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Delete Wing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: OFFICIAL CIRCULARS & NOTICES
          ===================================================================== */}
      {currentTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#D40000]" />
                University Circulars & Announcements
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Official broadcasts published across the campus ticker, club boards, and student portal.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter notices..."
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-xl focus:outline-none focus:border-[#D40000] w-48 text-neutral-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenCreateNotice}
                className="px-4 py-2 bg-[#D40000] hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Circular</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {announcements
              .filter(n => {
                if (!noticeSearch.trim()) return true;
                const q = noticeSearch.toLowerCase();
                return (
                  n.title.toLowerCase().includes(q) ||
                  n.content.toLowerCase().includes(q) ||
                  (n.category && n.category.toLowerCase().includes(q))
                );
              })
              .map((n) => (
                <div
                  key={n.id}
                  className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.pinned && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                            Pinned
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            n.priority === 'urgent'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : n.priority === 'important'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {n.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {n.category || 'Official Notice'}
                        </span>
                        {n.wingSlug && n.wingSlug !== 'all' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            {n.wingSlug}
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400">
                          {new Date(n.publishedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h4 className="font-bold text-base text-neutral-900 dark:text-white">{n.title}</h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                        {n.content}
                      </p>

                      {n.attachmentName && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 font-mono">
                          <FileText className="w-3.5 h-3.5 text-[#D40000]" />
                          <span>{n.attachmentName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditNotice(n)}
                        className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Edit Notice"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNoticePrompt(n)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {announcements.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl">
                <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No circulars published yet</p>
                <p className="text-xs text-neutral-500 mt-1">Click "Publish Circular" to post an official broadcast.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: CAMPUS GALLERY
          ===================================================================== */}
      {currentTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#D40000]" />
                Campus Photo Gallery & Media Vault
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Visual highlights displayed across the university home page and club spotlight sections.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddGallery}
              className="px-4 py-2 bg-[#D40000] hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Photograph</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {gallery.map((g) => (
              <div
                key={g.id}
                className="bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl overflow-hidden group shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
              >
                <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <img
                    src={g.imageUrl}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryPrompt(g)}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white backdrop-blur-xs transition-colors cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white">
                      {g.wingSlug}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-[#D40000] tracking-wider truncate">
                    {g.eventName || 'Campus Highlight'}
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">{g.title}</h4>
                  {g.caption && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{g.caption}</p>
                  )}
                </div>
              </div>
            ))}

            {gallery.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white dark:bg-[#141520] border border-neutral-200 dark:border-[#2D1B22] rounded-2xl">
                <Camera className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No photos in the gallery</p>
                <p className="text-xs text-neutral-500 mt-1">Click "Upload Photograph" to add imagery to the university showcase.</p>
              </div>
            )}
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
                    <span>Active & Verified Member</span>
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

              <div className="grid grid-cols-2 gap-3">
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
          MODAL: CLUB GOVERNANCE EDIT
          ===================================================================== */}
      {clubModalOpen && editingClub && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="bg-[#D40000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold font-heading text-base">Edit Club Governance: {editingClub.name}</h3>
              </div>
              <button onClick={() => setClubModalOpen(false)} className="text-white cursor-pointer hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="p-6 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Club Official Name
                </label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Motto / Slogan
                </label>
                <input
                  type="text"
                  required
                  value={clubMotto}
                  onChange={(e) => setClubMotto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Faculty Advisor Name
                  </label>
                  <input
                    type="text"
                    required
                    value={clubAdvisorName}
                    onChange={(e) => setClubAdvisorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Advisor Academic Title
                  </label>
                  <input
                    type="text"
                    required
                    value={clubAdvisorDesignation}
                    onChange={(e) => setClubAdvisorDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Student President Name
                </label>
                <input
                  type="text"
                  required
                  value={clubPresidentName}
                  onChange={(e) => setClubPresidentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={clubEmail}
                    onChange={(e) => setClubEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Hotline / Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={clubHotline}
                    onChange={(e) => setClubHotline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setClubModalOpen(false)}
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
                  <span>Save Club Governance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: SUBSECTOR WING ADD / EDIT
          ===================================================================== */}
      {wingModalOpen && selectedClubForWing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="bg-[#D40000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold font-heading text-base">
                  {editingWingId ? 'Edit Subsector Wing' : `Add Wing to ${selectedClubForWing.name}`}
                </h3>
              </div>
              <button onClick={() => setWingModalOpen(false)} className="text-white cursor-pointer hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWing} className="p-6 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Wing Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Competitive Programming & DSA Wing"
                  value={wingName}
                  onChange={(e) => setWingName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Subsector Category Key
                </label>
                <select
                  value={wingSlug}
                  onChange={(e) => setWingSlug(e.target.value as ClubSubsector)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                >
                  <option value="programming">Programming Wing (CUCC)</option>
                  <option value="cyber_security">Cyber Security Wing (CUCC)</option>
                  <option value="research">Research Wing (CUCC)</option>
                  <option value="sports">Sports Wing (Events & Clubs)</option>
                  <option value="cultural">Cultural Wing (Events & Clubs)</option>
                  <option value="tour">Tour & Picnic Wing (Events & Clubs)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Room / Lab Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 402, Academic Bldg A"
                    value={wingRoomLocation}
                    onChange={(e) => setWingRoomLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Weekly Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Thursdays 4:30 PM"
                    value={wingWeeklySchedule}
                    onChange={(e) => setWingWeeklySchedule(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Description & Focus
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Focus areas, workshops, and student training details..."
                  value={wingShortDesc}
                  onChange={(e) => setWingShortDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setWingModalOpen(false)}
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
                  <span>{editingWingId ? 'Save Wing' : 'Add Wing to Club'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CIRCULAR / NOTICE PUBLISH & EDIT
          ===================================================================== */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="bg-[#D40000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-bold font-heading text-base">
                  {editingNoticeId ? 'Edit Official Circular' : 'Publish New University Circular'}
                </h3>
              </div>
              <button onClick={() => setNoticeModalOpen(false)} className="text-white cursor-pointer hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="p-6 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Circular Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Trimester Wing Orientations"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  >
                    <option value="urgent">Urgent (Immediate Notice)</option>
                    <option value="important">Important (Official Advisory)</option>
                    <option value="general">General (Standard Information)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Official Circular, Advisory, Workshop"
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Target Organization
                  </label>
                  <select
                    value={noticeClubId}
                    onChange={(e) => setNoticeClubId(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  >
                    <option value="all">Across Entire University</option>
                    <option value="computer_club">Computer Club Members</option>
                    <option value="events_and_clubs">Events & Clubs Members</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Target Subsector Wing
                  </label>
                  <select
                    value={noticeWingSlug}
                    onChange={(e) => setNoticeWingSlug(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  >
                    <option value="all">All Wings</option>
                    <option value="programming">Programming Wing</option>
                    <option value="cyber_security">Cyber Security Wing</option>
                    <option value="research">Research Wing</option>
                    <option value="sports">Sports Wing</option>
                    <option value="cultural">Cultural Wing</option>
                    <option value="tour">Tour & Picnic Wing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Attachment Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule_Spring_2026.pdf"
                  value={noticeAttachmentName}
                  onChange={(e) => setNoticeAttachmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Full Announcement Text
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed text of the circular to be broadcasted to students..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="noticePinnedCheckbox"
                  checked={noticePinned}
                  onChange={(e) => setNoticePinned(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D40000] focus:ring-[#D40000] cursor-pointer"
                />
                <label htmlFor="noticePinnedCheckbox" className="text-xs text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer">
                  Pin to top of website notice boards and news ticker
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
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
                  <span>{editingNoticeId ? 'Save Circular' : 'Publish Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CAMPUS GALLERY UPLOAD
          ===================================================================== */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="bg-[#D40000] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <h3 className="font-bold font-heading text-base">Add Photograph to Campus Gallery</h3>
              </div>
              <button onClick={() => setGalleryModalOpen(false)} className="text-white cursor-pointer hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGallery} className="p-6 space-y-3.5 overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Photo Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Tech Hackathon 2026 Final Presentation"
                  value={galleryTitle}
                  onChange={(e) => setGalleryTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={galleryImageUrl}
                  onChange={(e) => setGalleryImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Event / Occasion Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Intra-University Tournament"
                    value={galleryEventName}
                    onChange={(e) => setGalleryEventName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Affiliated Organization
                  </label>
                  <select
                    value={galleryClubId}
                    onChange={(e) => setGalleryClubId(e.target.value as ClubCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                  >
                    <option value="computer_club">Computer Club</option>
                    <option value="events_and_clubs">Events & Clubs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Subsector Wing
                </label>
                <select
                  value={galleryWingSlug}
                  onChange={(e) => setGalleryWingSlug(e.target.value as ClubSubsector)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                >
                  <option value="programming">Programming Wing</option>
                  <option value="cyber_security">Cyber Security Wing</option>
                  <option value="research">Research Wing</option>
                  <option value="sports">Sports Wing</option>
                  <option value="cultural">Cultural Wing</option>
                  <option value="tour">Tour & Picnic Wing</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Photo Caption
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional caption describing the photograph..."
                  value={galleryCaption}
                  onChange={(e) => setGalleryCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#D40000]"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setGalleryModalOpen(false)}
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
                  <span>Publish Photograph</span>
                </button>
              </div>
            </form>
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
