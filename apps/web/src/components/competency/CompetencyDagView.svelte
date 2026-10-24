<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type CompetencyGraphResponse } from '../../stores/api';
  import type { CompetencyNode } from '@flashlearn/shared';
  import TaskRunnerModal from './TaskRunnerModal.svelte';
  import DiagnosticPlacementModal from './DiagnosticPlacementModal.svelte';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    workspaceId: string;
    onSelectCompetency?: (competencyId: string) => void;
  }

  let { workspaceId, onSelectCompetency }: Props = $props();

  let graphData = $state<CompetencyGraphResponse | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);
  let selectedNodeForTask = $state<CompetencyNode | null>(null);
  let showTaskModal = $state(false);
  let showDiagnosticModal = $state(false);

  onMount(() => {
    loadGraph();
  });

  async function loadGraph() {
    isLoading = true;
    errorMessage = null;
    try {
      graphData = await api.competencies.getGraph(workspaceId);
    } catch (err: any) {
      errorMessage = err.message || 'Gagal memuat graf kompetensi';
    } finally {
      isLoading = false;
    }
  }

  function handleNodeClick(node: any) {
    if (node.userStatus === 'locked') {
      alert('Kompetensi ini terkunci. Tuntaskan modul prasyarat sebelumnya terlebih dahulu.');
      return;
    }
    selectedNodeForTask = node;
    showTaskModal = true;
    onSelectCompetency?.(node.id);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'mastered':
        return { label: 'Tuntas (Mastered)', bg: '#dcfce7', text: '#15803d', icon: 'check-circle' };
      case 'in_progress':
        return { label: 'Sedang Berjalan', bg: '#e0f2fe', text: '#0369a1', icon: 'clock' };
      case 'ready':
        return { label: 'Siap Dikerjakan', bg: '#fef3c7', text: '#b45309', icon: 'play' };
      case 'stale':
        return { label: 'Perlu Uji Ulang', bg: '#fee2e2', text: '#b91c1c', icon: 'alert-triangle' };
      default:
        return { label: 'Terkunci', bg: '#f1f5f9', text: '#64748b', icon: 'lock' };
    }
  }

  function getOracleClassBadge(cls: string) {
    const c = (cls || '').toUpperCase();
    if (c.includes('A')) return { label: 'Kelas A · Deterministik', bg: '#f0fdf4', text: '#166534' };
    if (c.includes('B')) return { label: 'Kelas B · AI Benchmark', bg: '#eff6ff', text: '#1d4ed8' };
    if (c.includes('C')) return { label: 'Kelas C · Pakar Manusia', bg: '#faf5ff', text: '#7e22ce' };
    return { label: cls, bg: '#f8fafc', text: '#475569' };
  }

  function getDriftBadge(driftStatus?: string | null, retrievability?: number | null) {
    if (!driftStatus || driftStatus === 'none') return null;
    const rPct = retrievability !== null && retrievability !== undefined ? Math.round(retrievability * 100) : 100;
    if (driftStatus === 'drift_warning') {
      return { label: `⚠️ Peluruhan (${rPct}%)`, bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
    }
    if (driftStatus === 'provisionally_expired') {
      return { label: `🔴 Kedaluwarsa (${rPct}%)`, bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
    }
    return { label: `Segar (${rPct}%)`, bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
  }
</script>

<div class="competency-dag-container" style="display: flex; flex-direction: column; gap: 16px;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
        Peta Kompetensi & Prasyarat
      </h3>
      <p style="margin: 4px 0 0; font-size: 0.85rem; color: #64748b;">
        Graf prasyarat kompetensi berjenjang yang diverifikasi oleh Oracle multi-tier.
      </p>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button
        onclick={() => (showDiagnosticModal = true)}
        style="padding: 6px 12px; border-radius: 8px; border: none; background: #0f766e; font-size: 0.8rem; font-weight: 700; color: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 5px;"
      >
        <Icon name="bolt" size={13} />
        <span>Uji Diagnostik (KST)</span>
      </button>

      <button
        onclick={loadGraph}
        style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 5px;"
      >
        <Icon name="refresh" size={13} />
        <span>Segarkan</span>
      </button>
    </div>
  </div>

  {#if isLoading}
    <div style="text-align: center; padding: 40px; color: #94a3b8; font-weight: 500;">
      Memuat graf kompetensi...
    </div>
  {:else if errorMessage}
    <div style="padding: 16px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 0.9rem;">
      {errorMessage}
    </div>
  {:else if !graphData || graphData.nodes.length === 0}
    <div style="text-align: center; padding: 40px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px;">
      <p style="margin: 0; color: #64748b; font-weight: 600;">Belum ada node kompetensi pada workspace ini.</p>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
      {#each graphData.nodes as node}
        {@const status = getStatusBadge(node.userStatus)}
        {@const oracle = getOracleClassBadge(node.oracleClass)}
        {@const drift = getDriftBadge(node.driftStatus, node.cachedRetrievability)}
        <div
          class="competency-card"
          role="button"
          tabindex="0"
          onclick={() => handleNodeClick(node)}
          onkeydown={(e) => e.key === 'Enter' && handleNodeClick(node)}
          style="background: #ffffff; border: 1px solid {drift?.border || '#e2e8f0'}; border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
        >
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <span style="font-family: monospace; font-size: 0.75rem; font-weight: 700; color: #0f766e; background: #ccfbf1; padding: 2px 7px; border-radius: 6px;">
              {node.code}
            </span>
            <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">
              {#if drift}
                <span style="font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: {drift.bg}; color: {drift.text};">
                  {drift.label}
                </span>
              {/if}
              <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: {status.bg}; color: {status.text}; display: inline-flex; align-items: center; gap: 4px;">
                <Icon name={status.icon} size={11} />
                {status.label}
              </span>
            </div>
          </div>

          <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; line-height: 1.35;">
            {node.title}
          </h4>

          <p style="margin: 0 0 12px 0; font-size: 0.8rem; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            {node.description || 'Tidak ada deskripsi rinci.'}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: auto;">
            <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: {oracle.bg}; color: {oracle.text};">
              {oracle.label}
            </span>
            <div style="display: flex; align-items: center; gap: 6px;">
              {#if node.driftStatus === 'drift_warning' || node.driftStatus === 'provisionally_expired'}
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node);
                  }}
                  style="border: none; background: #b45309; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer;"
                >
                  Tantangan Revalidasi
                </button>
              {/if}
              {#if node.masteryScore !== null && node.masteryScore !== undefined}
                <span style="font-size: 0.8rem; font-weight: 800; color: #0f766e;">
                  Skor: {Math.round(node.masteryScore)}%
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <TaskRunnerModal
    isOpen={showTaskModal}
    competency={selectedNodeForTask}
    onClose={() => (showTaskModal = false)}
    onMasteryUpdated={loadGraph}
  />

  <DiagnosticPlacementModal
    isOpen={showDiagnosticModal}
    {workspaceId}
    onClose={() => (showDiagnosticModal = false)}
    onCompleted={loadGraph}
  />
</div>
