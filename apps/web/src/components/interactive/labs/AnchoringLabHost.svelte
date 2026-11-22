<script lang="ts">
  import type { AnchoringLabSpec } from '@flashlearn/shared';
  import StateMachineLab from './StateMachineLab.svelte';
  import MechanismManipulatorLab from './MechanismManipulatorLab.svelte';
  import WaveFieldTapperLab from './WaveFieldTapperLab.svelte';
  import BridgeMorphLab from './BridgeMorphLab.svelte';
  import SandboxedMicroSimFrame from './SandboxedMicroSimFrame.svelte';

  interface Props {
    lab: AnchoringLabSpec;
    simHtml?: string | null;
    completed: boolean;
    onAhaReached: () => void;
  }

  let { lab, simHtml = null, completed, onAhaReached }: Props = $props();
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
    {#if lab.tier === 'native_primitive' && lab.nativeConfig}
      {#if lab.nativeConfig.kind === 'state_machine_sandbox'}
        <StateMachineLab config={lab.nativeConfig} {onAhaReached} />
      {:else if lab.nativeConfig.kind === 'mechanism_manipulator'}
        <MechanismManipulatorLab config={lab.nativeConfig} {onAhaReached} />
      {:else if lab.nativeConfig.kind === 'wave_field_tapper'}
        <WaveFieldTapperLab config={lab.nativeConfig} {onAhaReached} />
      {:else if lab.nativeConfig.kind === 'bridge_morph_slider'}
        <BridgeMorphLab config={lab.nativeConfig} {onAhaReached} />
      {/if}
    {:else if simHtml}
      <SandboxedMicroSimFrame htmlContent={simHtml} title={lab.title} {onAhaReached} />
    {:else}
      <div style="padding: 16px; color: #475569; font-size: 0.9rem;">
        Memuat simulasi interaktif...
      </div>
    {/if}
  </div>

  {#if completed}
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 14px 16px;">
      <div style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #15803d; margin-bottom: 4px;">
        Pola Inti Terlihat
      </div>
      <p style="margin: 0; font-size: 0.9rem; color: #14532d; line-height: 1.5;">
        {lab.ahaObservation}
      </p>
    </div>
  {/if}
</div>
