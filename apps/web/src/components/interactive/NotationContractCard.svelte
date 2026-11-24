<script lang="ts">
  import type { UilaBlock4NotationContract } from '@flashlearn/shared';
  import MarkdownRenderer from '../ui/MarkdownRenderer.svelte';

  interface Props {
    notation: UilaBlock4NotationContract;
  }

  let { notation }: Props = $props();
  let copied = $state(false);

  const hasLatex = $derived(
    /\$\$[\s\S]+?\$\$|\$[^$\n]+\$/.test(notation.formulaOrCode || '')
  );

  async function copyFormula() {
    try {
      await navigator.clipboard.writeText(notation.formulaOrCode || '');
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      // Ignore clipboard failure
    }
  }
</script>

<div style="display: flex; flex-direction: column; gap: 16px;">
  <!-- 1. Formula / Structured Cheatsheet Block -->
  {#if notation.formulaOrCode}
    <div style="border-radius: 14px; overflow: hidden; border: 1px solid #1e293b; background: #0f172a;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: #1e293b; border-bottom: 1px solid #334155;">
        <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">
          {hasLatex ? 'Rumus & Notasi Formal' : 'Ringkasan Skema & Aturan'}
        </span>
        <button
          type="button"
          onclick={copyFormula}
          style="background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.14); border-radius: 6px; padding: 3px 9px; font-size: 0.72rem; font-weight: 700; cursor: pointer;"
        >
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      {#if hasLatex}
        <div style="padding: 16px 18px; background: #ffffff; color: #0f172a; font-size: 0.96rem; line-height: 1.65; overflow-x: auto;">
          <MarkdownRenderer content={notation.formulaOrCode} />
        </div>
      {:else}
        <pre style="margin: 0; padding: 16px 18px; color: #f1f5f9; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.88rem; line-height: 1.7; white-space: pre-wrap; word-break: break-word; overflow-x: auto;">{notation.formulaOrCode}</pre>
      {/if}
    </div>
  {/if}

  <!-- 2. Minimal Formalization Takeaway -->
  {#if notation.minimalFormalization}
    <div style="background: var(--ws-accent-soft, #f0fdfa); border-left: 4px solid var(--ws-accent, #0f766e); border-radius: 0 12px 12px 0; padding: 13px 16px;">
      <div style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ws-accent, #0f766e); margin-bottom: 4px;">
        Intisari Praktis
      </div>
      <div style="font-size: 0.92rem; color: var(--ws-accent-ink, #115e59); line-height: 1.6; font-weight: 500;">
        <MarkdownRenderer content={notation.minimalFormalization} />
      </div>
    </div>
  {/if}

  <!-- 3. Terms Deconstruction (Structured Definition Cards) -->
  {#if notation.termsDeconstruction && notation.termsDeconstruction.length > 0}
    <div>
      <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; margin-bottom: 8px;">
        Bedah Simbol & Istilah ({notation.termsDeconstruction.length})
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
        {#each notation.termsDeconstruction as item}
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
            <div>
              <code style="display: inline-block; font-size: 0.82rem; font-weight: 800; color: var(--ws-accent-ink, #115e59); background: var(--ws-accent-soft, #f0fdfa); border: 1px solid var(--ws-accent-border, #99f6e4); padding: 3px 8px; border-radius: 6px; word-break: break-word;">
                {item.symbol}
              </code>
            </div>
            <div style="font-size: 0.86rem; color: #334155; line-height: 1.55;">
              <MarkdownRenderer content={item.physicalMeaning} />
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- 4. Worked Example Card -->
  {#if notation.workedExampleSummary}
    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px 18px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #ffffff; background: var(--ws-accent, #0f766e); padding: 3px 8px; border-radius: 6px;">
          Contoh Penerapan Nyata
        </span>
      </div>
      <div style="font-size: 0.91rem; color: #1e293b; line-height: 1.65;">
        <MarkdownRenderer content={notation.workedExampleSummary} />
      </div>
    </div>
  {/if}
</div>
