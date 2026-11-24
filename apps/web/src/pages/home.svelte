<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace } from '@flashlearn/shared';
  import type { ResumableSessionSummary } from '../stores/api/contents';
  import { getMonogram } from '../lib/monogram';
  import { getWorkspaceTheme } from '../lib/workspaceTheme';
  import Icon from '../components/ui/Icon.svelte';
  import ChipBadge from '../components/ui/ChipBadge.svelte';
  import ResumeLearningStrip from '../components/workspace/ResumeLearningStrip.svelte';

  interface Props {
    f7router?: any;
  }

  let { f7router }: Props = $props();

  let workspaces = $state<Workspace[]>([]);
  let recentSessions = $state<ResumableSessionSummary[]>([]);
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);
  let searchQuery = $state('');
  let isHeroFlipped = $state(false);
  let searchInputEl = $state<HTMLInputElement | null>(null);

  $effect(() => {
    const _t = auth.token;
    loadWorkspaces();
  });

  $effect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputEl &&
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputEl?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  async function loadWorkspaces() {
    isLoading = true;
    loadError = null;
    try {
      const [wsList, recent] = await Promise.all([
        api.workspaces.list('public'),
        api.contents.listRecentResumable(4).catch(() => []),
      ]);
      workspaces = wsList;
      recentSessions = Array.isArray(recent) ? recent : [];
    } catch (err: any) {
      loadError = err?.message || 'Gagal memuat daftar workspace.';
    } finally {
      isLoading = false;
    }
  }

  let filteredWorkspaces = $derived(
    workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  function navigateToWorkspace(ws: Workspace) {
    if (f7router) {
      f7router.navigate(`/workspace/${ws.id}`);
    } else {
      window.location.hash = `/workspace/${ws.id}`;
    }
  }

  function navigateToContent(contentId: string) {
    if (f7router) {
      f7router.navigate(`/content/${contentId}`);
    } else {
      window.location.hash = `/content/${contentId}`;
    }
  }

  function toggleHeroCard() {
    isHeroFlipped = !isHeroFlipped;
  }
</script>

<Page name="home">
  <div class="home-page" style="max-width: 1040px; margin: 0 auto; padding: 24px 16px 48px;">
    <!-- Focused Hero Section -->
    <section
      aria-label="FlashLearn Hero"
      style="background: linear-gradient(135deg, #09473f 0%, #0f766e 60%, #115e59 100%); border-radius: 20px; padding: clamp(22px, 4vw, 36px); color: #ffffff; margin-bottom: 32px;"
    >
      <div style="display: flex; flex-wrap: wrap; gap: 28px; align-items: center; justify-content: space-between;">
        <!-- Left Column: Copy & Search -->
        <div style="flex: 1 1 420px; min-width: 0;">
          <h1 style="font-size: clamp(1.6rem, 3.6vw, 2.25rem); font-weight: 800; margin: 0 0 12px 0; line-height: 1.2; letter-spacing: -0.025em; color: #ffffff;">
            Kuasai Kompetensi Lewat Materi, Kuis, &amp; Active Recall
          </h1>
          <p style="font-size: 0.95rem; line-height: 1.6; color: #ccfbf1; margin: 0 0 22px 0; max-width: 520px;">
            Pilih topik yang ingin dipelajari, ikuti arahan langkah demi langkah di layar, dan lanjutkan kapan saja dari posisi terakhir.
          </p>

          <!-- Search Bar -->
          <div class="fl-search-container" style="max-width: 480px;">
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #475569; display: flex; align-items: center; pointer-events: none; z-index: 2;">
              <Icon name="search" size={17} />
            </span>
            <input
              bind:this={searchInputEl}
              type="text"
              class="fl-search-input"
              placeholder="Cari workspace atau topik..."
              bind:value={searchQuery}
              aria-label="Cari workspace atau materi"
            />
            {#if searchQuery}
              <button
                type="button"
                onclick={() => (searchQuery = '')}
                style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 0; width: 32px; height: 32px; border-radius: 6px; color: #475569; z-index: 2; display: flex; align-items: center; justify-content: center;"
                aria-label="Hapus pencarian"
              >
                <Icon name="xmark" size={16} />
              </button>
            {:else}
              <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; z-index: 2;">
                <span class="fl-kbd-badge">/</span>
              </span>
            {/if}
          </div>
        </div>

        <!-- Right Column: Calm Interactive 3D Recall Sample -->
        <div style="flex: 0 1 310px; width: 100%; max-width: 310px; margin: 0 auto;">
          <div
            class="flashcard-scene"
            style="height: 196px; max-width: 310px;"
            onclick={toggleHeroCard}
            role="button"
            tabindex="0"
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleHeroCard()}
            aria-label="Contoh kartu latihan active recall, tekan untuk membalik"
          >
            <div class="flashcard-card" class:flipped={isHeroFlipped}>
              <div class="flashcard-face flashcard-front" style="padding: 18px;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                  <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #0f766e; letter-spacing: 0.04em;">
                    Contoh Kartu Recall
                  </span>
                  <span style="font-size: 0.75rem; color: #64748b;">Ketuk untuk balik</span>
                </div>

                <p style="margin: auto 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; line-height: 1.4; text-align: left;">
                  Mengapa latihan memanggil ingatan aktif lebih efektif daripada membaca ulang catatan?
                </p>

                <div style="font-size: 0.78rem; color: #0f766e; font-weight: 600; text-align: left;">
                  Lihat ringkasan mekanisme
                </div>
              </div>

              <div class="flashcard-face flashcard-back" style="padding: 18px; border-color: #99f6e4;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                  <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: #15803d; letter-spacing: 0.04em;">
                    Ringkasan
                  </span>
                  <span style="font-size: 0.75rem; color: #0f766e;">Ketuk untuk balik</span>
                </div>

                <p style="margin: auto 0; font-size: 0.85rem; color: #1e293b; line-height: 1.5; text-align: left;">
                  Menguji diri sendiri memaksa otak merekonstruksi jalur memori dan segera menyingkap celah pemahaman yang tidak terlihat saat membaca pasif.
                </p>

                <div style="font-size: 0.75rem; color: #475569; text-align: right;">
                  FlashLearn
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Resumable Learning Sessions (Shown Only When Learner Has Saved Progress) -->
    <ResumeLearningStrip sessions={recentSessions} onOpenContent={navigateToContent} />

    <!-- Workspace List Header -->
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
      <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a;">
        Workspace Pembelajaran Publik
      </h2>
      <span style="font-size: 0.85rem; color: #475569; font-weight: 600;">
        {filteredWorkspaces.length} tersedia
      </span>
    </div>

    <!-- Workspaces Grid -->
    {#if isLoading}
      <div style="text-align: center; padding: 48px 16px; color: #475569; font-weight: 500;">
        Memuat daftar workspace publik...
      </div>
    {:else if loadError}
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 28px 20px; text-align: center;">
        <p style="color: #991b1b; margin: 0 0 12px 0; font-weight: 600;">{loadError}</p>
        <button
          type="button"
          onclick={loadWorkspaces}
          class="fl-btn fl-btn-sm"
          style="background: #ffffff; border: 1px solid #fecaca; color: #991b1b;"
        >
          Muat Ulang
        </button>
      </div>
    {:else if filteredWorkspaces.length === 0}
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 40px 20px; text-align: center;">
        <p style="color: #475569; margin: 0 0 12px 0; font-weight: 500;">
          {searchQuery
            ? `Tidak ada workspace yang cocok dengan "${searchQuery}".`
            : 'Belum ada workspace publik yang diterbitkan.'}
        </p>
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = '')}
            class="fl-btn fl-btn-sm"
            style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;"
          >
            Reset Pencarian
          </button>
        {/if}
      </div>
    {:else}
      <div class="fl-grid-cards">
        {#each filteredWorkspaces as ws}
          {@const wsTheme = getWorkspaceTheme(ws.slug || ws.id)}
          <div
            class="fl-card-hover"
            onclick={() => navigateToWorkspace(ws)}
            role="button"
            tabindex="0"
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateToWorkspace(ws)}
            style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;"
          >
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 8px;">
                <span
                  class="fl-monogram"
                  style="width: 40px; height: 40px; border-radius: 10px; font-size: 0.9rem; background: {wsTheme.soft}; color: {wsTheme.accent}; border: 1px solid {wsTheme.border};"
                  aria-hidden="true"
                >
                  {getMonogram(ws.name, ws.icon)}
                </span>
                <ChipBadge variant="neutral" label="Publik" />
              </div>

              <h3 style="margin: 0 0 8px 0; font-size: 1.08rem; color: #0f172a; font-weight: 700; overflow-wrap: break-word; line-height: 1.35;">
                {ws.name}
              </h3>

              {#if ws.description}
                <p style="margin: 0 0 16px 0; font-size: 0.86rem; color: #475569; line-height: 1.5; overflow-wrap: break-word;">
                  {ws.description}
                </p>
              {/if}
            </div>

            <div
              style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 0.82rem; color: #475569; gap: 8px;"
            >
              <span class="fl-truncate">{ws.creatorName || 'FlashLearn'}</span>
              <span style="color: {wsTheme.accent}; font-weight: 700; white-space: nowrap; flex-shrink: 0;">
                Buka Workspace
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Page>
