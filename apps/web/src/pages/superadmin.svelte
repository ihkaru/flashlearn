<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace } from '@flashlearn/shared';
  import { getMonogram } from '../lib/monogram';

  interface Props {
    f7router?: any;
  }

  let { f7router }: Props = $props();

  let allWorkspaces = $state<Workspace[]>([]);
  let isLoading = $state(true);

  $effect(() => {
    if (auth.isSuperadmin) {
      loadAll();
    }
  });

  async function loadAll() {
    isLoading = true;
    try {
      allWorkspaces = await api.workspaces.list('all');
    } catch (err: any) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteWorkspace(ws: Workspace) {
    if (!confirm(`Yakin ingin MENGHAPUS workspace "${ws.name}" milik ${ws.creatorEmail}? Aksi ini bersifat permanen!`)) {
      return;
    }

    try {
      await api.workspaces.delete(ws.id);
      await loadAll();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  }
</script>

<Page name="superadmin">
<div class="superadmin-panel" style="max-width: 960px; margin: 0 auto; padding: 24px 16px;">
  <!-- Header -->
  <div style="background: #ffffff; border: 1px solid #fecaca; border-left: 5px solid #b91c1c; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap;">
      <div style="min-width: 0; flex: 1 1 260px;">
        <div style="font-size: 0.78rem; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
          Superadmin Control Center
        </div>
        <h1 style="margin: 0 0 6px 0; font-size: clamp(1.3rem, 3vw, 1.55rem); color: #0f172a; font-weight: 800;">
          Universal Workspace Governance
        </h1>
        <p style="margin: 0; color: #475569; font-size: 0.92rem;">
          Akses membaca, mengubah, dan menghapus seluruh workspace dan konten di seluruh sistem.
        </p>
      </div>

      <a
        href="/docs"
        target="_blank"
        rel="noreferrer"
        style="background: #0f172a; color: #f8fafc; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; white-space: nowrap; flex-shrink: 0;"
      >
        API Playground
      </a>
    </div>
  </div>

  {#if !auth.isSuperadmin}
    <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 14px; padding: 36px 20px; text-align: center; color: #991b1b;">
      <h3 style="margin: 0 0 8px 0;">Akses Ditolak</h3>
      <p style="margin: 0;">Halaman ini hanya dapat diakses oleh akun dengan role Superadmin.</p>
    </div>
  {:else if isLoading}
    <div style="text-align: center; padding: 48px; color: #475569;">
      Mengambil seluruh data workspace global...
    </div>
  {:else}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
      <div style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <span>Semua Workspace Terdaftar ({allWorkspaces.length})</span>
        <button onclick={loadAll} class="fl-btn fl-btn-sm" style="background: #f8fafc; border: 1px solid #e2e8f0; color: #0f766e; font-weight: 700;">
          Segarkan
        </button>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 0.78rem; text-transform: uppercase;">
              <th style="padding: 12px 20px;">Workspace</th>
              <th style="padding: 12px 20px;">Kreator</th>
              <th style="padding: 12px 20px;">Visibilitas</th>
              <th style="padding: 12px 20px;">Tanggal Dibuat</th>
              <th style="padding: 12px 20px; text-align: right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each allWorkspaces as ws}
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 14px 20px; font-weight: 700; color: #0f172a;">
                  <span style="display: inline-flex; align-items: center; gap: 10px;">
                    <span class="fl-monogram" style="width: 28px; height: 28px; border-radius: 6px; font-size: 0.72rem;" aria-hidden="true">
                      {getMonogram(ws.name, ws.icon)}
                    </span>
                    <span>{ws.name}</span>
                  </span>
                </td>
                <td style="padding: 14px 20px; color: #475569;">
                  <div>{ws.creatorName || 'Unknown'}</div>
                  <div style="font-size: 0.75rem; color: #94a3b8;">{ws.creatorEmail}</div>
                </td>
                <td style="padding: 14px 20px;">
                  <span
                    style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: {ws.isPublic ? '#dcfce7' : '#f1f5f9'}; color: {ws.isPublic ? '#166534' : '#475569'};"
                  >
                    {ws.isPublic ? 'Publik' : 'Privat'}
                  </span>
                </td>
                <td style="padding: 14px 20px; color: #64748b; font-size: 0.85rem;">
                  {new Date(ws.createdAt).toLocaleDateString()}
                </td>
                <td style="padding: 14px 20px; text-align: right;">
                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button
                      onclick={() => f7router?.navigate(`/workspace/${ws.id}`)}
                      class="fl-btn fl-btn-sm"
                      style="background: #f1f5f9; border: none; font-weight: 700; color: #0f766e;"
                    >
                      Buka
                    </button>
                    <button
                      onclick={() => handleDeleteWorkspace(ws)}
                      class="fl-btn fl-btn-sm"
                      style="background: #fee2e2; border: 1px solid #fca5a5; font-weight: 700; color: #b91c1c;"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
</Page>
