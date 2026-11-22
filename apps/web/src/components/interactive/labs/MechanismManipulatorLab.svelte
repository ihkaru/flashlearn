<script lang="ts">
  import type { MechanismManipulatorConfig } from '@flashlearn/shared';

  interface Props {
    config: MechanismManipulatorConfig;
    onAhaReached: () => void;
  }

  let { config, onAhaReached }: Props = $props();

  let values = $state<Record<string, number>>(
    Object.fromEntries(config.sliders.map((s) => [s.id, s.initial]))
  );
  let moveCount = $state(0);
  let ahaSent = $state(false);

  const computedOutput = $derived.by(() => {
    const nums = config.sliders.map((s) => values[s.id] ?? s.initial);
    const a = nums[0] ?? 1;
    const b = nums[1] ?? 1;
    if (config.relation === 'ratio') return b === 0 ? 0 : a / b;
    if (config.relation === 'product') return a * b;
    if (config.relation === 'difference') return a - b;
    if (config.relation === 'inverse_sum') return a === 0 || b === 0 ? 0 : 1 / (1 / a + 1 / b);
    return a;
  });

  const barRatio = $derived(Math.min(1, Math.max(0.06, Math.abs(computedOutput) / 100)));

  function handleChange(id: string, val: number) {
    values = { ...values, [id]: val };
    moveCount += 1;

    const thresh = config.ahaThreshold;
    const meetsThresh = thresh
      ? (thresh.min === undefined || computedOutput >= thresh.min) &&
        (thresh.max === undefined || computedOutput <= thresh.max)
      : moveCount >= 2;

    if (!ahaSent && meetsThresh) {
      ahaSent = true;
      onAhaReached();
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 14px 16px;">
    <div style="font-size: 0.78rem; font-weight: 700; color: #115e59; margin-bottom: 4px;">
      {config.outputLabel}
    </div>
    <div style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 10px;">
      {Number.isFinite(computedOutput) ? computedOutput.toFixed(2) : '0.00'}
      {#if config.outputUnit}
        <span style="font-size: 0.85rem; font-weight: 600; color: #475569;"> {config.outputUnit}</span>
      {/if}
    </div>
    <div style="height: 8px; background: #ccfbf1; border-radius: 999px; overflow: hidden;">
      <div
        style="height: 100%; width: 100%; background: #0f766e; transform-origin: left center; transform: scaleX({barRatio}); transition: transform 0.16s ease-out;"
      ></div>
    </div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 12px;">
    {#each config.sliders as s (s.id)}
      <label style="display: flex; flex-direction: column; gap: 6px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span style="font-size: 0.88rem; font-weight: 700; color: #0f172a;">{s.label}</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #0f766e;">
            {values[s.id]}{s.unit ? ` ${s.unit}` : ''}
          </span>
        </div>
        <input
          type="range"
          min={s.min}
          max={s.max}
          step={s.step}
          value={values[s.id]}
          oninput={(e) => handleChange(s.id, Number((e.currentTarget as HTMLInputElement).value))}
          style="width: 100%; accent-color: #0f766e; min-height: 32px; cursor: pointer;"
        />
      </label>
    {/each}
  </div>

  <p style="margin: 0; font-size: 0.82rem; color: #475569; line-height: 1.45;">
    {config.targetHint}
  </p>
</div>
