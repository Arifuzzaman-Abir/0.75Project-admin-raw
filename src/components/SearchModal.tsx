import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Layers, 
  Calendar, 
  Bell, 
  ArrowRight, 
  Code2
} from 'lucide-react';
import { Club, ClubEvent, Announcement, ClubWing } from '../types.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubs: Club[];
  events: ClubEvent[];
  announcements: Announcement[];
  setActiveTab: (tab: string) => void;
  onSelectEvent: (event: ClubEvent) => void;
  onSelectWing: (wing: ClubWing) => void;
  onSelectAnnouncement: (announcement: Announcement) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  clubs,
  events,
  announcements,
  setActiveTab,
  onSelectEvent,
  onSelectWing,
  onSelectAnnouncement
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search across Clubs
  const matchedClubs = cleanQuery
    ? clubs.filter(c =>
        c.name.toLowerCase().includes(cleanQuery) ||
        c.shortCode.toLowerCase().includes(cleanQuery) ||
        c.motto.toLowerCase().includes(cleanQuery) ||
        c.presidentName.toLowerCase().includes(cleanQuery)
      )
    : [];

  // Search across Wings
  const allWings = clubs.flatMap(c => c.wings);
  const matchedWings = cleanQuery
    ? allWings.filter(w => 
        w.name.toLowerCase().includes(cleanQuery) || 
        w.shortDesc.toLowerCase().includes(cleanQuery) ||
        w.fullDesc.toLowerCase().includes(cleanQuery) ||
        w.slug.toLowerCase().includes(cleanQuery) ||
        w.keyActivities?.some(a => a.toLowerCase().includes(cleanQuery))
      )
    : [];

  // Search across Events
  const matchedEvents = cleanQuery
    ? events.filter(e => 
        e.title.toLowerCase().includes(cleanQuery) ||
        e.description.toLowerCase().includes(cleanQuery) ||
        e.venue.toLowerCase().includes(cleanQuery) ||
        e.category.toLowerCase().includes(cleanQuery) ||
        e.tags?.some(t => t.toLowerCase().includes(cleanQuery))
      )
    : [];

  // Search across Notices / Circulars
  const matchedNotices = cleanQuery
    ? announcements.filter(a => 
        a.title.toLowerCase().includes(cleanQuery) ||
        a.content.toLowerCase().includes(cleanQuery) ||
        a.category?.toLowerCase().includes(cleanQuery) ||
        a.authorName?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalResults = matchedClubs.length + matchedWings.length + matchedEvents.length + matchedNotices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#12131D] rounded-2xl shadow-2xl border border-neutral-200 dark:border-[#331C24] overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#181926]/50">
          <div className="w-8 h-8 rounded-full bg-white p-0.5 ring-1 ring-red-700/40 shadow-xs shrink-0 overflow-hidden flex items-center justify-center">
            <img 
              src="/city-university-logo.jpg" 
              alt="City University Official Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <Search className="w-4 h-4 text-[#D40000] dark:text-red-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs, wings, events, circulars, and announcements across website..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-500 text-[10px] font-mono font-bold">
            ESC
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Scroll Area */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Empty search prompt when nothing is typed */}
          {!cleanQuery && (
            <div className="text-center py-12 text-neutral-500">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-[#1A1B28] flex items-center justify-center mx-auto mb-3 text-[#D40000]">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Search Across Entire Website</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Type any keyword to search active events, competitions, club governance, subsector wings, and official university notices.
              </p>
            </div>
          )}

          {/* No results message */}
          {cleanQuery && totalResults === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <Search className="w-8 h-8 mx-auto text-neutral-400 mb-2 opacity-50" />
              <p className="font-semibold text-sm">No results found for "{query}"</p>
              <p className="text-xs text-neutral-400 mt-1">Nothing matching this keyword is currently available on the website.</p>
            </div>
          )}

          {/* Clubs Results */}
          {matchedClubs.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-[#D40000] dark:text-red-400">
                  <Layers className="w-3.5 h-3.5" />
                  University Clubs ({matchedClubs.length})
                </span>
                <span>Central Organizations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => {
                      setActiveTab('clubs');
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161726] border border-neutral-200 dark:border-neutral-800 hover:border-[#D40000] dark:hover:border-red-500 text-left transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/80 text-[#D40000] dark:text-red-300 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      {club.shortCode}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-[#D40000] dark:group-hover:text-red-400 transition-colors truncate">
                        {club.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 italic">
                        "{club.motto}"
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wings Results */}
          {matchedWings.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-[#D40000] dark:text-red-400">
                  <Layers className="w-3.5 h-3.5" />
                  Clubs & Wings ({matchedWings.length})
                </span>
                <span>University Wings</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchedWings.map((wing) => (
                  <button
                    key={wing.id}
                    onClick={() => {
                      onSelectWing(wing);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-[#161726] border border-neutral-200 dark:border-neutral-800 hover:border-[#D40000] dark:hover:border-red-500 text-left transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/80 text-[#D40000] dark:text-red-300 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-[#D40000] dark:group-hover:text-red-400 transition-colors truncate">
                        {wing.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {wing.shortDesc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Events Results */}
          {matchedEvents.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-[#D40000] dark:text-red-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Events & Competitions ({matchedEvents.length})
                </span>
                <span>Campus Calendar</span>
              </div>
              <div className="space-y-2">
                {matchedEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => {
                      onSelectEvent(evt);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-[#161726] border border-neutral-200 dark:border-neutral-800 hover:border-[#D40000] dark:hover:border-red-500 text-left transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-[#D40000] dark:text-red-400 uppercase">
                        {evt.date} • {evt.venue}
                      </span>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-[#D40000] dark:group-hover:text-red-400 transition-colors truncate">
                        {evt.title}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-950 text-[#D40000] dark:text-red-300 text-xs font-bold shrink-0">
                      View Event
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Announcements Results */}
          {matchedNotices.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-[#D40000] dark:text-red-400">
                  <Bell className="w-3.5 h-3.5" />
                  Notices & Circulars ({matchedNotices.length})
                </span>
                <span>Official Circulars</span>
              </div>
              <div className="space-y-2">
                {matchedNotices.map((ann) => (
                  <button
                    key={ann.id}
                    onClick={() => {
                      onSelectAnnouncement(ann);
                      onClose();
                    }}
                    className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-[#161726] border border-neutral-200 dark:border-neutral-800 hover:border-[#D40000] dark:hover:border-red-500 text-left transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-neutral-400">
                        {ann.publishedAt} • Circular #{ann.id.slice(-4).toUpperCase()}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white group-hover:text-[#D40000] dark:group-hover:text-red-400 transition-colors truncate">
                        {ann.title}
                      </h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 group-hover:text-[#D40000] transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-6 py-3 bg-neutral-50 dark:bg-[#151624] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>City University Events & Club (CUEC)</span>
          <button 
            onClick={() => {
              setActiveTab('dashboard');
              onClose();
            }}
            className="text-[#D40000] dark:text-red-400 hover:underline font-bold"
          >
            Administrator Dashboard &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
