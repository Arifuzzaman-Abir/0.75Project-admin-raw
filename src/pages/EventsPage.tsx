import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  X,
  Info
} from 'lucide-react';
import { ClubEvent } from '../types.ts';

interface EventsPageProps {
  events: ClubEvent[];
  selectedEventForModal: ClubEvent | null;
  setSelectedEventForModal: (evt: ClubEvent | null) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({
  events,
  selectedEventForModal,
  setSelectedEventForModal
}) => {
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedWing, setSelectedWing] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Event Details Modal state
  const [activeModalEvent, setActiveModalEvent] = useState<ClubEvent | null>(null);

  // Sync if selectedEventForModal is passed from outside
  useEffect(() => {
    if (selectedEventForModal) {
      setActiveModalEvent(selectedEventForModal);
      setSelectedEventForModal(null);
    }
  }, [selectedEventForModal, setSelectedEventForModal]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-[#D40000] dark:text-red-300 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official University Events Calendar</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-neutral-900 dark:text-white tracking-tight">
            Campus Events & Activities
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Central schedule of all hackathons, technology symposiums, tournaments, research seminars, and cultural expeditions across City University clubs and specialized wings.
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

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            return (
              <div
                key={evt.id}
                className="bg-white dark:bg-[#18050E] rounded-2xl border border-neutral-200 dark:border-[#380E1C] overflow-hidden shadow-xs hover:shadow-xl hover:border-red-400 dark:hover:border-red-600 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-48 overflow-hidden group">
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#D40000] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {evt.wingSlug.replace('_', ' ').toUpperCase()} WING
                      </span>
                      {evt.isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-red-950 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                        {evt.date}
                      </span>
                      <span className="flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                        <Clock className="w-3.5 h-3.5 text-red-400" />
                        {evt.time}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#D40000] dark:text-red-400 uppercase tracking-wider block">
                        {evt.kicker || `${evt.category.toUpperCase()} · CITY UNIVERSITY`}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg font-heading text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                        {evt.title}
                      </h3>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D40000] dark:text-red-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {evt.tags && evt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {evt.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#200A13] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-[#380E1C]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button: View Event */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => setActiveModalEvent(evt)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm bg-neutral-100 dark:bg-[#220712] hover:bg-[#D40000] hover:text-white dark:hover:bg-[#D40000] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-[#3D141F] active:scale-98"
                    title="View Event"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Event</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      {/* =====================================================================
          EVENT DETAILS MODAL
          ===================================================================== */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header Banner */}
            <div className="relative h-48 sm:h-56 overflow-hidden">
              <img
                src={activeModalEvent.bannerUrl}
                alt={activeModalEvent.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <button
                onClick={() => setActiveModalEvent(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D40000] text-white text-[10px] font-bold uppercase tracking-wider">
                    {activeModalEvent.wingSlug.replace('_', ' ').toUpperCase()} WING
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-neutral-200 text-[10px] font-bold uppercase tracking-wider">
                    {activeModalEvent.category}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
                  {activeModalEvent.title}
                </h3>
              </div>
            </div>

            {/* Quick Meta Row */}
            <div className="bg-neutral-50 dark:bg-[#1E0712] border-b border-neutral-200 dark:border-[#3D101E] px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D40000] shrink-0" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {activeModalEvent.date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D40000] shrink-0" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {activeModalEvent.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D40000] shrink-0" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {activeModalEvent.venue}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              
              {/* Event Overview & Full Agenda */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Event Overview & Agenda
                </h4>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-[#12131C] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {activeModalEvent.fullDetails || activeModalEvent.description}
                </p>
              </div>

              {/* Keynote Guests & Speakers */}
              {activeModalEvent.chiefGuests && activeModalEvent.chiefGuests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Honorable Guests & Keynote Speakers
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalEvent.chiefGuests.map((guest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-[#1C1D2A] text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
                      >
                        {guest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags & Topics */}
              {activeModalEvent.tags && activeModalEvent.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Topics & Focus Areas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeModalEvent.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#200A13] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#380E1C]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* General Information Banner */}
              <div className="p-4 rounded-xl bg-red-50/70 dark:bg-[#1F0912] border border-red-200/80 dark:border-[#3D1420] flex items-center gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                <Info className="w-5 h-5 text-[#D40000] dark:text-red-400 shrink-0" />
                <p>
                  Official City University campus event organized under <strong>{activeModalEvent.wingSlug.replace('_', ' ').toUpperCase()} Wing</strong>. Open to all students, university staff, and distinguished delegates.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
