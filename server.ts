import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  INITIAL_USERS,
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_GALLERY,
  INITIAL_APPLICATIONS
} from './src/data/initialData.ts';
import type {
  User,
  UserRole,
  Club,
  ClubCategory,
  ClubSubsector,
  ClubWing,
  ClubExecutive,
  ClubEvent,
  Announcement,
  GalleryItem,
  ControllerApplication,
  EventRegistration
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Database Store
let users: User[] = [...INITIAL_USERS];
let clubs: Club[] = JSON.parse(JSON.stringify(INITIAL_CLUBS));
let events: ClubEvent[] = JSON.parse(JSON.stringify(INITIAL_EVENTS));
let announcements: Announcement[] = JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS));
let gallery: GalleryItem[] = JSON.parse(JSON.stringify(INITIAL_GALLERY));
let applications: ControllerApplication[] = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));

function syncLeadershipAndMembership() {
  for (const club of clubs) {
    const clubUsers = users.filter(u => u.clubAffiliation === club.id);
    if (clubUsers.length > 0) {
      club.totalMembers = Math.max(club.totalMembers, clubUsers.length);
    }
    
    if (club.id === 'computer_club') {
      club.presidentName = 'Hanif Hossain Samir(CSE 66B)';
      for (const wing of club.wings) {
        wing.conveners = [
          {
            id: `conv-samir-${wing.slug}`,
            name: 'Hanif Hossain Samir',
            designation: 'Student President & Computer Club Controller',
            department: 'CSE (66B)',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
            email: 'controller.tech@cityuniversity.edu'
          }
        ];
      }
    } else if (club.id === 'events_and_clubs') {
      club.presidentName = 'Mir Himel Ahmed(CSE 66B)';
      for (const wing of club.wings) {
        wing.conveners = [
          {
            id: `conv-himel-${wing.slug}`,
            name: 'Mir Himel Ahmed',
            designation: 'Student President & Events & Clubs Controller',
            department: 'CSE (66B)',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
            email: 'controller.events@cityuniversity.edu'
          }
        ];
      }
    }
  }

  // Ensure controllers in users table match designated student presidents
  const samirIdx = users.findIndex(u => u.name.includes('Hanif Hossain Samir') || u.studentId === '1098');
  if (samirIdx !== -1) {
    users[samirIdx].role = 'controller';
    users[samirIdx].batch = 'CSE 66B';
    users[samirIdx].department = 'Computer Science & Engineering';
    users[samirIdx].clubAffiliation = 'computer_club';
  }

  const himelIdx = users.findIndex(u => u.name.includes('Mir Himel Ahmed') || u.studentId === '1120');
  if (himelIdx !== -1) {
    users[himelIdx].role = 'controller';
    users[himelIdx].batch = 'CSE 66B';
    users[himelIdx].department = 'Computer Science & Engineering';
    users[himelIdx].clubAffiliation = 'events_and_clubs';
  }
}

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      users,
      clubs,
      events,
      announcements,
      gallery,
      applications
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save to disk:', err);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users) && data.users.length > 0) users = data.users;
      if (Array.isArray(data.clubs) && data.clubs.length > 0) clubs = data.clubs;
      if (Array.isArray(data.events) && data.events.length > 0) events = data.events;
      if (Array.isArray(data.announcements) && data.announcements.length > 0) announcements = data.announcements;
      if (Array.isArray(data.gallery) && data.gallery.length > 0) gallery = data.gallery;
      if (Array.isArray(data.applications)) applications = data.applications;
    }
    syncLeadershipAndMembership();
    saveToDisk();
  } catch (err) {
    console.error('Failed to load from disk, using defaults:', err);
  }
}

loadFromDisk();

async function startServer() {
  const app = express();
  
  // Resolve port:
  // 1. Command-line flag --port <number> (passed by AI Studio dev runner: --port 3000)
  // 2. DEFAULT_APP_PORT environment variable (set to 3000 in AI Studio)
  // 3. PORT environment variable (ignoring 8080 which is reserved for host Nginx proxy)
  // 4. Default to 3000
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : NaN;
  const envPort = Number(process.env.PORT);
  const defaultPort = Number(process.env.DEFAULT_APP_PORT);
  const PORT = !isNaN(cliPort) && cliPort > 0
    ? cliPort
    : (defaultPort || (envPort && envPort !== 8080 ? envPort : 3000));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS headers for API
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Helper auth check from header
  const getAuthUser = (req: Request): User | undefined => {
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      return users.find(u => u.id === userId);
    }
    return undefined;
  };

  /* ==========================================================================
     API ROUTES
     ========================================================================== */

  // 0. Health check & Portal Meta
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      app: 'City University Events & Clubs (CUEC)',
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // 1. Stats overview
  app.get('/api/stats', (_req: Request, res: Response) => {
    const totalMembers = clubs.reduce((acc, c) => acc + c.totalMembers, 0);
    const activeEvents = events.filter(e => e.status === 'upcoming').length;
    const totalAnnouncements = announcements.length;
    const pendingApplications = applications.filter(a => a.status === 'pending').length;

    res.json({
      success: true,
      stats: {
        totalClubs: clubs.length,
        totalWings: clubs.reduce((acc, c) => acc + c.wings.length, 0),
        totalMembers,
        activeEvents,
        totalAnnouncements,
        pendingApplications,
        registeredUsers: users.length
      }
    });
  });

  // 2. Clubs & Wings
  app.get('/api/clubs', (_req: Request, res: Response) => {
    res.json({ success: true, clubs });
  });

  app.get('/api/clubs/:id', (req: Request, res: Response) => {
    const club = clubs.find(c => c.id === req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    res.json({ success: true, club });
  });

  app.put('/api/clubs/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Only Administrators can modify club details.' });
    }
    const idx = clubs.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    clubs[idx] = { ...clubs[idx], ...req.body };
    syncLeadershipAndMembership();
    saveToDisk();
    res.json({ success: true, club: clubs[idx] });
  });

  // Club Wings: Add Wing
  app.post('/api/clubs/:id/wings', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Only Administrators can add club wings.' });
    }
    const idx = clubs.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const { name, slug, shortDesc, fullDesc, kicker, badge, weeklySchedule, roomLocation } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Wing name and slug identifier are required.' });
    }

    const newWing: ClubWing = {
      id: req.body.id || `wing-${slug}-${Date.now()}`,
      clubId: clubs[idx].id,
      slug: slug as ClubSubsector,
      name,
      kicker: kicker || `${name.toUpperCase()} WING`,
      shortDesc: shortDesc || `Official subsector wing of ${clubs[idx].name}.`,
      fullDesc: fullDesc || shortDesc || `Official activities, seminars, and projects under ${name}.`,
      badge: badge || 'Active Wing',
      iconName: req.body.iconName || 'Sparkles',
      bannerUrl: req.body.bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      vision: req.body.vision || 'Empowering City University students through continuous skill growth.',
      weeklySchedule: weeklySchedule || 'Fridays 4:00 PM',
      roomLocation: roomLocation || 'Campus Hub',
      conveners: req.body.conveners || [],
      keyActivities: req.body.keyActivities || ['Seminars', 'Competitions', 'Practical Workshops'],
      pastAchievements: req.body.pastAchievements || [],
      membershipPerks: req.body.membershipPerks || ['Official Certification', 'Leadership Experience']
    };

    clubs[idx].wings.push(newWing);
    syncLeadershipAndMembership();
    saveToDisk();
    res.status(201).json({ success: true, wing: newWing, club: clubs[idx] });
  });

  // Club Wings: Update Wing
  app.put('/api/clubs/:id/wings/:wingId', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Only Administrators can update club wings.' });
    }
    const idx = clubs.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const wIdx = clubs[idx].wings.findIndex(w => w.id === req.params.wingId || w.slug === req.params.wingId);
    if (wIdx === -1) {
      return res.status(404).json({ success: false, message: 'Wing not found' });
    }

    clubs[idx].wings[wIdx] = { ...clubs[idx].wings[wIdx], ...req.body };
    syncLeadershipAndMembership();
    saveToDisk();
    res.json({ success: true, wing: clubs[idx].wings[wIdx], club: clubs[idx] });
  });

  // Club Wings: Delete Wing
  app.delete('/api/clubs/:id/wings/:wingId', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Only Administrators can delete club wings.' });
    }
    const idx = clubs.findIndex(c => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    clubs[idx].wings = clubs[idx].wings.filter(w => w.id !== req.params.wingId && w.slug !== req.params.wingId);
    syncLeadershipAndMembership();
    saveToDisk();
    res.json({ success: true, message: 'Wing removed successfully.', club: clubs[idx] });
  });

  // 3. Events
  app.get('/api/events', (req: Request, res: Response) => {
    let result = [...events];
    const { clubId, wingSlug, status, search } = req.query;

    if (clubId && clubId !== 'all') {
      result = result.filter(e => e.clubId === clubId);
    }
    if (wingSlug && wingSlug !== 'all') {
      result = result.filter(e => e.wingSlug === wingSlug);
    }
    if (status && status !== 'all') {
      result = result.filter(e => e.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, events: result });
  });

  app.get('/api/events/:id', (req: Request, res: Response) => {
    const evt = events.find(e => e.id === req.params.id);
    if (!evt) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, event: evt });
  });

  app.post('/api/events', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only Administrators and Controllers can create events.' });
    }

    const {
      title,
      clubId,
      wingSlug,
      category,
      description,
      fullDetails,
      bannerUrl,
      date,
      time,
      venue,
      registrationDeadline,
      capacity,
      chiefGuests,
      tags,
      kicker
    } = req.body;

    if (!title || !clubId || !wingSlug || !date || !venue) {
      return res.status(400).json({ success: false, message: 'Missing required event fields.' });
    }

    const newEvent: ClubEvent = {
      id: `evt-${Date.now()}`,
      title,
      clubId,
      wingSlug,
      category: category || 'General Event',
      kicker: kicker || `${(category || 'Event').toUpperCase()} · ${wingSlug.replace('_', ' ').toUpperCase()}`,
      description,
      fullDetails: fullDetails || description,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      date,
      time: time || '10:00 AM',
      venue,
      registrationDeadline: registrationDeadline || date,
      capacity: Number(capacity) || 100,
      registeredCount: 0,
      chiefGuests: Array.isArray(chiefGuests) ? chiefGuests : (chiefGuests ? [chiefGuests] : []),
      tags: Array.isArray(tags) ? tags : ['CUEC', 'Campus'],
      isFeatured: req.body.isFeatured || false,
      status: 'upcoming',
      registrations: []
    };

    events.unshift(newEvent);
    saveToDisk();
    res.status(201).json({ success: true, event: newEvent });
  });

  app.put('/api/events/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const idx = events.findIndex(e => e.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    events[idx] = {
      ...events[idx],
      ...req.body,
      id: events[idx].id // protect ID
    };

    saveToDisk();
    res.json({ success: true, event: events[idx] });
  });

  app.delete('/api/events/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const initialLen = events.length;
    events = events.filter(e => e.id !== req.params.id);
    if (events.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    saveToDisk();
    res.json({ success: true, message: 'Event removed successfully.' });
  });

  // Register for event
  app.post('/api/events/:id/register', (req: Request, res: Response) => {
    const evt = events.find(e => e.id === req.params.id);
    if (!evt) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { userId, userName, studentId, email, department } = req.body;
    if (!userName || !studentId || !email) {
      return res.status(400).json({ success: false, message: 'Student information is required for registration.' });
    }

    // Check duplicate
    const alreadyRegistered = evt.registrations.some(
      r => r.studentId === studentId || r.email === email || (userId && r.userId === userId)
    );
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: 'Student is already registered for this event.' });
    }

    // No limit slots for all clubs: event registrations are always accepted

    const registration: EventRegistration = {
      id: `reg-${Date.now()}`,
      userId: userId || `guest-${Date.now()}`,
      userName,
      studentId,
      email,
      department: department || 'General Studies',
      registeredAt: new Date().toISOString(),
      ticketCode: `CUEC-${evt.clubId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    evt.registrations.push(registration);
    evt.registeredCount = evt.registrations.filter(r => r.status !== 'rejected').length;

    res.status(201).json({ success: true, registration, event: evt });
  });

  // Administrator: Approve new user application or existing applicant for event & wing
  app.post('/api/events/:id/approve-application', (req: Request, res: Response) => {
    const evt = events.find(e => e.id === req.params.id);
    if (!evt) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { regId, userName, studentId, email, department, wingSlug, adminName } = req.body;

    // Case 1: Approve existing pending application
    if (regId) {
      const existing = evt.registrations.find(r => r.id === regId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Application record not found.' });
      }
      existing.status = 'approved';
      existing.approvedBy = adminName || 'Administrator';
      existing.approvedAt = new Date().toISOString();
      evt.registeredCount = evt.registrations.filter(r => r.status === 'approved').length;
      return res.json({ success: true, message: `Application for ${existing.userName} approved successfully.`, event: evt, registration: existing });
    }

    // Case 2: Direct admission of new user by Administrator
    if (!userName || !studentId || !email) {
      return res.status(400).json({ success: false, message: 'Student name, ID, and email are required to approve.' });
    }

    const newRegistration: EventRegistration = {
      id: `reg-${Date.now()}`,
      userId: `user-${studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
      userName,
      studentId,
      email,
      department: department || 'General Studies',
      registeredAt: new Date().toISOString(),
      ticketCode: `CUEC-${(wingSlug || evt.wingSlug || 'EVT').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'approved',
      wingSlug: (wingSlug || evt.wingSlug) as any,
      approvedBy: adminName || 'Administrator',
      approvedAt: new Date().toISOString()
    };

    evt.registrations.unshift(newRegistration);
    evt.registeredCount = evt.registrations.filter(r => r.status === 'approved').length;
    saveToDisk();

    res.json({
      success: true,
      message: `New student ${userName} has been approved and joined into ${evt.title}.`,
      event: evt,
      registration: newRegistration
    });
  });

  // Administrator: Reject event application
  app.patch('/api/events/:id/registrations/:regId/reject', (req: Request, res: Response) => {
    const evt = events.find(e => e.id === req.params.id);
    if (!evt) return res.status(404).json({ success: false, message: 'Event not found' });
    const reg = evt.registrations.find(r => r.id === req.params.regId);
    if (!reg) return res.status(404).json({ success: false, message: 'Application record not found.' });

    reg.status = 'rejected';
    evt.registeredCount = evt.registrations.filter(r => r.status === 'approved').length;
    saveToDisk();
    res.json({ success: true, message: 'Application marked as rejected.', event: evt });
  });

  // Administrator: Delete registration
  app.delete('/api/events/:id/registrations/:regId', (req: Request, res: Response) => {
    const evt = events.find(e => e.id === req.params.id);
    if (!evt) return res.status(404).json({ success: false, message: 'Event not found' });
    evt.registrations = evt.registrations.filter(r => r.id !== req.params.regId);
    evt.registeredCount = evt.registrations.filter(r => r.status === 'approved').length;
    saveToDisk();
    res.json({ success: true, message: 'Application removed.', event: evt });
  });

  // 4. Announcements
  app.get('/api/announcements', (req: Request, res: Response) => {
    let result = [...announcements];
    const { clubId, priority } = req.query;

    if (clubId && clubId !== 'all') {
      result = result.filter(a => a.clubId === clubId || a.clubId === 'all');
    }
    if (priority && priority !== 'all') {
      result = result.filter(a => a.priority === priority);
    }

    // Sort: pinned first, then newest
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    res.json({ success: true, announcements: result });
  });

  app.post('/api/announcements', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Only Administrators and Controllers can issue announcements.' });
    }

    const { title, content, clubId, wingSlug, priority, category, attachmentName, imageUrl, pinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      clubId: clubId || 'all',
      wingSlug: wingSlug || 'all',
      priority: priority || 'general',
      publishedAt: new Date().toISOString(),
      authorName: authUser?.name || 'City University Student Affairs',
      authorRole: authUser?.role === 'administrator' ? 'Administrator' : 'Club Controller',
      attachmentName,
      imageUrl: imageUrl || undefined,
      category: category || 'Notice',
      pinned: !!pinned
    };

    announcements.unshift(newAnnouncement);
    saveToDisk();
    res.status(201).json({ success: true, announcement: newAnnouncement });
  });

  app.put('/api/announcements/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const idx = announcements.findIndex(a => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    announcements[idx] = { ...announcements[idx], ...req.body, id: announcements[idx].id };
    saveToDisk();
    res.json({ success: true, announcement: announcements[idx] });
  });

  app.delete('/api/announcements/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    announcements = announcements.filter(a => a.id !== req.params.id);
    saveToDisk();
    res.json({ success: true, message: 'Announcement removed successfully.' });
  });

  // 5. Gallery
  app.get('/api/gallery', (req: Request, res: Response) => {
    let result = [...gallery];
    const { clubId, wingSlug } = req.query;

    if (clubId && clubId !== 'all') {
      result = result.filter(g => g.clubId === clubId);
    }
    if (wingSlug && wingSlug !== 'all') {
      result = result.filter(g => g.wingSlug === wingSlug);
    }

    res.json({ success: true, gallery: result });
  });

  app.post('/api/gallery', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    const { title, caption, imageUrl, imageUrls, clubId, wingSlug, eventName } = req.body;

    // Support batch adding multiple photos to album
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      const createdItems: GalleryItem[] = [];
      const derivedClubId: ClubCategory = clubId || (['programming', 'cyber_security', 'research'].includes(wingSlug) ? 'computer_club' : 'events_and_clubs');
      
      imageUrls.forEach((url: string, index: number) => {
        if (!url || typeof url !== 'string') return;
        const newItem: GalleryItem = {
          id: `gal-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          title: title || `${String(wingSlug).replace('_', ' ')} Photo ${index + 1}`,
          caption: caption || '',
          imageUrl: url,
          clubId: derivedClubId,
          wingSlug: wingSlug || 'sports',
          eventName: eventName || 'University Album Photo',
          date: new Date().toISOString().split('T')[0],
          photogName: authUser?.name || 'City University Member',
          likes: 0
        };
        gallery.unshift(newItem);
        createdItems.push(newItem);
      });
      saveToDisk();
      return res.status(201).json({ success: true, items: createdItems, item: createdItems[0] });
    }

    if (!imageUrl || !wingSlug) {
      return res.status(400).json({ success: false, message: 'Image URL and Album Wing are required.' });
    }

    const derivedClubId: ClubCategory = clubId || (['programming', 'cyber_security', 'research'].includes(wingSlug) ? 'computer_club' : 'events_and_clubs');

    const newItem: GalleryItem = {
      id: `gal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || `${String(wingSlug).replace('_', ' ')} Photo`,
      caption: caption || '',
      imageUrl,
      clubId: derivedClubId,
      wingSlug,
      eventName: eventName || 'University Album Photo',
      date: new Date().toISOString().split('T')[0],
      photogName: authUser?.name || 'City University Member',
      likes: 0
    };

    gallery.unshift(newItem);
    saveToDisk();
    res.status(201).json({ success: true, item: newItem });
  });

  app.post('/api/gallery/:id/like', (req: Request, res: Response) => {
    const item = gallery.find(g => g.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found.' });
    }
    item.likes += 1;
    saveToDisk();
    res.json({ success: true, likes: item.likes });
  });

  app.put('/api/gallery/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    const idx = gallery.findIndex(g => g.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Gallery item not found.' });
    }
    gallery[idx] = { ...gallery[idx], ...req.body, id: gallery[idx].id };
    saveToDisk();
    res.json({ success: true, item: gallery[idx] });
  });

  app.delete('/api/gallery/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role === 'user') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }
    gallery = gallery.filter(g => g.id !== req.params.id);
    saveToDisk();
    res.json({ success: true, message: 'Gallery item deleted.' });
  });

  // 6. Club Membership & Joining Applications
  app.get('/api/applications', (req: Request, res: Response) => {
    let result = [...applications];
    const { clubId, wingSlug, status } = req.query;

    if (clubId && clubId !== 'all') {
      result = result.filter(a => a.targetClub === clubId);
    }
    if (wingSlug && wingSlug !== 'all') {
      result = result.filter(a => a.targetWing === wingSlug);
    }
    if (status && status !== 'all') {
      result = result.filter(a => a.status === status);
    }

    res.json({ success: true, applications: result });
  });

  app.post('/api/applications', (req: Request, res: Response) => {
    const {
      applicantName,
      applicantEmail,
      studentId,
      department,
      currentSemester,
      cgpa,
      targetClub,
      targetWing,
      statementOfIntent,
      experience,
      portfolioLink
    } = req.body;

    if (!applicantName || !applicantEmail || !studentId || !targetClub || !targetWing) {
      return res.status(400).json({ success: false, message: 'Please complete student name, email, ID, club, and wing fields.' });
    }

    // Check duplicate pending application for the same club & wing
    const existing = applications.find(
      a => a.studentId === studentId && a.targetClub === targetClub && a.targetWing === targetWing && a.status === 'pending'
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending application under review for this wing.'
      });
    }

    const newApp: ControllerApplication = {
      id: `app-${Date.now()}`,
      applicantName,
      applicantEmail,
      studentId,
      department: department || 'Undergraduate',
      currentSemester: currentSemester || '3rd Semester',
      cgpa: cgpa || '3.50',
      targetClub,
      targetWing,
      statementOfIntent: statementOfIntent || 'Enthusiastic to join and contribute to club activities.',
      experience: experience || 'Active university volunteer',
      portfolioLink,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    applications.unshift(newApp);
    res.status(201).json({ success: true, application: newApp, message: 'Joining application submitted successfully.' });
  });

  // Direct Admission: Administrator/Controller directly approves and admits a student to club & wing
  app.post('/api/applications/direct-admit', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    const {
      applicantName,
      applicantEmail,
      studentId,
      department,
      currentSemester,
      cgpa,
      targetClub,
      targetWing,
      adminNotes
    } = req.body;

    if (!applicantName || !applicantEmail || !studentId || !targetClub || !targetWing) {
      return res.status(400).json({ success: false, message: 'Student name, email, ID, club, and wing are required.' });
    }

    const newApp: ControllerApplication = {
      id: `app-admit-${Date.now()}`,
      applicantName,
      applicantEmail,
      studentId,
      department: department || 'Undergraduate',
      currentSemester: currentSemester || '3rd Semester',
      cgpa: cgpa || '3.50',
      targetClub,
      targetWing,
      statementOfIntent: 'Direct admission approved by Club Administration.',
      experience: 'Admitted student member',
      status: 'approved',
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: authUser?.name || 'Administrator',
      adminNotes: adminNotes || 'Directly admitted and approved into club.'
    };

    applications.unshift(newApp);

    // Update club member count
    const club = clubs.find(c => c.id === targetClub);
    if (club) {
      club.totalMembers += 1;
    }

    // Add or update user record
    const existingUser = users.find(u => u.email === applicantEmail || u.studentId === studentId);
    if (existingUser) {
      existingUser.clubAffiliation = targetClub;
      existingUser.assignedWing = targetWing;
    } else {
      users.push({
        id: `usr-mem-${Date.now()}`,
        name: applicantName,
        email: applicantEmail,
        role: 'user',
        studentId,
        department: department || 'Undergraduate',
        semester: currentSemester || '3rd Semester',
        clubAffiliation: targetClub,
        assignedWing: targetWing,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(applicantName)}&backgroundColor=D40000`,
        joinedAt: new Date().toISOString().split('T')[0]
      });
    }

    syncLeadershipAndMembership();
    saveToDisk();

    res.status(201).json({
      success: true,
      application: newApp,
      message: `${applicantName} has been directly admitted and approved into ${club?.name || targetClub}.`
    });
  });

  // Approve club joining application
  app.patch('/api/applications/:id/approve', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    const appItem = applications.find(a => a.id === req.params.id);
    if (!appItem) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    appItem.status = 'approved';
    appItem.reviewedAt = new Date().toISOString();
    appItem.reviewedBy = authUser?.name || 'Administrator';
    appItem.adminNotes = req.body.adminNotes || 'Joining request reviewed and approved for official membership.';

    // Increment club total members
    const targetClub = clubs.find(c => c.id === appItem.targetClub);
    if (targetClub) {
      targetClub.totalMembers += 1;
    }

    // Upgrade user record or create member user
    const existingUser = users.find(u => u.email === appItem.applicantEmail || u.studentId === appItem.studentId);
    if (existingUser) {
      existingUser.clubAffiliation = appItem.targetClub;
      existingUser.assignedWing = appItem.targetWing;
    } else {
      users.push({
        id: `usr-mem-${Date.now()}`,
        name: appItem.applicantName,
        email: appItem.applicantEmail,
        role: 'user',
        studentId: appItem.studentId,
        department: appItem.department,
        semester: appItem.currentSemester,
        clubAffiliation: appItem.targetClub,
        assignedWing: appItem.targetWing,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(appItem.applicantName)}&backgroundColor=D40000`,
        joinedAt: new Date().toISOString().split('T')[0]
      });
    }

    syncLeadershipAndMembership();
    saveToDisk();

    res.json({
      success: true,
      application: appItem,
      message: `Joining request for ${appItem.applicantName} approved successfully.`
    });
  });

  // Reject club joining application
  app.patch('/api/applications/:id/reject', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    const appItem = applications.find(a => a.id === req.params.id);
    if (!appItem) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    appItem.status = 'rejected';
    appItem.reviewedAt = new Date().toISOString();
    appItem.reviewedBy = authUser?.name || 'Administrator';
    appItem.adminNotes = req.body.adminNotes || 'Does not meet current membership criteria or wing prerequisites.';

    saveToDisk();

    res.json({
      success: true,
      application: appItem,
      message: `Application for ${appItem.applicantName} marked as rejected.`
    });
  });

  app.delete('/api/applications/:id', (req: Request, res: Response) => {
    applications = applications.filter(a => a.id !== req.params.id);
    saveToDisk();
    res.json({ success: true, message: 'Application record removed.' });
  });

  // 7. Users & Auth endpoints
  app.get('/api/users', (_req: Request, res: Response) => {
    res.json({ success: true, users });
  });

  // Admin add new user / controller / admin
  app.post('/api/users', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Restricted to Administrators.' });
    }

    const { name, email, studentId, department, batch, semester, role, clubAffiliation, assignedWing, phone, joinedAt } = req.body;
    if (!name || !email || !studentId) {
      return res.status(400).json({ success: false, message: 'Name, email, and Student ID are required.' });
    }

    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase() || u.studentId === studentId);
    if (exists) {
      return res.status(400).json({ success: false, message: 'A user with this email or ID already exists.' });
    }

    const newUser: User = {
      id: `usr-${role || 'std'}-${Date.now()}`,
      name,
      email,
      role: role || 'user',
      studentId,
      department: department || 'Undergraduate',
      batch: batch || '58th Batch',
      semester: semester || '1st Semester',
      clubAffiliation: clubAffiliation || 'computer_club',
      assignedWing: assignedWing || undefined,
      phone: phone || undefined,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=D40000`,
      joinedAt: joinedAt || new Date().toISOString()
    };

    users.push(newUser);
    syncLeadershipAndMembership();
    saveToDisk();
    res.status(201).json({ success: true, user: newUser });
  });

  // Admin update user / controller
  app.put('/api/users/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Restricted to Administrators.' });
    }

    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    users[idx] = { ...users[idx], ...req.body, id: users[idx].id };
    syncLeadershipAndMembership();
    saveToDisk();
    res.json({ success: true, user: users[idx] });
  });

  // Admin remove user / controller
  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const authUser = getAuthUser(req);
    if (authUser && authUser.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Restricted to Administrators.' });
    }

    if (req.params.id === 'usr-admin-1') {
      return res.status(400).json({ success: false, message: 'Primary administrator account cannot be removed.' });
    }

    const targetUser = users.find(u => u.id === req.params.id);
    users = users.filter(u => u.id !== req.params.id);
    syncLeadershipAndMembership();
    saveToDisk();
    res.json({
      success: true,
      message: targetUser ? `User "${targetUser.name}" successfully removed.` : 'User removed successfully.'
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, username, name, role } = req.body;
    if (!email && !username && !name) {
      return res.status(400).json({ success: false, message: 'Username and email are required.' });
    }

    const searchEmail = (email || '').toLowerCase().trim();
    const searchName = (username || name || '').toLowerCase().trim();

    let user = users.find(u => 
      (searchEmail && u.email.toLowerCase() === searchEmail) ||
      (searchName && u.name.toLowerCase() === searchName) ||
      ((searchEmail === 'admin@cityuniversity.edu' || searchEmail === 'arifuzzamanabir2025@gmail.com') && u.role === 'administrator')
    );

    if (!user && role) {
      user = users.find(u => u.role === role);
    }

    if (!user) {
      const finalRole: UserRole = role || 'user';
      user = {
        id: `usr-${Date.now()}`,
        name: username || name || 'User',
        email: email || `${(username || 'user').toLowerCase().replace(/\s+/g, '')}@cityuniversity.edu`,
        role: finalRole,
        studentId: `CU-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Computer Science & Engineering',
        joinedAt: new Date().toISOString().split('T')[0]
      };
      users.push(user);
    } else {
      if (role && user.role !== role) {
        user.role = role;
      }
      if (username && (!user.name || user.name === 'User')) {
        user.name = username;
      }
    }

    res.json({ success: true, user });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, username, email, role, studentId, department, semester, clubAffiliation, assignedWing } = req.body;
    const finalName = (username || name || '').trim();
    const finalEmail = (email || '').trim();
    if (!finalName || !finalEmail) {
      return res.status(400).json({ success: false, message: 'Username and email are required.' });
    }

    let existing = users.find(u => u.email.toLowerCase() === finalEmail.toLowerCase());
    if (existing) {
      existing.name = finalName;
      if (role) existing.role = role;
      return res.json({ success: true, user: existing });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: finalName,
      email: finalEmail,
      role: role || 'user',
      studentId: studentId || `CU-${Math.floor(1000 + Math.random() * 9000)}`,
      department: department || 'Computer Science & Engineering',
      semester: semester || '1st Semester',
      clubAffiliation: clubAffiliation || 'computer_club',
      assignedWing: assignedWing || 'programming',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}&backgroundColor=D40000`,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    res.status(201).json({ success: true, user: newUser });
  });

  /* ==========================================================================
     VITE INTEGRATION
     ========================================================================== */
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CUEC] Portal server listening on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('[CUEC] Server error:', err);
  });
}

startServer().catch(err => {
  console.error('[CUEC] Error initializing server:', err);
  process.exit(1);
});
