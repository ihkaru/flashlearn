<script lang="ts">
  import type { Domain } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

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

<div class="domain-track-container" style="margin-bottom: 24px;">
  <!-- Header: Authority Track & Domain Counter -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-weight: 800; font-size: 0.95rem; color: #0f172a; display: flex; align-items: center; gap: 6px;">
        <Icon name="shield-check" size={16} />
        Lintasan Kualifikasi Wewenang (Domain SDM)
      </span>
      <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">
        {domains.length} Domain
      </span>
    </div>

    {#if isOwner && onOpenCreateDomain}
      <button
        onclick={onOpenCreateDomain}
        class="fl-btn fl-btn-sm"
        style="border: 1px dashed #0f766e; background: #f0fdfa; color: #0f766e; font-weight: 700;"
      >
        <Icon name="plus" size={12} />
        <span>Tambah Domain</span>
      </button>
    {/if}
  </div>

  <!-- Domain Tabs / Pills -->
  <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch; margin-bottom: 14px;">
    {#each domains as d (d.id)}
      {@const isSelected = d.id === selectedDomainId}
      <button
        onclick={() => onSelectDomain(d.id)}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: 1.5px solid {isSelected ? '#0f766e' : '#e2e8f0'}; background: {isSelected ? '#0f766e' : '#ffffff'}; color: {isSelected ? '#ffffff' : '#334155'}; box-shadow: {isSelected ? '0 4px 12px rgba(15,118,110,0.2)' : '0 1px 3px rgba(0,0,0,0.05)'}; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0;"
      >
        <span>{d.icon || '🎯'}</span>
        <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{d.name}</span>
        <span style="font-size: 0.7rem; padding: 1px 6px; border-radius: 9999px; background: {isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9'}; color: {isSelected ? '#ffffff' : '#64748b'};">
          Lvl {d.legalAuthorityLevel}
        </span>
      </button>
    {/each}
  </div>

  <!-- Selected Domain Responsibility Callout -->
  {#if activeDomain}
    <div
      style="background: #ffffff; border: 1.5px solid #ccfbf1; border-left: 5px solid #0f766e; border-radius: 12px; padding: 16px 18px; box-shadow: 0 2px 8px rgba(15,118,110,0.06);"
    >
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 0.72rem; font-weight: 800; color: #0f766e; background: #ccfbf1; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;">
              {activeDomain.code}
            </span>
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">
              Target Peran:
            </span>
            <span style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">
              {activeDomain.targetRole}
            </span>
          </div>
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; line-height: 1.3;">
            {activeDomain.name}
          </h3>
        </div>

        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #0f766e; background: #f0fdfa; border: 1px solid #99f6e4; padding: 3px 8px; border-radius: 6px;">
            Otoritas Tingkat {activeDomain.legalAuthorityLevel}
          </span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px;">
            Target Nilai &ge; {activeDomain.minPassingScore}%
          </span>
        </div>
      </div>

      <!-- Concrete Responsibility & Governance Invariant -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 10px 12px; font-size: 0.84rem; color: #334155; line-height: 1.45; border: 1px solid #e2e8f0;">
        <span style="font-weight: 800; color: #0f766e; display: inline-flex; align-items: center; gap: 4px;">
          <Icon name="check-circle" size={13} />
          Lingkup Tanggung Jawab Sah SDM:
        </span>
        <span style="display: inline; margin-left: 4px;">
          {activeDomain.responsibilityScope}
        </span>
      </div>
    </div>
  {/if}
</div>
