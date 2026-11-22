<script lang="ts">
  import type { BridgeMorphSliderConfig } from '@flashlearn/shared';

  interface Props {
    config: BridgeMorphSliderConfig;
    onAhaReached: () => void;
  }

  let { config, onAhaReached }: Props = $props();

  let stageIndex = $state(0);
  let visitedEnd = $state(false);

  const stage = $derived(config.stages[stageIndex] || config.stages[0]);

  function handleSlide(val: number) {
    stageIndex = val;
    if (!visitedEnd && val >= config.stages.length - 1) {
      visitedEnd = true;
      onAhaReached();
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 12px;">
  <div
    style="border-radius: 12px; padding: 16px; border: 1.5px solid {stage?.isBreakpoint ? '#fda4af' : '#99f6e4'}; background: {stage?.isBreakpoint ? '#fff1f2' : '#f0fdfa'};"
  >
    <div style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: {stage?.isBreakpoint ? '#be123c' : '#0f766e'}; margin-bottom: 4px;">
      Tahap {stageIndex + 1} dari {config.stages.length}
      {stage?.isBreakpoint ? ' - Batas Analogi' : ''}
    </div>
    <div style="font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
      {stage?.label}
    </div>
    <p style="margin: 0 0 8px 0; font-size: 0.88rem; color: #334155; line-height: 1.5;">
      {stage?.description}
    </p>
    <div style="font-size: 0.82rem; font-weight: 600; color: {stage?.isBreakpoint ? '#9f1239' : '#115e59'};">
      Aturan yang tetap berlaku: {stage?.preservedInvariant}
    </div>
  </div>

  <label style="display: flex; flex-direction: column; gap: 6px;">
    <span style="font-size: 0.82rem; font-weight: 600; color: #475569;">
      Geser dari pengalaman awal hingga konsep inti
    </span>
    <input
      type="range"
      min={0}
      max={Math.max(0, config.stages.length - 1)}
      step={1}
      value={stageIndex}
      oninput={(e) => handleSlide(Number((e.currentTarget as HTMLInputElement).value))}
      style="width: 100%; accent-color: #0f766e; min-height: 36px; cursor: pointer;"
    />
  </label>
</div>
