<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace } from '@flashlearn/shared';
  import Icon from '../components/ui/Icon.svelte';

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
  <div style="background: #ffffff; border: 1px solid #fee2e2; border-left: 6px solid #b91c1c; border-radius: 16px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 0.8rem; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
          🛡️ Superadmin Control Center
        </div>
        <h1 style="margin: 0 0 6px 0; font-size: 1.6rem; color: #0f172a; font-weight: 800;">
          Universal Workspace Governance
        </h1>
        <p style="margin: 0; color: #64748b; font-size: 0.95rem;">
          Kamu memiliki akses membaca, mengubah, dan menghapus seluruh workspace & konten di seluruh sistem.
        </p>
      </div>

      <a
        href="http://localhost:3001/docs"
        target="_blank"
        rel="noreferrer"
        style="background: #0f172a; color: #38bdf8; text-decoration: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;"
      >
        📖 Scalar API Playground ↗
      </a>
    </div>
  </div>

  {#if !auth.isSuperadmin}
    <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 16px; padding: 40px; text-align: center; color: #991b1b;">
      <h3>Akses Ditolak</h3>
      <p>Halaman ini hanya dapat diakses oleh akun dengan role Superadmin.</p>
    </div>
  {:else if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8;">
      Mengambil seluruh data workspace global...
    </div>
  {:else}
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
      <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; align-items: center;">
        <span>Semua Workspace Terdaftar ({allWorkspaces.length})</span>
        <button onclick={loadAll} class="fl-btn fl-btn-sm" style="background: none; border: none; color: #0f766e; font-weight: 700;">
          <Icon name="refresh" size={13} />
          <span>Refresh</span>
        </button>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; text-transform: uppercase;">
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
                  <span style="margin-right: 8px;">{ws.icon || '📚'}</span>
                  {ws.name}
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
