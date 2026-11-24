<script lang="ts">
  import {
    exportWorkspaceToMarkdown,
    type Content,
    type Domain,
    type Workspace,
  } from '@flashlearn/shared';
  import { getMonogram } from '../../lib/monogram';
  import CopyMarkdownButton from './CopyMarkdownButton.svelte';

  interface Props {
    workspace: Workspace;
    contents?: Content[];
    domains?: Domain[];
    isOwner: boolean;
    onCreateModule: () => void;
  }

  let { workspace, contents = [], domains = [], isOwner, onCreateModule }: Props = $props();

  function buildWorkspaceExport() {
    const assetOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = exportWorkspaceToMarkdown({
      workspace,
      contents,
      domains,
      assetOrigin,
    });
    const kbLabel =
      res.charCount >= 1000
        ? `${(res.charCount / 1000).toFixed(1)}K kar`
        : `${res.charCount} kar`;
    return {
      markdown: res.markdown,
      metaLabel: `${res.moduleCount} modul · ${kbLabel}`,
      filename: `${workspace.slug || 'workspace'}-full-materi.md`,
    };
  }
</script>

<div
  style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px;"
>
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 14px; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1 1 240px;">
      <div
        class="fl-monogram"
        style="width: 48px; height: 48px; border-radius: 12px; font-size: 1rem;"
        aria-hidden="true"
      >
        {getMonogram(workspace.name, workspace.icon)}
      </div>
      <div style="min-width: 0; flex: 1;">
        <h1 style="margin: 0 0 4px 0; font-size: clamp(1.25rem, 3vw, 1.5rem); color: #0f172a; font-weight: 800; overflow-wrap: break-word; line-height: 1.25;">
          {workspace.name}
        </h1>
        <div style="font-size: 0.825rem; color: #475569;">
          Dikelola oleh <strong style="color: #1e293b;">{workspace.creatorName || 'Creator'}</strong>
        </div>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      {#if contents.length > 0}
        <CopyMarkdownButton
          label="Salin Full Materi (MD)"
          getExport={buildWorkspaceExport}
        />
      {/if}

      {#if isOwner}
        <button
          onclick={onCreateModule}
          class="fl-btn fl-btn-md fl-pill-btn"
          style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
        >
          <span>Buat Modul</span>
        </button>
      {/if}
    </div>
  </div>

  {#if workspace.description}
    <p style="margin: 0; font-size: 0.9rem; line-height: 1.6; color: #475569; overflow-wrap: break-word;">
      {workspace.description}
    </p>
  {/if}
</div>
