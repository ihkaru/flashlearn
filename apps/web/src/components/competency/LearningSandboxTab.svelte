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

<div class="learning-sandbox" style="display: flex; flex-direction: column; gap: 18px;">
  <!-- Banner Pengantar Sandbox -->
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px;">
    <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 800; color: #14532d;">
      Mode Belajar &amp; Latihan Aman (Sandbox)
    </h4>
    <p style="margin: 0; font-size: 0.84rem; color: #166534; line-height: 1.5;">
      Ruang pembentukan model mental sebelum ujian wewenang. Pelajari contoh kerja ahli, verifikasi checklist prosedur, dan coba latihan tanpa pengurangan skor.
    </p>
  </div>

  <!-- Causal Schema Priming Section (ADR-06) -->
  {#if bundle.causalProbes && bundle.causalProbes.length > 0}
    <CausalProbeDeck probes={bundle.causalProbes} />
  {/if}

  <!-- Job Aid & Checklist Section -->
  {#if bundle.jobAid}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; gap: 8px; flex-wrap: wrap;">
        <h5 style="margin: 0; font-size: 0.92rem; font-weight: 800; color: #0f172a;">
          Job Aid &amp; Lembar Kerja Operasional
        </h5>
        {#if bundle.jobAid.statutoryCitations && bundle.jobAid.statutoryCitations.length > 0}
          <span style="font-size: 0.72rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: 700; white-space: nowrap;">
            Corpus of Record
          </span>
        {/if}
      </div>

      <!-- Citations -->
      {#if bundle.jobAid.statutoryCitations && bundle.jobAid.statutoryCitations.length > 0}
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
          {#each bundle.jobAid.statutoryCitations as cit}
            <span style="font-size: 0.75rem; background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-weight: 600;">
              {cit}
            </span>
          {/each}
        </div>
      {/if}

      <!-- Formulas (for algorithmic quant) -->
      {#if bundle.jobAid.formulas && Object.keys(bundle.jobAid.formulas).length > 0}
        <div style="margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px;">
          <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 6px;">
            Formula &amp; Kaidah Perhitungan
          </span>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            {#each Object.entries(bundle.jobAid.formulas) as [label, expr]}
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.82rem; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <span style="font-weight: 700; color: #0f766e;">{label}:</span>
                <code style="font-family: monospace; color: #0f172a; font-weight: 700; overflow-wrap: anywhere;">{expr}</code>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Checklist items -->
      {#if bundle.jobAid.checklist && bundle.jobAid.checklist.length > 0}
        <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 8px;">
          Checklist Langkah Kerja Mandiri:
        </span>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          {#each bundle.jobAid.checklist as item, idx}
            <button
              type="button"
              onclick={() => toggleAidCheck(idx)}
              class="fl-btn-wrap"
              style="width: 100%; display: flex; align-items: flex-start; gap: 10px; text-align: left; background: {checkedAidItems[idx] ? '#f0fdf4' : '#fafafa'}; border: 1px solid {checkedAidItems[idx] ? '#86efac' : '#e2e8f0'}; padding: 10px 12px; border-radius: 8px;"
            >
              <span
                style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; border: 2px solid {checkedAidItems[idx] ? '#16a34a' : '#94a3b8'}; background: {checkedAidItems[idx] ? '#16a34a' : '#ffffff'}; color: #ffffff; flex-shrink: 0; margin-top: 1px;"
                aria-hidden="true"
              >
                {#if checkedAidItems[idx]}
                  <Icon name="check" size={12} />
                {/if}
              </span>
              <span style="font-size: 0.84rem; color: {checkedAidItems[idx] ? '#15803d' : '#334155'}; line-height: 1.45; text-decoration: {checkedAidItems[idx] ? 'line-through' : 'none'};">
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
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
      <h5 style="margin: 0 0 12px 0; font-size: 0.92rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        Annotated Worked Example (Bedah Kasus Ahli)
      </h5>

      {#each bundle.workedExamples as we}
        <div style="margin-bottom: 16px;">
          <h6 style="margin: 0 0 6px 0; font-size: 0.88rem; font-weight: 800; color: #0f766e;">
            {we.title}
          </h6>
          <div style="background: #f8fafc; border-left: 3px solid #0f766e; padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 0.84rem; color: #334155; line-height: 1.5; margin-bottom: 12px;">
            {we.scenario}
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            {#each we.solutionSteps as step}
              <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #ffffff;">
                <div style="font-size: 0.84rem; font-weight: 800; color: #1e293b; margin-bottom: 4px;">
                  {step.step}
                </div>
                <div style="font-size: 0.82rem; color: #475569; line-height: 1.45;">
                  {step.explanation}
                </div>
                {#if step.commonTrap}
                  <div style="margin-top: 8px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 6px 10px; font-size: 0.78rem; color: #9f1239; line-height: 1.4;">
                    <strong>Jebakan Kritis:</strong> {step.commonTrap}
                  </div>
                {/if}
              </div>
            {/each}
          </div>

          <div style="margin-top: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 12px; font-size: 0.84rem; color: #065f46; font-weight: 700;">
            Hasil Akhir Kasus: {we.finalOutcome}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Micro-Sandbox Section -->
  {#if bundle.microSandbox}
    <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px;">
      <h5 style="margin: 0 0 10px 0; font-size: 0.92rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        {bundle.microSandbox.title}
      </h5>

      <div style="font-size: 0.84rem; color: #334155; line-height: 1.5; margin-bottom: 12px; background: #f8fafc; padding: 10px 12px; border-radius: 8px;">
        {bundle.microSandbox.scenario}
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        {#each bundle.microSandbox.checkpoints as cp, idx}
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 0.84rem; font-weight: 700; color: #334155; flex: 1 1 180px;">{cp.label}</span>
              <button
                type="button"
                onclick={() => toggleHint(idx)}
                class="fl-btn fl-btn-sm"
                style="border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; font-size: 0.76rem; font-weight: 700;"
              >
                {revealedHints[idx] ? 'Tutup Petunjuk' : 'Lihat Solusi Mandiri'}
              </button>
            </div>
            {#if revealedHints[idx]}
              <div style="margin-top: 8px; font-size: 0.8rem; color: #1e40af; background: #eff6ff; padding: 8px 10px; border-radius: 6px; line-height: 1.45;">
                <strong>Petunjuk:</strong> {cp.hint}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Reading Materials Accordion if available -->
  {#if bundle.readingMaterials && bundle.readingMaterials.length > 0}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
      <span style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 8px;">
        Modul Teori &amp; Bacaan Terkait:
      </span>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        {#each bundle.readingMaterials as mat}
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <button
              type="button"
              onclick={() => (expandedMaterialId = expandedMaterialId === mat.id ? null : mat.id)}
              class="fl-btn-wrap"
              style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 14px; background: #f8fafc; border: none; text-align: left;"
            >
              <span style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">{mat.title}</span>
              <span style="font-size: 0.78rem; color: #0f766e; font-weight: 600; white-space: nowrap; flex-shrink: 0;">
                {expandedMaterialId === mat.id ? 'Tutup' : 'Baca'}
              </span>
            </button>
            {#if expandedMaterialId === mat.id}
              <div style="padding: 12px 14px; font-size: 0.84rem; color: #334155; line-height: 1.55; background: #ffffff;">
                {#if mat.summary}
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #0f766e;">{mat.summary}</p>
                {/if}
                <MarkdownRenderer content={mat.body || 'Tidak ada teks panjang.'} />
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Mandatory Unaided Sandbox Step (ADR-06 Anti-AI-Crutch) -->
  <div style="background: {hasPassedUnaided ? '#f0fdf4' : '#fffbeb'}; border: 1.5px solid {hasPassedUnaided ? '#86efac' : '#fde68a'}; border-radius: 12px; padding: 16px;">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
      <h5 style="margin: 0; font-size: 0.92rem; font-weight: 800; color: {hasPassedUnaided ? '#14532d' : '#92400e'};">
        Checkpoint Latihan Mandiri (Unaided Practice)
      </h5>
      <span style="font-size: 0.74rem; font-weight: 700; background: {hasPassedUnaided ? '#dcfce7' : '#fef3c7'}; color: {hasPassedUnaided ? '#15803d' : '#b45309'}; padding: 3px 8px; border-radius: 6px; white-space: nowrap;">
        {hasPassedUnaided ? 'Terverifikasi Mandiri' : 'AI Dinonaktifkan'}
      </span>
    </div>
    <p style="margin: 0 0 12px 0; font-size: 0.82rem; color: {hasPassedUnaided ? '#166534' : '#78350f'}; line-height: 1.5;">
      {hasPassedUnaided
        ? 'Anda telah mendemonstrasikan eksekusi mandiri tanpa bantuan AI. Akses menuju Ujian Resmi kini terbuka.'
        : 'Sesuai regulasi anti-AI Crutch (Bastani et al., 2025), pembelajar wajib menyelesaikan latihan mandiri tanpa petunjuk AI sebelum ujian resmi dibuka.'}
    </p>

    {#if !hasPassedUnaided}
      <button
        type="button"
        onclick={handlePassUnaided}
        class="fl-btn fl-btn-md fl-btn-wrap"
        style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
      >
        Konfirmasi Lulus Latihan Mandiri (Buka Kunci Ujian)
      </button>
    {/if}
  </div>

  <!-- Tombol Maju ke Ujian (Gated by hasPassedUnaided) -->
  <div style="padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
    <div style="font-size: 0.82rem; color: {hasPassedUnaided ? '#15803d' : '#475569'}; font-weight: 600;">
      {hasPassedUnaided ? 'Syarat mandiri terpenuhi. Siap masuk ujian.' : 'Selesaikan latihan mandiri di atas untuk membuka ujian.'}
    </div>
    <button
      type="button"
      onclick={onProceedToExam}
      disabled={!hasPassedUnaided}
      class="fl-btn fl-btn-md"
      style="background: {hasPassedUnaided ? '#0f766e' : '#cbd5e1'}; color: #ffffff; border: none; font-weight: 700;"
    >
      {#if !hasPassedUnaided}
        <Icon name="lock" size={14} />
      {/if}
      <span>Masuk Ujian Pembuktian</span>
    </button>
  </div>
</div>
