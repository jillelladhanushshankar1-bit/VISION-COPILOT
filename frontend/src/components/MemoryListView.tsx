import React, { useState } from 'react';
import { MemoryItem, MemoryCategory } from '../types';

interface MemoryListViewProps {
  memories: MemoryItem[];
  onClose: () => void;
  onToggleActive: (id: string) => void;
  onAddMemory: (newMemory: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  onSpeak: (text: string) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryListView: React.FC<MemoryListViewProps> = ({
  memories,
  onClose,
  onToggleActive,
  onAddMemory,
  onSpeak,
  onDeleteMemory,
}) => {
  const [filter, setFilter] = useState<'All' | MemoryCategory>('All');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New Memory Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('Object');
  const [newTag, setNewTag] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSpoken, setNewSpoken] = useState('');

  const filtered = memories.filter((item) => {
    if (filter !== 'All' && item.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.relationshipOrTag.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddMemory({
      name: newName.trim(),
      category: newCategory,
      relationshipOrTag: newTag.trim() || `${newCategory} Memory`,
      description: newDesc.trim() || `Saved personal item for spatial guidance.`,
      notificationSpoken:
        newSpoken.trim() || `${newName.trim()} is recognized in front of you.`,
      image:
        newCategory === 'Person'
          ? '/src/assets/images/remembered_sister_portrait_1790251837150.jpg'
          : '/src/assets/images/remembered_keys_wallet_1790251821942.jpg',
      lastSeen: 'Just saved',
      active: true,
    });

    setNewName('');
    setNewTag('');
    setNewDesc('');
    setNewSpoken('');
    setIsAdding(false);
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
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#bd4be5]"></span>
              <h1 className="text-[20px] font-bold text-[#1a1a1a] leading-tight">
                Personal Memories
              </h1>
            </div>
            <p className="text-[13px] text-[#747878] font-medium">
              {memories.length} recognized people, objects & places
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="h-10 px-3.5 rounded-26 bg-[#bd4be5] text-[#ffffff] text-[13px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-none"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isAdding ? 'close' : 'add'}
          </span>
          <span>{isAdding ? 'Cancel' : 'Remember'}</span>
        </button>
      </header>

      {/* Add Memory Drawer Form */}
      {isAdding && (
        <div className="p-5 bg-[#fcf8ff] border-b border-[#bd4be5]/30 space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#bd4be5] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              <span>Remember New Entity from Viewport</span>
            </span>
            <span className="text-[12px] text-[#747878]">Auto-tags via Optical Sensor</span>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#2f2f2f] px-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Walking Cane"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full h-11 px-3 rounded-26 bg-[#ffffff] border border-[#bd4be5]/40 text-[14px] text-[#1a1a1a] font-medium focus:outline-none focus:border-[#bd4be5]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#2f2f2f] px-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full h-11 px-3 rounded-26 bg-[#ffffff] border border-[#bd4be5]/40 text-[14px] text-[#1a1a1a] font-medium focus:outline-none focus:border-[#bd4be5]"
                >
                  <option value="Object">Object</option>
                  <option value="Person">Person</option>
                  <option value="Place">Place</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#2f2f2f] px-1">Tag / Relationship</label>
              <input
                type="text"
                placeholder="e.g. Mobility Assist · White & Red"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full h-11 px-3 rounded-26 bg-[#ffffff] border border-[#bd4be5]/40 text-[14px] text-[#1a1a1a] font-medium focus:outline-none focus:border-[#bd4be5]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#2f2f2f] px-1">Spoken Voice Alert</label>
              <input
                type="text"
                placeholder="e.g. Your walking cane is propped by the front doorway."
                value={newSpoken}
                onChange={(e) => setNewSpoken(e.target.value)}
                className="w-full h-11 px-3 rounded-26 bg-[#ffffff] border border-[#bd4be5]/40 text-[14px] text-[#1a1a1a] font-medium focus:outline-none focus:border-[#bd4be5]"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] rounded-26 bg-[#bd4be5] text-[#ffffff] font-bold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span>Save to Copilot Memory</span>
            </button>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="px-6 pt-3 pb-2 space-y-2.5 bg-[#ffffff]">
        {/* Search Input */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-[#747878] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved people, keys, rooms..."
            className="w-full h-11 pl-10 pr-4 rounded-26 bg-[#f5f5f5] text-[14px] text-[#1a1a1a] font-medium border border-[#e2e2e2] focus:border-[#bd4be5] focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="w-full p-1 bg-[#f5f5f5] rounded-26 flex gap-1">
          {(['All', 'Person', 'Object', 'Place'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-1 min-h-[38px] rounded-26 text-[13px] font-bold transition-all ${
                filter === cat
                  ? 'bg-[#bd4be5] text-[#ffffff]'
                  : 'text-[#444748] hover:text-[#1a1a1a]'
              }`}
            >
              {cat === 'All' ? `All (${memories.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memories List */}
      <main className="flex-1 overflow-y-auto px-6 py-2 space-y-3.5">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-26 bg-[#fcf8ff] text-[#bd4be5] flex items-center justify-center mx-auto border border-[#bd4be5]/30">
              <span className="material-symbols-outlined text-[32px]">psychology</span>
            </div>
            <h3 className="text-[18px] font-bold text-[#1a1a1a]">No memories found</h3>
            <p className="text-[14px] text-[#747878] max-w-xs mx-auto">
              Tap "Remember" above to record important faces, daily essentials, or home landmarks.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              className={`w-full bg-[#f5f5f5] rounded-26 p-4 border transition-all ${
                item.active ? 'border-[#e2e2e2]' : 'border-[#e2e2e2] opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-7 px-3 rounded-26 bg-[#bd4be5] text-[#ffffff] text-[12px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">
                      {item.category === 'Person'
                        ? 'face'
                        : item.category === 'Object'
                        ? 'interests'
                        : 'location_on'}
                    </span>
                    <span>{item.category}</span>
                  </span>
                  <span className="text-[12px] font-semibold text-[#747878]">
                    {item.relationshipOrTag}
                  </span>
                </div>

                {/* Active recognition toggle */}
                <button
                  onClick={() => onToggleActive(item.id)}
                  title={item.active ? 'Recognition enabled' : 'Recognition paused'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                    item.active
                      ? 'bg-[#ffffff] text-[#00af3d] border-[#00af3d]'
                      : 'bg-[#e2e2e2] text-[#747878] border-[#c4c7c7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {item.active ? 'check' : 'pause'}
                  </span>
                  <span>{item.active ? 'Active' : 'Paused'}</span>
                </button>
              </div>

              {/* Title & Thumbnail */}
              <div className="flex items-start gap-3 pt-2">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-26 object-cover border border-[#c4c7c7] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[18px] font-bold text-[#1a1a1a] truncate">
                    {item.name}
                  </h3>
                  <p className="text-[13px] text-[#444748] line-clamp-2 leading-snug pt-0.5">
                    {item.description}
                  </p>
                  {item.lastSeen && (
                    <span className="text-[11px] font-medium text-[#747878] block pt-1">
                      Seen: {item.lastSeen}
                    </span>
                  )}
                </div>
              </div>

              {/* Voice Alert Sample */}
              <div className="mt-2.5 bg-[#ffffff] p-2.5 rounded-xl border border-[#e2e2e2] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-[#bd4be5] flex-shrink-0">
                    record_voice_over
                  </span>
                  <p className="text-[13px] font-medium text-[#2f2f2f] truncate">
                    "{item.notificationSpoken}"
                  </p>
                </div>
                <button
                  onClick={() => onSpeak(item.notificationSpoken)}
                  className="flex-shrink-0 h-7 px-2.5 rounded-26 bg-[#f5f5f5] text-[#1a1a1a] text-[11px] font-bold flex items-center gap-1 border border-[#c4c7c7] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px]">volume_up</span>
                  <span>Hear</span>
                </button>
              </div>

              {/* Delete / Quick action footer */}
              <div className="pt-2 flex justify-between items-center text-[12px] text-[#747878]">
                <span>Saved to camera neural model</span>
                <button
                  onClick={() => onDeleteMemory(item.id)}
                  className="text-[#ba1a1a] font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Footer Close */}
      <footer className="w-full bg-[#ffffff] p-4 border-t border-[#e2e2e2]">
        <button
          onClick={onClose}
          className="w-full min-h-[52px] rounded-26 bg-[#1a1a1a] text-[#ffffff] font-bold text-[16px] flex items-center justify-center space-x-2 active:scale-95 transition-all"
        >
          <span>Return to Viewport</span>
        </button>
      </footer>
    </div>
  );
};
