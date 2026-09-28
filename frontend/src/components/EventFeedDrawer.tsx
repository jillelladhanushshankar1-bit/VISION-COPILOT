import React, { useState } from 'react';
import { VisionEvent, EventCategory } from '../types';

interface EventFeedDrawerProps {
  events: VisionEvent[];
  onClose: () => void;
  onReplayAudio: (event: VisionEvent) => void;
  onTriggerEvent: (eventTemplateIndex: number) => void;
  onClearFeed: () => void;
}

export const EventFeedDrawer: React.FC<EventFeedDrawerProps> = ({
  events,
  onClose,
  onReplayAudio,
  onTriggerEvent,
  onClearFeed,
}) => {
  const [filter, setFilter] = useState<'All' | EventCategory>('All');

  const filteredEvents = events.filter((evt) => {
    if (filter === 'All') return true;
    return evt.type === filter;
  });

  const getBadgeStyle = (type: EventCategory) => {
    switch (type) {
      case 'Hazard':
        return 'bg-[#ff5406] text-[#ffffff]';
      case 'Motion':
        return 'bg-[#00a9dd] text-[#ffffff]';
      case 'General':
      default:
        return 'bg-[#00af3d] text-[#ffffff]';
    }
  };

  const formatTimestamp = (date: Date) => {
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#ffffff] flex flex-col justify-between max-w-md mx-auto select-none overflow-hidden animate-in slide-in-from-bottom duration-200">
      {/* Top Bar Header */}
      <header className="w-full bg-[#ffffff] pt-4 pb-3 px-6 border-b border-[#e2e2e2] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            aria-label="Back to camera"
            className="w-10 h-10 rounded-26 bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a] hover:bg-[#e8e8e8] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-[#1a1a1a] leading-tight">
              Recent Observations
            </h1>
            <p className="text-[13px] text-[#747878] font-medium">
              {events.length} total events accumulated
            </p>
          </div>
        </div>

        {events.length > 0 && (
          <button
            onClick={onClearFeed}
            className="text-[13px] font-bold text-[#ba1a1a] hover:underline px-2 py-1"
          >
            Clear
          </button>
        )}
      </header>

      {/* Filter Tabs */}
      <div className="px-6 pt-3 pb-2 bg-[#ffffff]">
        <div className="w-full p-1 bg-[#f5f5f5] rounded-26 flex gap-1">
          {(['All', 'Hazard', 'Motion', 'General'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 min-h-[38px] rounded-26 text-[13px] font-bold transition-all ${
                filter === tab
                  ? 'bg-[#1a1a1a] text-[#ffffff]'
                  : 'text-[#444748] hover:text-[#1a1a1a]'
              }`}
            >
              {tab === 'All' ? `All (${events.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events List (Accumulated most recent first) */}
      <main className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-26 bg-[#f5f5f5] text-[#747878] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">inventory_2</span>
            </div>
            <h3 className="text-[18px] font-bold text-[#1a1a1a]">No observations in this view</h3>
            <p className="text-[14px] text-[#747878] max-w-xs mx-auto">
              Start spatial awareness or trigger a mock event below to populate your live feed.
            </p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <article
              key={evt.id}
              className="w-full bg-[#f5f5f5] rounded-26 p-4 border border-[#e2e2e2] flex flex-col space-y-2.5 hover:border-[#1a1a1a] transition-all"
            >
              {/* Event Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`h-7 px-3 rounded-26 text-[12px] font-bold flex items-center gap-1 ${getBadgeStyle(
                      evt.type
                    )}`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {evt.type === 'Hazard'
                        ? 'warning'
                        : evt.type === 'Motion'
                        ? 'directions_walk'
                        : 'info'}
                    </span>
                    <span>{evt.type}</span>
                  </span>
                  <span className="text-[13px] font-semibold text-[#747878]">
                    {formatTimestamp(evt.timestamp)}
                  </span>
                </div>

                <span className="text-[12px] font-semibold text-[#444748] bg-[#e2e2e2] px-2.5 py-0.5 rounded-full">
                  {evt.confidence}
                </span>
              </div>

              {/* Message */}
              <p className="text-[17px] font-bold text-[#1a1a1a] leading-snug">
                "{evt.message}"
              </p>

              {/* Details or distance */}
              {evt.details && (
                <p className="text-[13px] text-[#444748] bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e2e2]">
                  {evt.details}
                </p>
              )}

              {/* Thumbnail and Replay Action */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <img
                    src={evt.image}
                    alt={evt.imageAlt}
                    className="w-12 h-10 object-cover rounded-lg border border-[#c4c7c7]"
                  />
                  <span className="text-[13px] font-bold text-[#2f2f2f]">
                    {evt.label}
                  </span>
                </div>

                <button
                  onClick={() => onReplayAudio(evt)}
                  className="h-9 px-3.5 rounded-26 bg-[#ffffff] text-[#1a1a1a] text-[13px] font-bold flex items-center space-x-1.5 border border-[#1a1a1a] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">volume_up</span>
                  <span>Play</span>
                </button>
              </div>
            </article>
          ))
        )}

        {/* Prototype Testing Trigger Section */}
        <div className="pt-4 pb-2">
          <div className="bg-[#f0f0f0] p-4 rounded-26 border border-[#c4c7c7] space-y-2.5">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#1a1a1a]">
              <span className="material-symbols-outlined text-[18px] text-[#ff5406]">science</span>
              <span>Prototype Test: Simulate New Event</span>
            </div>
            <p className="text-[12px] text-[#444748]">
              Tap any mock event to immediately add and experience its audio-visual alert:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onTriggerEvent(0); // Stairs
                  onClose();
                }}
                className="text-[12px] font-bold text-[#1a1a1a] bg-[#ffffff] p-2.5 rounded-xl border border-[#c4c7c7] text-left hover:border-[#ff5406] active:scale-95"
              >
                ⚠️ Stairs Ahead (Hazard)
              </button>
              <button
                onClick={() => {
                  onTriggerEvent(1); // Tree branch
                  onClose();
                }}
                className="text-[12px] font-bold text-[#1a1a1a] bg-[#ffffff] p-2.5 rounded-xl border border-[#c4c7c7] text-left hover:border-[#ff5406] active:scale-95"
              >
                ⚠️ Tree Branch (Hazard)
              </button>
              <button
                onClick={() => {
                  onTriggerEvent(2); // Person
                  onClose();
                }}
                className="text-[12px] font-bold text-[#1a1a1a] bg-[#ffffff] p-2.5 rounded-xl border border-[#c4c7c7] text-left hover:border-[#00a9dd] active:scale-95"
              >
                🚶 Person Crossing (Motion)
              </button>
              <button
                onClick={() => {
                  onTriggerEvent(3); // Door opened
                  onClose();
                }}
                className="text-[12px] font-bold text-[#1a1a1a] bg-[#ffffff] p-2.5 rounded-xl border border-[#c4c7c7] text-left hover:border-[#00af3d] active:scale-95"
              >
                🚪 Door Opened (General)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Close */}
      <footer className="w-full bg-[#ffffff] p-4 border-t border-[#e2e2e2]">
        <button
          onClick={onClose}
          className="w-full min-h-[52px] rounded-26 bg-[#1a1a1a] text-[#ffffff] font-bold text-[16px] flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <span>Return to Camera</span>
        </button>
      </footer>
    </div>
  );
};
