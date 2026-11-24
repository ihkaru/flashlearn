<script lang="ts">
  import { learningFeedback } from '../../lib/learningFeedback.svelte';

  let toast = $derived(learningFeedback.activeToast);
</script>

{#if toast}
  {#key toast.id}
    <div
      class="fl-milestone-host"
      role="status"
      aria-live="polite"
    >
      <div
        class="fl-milestone-pill fl-milestone-pop"
        class:fl-milestone-major={toast.tier === 'milestone'}
        class:fl-milestone-redemption={toast.tier === 'redemption'}
      >
        <span class="fl-milestone-dot" aria-hidden="true"></span>
        <div style="min-width: 0;">
          <div style="font-size: 0.88rem; font-weight: 800; line-height: 1.2;">
            {toast.title}
          </div>
          <div style="font-size: 0.76rem; opacity: 0.9; line-height: 1.25; margin-top: 1px;">
            {toast.subtitle}
          </div>
        </div>
      </div>
    </div>
  {/key}
{/if}

<style>
  .fl-milestone-host {
    position: fixed;
    top: 66px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 60;
    pointer-events: none;
    max-width: calc(100vw - 24px);
  }

  .fl-milestone-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 14px;
    background: var(--ws-accent-soft, #f0fdfa);
    border: 1.5px solid var(--ws-accent-border, #99f6e4);
    color: var(--ws-accent-ink, #115e59);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  }

  .fl-milestone-major {
    background: var(--ws-accent, #0f766e);
    border-color: var(--ws-accent, #0f766e);
    color: #ffffff;
  }

  .fl-milestone-redemption {
    background: #ecfdf5;
    border-color: #6ee7b7;
    color: #065f46;
  }

  .fl-milestone-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
</style>
