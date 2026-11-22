<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace } from '@flashlearn/shared';
  import { getMonogram } from '../lib/monogram';
  import DomainSynthesizerModal from '../components/workspace/DomainSynthesizerModal.svelte';
  import Icon from '../components/ui/Icon.svelte';

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
  let icon = $state('');
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
        icon: getMonogram(name.trim(), icon.trim()),
        isPublic,
      });

      showCreateModal = false;
      name = '';
      description = '';
      icon = '';
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
  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 24px;">
    <div style="min-width: 0; flex: 1 1 260px;">
      <h1 style="margin: 0 0 6px 0; font-size: clamp(1.35rem, 3vw, 1.65rem); font-weight: 800; color: #0f172a;">
        Studio Kreator
      </h1>
      <p style="margin: 0; color: #475569; font-size: 0.92rem;">
        Kelola workspace, terbitkan modul pembelajaran, dan pantau materi kuis milikmu.
      </p>
    </div>

    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
      <button
        onclick={() => (showSynthesizerModal = true)}
        class="fl-btn fl-btn-md"
        style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
      >
        Impor Blueprint
      </button>
      <button
        onclick={() => auth.openApiKeyModal()}
        class="fl-btn fl-btn-md"
        style="background: #ffffff; color: #0f766e; border: 1px solid #0f766e; font-weight: 700;"
      >
        API Key
      </button>
      <button
        onclick={() => (showCreateModal = true)}
        class="fl-btn fl-btn-md"
        style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1; font-weight: 700;"
      >
        Workspace Baru
      </button>
    </div>
  </div>

  {#if !auth.isLoggedIn}
    <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 40px 20px; text-align: center;">
      <h3 style="margin: 0 0 8px 0; color: #0f172a;">Silakan Masuk Terlebih Dahulu</h3>
      <p style="color: #475569; margin: 0;">Gunakan tombol login di pojok kanan atas untuk mengakses Studio Kreator.</p>
    </div>
  {:else if isLoading}
    <div style="text-align: center; padding: 48px; color: #475569;">
      Memuat daftar workspace milikmu...
    </div>
  {:else if myWorkspaces.length === 0}
    <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 40px 24px; text-align: center;">
      <h3 style="margin: 0 0 8px 0; color: #0f172a;">Belum Ada Workspace</h3>
      <p style="color: #475569; margin: 0 0 20px 0; font-size: 0.94rem;">
        Buat workspace pertamamu untuk mulai menyusun materi, kuis, atau modul gabungan.
      </p>
      <button
        onclick={() => (showCreateModal = true)}
        class="fl-btn fl-btn-lg"
        style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
      >
        Buat Workspace Sekarang
      </button>
    </div>
  {:else}
    <div class="fl-grid-cards">
      {#each myWorkspaces as ws}
        <div
          class="fl-card-hover"
          onclick={() => f7router?.navigate(`/workspace/${ws.id}`)}
          role="button"
          tabindex="0"
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && f7router?.navigate(`/workspace/${ws.id}`)}
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;"
        >
          <div>
            <span
              class="fl-monogram"
              style="width: 40px; height: 40px; border-radius: 10px; font-size: 0.9rem; margin-bottom: 12px;"
              aria-hidden="true"
            >
              {getMonogram(ws.name, ws.icon)}
            </span>
            <h3 style="margin: 0 0 6px 0; font-size: 1.08rem; color: #0f172a; font-weight: 700; overflow-wrap: break-word;">
              {ws.name}
            </h3>
            {#if ws.description}
              <p style="color: #475569; font-size: 0.86rem; margin: 0 0 14px 0; line-height: 1.45; overflow-wrap: break-word;">
                {ws.description}
              </p>
            {/if}
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span style="font-size: 0.78rem; font-weight: 700; color: {ws.isPublic ? '#15803d' : '#475569'};">
              {ws.isPublic ? 'Publik' : 'Privat'}
            </span>
            <span style="color: #0f766e; font-size: 0.85rem; font-weight: 700; white-space: nowrap;">
              Buka Studio
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
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && (showCreateModal = false)}
  >
    <div
      style="background: #ffffff; width: 100%; max-width: 520px; border-radius: 18px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2);"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
          Buat Workspace Baru
        </h2>
        <button
          type="button"
          onclick={() => (showCreateModal = false)}
          aria-label="Tutup modal"
          style="background: #f1f5f9; border: none; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #475569;"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <form onsubmit={handleCreateWorkspace} style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label for="ws-code" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Kode Singkat (Opsional, 2-3 huruf)
          </label>
          <input
            id="ws-code"
            type="text"
            maxlength="3"
            placeholder="FL"
            bind:value={icon}
            style="width: 96px; text-align: center; font-weight: 700; text-transform: uppercase; font-size: 0.95rem; padding: 8px; border: 1px solid #cbd5e1; border-radius: 8px;"
          />
        </div>

        <div>
          <label for="ws-name" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Nama Workspace
          </label>
          <input
            id="ws-name"
            type="text"
            required
            placeholder="Contoh: Arsitektur Sistem Terdistribusi"
            bind:value={name}
            style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem;"
          />
        </div>

        <div>
          <label for="ws-desc" style="display: block; font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
            Deskripsi Workspace
          </label>
          <textarea
            id="ws-desc"
            rows="3"
            placeholder="Jelaskan tujuan dan kurikulum pembelajaran di workspace ini..."
            bind:value={description}
            style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; font-family: inherit;"
          ></textarea>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="isPublic" bind:checked={isPublic} />
          <label for="isPublic" style="font-size: 0.88rem; color: #334155; font-weight: 600;">
            Jadikan Publik (Dapat diakses tanpa login)
          </label>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px;">
          <button
            type="button"
            onclick={() => (showCreateModal = false)}
            class="fl-btn fl-btn-md"
            style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155;"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isCreating}
            class="fl-btn fl-btn-md"
            style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
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
