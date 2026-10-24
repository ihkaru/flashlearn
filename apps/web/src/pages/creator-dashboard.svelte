<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace } from '@flashlearn/shared';
  import DomainSynthesizerModal from '../components/workspace/DomainSynthesizerModal.svelte';

  interface Props {
    f7router?: any;
  }

  let { f7router }: Props = $props();

  let myWorkspaces = $state<Workspace[]>([]);
  let isLoading = $state(true);

  let showCreateModal = $state(false);
  let showSynthesizerModal = $state(false);
  let name = $state('');
  let description = $state('');
  let icon = $state('📚');
  let isPublic = $state(true);
  let isCreating = $state(false);

  $effect(() => {
    if (auth.isLoggedIn) {
      loadMyWorkspaces();
    }
  });

  async function loadMyWorkspaces() {
    isLoading = true;
    try {
      myWorkspaces = await api.workspaces.list('mine');
    } catch (err: any) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function handleCreateWorkspace(e: Event) {
    e.preventDefault();
    if (!name.trim()) return;

    isCreating = true;
    try {
      const ws = await api.workspaces.create({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || '📚',
        isPublic,
      });

      showCreateModal = false;
      name = '';
      description = '';
      await loadMyWorkspaces();

      if (f7router) {
        f7router.navigate(`/workspace/${ws.id}`);
      }
    } catch (err: any) {
      alert(`Gagal membuat workspace: ${err.message}`);
    } finally {
      isCreating = false;
    }
  }
</script>

<Page name="creator">
<div class="creator-dashboard" style="max-width: 900px; margin: 0 auto; padding: 24px 16px;">
  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
    <div>
      <h1 style="margin: 0 0 6px 0; font-size: 1.7rem; font-weight: 800; color: #0f172a;">
        🛠️ Creator Studio
      </h1>
      <p style="margin: 0; color: #64748b; font-size: 0.95rem;">
        Kelola workspace, terbitkan modul pembelajaran, dan pantau materi kuis milikmu.
      </p>
    </div>

    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
      <button
        onclick={() => (showSynthesizerModal = true)}
        style="background: #0f766e; color: #ffffff; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);"
      >
        🤖 Sintesis Domain SOP
      </button>
      <button
        onclick={() => auth.openApiKeyModal()}
        style="background: #ffffff; color: #0f766e; border: 1.5px solid #0f766e; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.03);"
      >
        🔑 API Key AI
      </button>
      <button
        onclick={() => (showCreateModal = true)}
        style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1; padding: 11px 18px; border-radius: 12px; font-weight: 700; cursor: pointer;"
      >
        + Workspace Manual
      </button>
    </div>
  </div>

  {#if !auth.isLoggedIn}
    <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 48px; text-align: center;">
      <h3>Silakan Masuk Terlebih Dahulu</h3>
      <p style="color: #64748b;">Gunakan tombol login Google di kanan atas untuk masuk sebagai Creator.</p>
    </div>
  {:else if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8;">
      Memuat daftar workspace milikmu...
    </div>
  {:else if myWorkspaces.length === 0}
    <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 20px; padding: 48px 24px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 12px;">📁</div>
      <h3 style="margin: 0 0 8px 0; color: #0f172a;">Belum Ada Workspace</h3>
      <p style="color: #64748b; margin: 0 0 20px 0; font-size: 0.95rem;">
        Buat ruang kerja (workspace) pertamamu untuk mulai menyusun materi, kuis, atau modul gabungan.
      </p>
      <button
        onclick={() => (showCreateModal = true)}
        style="background: #0f766e; color: #ffffff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;"
      >
        Buat Workspace Sekarang
      </button>
    </div>
  {:else}
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px;">
      {#each myWorkspaces as ws}
        <div
          onclick={() => f7router?.navigate(`/workspace/${ws.id}`)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && f7router?.navigate(`/workspace/${ws.id}`)}
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 6px rgba(0,0,0,0.03);"
        >
          <div>
            <div style="font-size: 2rem; margin-bottom: 8px;">{ws.icon || '📚'}</div>
            <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; color: #0f172a; font-weight: 700;">
              {ws.name}
            </h3>
            {#if ws.description}
              <p style="color: #64748b; font-size: 0.875rem; margin: 0 0 12px 0; line-height: 1.4;">
                {ws.description}
              </p>
            {/if}
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: {ws.isPublic ? '#16a34a' : '#94a3b8'};">
              {ws.isPublic ? '🌐 Publik' : '🔒 Privat'}
            </span>
            <span style="color: #0f766e; font-size: 0.85rem; font-weight: 700;">
              Buka Studio →
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal Buat Workspace -->
{#if showCreateModal}
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px;"
    onclick={() => (showCreateModal = false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && (showCreateModal = false)}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 520px; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #0f172a;">
          🏛️ Buat Workspace Baru
        </h2>
        <button
          onclick={() => (showCreateModal = false)}
          style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;"
        >
          ✕
        </button>
      </div>

      <form onsubmit={handleCreateWorkspace} style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Ikon / Emoji
          </label>
          <input
            type="text"
            maxlength="4"
            bind:value={icon}
            style="width: 80px; text-align: center; font-size: 1.5rem; padding: 6px; border: 1px solid #cbd5e1; border-radius: 8px;"
          />
        </div>

        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Nama Workspace
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Belajar Svelte 5 & Bun..."
            bind:value={name}
            style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;"
          />
        </div>

        <div>
          <label style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Deskripsi Workspace
          </label>
          <textarea
            rows="3"
            placeholder="Jelaskan tujuan dan kurikulum pembelajaran di workspace ini..."
            bind:value={description}
            style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; font-family: inherit;"
          ></textarea>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="isPublic" bind:checked={isPublic} />
          <label for="isPublic" style="font-size: 0.9rem; color: #334155; font-weight: 600; cursor: pointer;">
            Jadikan Publik (Dapat diakses oleh Guest tanpa login)
          </label>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 10px;">
          <button
            type="button"
            onclick={() => (showCreateModal = false)}
            style="background: #f1f5f9; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isCreating}
            style="background: #0f766e; color: #ffffff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer;"
          >
            {isCreating ? 'Membuat...' : 'Buat Sekarang'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<DomainSynthesizerModal
  isOpen={showSynthesizerModal}
  onClose={() => (showSynthesizerModal = false)}
  onSynthesized={async (newWsId) => {
    await loadMyWorkspaces();
    if (f7router) {
      f7router.navigate(`/workspace/${newWsId}`);
    } else {
      window.location.hash = `/workspace/${newWsId}`;
    }
  }}
/>
</Page>
