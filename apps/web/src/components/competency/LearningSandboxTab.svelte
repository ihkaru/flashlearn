<script lang="ts">
  import type { CompetencyLearningBundle } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';
  import CausalProbeDeck from './CausalProbeDeck.svelte';
  import MarkdownRenderer from '../ui/MarkdownRenderer.svelte';

  interface Props {
    bundle: CompetencyLearningBundle;
    hasPassedUnaided?: boolean;
    onProceedToExam: () => void;
    onPassedUnaidedSandbox?: () => void;
  }

  let {
    bundle,
    hasPassedUnaided = false,
    onProceedToExam,
    onPassedUnaidedSandbox,
  }: Props = $props();

  let expandedMaterialId = $state<string | null>(null);
  let checkedAidItems = $state<Record<number, boolean>>({});
  let revealedHints = $state<Record<number, boolean>>({});

  function toggleAidCheck(idx: number) {
    checkedAidItems[idx] = !checkedAidItems[idx];
  }

  function toggleHint(idx: number) {
    revealedHints[idx] = !revealedHints[idx];
  }

  function handlePassUnaided() {
    onPassedUnaidedSandbox?.();
  }
</script>

<div class="learning-sandbox" style="display: flex; flex-direction: column; gap: 20px;">
  <!-- Banner Pengantar Sandbox -->
  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 14px; padding: 14px 18px; display: flex; align-items: flex-start; gap: 12px;">
    <div style="background: #16a34a; color: #ffffff; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; shrink: 0;">
      <Icon name="book" size={16} />
    </div>
    <div>
      <h4 style="margin: 0 0 2px 0; font-size: 0.95rem; font-weight: 800; color: #14532d;">
        Mode Belajar & Latihan Aman (Sandbox)
      </h4>
      <p style="margin: 0; font-size: 0.8rem; color: #166534; line-height: 1.4;">
        Ruang pembentukan mental model sebelum ujian wewenang. Bedah contoh kerja ahli, pelajari checklist SOP, dan coba simulasi tanpa takut pengurangan skor.
      </p>
    </div>
  </div>

  <!-- Causal Schema Priming Section (ADR-06) -->
  {#if bundle.causalProbes && bundle.causalProbes.length > 0}
    <CausalProbeDeck probes={bundle.causalProbes} />
  {/if}

  <!-- Job Aid & Checklist Section -->
  {#if bundle.jobAid}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <Icon name="check-double" size={16} class="text-teal-600" />
          <h5 style="margin: 0; font-size: 0.9rem; font-weight: 800; color: #0f172a;">
            Job Aid & Lembar Kerja Operasional
          </h5>
        </div>
        {#if bundle.jobAid.statutoryCitations && bundle.jobAid.statutoryCitations.length > 0}
          <span style="font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">
            Corpus of Record
          </span>
        {/if}
      </div>

      <!-- Citations -->
      {#if bundle.jobAid.statutoryCitations && bundle.jobAid.statutoryCitations.length > 0}
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
          {#each bundle.jobAid.statutoryCitations as cit}
            <span style="font-size: 0.72rem; background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-weight: 600;">
              📜 {cit}
            </span>
          {/each}
        </div>
      {/if}

      <!-- Formulas (for algorithmic quant) -->
      {#if bundle.jobAid.formulas && Object.keys(bundle.jobAid.formulas).length > 0}
        <div style="margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
          <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
            Formula & Kaidah Perhitungan
          </span>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            {#each Object.entries(bundle.jobAid.formulas) as [label, expr]}
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="font-weight: 700; color: #0f766e;">{label}:</span>
                <code style="font-family: monospace; color: #0f172a; font-weight: 700;">{expr}</code>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Checklist items -->
      {#if bundle.jobAid.checklist && bundle.jobAid.checklist.length > 0}
        <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
          Checklist Langkah Kerja Mandiri:
        </span>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          {#each bundle.jobAid.checklist as item, idx}
            <button
              type="button"
              onclick={() => toggleAidCheck(idx)}
              style="display: flex; align-items: flex-start; gap: 10px; text-align: left; background: {checkedAidItems[idx] ? '#f0fdf4' : '#fafafa'}; border: 1px solid {checkedAidItems[idx] ? '#86efac' : '#e5e7eb'}; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;"
            >
              <span style="display: inline-block; width: 18px; height: 18px; border-radius: 4px; border: 2px solid {checkedAidItems[idx] ? '#16a34a' : '#9ca3af'}; background: {checkedAidItems[idx] ? '#16a34a' : '#ffffff'}; color: #ffffff; font-size: 11px; text-align: center; line-height: 14px; shrink: 0; font-weight: 900;">
                {checkedAidItems[idx] ? '✓' : ''}
              </span>
              <span style="font-size: 0.8rem; color: {checkedAidItems[idx] ? '#15803d' : '#374151'}; line-height: 1.4; text-decoration: {checkedAidItems[idx] ? 'line-through' : 'none'};">
                {item}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Annotated Worked Example Section -->
  {#if bundle.workedExamples && bundle.workedExamples.length > 0}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <Icon name="lightbulb" size={16} class="text-amber-500" />
        <h5 style="margin: 0; font-size: 0.9rem; font-weight: 800; color: #0f172a;">
          Annotated Worked Example (Bedah Kasus Ahli)
        </h5>
      </div>

      {#each bundle.workedExamples as we}
        <div style="margin-bottom: 16px;">
          <h6 style="margin: 0 0 6px 0; font-size: 0.85rem; font-weight: 800; color: #0f766e;">
            {we.title}
          </h6>
          <div style="background: #f8fafc; border-left: 3px solid #0f766e; padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 0.8rem; color: #334155; line-height: 1.45; margin-bottom: 12px;">
            {we.scenario}
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            {#each we.solutionSteps as step}
              <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #ffffff;">
                <div style="font-size: 0.8rem; font-weight: 800; color: #1e293b; margin-bottom: 3px;">
                  {step.step}
                </div>
                <div style="font-size: 0.78rem; color: #475569; line-height: 1.4;">
                  {step.explanation}
                </div>
                {#if step.commonTrap}
                  <div style="margin-top: 6px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 6px 8px; font-size: 0.72rem; color: #9f1239; line-height: 1.35; display: flex; align-items: center; gap: 6px;">
                    <span style="font-weight: 800; shrink: 0;">⚠️ Jebakan Kritis:</span>
                    <span>{step.commonTrap}</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>

          <div style="margin-top: 10px; background: #ecfdf5; border: 1px dashed #059669; border-radius: 8px; padding: 8px 12px; font-size: 0.8rem; color: #065f46; font-weight: 700;">
            🎯 Hasil Akhir Kasus: {we.finalOutcome}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Micro-Sandbox Section -->
  {#if bundle.microSandbox}
    <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <Icon name="bolt" size={16} class="text-indigo-600" />
        <h5 style="margin: 0; font-size: 0.9rem; font-weight: 800; color: #0f172a;">
          {bundle.microSandbox.title}
        </h5>
      </div>

      <div style="font-size: 0.8rem; color: #334155; line-height: 1.45; margin-bottom: 12px; background: #f8fafc; padding: 10px; border-radius: 8px;">
        {bundle.microSandbox.scenario}
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        {#each bundle.microSandbox.checkpoints as cp, idx}
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; background: #fdfdfd;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #334155;">{cp.label}</span>
              <button
                type="button"
                onclick={() => toggleHint(idx)}
                style="border: none; background: #eff6ff; color: #1d4ed8; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 5px; cursor: pointer;"
              >
                {revealedHints[idx] ? 'Tutup Petunjuk' : 'Lihat Solusi Mandiri'}
              </button>
            </div>
            {#if revealedHints[idx]}
              <div style="margin-top: 6px; font-size: 0.76rem; color: #1e40af; background: #eff6ff; padding: 6px 10px; border-radius: 6px;">
                💡 {cp.hint}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Reading Materials Accordion if available -->
  {#if bundle.readingMaterials && bundle.readingMaterials.length > 0}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px;">
      <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
        Modul Teori & Bacaan Terkait:
      </span>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        {#each bundle.readingMaterials as mat}
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <button
              type="button"
              onclick={() => (expandedMaterialId = expandedMaterialId === mat.id ? null : mat.id)}
              style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border: none; text-align: left; cursor: pointer;"
            >
              <span style="font-size: 0.82rem; font-weight: 700; color: #0f172a;">{mat.title}</span>
              <span style="font-size: 0.75rem; color: #64748b;">
                {expandedMaterialId === mat.id ? '▲ Tutup' : '▼ Baca'}
              </span>
            </button>
            {#if expandedMaterialId === mat.id}
              <div style="padding: 12px 14px; font-size: 0.8rem; color: #334155; line-height: 1.5; background: #ffffff;">
                {#if mat.summary}
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f766e;">{mat.summary}</p>
                {/if}
                <div style="font-size: 0.85rem; line-height: 1.6;">
                  <MarkdownRenderer content={mat.body || 'Tidak ada teks panjang.'} />
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Mandatory Unaided Sandbox Step (ADR-06 Anti-AI-Crutch) -->
  <div style="background: {hasPassedUnaided ? '#f0fdf4' : '#fffbeb'}; border: 1.5px solid {hasPassedUnaided ? '#86efac' : '#fde68a'}; border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <Icon name={hasPassedUnaided ? 'check-double' : 'shield-check'} size={18} class={hasPassedUnaided ? 'text-green-600' : 'text-amber-600'} />
        <h5 style="margin: 0; font-size: 0.9rem; font-weight: 800; color: {hasPassedUnaided ? '#14532d' : '#92400e'};">
          Checkpoint Latihan Mandiri (Mandatory Unaided Practice)
        </h5>
      </div>
      <span style="font-size: 0.72rem; font-weight: 800; background: {hasPassedUnaided ? '#dcfce7' : '#fef3c7'}; color: {hasPassedUnaided ? '#15803d' : '#b45309'}; padding: 2px 8px; border-radius: 9999px;">
        {hasPassedUnaided ? 'Terverifikasi Mandiri ✓' : 'AI Dinonaktifkan ⛔'}
      </span>
    </div>
    <p style="margin: 0 0 12px 0; font-size: 0.78rem; color: {hasPassedUnaided ? '#166534' : '#78350f'}; line-height: 1.45;">
      {hasPassedUnaided
        ? 'Anda telah berhasil mendemonstrasikan eksekusi mandiri tanpa bantuan AI. Izin menuju Ujian Pembuktian Gate telah terbuka!'
        : 'Sesuai regulasi anti-AI Crutch (Bastani et al., 2025), pembelajar wajib menyelesaikan latihan mandiri tanpa petunjuk AI sebelum ujian resmi dibuka.'}
    </p>

    {#if !hasPassedUnaided}
      <button
        type="button"
        onclick={handlePassUnaided}
        class="fl-btn fl-btn-sm"
        style="background: #0f766e; color: #ffffff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px;"
      >
        <Icon name="check" size={14} />
        <span>Konfirmasi Lulus Latihan Mandiri (Buka Kunci Ujian)</span>
      </button>
    {/if}
  </div>

  <!-- Tombol Maju ke Ujian (Gated by hasPassedUnaided) -->
  <div style="padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
    <div style="font-size: 0.78rem; color: {hasPassedUnaided ? '#15803d' : '#64748b'}; font-weight: 700; display: flex; align-items: center; gap: 6px;">
      <Icon name={hasPassedUnaided ? 'check' : 'lock'} size={14} />
      <span>{hasPassedUnaided ? 'Syarat mandiri terpenuhi: Siap masuk ujian' : 'Ujian terkunci: Selesaikan latihan mandiri di atas'}</span>
    </div>
    <button
      type="button"
      onclick={onProceedToExam}
      disabled={!hasPassedUnaided}
      class="fl-btn fl-btn-primary"
      style="display: flex; align-items: center; gap: 8px; padding: 12px 20px; font-size: 0.88rem; font-weight: 800; border-radius: 10px; background: {hasPassedUnaided ? '#0f766e' : '#cbd5e1'}; color: #ffffff; border: none; cursor: {hasPassedUnaided ? 'pointer' : 'not-allowed'}; box-shadow: {hasPassedUnaided ? '0 4px 6px -1px rgba(15, 118, 110, 0.2)' : 'none'};"
    >
      <span>Masuk Ujian Pembuktian Gate</span>
      <Icon name={hasPassedUnaided ? 'arrow-right' : 'lock'} size={16} />
    </button>
  </div>
</div>
