<script lang="ts">
  import type { CausalProbe } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    probes: CausalProbe[];
    onAllProbesCompleted?: () => void;
  }

  let { probes, onAllProbesCompleted }: Props = $props();

  let selectedOptions = $state<Record<string, number>>({});
  let revealedAnswers = $state<Record<string, boolean>>({});

  function handleSelectOption(probeId: string, optIdx: number) {
    selectedOptions[probeId] = optIdx;
    revealedAnswers[probeId] = true;
    checkCompletion();
  }

  function handleManualReveal(probeId: string) {
    revealedAnswers[probeId] = true;
    checkCompletion();
  }

  function checkCompletion() {
    const allAnswered = probes.every((p) => revealedAnswers[p.id]);
    if (allAnswered && onAllProbesCompleted) {
      onAllProbesCompleted();
    }
  }

  function getProbeTypeMeta(type: CausalProbe['type']) {
    switch (type) {
      case 'causal_prediction':
        return { label: 'Prediksi Sebab-Akibat (What-If)', icon: 'lightbulb', color: '#0f766e', bg: '#ccfbf1' };
      case 'analogical_comparison':
        return { label: 'Komparasi Struktur Analogis', icon: 'check-double', color: '#4338ca', bg: '#e0e7ff' };
      case 'micro_debugging':
        return { label: 'Micro-Debugging Anomali', icon: 'exclamation-triangle', color: '#b45309', bg: '#fef3c7' };
      default:
        return { label: 'Penyelidikan Kausal', icon: 'bolt', color: '#334155', bg: '#f1f5f9' };
    }
  }
</script>

<div class="causal-probe-deck" style="background: #ffffff; border: 1.5px solid #0d9488; border-radius: 14px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.1);">
  <!-- Header Section -->
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="background: #0f766e; color: #ffffff; width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
        <Icon name="bolt" size={14} />
      </div>
      <div>
        <h5 style="margin: 0; font-size: 0.9rem; font-weight: 800; color: #0f172a;">
          Causal Schema Priming (Aktivasi Nalar Sebab-Akibat)
        </h5>
        <span style="font-size: 0.72rem; color: #64748b;">
          Pilih hipotesis prediksi sebelum melihat mekanisme sebab-akibat operasional.
        </span>
      </div>
    </div>
    <span style="font-size: 0.72rem; background: #ccfbf1; color: #0f766e; padding: 3px 8px; border-radius: 9999px; font-weight: 700;">
      {Object.keys(revealedAnswers).length}/{probes.length} Diselesaikan
    </span>
  </div>

  <!-- List of Probes -->
  <div style="display: flex; flex-direction: column; gap: 14px;">
    {#each probes as probe, pIdx}
      {@const meta = getProbeTypeMeta(probe.type)}
      {@const isRevealed = revealedAnswers[probe.id]}
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; background: #f8fafc;">
        <!-- Probe Badge & Title -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 0.72rem; font-weight: 800; color: {meta.color}; background: {meta.bg}; padding: 2px 8px; border-radius: 6px;">
            Kasus {pIdx + 1}: {meta.label}
          </span>
          {#if isRevealed}
            <span style="font-size: 0.7rem; font-weight: 700; color: #16a34a; display: flex; align-items: center; gap: 4px;">
              <Icon name="check" size={12} /> Terverifikasi
            </span>
          {/if}
        </div>

        <!-- Problem Prompt -->
        <p style="margin: 0 0 10px 0; font-size: 0.82rem; font-weight: 700; color: #1e293b; line-height: 1.45;">
          {probe.prompt}
        </p>

        <!-- Analogical comparison view if present -->
        {#if probe.scenarioA && probe.scenarioB}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 0.75rem; color: #334155;">
              <strong style="color: #0f766e; display: block; margin-bottom: 4px;">Skenario A:</strong>
              {probe.scenarioA}
            </div>
            <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 0.75rem; color: #334155;">
              <strong style="color: #4338ca; display: block; margin-bottom: 4px;">Skenario B:</strong>
              {probe.scenarioB}
            </div>
          </div>
        {/if}

        <!-- Micro-debugging code snippet if present -->
        {#if probe.faultySnippet}
          <div style="background: #1e293b; color: #f8fafc; border-radius: 8px; padding: 10px 12px; font-family: monospace; font-size: 0.75rem; margin-bottom: 10px; overflow-x: auto;">
            <div style="color: #94a3b8; font-size: 0.68rem; margin-bottom: 4px;">Snippet Analisis Cacat:</div>
            <pre style="margin: 0; white-space: pre-wrap;">{probe.faultySnippet}</pre>
          </div>
        {/if}

        <!-- Interactive Prediction Options -->
        {#if probe.predictionOptions && probe.predictionOptions.length > 0}
          <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
            {#each probe.predictionOptions as option, optIdx}
              {@const isSelected = selectedOptions[probe.id] === optIdx}
              <button
                type="button"
                onclick={() => handleSelectOption(probe.id, optIdx)}
                style="display: flex; align-items: center; gap: 8px; text-align: left; background: {isSelected ? '#e0f2fe' : '#ffffff'}; border: 1.5px solid {isSelected ? '#0284c7' : '#cbd5e1'}; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;"
              >
                <span style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid {isSelected ? '#0284c7' : '#94a3b8'}; background: {isSelected ? '#0284c7' : '#ffffff'}; display: flex; align-items: center; justify-content: center; shrink: 0;">
                  {#if isSelected}
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
                  {/if}
                </span>
                <span style="font-size: 0.78rem; font-weight: {isSelected ? '700' : '500'}; color: {isSelected ? '#0369a1' : '#334155'};">
                  {option}
                </span>
              </button>
            {/each}
          </div>
        {:else if !isRevealed}
          <button
            type="button"
            onclick={() => handleManualReveal(probe.id)}
            class="fl-btn fl-btn-sm"
            style="background: #ffffff; border: 1px solid #cbd5e1; color: #475569; font-size: 0.75rem; font-weight: 700; border-radius: 6px; padding: 6px 12px; cursor: pointer;"
          >
            Pikirkan Jawaban Lalu Buka Analisis Kausal
          </button>
        {/if}

        <!-- Revealed Causal Rationale -->
        {#if isRevealed}
          <div style="margin-top: 8px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px 12px; font-size: 0.78rem; color: #166534; line-height: 1.45;">
            <div style="font-weight: 800; color: #14532d; margin-bottom: 2px; display: flex; align-items: center; gap: 6px;">
              <span>🔍 Mekanisme & Alasan Sebab-Akibat:</span>
            </div>
            {probe.causalRationale}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
