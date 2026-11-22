<script lang="ts">
  import type { StateMachineSandboxConfig } from '@flashlearn/shared';

  interface Props {
    config: StateMachineSandboxConfig;
    onAhaReached: () => void;
  }

  let { config, onAhaReached }: Props = $props();

  let currentStateId = $state(config.initialStateId);
  let lastMessage = $state('Pilih salah satu aksi di bawah untuk mencoba langsung.');
  let triggeredActions = $state<string[]>([]);
  let ahaSent = $state(false);

  const currentState = $derived(
    config.states.find((s) => s.id === currentStateId) || config.states[0]
  );

  const toneColors: Record<string, { bg: string; border: string; text: string }> = {
    neutral: { bg: '#f8fafc', border: '#cbd5e1', text: '#0f172a' },
    locked: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
    open: { bg: '#f0fdfa', border: '#99f6e4', text: '#115e59' },
    warning: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239' },
  };

  const activeTone = $derived(toneColors[currentState?.tone || 'neutral'] || toneColors.neutral);

  function triggerAction(actionId: string) {
    const action = config.actions.find((a) => a.id === actionId);
    if (!action) return;

    currentStateId = action.toState;
    lastMessage = action.resultMessage;

    if (!triggeredActions.includes(action.id)) {
      triggeredActions = [...triggeredActions, action.id];
    }

    const req = config.requiredActionIdsForAha || [];
    const reqMet = req.length > 0 && req.every((id) => triggeredActions.includes(id));
    if (!ahaSent && (action.triggersAha || reqMet || (req.length === 0 && triggeredActions.length >= 2))) {
      ahaSent = true;
      onAhaReached();
    }
  }

  function resetLab() {
    currentStateId = config.initialStateId;
    lastMessage = 'Simulasi diatur ulang. Silakan coba lagi.';
  }
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <div
    style="border-radius: 12px; padding: 16px; border: 1.5px solid {activeTone.border}; background: {activeTone.bg}; transition: background 0.2s ease, border-color 0.2s ease;"
  >
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px;">
      <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: {activeTone.text};">
        Kondisi Saat Ini
      </span>
      <button
        type="button"
        onclick={resetLab}
        style="background: transparent; border: none; color: #475569; font-size: 0.78rem; font-weight: 600; padding: 4px 8px; cursor: pointer;"
      >
        Ulang
      </button>
    </div>
    <div style="font-size: 1.05rem; font-weight: 800; color: {activeTone.text}; margin-bottom: 4px;">
      {currentState?.label}
    </div>
    <p style="margin: 0; font-size: 0.88rem; color: #334155; line-height: 1.5;">
      {currentState?.description}
    </p>
  </div>

  <div style="font-size: 0.88rem; color: #0f172a; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; line-height: 1.5;">
    {lastMessage}
  </div>

  <div style="display: flex; flex-direction: column; gap: 8px;">
    {#each config.actions as action (action.id)}
      {@const allowed = action.fromStates.includes(currentStateId)}
      <button
        type="button"
        disabled={!allowed}
        onclick={() => triggerAction(action.id)}
        class="fl-btn-wrap"
        style="width: 100%; min-height: 48px; padding: 11px 14px; border-radius: 10px; border: 1.5px solid {allowed ? '#0f766e' : '#e2e8f0'}; background: {allowed ? '#ffffff' : '#f8fafc'}; color: {allowed ? '#0f172a' : '#94a3b8'}; display: flex; justify-content: space-between; align-items: center; gap: 10px; text-align: left;"
      >
        <span style="font-weight: 700; font-size: 0.9rem;">{action.label}</span>
        <span style="font-size: 0.75rem; font-weight: 600; color: {allowed ? '#0f766e' : '#94a3b8'}; background: {allowed ? '#f0fdfa' : '#f1f5f9'}; padding: 3px 8px; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">
          {action.actor}
        </span>
      </button>
    {/each}
  </div>
</div>
