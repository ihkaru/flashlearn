<script lang="ts">
  import type { IllStructuredCaseSpec } from '@flashlearn/shared';

  interface Props {
    caseSpec: IllStructuredCaseSpec;
  }

  let { caseSpec }: Props = $props();
  let activeIdx = $state(0);
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
    <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; margin-bottom: 4px;">
      Konteks Kasus
    </div>
    <p style="margin: 0; font-size: 0.92rem; color: #0f172a; line-height: 1.6;">
      {caseSpec.contextBrief}
    </p>
  </div>

  <!-- Perspective selector tabs (calm, single view at a time) -->
  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
    {#each caseSpec.perspectives as p, idx}
      <button
        type="button"
        onclick={() => (activeIdx = idx)}
        class="fl-btn fl-btn-sm"
        style="border-radius: 999px; font-weight: 700; border: 1px solid {activeIdx === idx ? '#0f766e' : '#cbd5e1'}; background: {activeIdx === idx ? '#0f766e' : '#ffffff'}; color: {activeIdx === idx ? '#ffffff' : '#334155'};"
      >
        {p.actorOrSchool}
      </button>
    {/each}
  </div>

  {#if caseSpec.perspectives[activeIdx]}
    {@const view = caseSpec.perspectives[activeIdx]}
    <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px 16px; display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 0.94rem; font-weight: 800; color: #0f172a;">{view.claim}</div>
      <div style="font-size: 0.87rem; color: #166534; line-height: 1.5;">
        <strong>Dasar bukti:</strong> {view.supportingEvidence}
      </div>
      <div style="font-size: 0.87rem; color: #9f1239; line-height: 1.5;">
        <strong>Titik buta:</strong> {view.blindSpot}
      </div>
    </div>
  {/if}

  {#if caseSpec.rubricCriteria.length > 0}
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f766e;">
        Kriteria Keputusan yang Kuat
      </div>
      {#each caseSpec.rubricCriteria as rc}
        <div style="font-size: 0.86rem; color: #134e4a; line-height: 1.45;">
          <strong>{rc.criterion}:</strong> {rc.strongIndicator}
        </div>
      {/each}
    </div>
  {/if}
</div>
