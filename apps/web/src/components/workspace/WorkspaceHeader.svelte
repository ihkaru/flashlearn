<script lang="ts">
  import type { Workspace } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    workspace: Workspace;
    isOwner: boolean;
    onCreateModule: () => void;
  }

  let { workspace, isOwner, onCreateModule }: Props = $props();
</script>

<div
  style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.02);"
>
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 14px; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1;">
      <div
        style="width: 52px; height: 52px; border-radius: 14px; background: #f0fdfa; border: 1px solid #ccfbf1; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;"
      >
        {workspace.icon || '📚'}
      </div>
      <div style="min-width: 0; flex: 1;">
        <h1 style="margin: 0 0 4px 0; font-size: 1.55rem; color: #0f172a; font-weight: 800; overflow-wrap: break-word; word-break: break-word; line-height: 1.25;">
          {workspace.name}
        </h1>
        <div style="font-size: 0.825rem; color: #64748b;">
          Dikelola oleh <strong style="color: #334155;">{workspace.creatorName || 'Creator'}</strong>
        </div>
      </div>
    </div>

    {#if isOwner}
      <button
        onclick={onCreateModule}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.875rem; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);"
      >
        <Icon name="plus" size={15} />
        <span>Buat Modul</span>
      </button>
    {/if}
  </div>

  {#if workspace.description}
    <p style="margin: 0; font-size: 0.925rem; line-height: 1.6; color: #475569; overflow-wrap: break-word;">
      {workspace.description}
    </p>
  {/if}
</div>
