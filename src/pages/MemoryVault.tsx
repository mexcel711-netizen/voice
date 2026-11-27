import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PinPad } from '../components/safety/ConfirmModal';
import {
  EmptyState,
  GlassCard,
  ModalShell,
  PillButton,
  ToggleSwitch,
} from '../components/ui/Primitives';
import { useToast } from '../context/ToastContext';
import { useZara } from '../context/ZaraContext';
import { formatTimeAgo } from '../lib/format';
import { containsUrduScript } from '../lib/rtl';
import { memorySchema } from '../lib/validation';
import type { MemoryCategory, MemoryItem, MemoryType } from '../types/db';

const CATEGORIES: Array<{ id: 'all' | MemoryCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'personal', label: 'Personal' },
  { id: 'work_code', label: 'Work & Code' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'dates', label: 'Dates' },
  { id: 'habits', label: 'Habits' },
  { id: 'other', label: 'Other' },
];

export default function MemoryVault() {
  const {
    memories,
    settings,
    updateSettings,
    addMemory,
    updateMemory,
    deleteMemory,
    purgeAllMemories,
    openConfirmModal,
  } = useZara();
  const { showToast } = useToast();

  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | MemoryCategory>('all');

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MemoryItem | null>(null);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('personal');
  const [memType, setMemType] = useState<MemoryType>('semantic');
  const [importance, setImportance] = useState(3);
  const [formError, setFormError] = useState<string | null>(null);

  // Purge 2-step PIN modal
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeChecked, setPurgeChecked] = useState(false);
  const [purgePin, setPurgePin] = useState('');
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memories
      .filter((m) => {
        if (catFilter !== 'all' && m.category !== catFilter) return false;
        if (q && !m.content.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
  }, [catFilter, memories, query]);

  const openAdd = () => {
    setEditing(null);
    setContent('');
    setCategory('personal');
    setMemType('semantic');
    setImportance(3);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: MemoryItem) => {
    setEditing(item);
    setContent(item.content);
    setCategory(item.category);
    setMemType(item.memory_type);
    setImportance(item.importance);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = memorySchema.safeParse({
      content,
      category,
      memory_type: memType,
      importance,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || 'Invalid memory details.');
      return;
    }
    if (editing) {
      await updateMemory(editing.id, parsed.data);
      showToast('Memory updated.', 'success');
    } else {
      await addMemory({ ...parsed.data, source: 'manual' });
      showToast('Saved to Memory Vault.', 'success');
    }
    setModalOpen(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(memories, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zara-memory-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Memory Vault exported as JSON.', 'success');
  };

  const handlePurge = async () => {
    if (!purgeChecked) {
      setPurgeError('Please confirm irreversible deletion checkbox first.');
      return;
    }
    setPurging(true);
    setPurgeError(null);
    try {
      const res = await purgeAllMemories(purgePin);
      if (!res.ok) {
        setPurgeError(res.error || 'PIN verification failed.');
        return;
      }
      showToast('All memories purged.', 'info');
      setPurgeOpen(false);
      setPurgePin('');
      setPurgeChecked(false);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            Personal Long-Term Context
          </p>
          <h1 className="font-headline-lg text-headline-lg text-on-surface flex flex-wrap items-baseline gap-3">
            <span>Memory Vault</span>
            <span className="urdu-rtl text-xl text-primary-fixed-dim" dir="rtl" lang="ur">
              ذاتی یادداشتیں اور حوالہ جات
            </span>
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Inspect, edit, pin, export, or purge everything Zara remembers about you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-full bg-surface-container-high/80 px-4 py-2 border border-border-subtle">
            <span className="text-xs text-on-surface">Auto-Learn</span>
            <ToggleSwitch
              checked={settings.auto_learn_enabled}
              onChange={(next) => void updateSettings({ auto_learn_enabled: next })}
              label="Toggle auto-learn memory capture"
            />
          </div>
          <PillButton variant="secondary" onClick={handleExport} disabled={memories.length === 0}>
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export JSON
          </PillButton>
          <PillButton onClick={openAdd}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Memory
          </PillButton>
          {memories.length > 0 && (
            <PillButton
              variant="danger"
              onClick={() => {
                setPurgePin('');
                setPurgeChecked(false);
                setPurgeError(null);
                setPurgeOpen(true);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              Purge All
            </PillButton>
          )}
        </div>
      </div>

      {/* Search & Category Chips */}
      <GlassCard className="p-4 space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]">
            search
          </span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories (⌘K)..."
            className="zara-input w-full pl-11 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const count =
              c.id === 'all'
                ? memories.length
                : memories.filter((m) => m.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCatFilter(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  catFilter === c.id
                    ? 'bg-primary/20 text-primary border-primary/50'
                    : 'bg-surface-container-low text-on-surface-variant border-border-subtle hover:text-on-surface'
                }`}
              >
                {c.label} ({count})
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Memory Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="psychology"
          title={memories.length === 0 ? 'Memory Vault is empty' : 'No matching memories'}
          subtitle={
            memories.length === 0
              ? 'Zara stores only real facts you add here or things she learns during conversations when Auto-Learn is on.'
              : 'Try clearing your search query or selecting a different category.'
          }
          actionLabel="Add First Memory"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mem) => {
            const urdu = containsUrduScript(mem.content);
            return (
              <GlassCard
                key={mem.id}
                className={`p-5 flex flex-col justify-between gap-4 ${
                  mem.is_pinned ? 'border border-primary/40' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary uppercase">
                        {mem.category.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-surface-container-high text-on-surface-variant">
                        {mem.memory_type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void updateMemory(mem.id, { is_pinned: !mem.is_pinned })}
                      aria-label={mem.is_pinned ? 'Unpin memory' : 'Pin memory'}
                      className={`p-1.5 rounded-full cursor-pointer ${
                        mem.is_pinned
                          ? 'text-tertiary bg-tertiary/15'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">push_pin</span>
                    </button>
                  </div>

                  <p
                    className={`text-on-surface leading-relaxed ${
                      urdu ? 'urdu-rtl text-base' : 'text-sm'
                    }`}
                    dir={urdu ? 'rtl' : 'ltr'}
                  >
                    {mem.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50 text-xs text-on-surface-variant">
                  <span>
                    Importance {mem.importance}/5 · {formatTimeAgo(mem.created_at)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(mem)}
                      aria-label="Edit memory"
                      className="p-1.5 rounded-full hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        openConfirmModal({
                          title: 'Delete Memory',
                          description: 'Remove this memory from Zara vault?',
                          method: 'manual',
                          riskLevel: 'low',
                          onConfirm: async () => {
                            await deleteMemory(mem.id);
                            showToast('Memory removed.', 'info');
                          },
                        })
                      }
                      aria-label="Delete memory"
                      className="p-1.5 rounded-full hover:text-error cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ModalShell
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Memory' : 'Add New Memory'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="rounded-xl bg-error-container/40 border border-error/40 px-3.5 py-2 text-xs text-error">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">
              Fact or Preference (max 1000 chars)
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Boss prefers strong doodh patti chai around 5 PM while coding."
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MemoryCategory)}
                className="zara-input w-full px-3 py-2 text-xs"
              >
                <option value="personal">Personal</option>
                <option value="work_code">Work &amp; Code</option>
                <option value="relationship">Relationship</option>
                <option value="dates">Dates</option>
                <option value="habits">Habits</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Type</label>
              <select
                value={memType}
                onChange={(e) => setMemType(e.target.value as MemoryType)}
                className="zara-input w-full px-3 py-2 text-xs"
              >
                <option value="semantic">Semantic (Fact)</option>
                <option value="episodic">Episodic (Event)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">
                Importance ({importance}/5)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="zara-slider mt-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <PillButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </PillButton>
            <PillButton type="submit">{editing ? 'Update' : 'Save Memory'}</PillButton>
          </div>
        </form>
      </ModalShell>

      {/* Purge All 2-Step PIN Confirmation */}
      <ModalShell
        isOpen={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        title="Purge Entire Memory Vault"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            This permanently deletes all {memories.length} stored memories. Export JSON first if you
            want a backup.
          </p>
          <label className="flex items-center gap-2.5 text-xs text-on-surface cursor-pointer bg-surface-container-low p-3 rounded-xl border border-border-subtle">
            <input
              type="checkbox"
              checked={purgeChecked}
              onChange={(e) => setPurgeChecked(e.target.checked)}
              className="accent-error"
            />
            I understand all memories will be permanently deleted.
          </label>
          {purgeError && (
            <p role="alert" className="text-xs text-error font-medium">
              {purgeError}
            </p>
          )}
          <PinPad
            value={purgePin}
            onChange={(v) => {
              setPurgePin(v);
              setPurgeError(null);
            }}
            onSubmit={() => void handlePurge()}
            disabled={purging || !purgeChecked}
            submitLabel={purging ? 'Purging...' : 'Confirm Purge All'}
            errorShake={Boolean(purgeError)}
          />
          <div className="flex justify-end gap-2">
            <PillButton variant="ghost" onClick={() => setPurgeOpen(false)}>
              Cancel
            </PillButton>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
