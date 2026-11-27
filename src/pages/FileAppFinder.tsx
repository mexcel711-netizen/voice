import React, { useMemo, useState } from 'react';
import { useZara } from '../context/ZaraContext';
import { EmptyState, GlassCard, ModalShell, PillButton } from '../components/ui/Primitives';
import { formatBytes } from '../lib/format';
import { validateFileRename } from '../lib/validation';
import { useToast } from '../context/ToastContext';
import type { FileCategory, FileIndexEntry } from '../types/db';

type FilesTab = 'all' | 'app' | 'recent' | 'starred';

export default function FileAppFinder() {
  const { filesIndex, deviceOnline, dispatchCommand, starFile, openConfirmModal } = useZara();
  const { showToast } = useToast();

  const [tab, setTab] = useState<FilesTab>('all');
  const [category, setCategory] = useState<'all' | FileCategory>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FileIndexEntry | null>(null);

  const [renameTarget, setRenameTarget] = useState<FileIndexEntry | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return filesIndex.filter((item) => {
      if (tab === 'app' && item.kind !== 'app') return false;
      if (tab === 'starred' && !item.is_starred) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.path.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [filesIndex, tab, category, search]);

  const handleSearchAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    await dispatchCommand('search_files', { query: search.trim() }, 'ui');
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    const v = validateFileRename(renameValue);
    if (!v.ok) {
      setRenameError(v.error || 'Invalid filename.');
      return;
    }
    await dispatchCommand(
      'rename_file',
      { path: renameTarget.path, new_name: renameValue.trim(), size_bytes: renameTarget.size_bytes ?? 0 },
      'ui'
    );
    setRenameTarget(null);
    setRenameError(null);
  };

  const handleTrash = (item: FileIndexEntry) => {
    const isLarge = (item.size_bytes ?? 0) > 10 * 1024 * 1024;
    openConfirmModal({
      title: `Trash '${item.name}'?`,
      description: isLarge
        ? `This file exceeds 10MB (${formatBytes(item.size_bytes)}). 6-digit PIN verification is required.`
        : `Move "${item.name}" to your system Trash?`,
      method: isLarge ? 'pin' : 'manual',
      riskLevel: 'high',
      commandSummary: item.path,
      onConfirm: async () => {
        await dispatchCommand(
          'trash_file',
          { path: item.path, size_bytes: item.size_bytes ?? 0 },
          'ui'
        );
        showToast(`Trash command queued for ${item.name}`, 'info');
      },
    });
  };

  return (
    <>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
              File & App Finder
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Search indexed laptop files and launch apps securely via Zara Local Agent.
            </p>
          </div>
          <span className="px-4 py-1.5 rounded-full glass-panel text-xs font-semibold">
            {deviceOnline ? 'Live Index Connected' : 'Laptop Offline'}
          </span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchAgent} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[20px]">
              search
            </span>
            <input
              type="text"
              aria-label="Search files and applications"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files, codebases, or apps on laptop..."
              className="zara-input w-full pl-11 pr-4 py-3 text-sm"
            />
          </div>
          <PillButton type="submit" disabled={!search.trim()}>
            Query Laptop Agent
          </PillButton>
        </form>

        {/* Tabs & Categories */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'All Files'],
                ['app', 'Applications'],
                ['recent', 'Recent'],
                ['starred', 'Starred / Vault'],
              ] as Array<[FilesTab, string]>
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                  tab === k
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['all', 'document', 'code', 'image', 'download', 'app'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] capitalize cursor-pointer ${
                  category === cat
                    ? 'bg-secondary-container text-on-secondary-container font-semibold'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="folder_open"
            title="Zara ko woh nahi mila. Doosra naam try karein?"
            subtitle={
              deviceOnline
                ? 'Try a different keyword or click Query Laptop Agent to run a live search.'
                : 'Laptop is currently offline. Connect Zara Local Agent to sync indexed files and applications.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-2.5">
              {filtered.map((item) => (
                <GlassCard key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-secondary text-[22px]">
                      {item.kind === 'app' ? 'apps' : 'description'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-label-md text-on-surface font-semibold truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-on-surface-variant font-mono truncate">
                        {item.path}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label={item.is_starred ? `Unstar ${item.name}` : `Star ${item.name}`}
                      onClick={() => void starFile(item.id, !item.is_starred)}
                      className={`p-2 rounded-lg hover:bg-surface-container-high cursor-pointer ${
                        item.is_starred ? 'text-tertiary' : 'text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">star</span>
                    </button>
                    <PillButton
                      variant="secondary"
                      onClick={() =>
                        void dispatchCommand(
                          item.kind === 'app' ? 'open_app' : 'open_file',
                          item.kind === 'app' ? { name: item.name } : { path: item.path },
                          'ui'
                        )
                      }
                      className="px-3 py-1.5 text-xs min-h-[34px]"
                    >
                      Open
                    </PillButton>
                    <button
                      type="button"
                      aria-label={`Reveal ${item.name}`}
                      onClick={() =>
                        void dispatchCommand('reveal_file', { path: item.path }, 'ui')
                      }
                      className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">folder</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Rename ${item.name}`}
                      onClick={() => {
                        setRenameTarget(item);
                        setRenameValue(item.name);
                        setRenameError(null);
                      }}
                      className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Trash ${item.name}`}
                      onClick={() => handleTrash(item)}
                      className="p-2 rounded-lg bg-error-container/40 text-error hover:bg-error-container/70 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="lg:col-span-4">
              {selected ? (
                <GlassCard elevated className="p-5 space-y-3">
                  <h3 className="font-headline-sm text-on-surface">{selected.name}</h3>
                  <dl className="text-xs space-y-2 text-on-surface-variant">
                    <div>
                      <dt className="text-outline">Path</dt>
                      <dd className="font-mono text-on-surface break-all">{selected.path}</dd>
                    </div>
                    <div>
                      <dt className="text-outline">Size</dt>
                      <dd>{formatBytes(selected.size_bytes)}</dd>
                    </div>
                    <div>
                      <dt className="text-outline">Checksum (SHA-256)</dt>
                      <dd className="font-mono break-all">
                        {selected.checksum_sha256 || 'Not hashed'}
                      </dd>
                    </div>
                    {selected.zara_note && (
                      <div>
                        <dt className="text-outline">Zara’s Note</dt>
                        <dd className="text-primary">{selected.zara_note}</dd>
                      </div>
                    )}
                  </dl>
                </GlassCard>
              ) : (
                <GlassCard className="p-5 text-xs text-on-surface-variant text-center">
                  Select a file or application to inspect metadata and checksum.
                </GlassCard>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      <ModalShell
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title={`Rename ${renameTarget?.name ?? 'File'}`}
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <div>
            <label htmlFor="rename-file-input" className="block text-xs text-on-surface-variant mb-1">
              New Name (no /, \, or :)
            </label>
            <input
              id="rename-file-input"
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="zara-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          {renameError && (
            <p role="alert" className="text-xs text-error">
              {renameError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <PillButton variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </PillButton>
            <PillButton type="submit">Queue Rename</PillButton>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
