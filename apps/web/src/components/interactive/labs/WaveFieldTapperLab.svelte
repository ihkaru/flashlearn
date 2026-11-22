<script lang="ts">
  import type { WaveFieldTapperConfig } from '@flashlearn/shared';

  interface Props {
    config: WaveFieldTapperConfig;
    onAhaReached: () => void;
  }

  let { config, onAhaReached }: Props = $props();

  interface TapPoint {
    x: number;
    y: number;
  }

  let taps = $state<TapPoint[]>([]);
  let ahaSent = $state(false);
  const rings = [24, 52, 80, 108, 136];

  function handleSurfaceTap(e: PointerEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 320);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 180);

    taps = taps.length >= 2 ? [taps[1], { x, y }] : [...taps, { x, y }];

    if (!ahaSent && taps.length >= Math.max(2, config.minTapsForAha)) {
      ahaSent = true;
      onAhaReached();
    }
  }

  function clearTaps() {
    taps = [];
  }

  const midpoint = $derived(
    taps.length === 2
      ? { x: Math.round((taps[0].x + taps[1].x) / 2), y: Math.round((taps[0].y + taps[1].y) / 2) }
      : null
  );
</script>

<div style="display: flex; flex-direction: column; gap: 10px;">
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
    <span style="font-size: 0.82rem; font-weight: 700; color: #334155;">
      {config.surfaceLabel} ({taps.length}/2 titik ketukan)
    </span>
    {#if taps.length > 0}
      <button
        type="button"
        onclick={clearTaps}
        style="background: transparent; border: none; color: #475569; font-size: 0.78rem; font-weight: 600; padding: 4px 8px; cursor: pointer;"
      >
        Bersihkan
      </button>
    {/if}
  </div>

  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <svg
    viewBox="0 0 320 180"
    onpointerdown={handleSurfaceTap}
    style="width: 100%; height: auto; aspect-ratio: 16 / 9; background: #f0fdfa; border: 1.5px solid #99f6e4; border-radius: 12px; cursor: crosshair; touch-action: manipulation; display: block;"
    aria-label="Bidang interaktif, ketuk di dua lokasi untuk melihat pertemuan gelombang"
  >
    {#if taps.length === 0}
      <text x="160" y="94" text-anchor="middle" fill="#0f766e" font-size="13" font-weight="600">
        Ketuk 2 titik di sini untuk membuat riak
      </text>
    {/if}

    {#each taps as pt, idx (idx)}
      {#each rings as r, rIdx (rIdx)}
        <circle
          cx={pt.x}
          cy={pt.y}
          r={r}
          fill="none"
          stroke={rIdx % 2 === 0 ? '#0f766e' : '#d97706'}
          stroke-width={rIdx % 2 === 0 ? '2' : '1.4'}
          stroke-dasharray={rIdx % 2 === 0 ? 'none' : '4 4'}
          opacity={Math.max(0.25, 0.9 - rIdx * 0.14)}
        />
      {/each}
      <circle cx={pt.x} cy={pt.y} r="5" fill="#0f766e" />
    {/each}

    {#if midpoint}
      <circle cx={midpoint.x} cy={midpoint.y} r="7" fill="#0f766e" opacity="0.25" />
      <circle cx={midpoint.x} cy={midpoint.y} r="3.5" fill="#0f172a" />
    {/if}
  </svg>

  <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.78rem; color: #475569;">
    <span><strong style="color: #0f766e;">Garis utuh:</strong> {config.constructiveLabel}</span>
    <span><strong style="color: #b45309;">Garis putus:</strong> {config.destructiveLabel}</span>
  </div>
</div>
