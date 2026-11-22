<script lang="ts">
  import type { Domain } from '@flashlearn/shared';

  interface Props {
    domains: Domain[];
    selectedDomainId: string;
    onSelectDomain: (domainId: string) => void;
    isOwner?: boolean;
    onOpenCreateDomain?: () => void;
  }

  let {
    domains,
    selectedDomainId,
    onSelectDomain,
    isOwner = false,
    onOpenCreateDomain,
  }: Props = $props();

  let activeDomain = $derived(
    domains.find((d) => d.id === selectedDomainId) || domains[0]
  );
</script>

<div class="domain-track-container" style="margin-bottom: 22px;">
  <!-- Header: Authority Track & Domain Counter -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 8px; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <span style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">
        Lintasan Kualifikasi Wewenang
      </span>
      <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: 700; white-space: nowrap;">
        {domains.length} Domain
      </span>
    </div>

    {#if isOwner && onOpenCreateDomain}
      <button
        onclick={onOpenCreateDomain}
        class="fl-btn fl-btn-sm"
        style="border: 1px dashed #0f766e; background: #f0fdfa; color: #0f766e; font-weight: 700;"
      >
        <span>Tambah Domain</span>
      </button>
    {/if}
  </div>

  <!-- Domain Tabs / Pills -->
  <div class="fl-scroll-row" style="margin-bottom: 12px;">
    {#each domains as d (d.id)}
      {@const isSelected = d.id === selectedDomainId}
      <button
        onclick={() => onSelectDomain(d.id)}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: 1.5px solid {isSelected ? '#0f766e' : '#e2e8f0'}; background: {isSelected ? '#0f766e' : '#ffffff'}; color: {isSelected ? '#ffffff' : '#334155'}; font-weight: 700; gap: 8px;"
      >
        <span style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{d.name}</span>
        <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 5px; background: {isSelected ? 'rgba(255,255,255,0.22)' : '#f1f5f9'}; color: {isSelected ? '#ffffff' : '#475569'};">
          Lvl {d.legalAuthorityLevel}
        </span>
      </button>
    {/each}
  </div>

  <!-- Selected Domain Responsibility Callout -->
  {#if activeDomain}
    <div
      style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px;"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
        <div style="min-width: 0; flex: 1 1 240px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
            <span style="font-family: monospace; font-size: 0.74rem; font-weight: 700; color: #0f766e; background: #ccfbf1; padding: 2px 6px; border-radius: 4px;">
              {activeDomain.code}
            </span>
            <span style="font-size: 0.8rem; color: #475569;">
              Peran: <strong style="color: #0f172a;">{activeDomain.targetRole}</strong>
            </span>
          </div>
          <h3 style="margin: 0; font-size: 1.02rem; font-weight: 800; color: #0f172a; line-height: 1.35;">
            {activeDomain.name}
          </h3>
        </div>

        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #0f766e; background: #f0fdfa; border: 1px solid #99f6e4; padding: 3px 8px; border-radius: 6px; white-space: nowrap;">
            Otoritas Tingkat {activeDomain.legalAuthorityLevel}
          </span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; white-space: nowrap;">
            Target &ge; {activeDomain.minPassingScore}%
          </span>
        </div>
      </div>

      <!-- Concrete Responsibility & Governance Invariant -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 10px 12px; font-size: 0.85rem; color: #334155; line-height: 1.5; border: 1px solid #e2e8f0;">
        <strong style="color: #0f766e;">Lingkup Tanggung Jawab Sah:</strong>
        <span style="margin-left: 4px;">{activeDomain.responsibilityScope}</span>
      </div>
    </div>
  {/if}
</div>
