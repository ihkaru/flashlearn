<script lang="ts">
  import type { Content, Domain, LearnerContentProgress } from '@flashlearn/shared';
  import ContentListItem from './ContentListItem.svelte';

  interface Props {
    contents: Content[];
    domains: Domain[];
    progressByContentId: Record<string, LearnerContentProgress>;
    isOwner: boolean;
    isTrash: boolean;
    isRestoring: boolean;
    copiedLinkId: string | null;
    onNavigate: (c: Content) => void;
    onCopyLink: (c: Content, e: Event) => void;
    onOpenReview: (c: Content, e: Event, tab: 'analysis' | 'participants') => void;
    onOpenEdit: (c: Content, e: Event) => void;
    onRollback: (c: Content, e: Event) => void;
    onDelete: (c: Content, e: Event) => void;
    onRestore: (c: Content, e: Event) => void;
  }

  let {
    contents,
    domains,
    progressByContentId,
    isOwner,
    isTrash,
    isRestoring,
    copiedLinkId,
    onNavigate,
    onCopyLink,
    onOpenReview,
    onOpenEdit,
    onRollback,
    onDelete,
    onRestore,
  }: Props = $props();

  interface UnitGroup {
    key: string;
    title: string;
    order: number;
    totalMinutes: number;
    completedCount: number;
    items: Content[];
  }

  const unitGroups = $derived.by(() => {
    const domainMap = new Map(domains.map((d, idx) => [d.id, { domain: d, idx }]));
    const groups = new Map<string, UnitGroup>();

    for (const c of contents) {
      const meta = c.interactivePayload?.unitMeta;
      const domEntry = c.domainId ? domainMap.get(c.domainId) : undefined;
      const key = meta?.unitCode || domEntry?.domain.code || 'general';
      const title = meta?.unitTitle || domEntry?.domain.name || 'Sesi Pembelajaran';
      const order = meta?.unitOrder ?? (domEntry ? domEntry.idx + 1 : 999);

      if (!groups.has(key)) {
        groups.set(key, { key, title, order, totalMinutes: 0, completedCount: 0, items: [] });
      }
      const g = groups.get(key)!;
      g.items.push(c);
      g.totalMinutes += c.readingTimeMinutes || c.interactivePayload?.estimatedMinutes || 5;
      if (progressByContentId[c.id]?.isCompleted) g.completedCount += 1;
    }

    const sorted = Array.from(groups.values()).sort((a, b) => a.order - b.order);
    for (const g of sorted) {
      g.items.sort(
        (a, b) =>
          (a.interactivePayload?.unitMeta?.moduleOrder ?? 999) -
          (b.interactivePayload?.unitMeta?.moduleOrder ?? 999)
      );
    }
    return sorted;
  });

  const nextSession = $derived.by(() => {
    const allOrdered = unitGroups.flatMap((g) => g.items);
    const inProgress = allOrdered.find((c) => {
      const p = progressByContentId[c.id];
      return p && !p.isCompleted;
    });
    if (inProgress) return { content: inProgress, label: 'Lanjutkan Sesi Terakhir' };
    const firstUnfinished = allOrdered.find((c) => !progressByContentId[c.id]?.isCompleted);
    if (firstUnfinished) return { content: firstUnfinished, label: 'Mulai Sesi Berikutnya' };
    return allOrdered[0] ? { content: allOrdered[0], label: 'Ulangi dari Sesi Pertama' } : null;
  });

  const totalCompleted = $derived(
    contents.filter((c) => progressByContentId[c.id]?.isCompleted).length
  );
  const overallProgressRatio = $derived(
    contents.length > 0 ? Math.min(1, totalCompleted / contents.length) : 0
  );

  let manuallyToggled = $state<Record<string, boolean>>({});

  function isUnitExpanded(group: UnitGroup, idx: number): boolean {
    if (manuallyToggled[group.key] !== undefined) return manuallyToggled[group.key];
    if (unitGroups.length === 1) return true;
    const firstActiveIdx = unitGroups.findIndex((g) => g.completedCount < g.items.length);
    return idx === (firstActiveIdx >= 0 ? firstActiveIdx : 0);
  }

  function toggleUnit(key: string, currentOpen: boolean) {
    manuallyToggled = { ...manuallyToggled, [key]: !currentOpen };
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  {#if !isTrash && nextSession && contents.length > 1}
    <div style="background: var(--ws-accent-soft, #f0fdfa); border: 1.5px solid var(--ws-accent-border, #99f6e4); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="min-width: 0; flex: 1 1 220px;">
          <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ws-accent, #0f766e);">
            {nextSession.label} · {totalCompleted}/{contents.length} selesai
          </div>
          <div style="font-size: 0.96rem; font-weight: 800; color: var(--ws-accent-ink, #115e59); margin-top: 2px;">
            {nextSession.content.title}
          </div>
        </div>
        <button
          type="button"
          onclick={() => onNavigate(nextSession.content)}
          class="fl-btn fl-btn-md"
          style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700;"
        >
          Lanjutkan
        </button>
      </div>
      <div style="height: 5px; background: rgba(15, 23, 42, 0.08); border-radius: 999px; overflow: hidden;">
        <div
          class="fl-progress-bar-fill"
          style="background: var(--ws-accent, #0f766e); transform: scaleX({overallProgressRatio});"
        ></div>
      </div>
    </div>
  {/if}

  {#each unitGroups as group, idx (group.key)}
    {@const expanded = isUnitExpanded(group, idx)}
    {#if unitGroups.length > 1}
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
        <button
          type="button"
          onclick={() => toggleUnit(group.key, expanded)}
          style="width: 100%; padding: 14px 16px; background: {expanded ? '#f8fafc' : '#ffffff'}; border: none; border-bottom: {expanded ? '1px solid #e2e8f0' : 'none'}; display: flex; justify-content: space-between; align-items: center; gap: 12px; text-align: left; cursor: pointer;"
        >
          <div style="min-width: 0;">
            <div style="font-size: 0.94rem; font-weight: 800; color: #0f172a;">{group.title}</div>
            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
              {group.completedCount}/{group.items.length} sesi selesai · ±{group.totalMinutes} menit
            </div>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--ws-accent, #0f766e); flex-shrink: 0;">
            {expanded ? 'Lipat' : 'Buka'}
          </span>
        </button>

        {#if expanded}
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
            {#each group.items as c (c.id)}
              <ContentListItem
                content={c}
                progress={progressByContentId[c.id] || null}
                {isOwner}
                {isTrash}
                {isRestoring}
                {copiedLinkId}
                {onNavigate}
                {onCopyLink}
                {onOpenReview}
                {onOpenEdit}
                {onRollback}
                {onDelete}
                {onRestore}
              />
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 12px;">
        {#each group.items as c (c.id)}
          <ContentListItem
            content={c}
            progress={progressByContentId[c.id] || null}
            {isOwner}
            {isTrash}
            {isRestoring}
            {copiedLinkId}
            {onNavigate}
            {onCopyLink}
            {onOpenReview}
            {onOpenEdit}
            {onRollback}
            {onDelete}
            {onRestore}
          />
        {/each}
      </div>
    {/if}
  {/each}
</div>
