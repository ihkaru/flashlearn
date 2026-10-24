<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace } from '@flashlearn/shared';
  import Icon from '../components/ui/Icon.svelte';
  import ChipBadge from '../components/ui/ChipBadge.svelte';

  interface Props {
    f7router?: any;
  }

  let { f7router }: Props = $props();

  let workspaces = $state<Workspace[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state('');
  let isHeroFlipped = $state(false);
  let searchInputEl = $state<HTMLInputElement | null>(null);

  $effect(() => {
    // Re-fetch workspaces when auth token changes
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
    try {
      workspaces = await api.workspaces.list('public');
    } catch (err: any) {
      console.error('Failed to load workspaces:', err);
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

  function toggleHeroCard() {
    isHeroFlipped = !isHeroFlipped;
  }
</script>

<Page name="home">
  <div class="home-page" style="max-width: 1040px; margin: 0 auto; padding: 24px 16px;">
    <!-- Hero Section with Ambient Mesh & Interactive 3D Teaser -->
    <section
      aria-label="FlashLearn Hero"
      style="background: radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.28) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(13, 148, 136, 0.35) 0%, transparent 45%), linear-gradient(135deg, #09473f 0%, #0f766e 55%, #115e59 100%); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; padding: 36px 30px; color: #ffffff; margin-bottom: 24px; box-shadow: 0 16px 36px -10px rgba(15, 118, 110, 0.35);"
    >
      <div style="display: flex; flex-wrap: wrap; gap: 32px; align-items: center; justify-content: space-between;">
        <!-- Left Column: Copy & Search -->
        <div style="flex: 1 1 480px; min-width: 280px;">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;">
            <span
              style="background: rgba(255, 255, 255, 0.16); backdrop-filter: blur(8px); padding: 5px 12px; border-radius: 9999px; font-size: 0.775rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.2);"
            >
              <span class="fl-pulse-dot"></span>
              <span>Active Recall Engine</span>
            </span>
            <span style="font-size: 0.825rem; color: #ccfbf1; font-weight: 500; display: inline-flex; align-items: center; gap: 5px;">
              <Icon name="bolt" size={13} strokeWidth={2.4} />
              <span>Akses Tamu Tanpa Akun</span>
            </span>
          </div>

          <h1 style="font-size: clamp(1.85rem, 3.8vw, 2.35rem); font-weight: 800; margin: 0 0 14px 0; line-height: 1.25; letter-spacing: -0.025em; color: #ffffff;">
            Kuasai Materi Lebih Cepat dengan Kuis & 3D Flashcards
          </h1>
          <p style="font-size: 0.975rem; line-height: 1.6; color: #e6fffa; margin: 0 0 24px 0; max-width: 540px;">
            Pilih materi atau kuis dari workspace publik di bawah. Uji pemahaman dengan asesmen berbobot dan perkuat retensi ingatan lewat konversi otomatis kartu flip 3D.
          </p>

          <!-- Interactive Search Bar -->
          <div class="fl-search-container" style="max-width: 500px; position: relative;">
            <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; display: flex; align-items: center; pointer-events: none; z-index: 2;">
              <Icon name="search" size={18} />
            </span>
            <input
              bind:this={searchInputEl}
              type="text"
              class="fl-search-input"
              placeholder="Cari workspace, materi, atau kuis..."
              bind:value={searchQuery}
              aria-label="Cari workspace atau materi"
            />
            {#if searchQuery}
              <button
                type="button"
                onclick={() => (searchQuery = '')}
                class="fl-btn"
                style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; padding: 0; width: 28px; height: 28px; min-height: 28px; border-radius: 6px; color: #94a3b8; z-index: 2;"
                aria-label="Hapus pencarian"
              >
                <Icon name="xmark" size={16} />
              </button>
            {:else}
              <span style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; z-index: 2;">
                <span class="fl-kbd-badge">/</span>
              </span>
            {/if}
          </div>
        </div>

        <!-- Right Column: Interactive 3D Flashcard Hero Teaser -->
        <div style="flex: 0 1 320px; width: 100%; max-width: 320px; margin: 0 auto;">
          <div
            class="flashcard-scene"
            style="height: 200px; max-width: 320px;"
            onclick={toggleHeroCard}
            role="button"
            tabindex="0"
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleHeroCard()}
            title="Klik untuk membalik kartu 3D"
          >
            <div class="flashcard-card fl-hero-float" class:flipped={isHeroFlipped}>
              <!-- Front Face -->
              <div
                class="flashcard-face flashcard-front"
                style="padding: 18px 20px; border: 1.5px solid rgba(255,255,255,0.85); box-shadow: 0 12px 28px -6px rgba(0,0,0,0.2);"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span
                    style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #0f766e; background: #ccfbf1; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.04em; display: inline-flex; align-items: center; gap: 4px;"
                  >
                    <Icon name="sparkles" size={11} />
                    <span>Demo 3D Flip</span>
                  </span>
                  <span style="font-size: 0.725rem; color: #94a3b8; display: inline-flex; align-items: center; gap: 3px;">
                    <Icon name="arrow-path" size={11} />
                    <span>Klik balik</span>
                  </span>
                </div>

                <div style="margin: auto 0; text-align: left;">
                  <p style="font-size: 0.725rem; font-weight: 600; color: #64748b; margin: 0 0 6px 0; text-transform: uppercase;">
                    Pertanyaan Recall
                  </p>
                  <h4 style="margin: 0; font-size: 0.975rem; font-weight: 700; color: #0f172a; line-height: 1.35;">
                    Berapa persen peningkatan retensi ingatan metode Active Recall vs membaca pasif?
                  </h4>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #0f766e; font-weight: 600;">
                  <span>Klik untuk cek jawaban</span>
                  <Icon name="chevron-right" size={13} />
                </div>
              </div>

              <!-- Back Face -->
              <div
                class="flashcard-face flashcard-back"
                style="padding: 18px 20px; border: 1.5px solid rgba(15, 118, 110, 0.25); box-shadow: 0 12px 28px -6px rgba(15, 118, 110, 0.25);"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span
                    style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.04em; display: inline-flex; align-items: center; gap: 4px;"
                  >
                    <Icon name="check-circle" size={11} />
                    <span>Kunci Jawaban</span>
                  </span>
                  <span style="font-size: 0.725rem; color: #0f766e; display: inline-flex; align-items: center; gap: 3px;">
                    <Icon name="arrow-path" size={11} />
                    <span>Klik balik</span>
                  </span>
                </div>

                <div style="margin: auto 0; text-align: left;">
                  <div style="font-size: 1.25rem; font-weight: 800; color: #0f766e; margin-bottom: 4px;">
                    Hingga 250% (2.5x)
                  </div>
                  <p style="margin: 0; font-size: 0.8rem; color: #334155; line-height: 1.45;">
                    Mengingat secara aktif memicu konsolidasi sinapsis otak jauh lebih kuat daripada menatap materi secara pasif.
                  </p>
                </div>

                <div style="display: flex; justify-content: flex-end; font-size: 0.725rem; color: #64748b;">
                  <span>FlashLearn Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust & Capability Strip (Zero Wrap Guaranteed) -->
    <div
      style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
    >
      <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.825rem; font-weight: 600; color: #334155; white-space: nowrap; flex-shrink: 0;">
        <Icon name="bolt" size={15} style="color: #0f766e;" />
        <span>Akses Tamu Instan</span>
      </div>
      <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.825rem; font-weight: 600; color: #334155; white-space: nowrap; flex-shrink: 0;">
        <Icon name="layers" size={15} style="color: #0f766e;" />
        <span>3D Flip Physics</span>
      </div>
      <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.825rem; font-weight: 600; color: #334155; white-space: nowrap; flex-shrink: 0;">
        <Icon name="chart-bar" size={15} style="color: #0f766e;" />
        <span>Evaluasi Skor & Pembahasan</span>
      </div>
      <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.825rem; font-weight: 600; color: #334155; white-space: nowrap; flex-shrink: 0;">
        <Icon name="arrow-down-tray" size={15} style="color: #0f766e;" />
        <span>Ekspor Excel & CSV</span>
      </div>
    </div>

    <!-- Content Modes Methodology Banner -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px;">
      <div class="fl-feature-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="width: 42px; height: 42px; border-radius: 12px; background: #eff6ff; color: #1d4ed8; display: flex; align-items: center; justify-content: center;">
            <Icon name="book-open" size={20} />
          </div>
          <ChipBadge variant="materi" label="Materi" />
        </div>
        <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #0f172a; font-weight: 700;">Materi Terstruktur</h3>
        <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">
          Bahan bacaan ringkas dan terfokus dengan estimasi waktu baca serta rangkuman poin-poin inti pembelajaran.
        </p>
      </div>

      <div class="fl-feature-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="width: 42px; height: 42px; border-radius: 12px; background: #fefce8; color: #b45309; display: flex; align-items: center; justify-content: center;">
            <Icon name="check-circle" size={20} />
          </div>
          <ChipBadge variant="quiz" label="Kuis" />
        </div>
        <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #0f172a; font-weight: 700;">Kuis Interaktif</h3>
        <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">
          Asesmen interaktif langsung dengan evaluasi skor otomatis dan pembahasan lengkap pada tiap butir soal.
        </p>
      </div>

      <div class="fl-feature-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="width: 42px; height: 42px; border-radius: 12px; background: #f0fdfa; color: #0f766e; display: flex; align-items: center; justify-content: center;">
            <Icon name="layers" size={20} />
          </div>
          <ChipBadge variant="combined" label="Gabungan" />
        </div>
        <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #0f172a; font-weight: 700;">Materi & Kuis Gabungan</h3>
        <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.5;">
          Pelajari konsep terlebih dahulu, lalu langsung uji daya serap dengan checkpoint kuis & kartu 3D flashcards.
        </p>
      </div>
    </div>

    <!-- Workspace List Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
      <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
        <Icon name="layers" size={18} style="color: #0f766e;" />
        <span>Workspace Pembelajaran Publik</span>
      </h2>
      <span style="font-size: 0.825rem; color: #64748b; font-weight: 600;">
        {filteredWorkspaces.length} Workspace Tersedia
      </span>
    </div>

    <!-- Workspaces Grid -->
    {#if isLoading}
      <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 500;">
        Sedang memuat workspace publik...
      </div>
    {:else if filteredWorkspaces.length === 0}
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center;">
        <p style="color: #64748b; margin: 0; font-weight: 500;">Tidak ada workspace yang cocok dengan pencarianmu.</p>
      </div>
    {:else}
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px;">
        {#each filteredWorkspaces as ws}
          <div
            class="fl-card-hover fl-interactive-press"
            onclick={() => navigateToWorkspace(ws)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && navigateToWorkspace(ws)}
            style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.02);"
          >
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: #f0fdfa; border: 1px solid #ccfbf1; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  {#if ws.icon}
                    <span style="font-size: 1.5rem; line-height: 1;">{ws.icon}</span>
                  {:else}
                    <Icon name="layers" size={22} style="color: #0f766e;" />
                  {/if}
                </div>
                <ChipBadge variant="neutral" label="Publik" />
              </div>

              <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; color: #0f172a; font-weight: 700; overflow-wrap: break-word; line-height: 1.3;">
                {ws.name}
              </h3>

              {#if ws.description}
                <p style="margin: 0 0 16px 0; font-size: 0.85rem; color: #64748b; line-height: 1.45; overflow-wrap: break-word;">
                  {ws.description}
                </p>
              {/if}
            </div>

            <div
              style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 0.8rem; color: #64748b;"
            >
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <Icon name="shield-check" size={13} style="color: #0f766e;" />
                <span>{ws.creatorName || 'FlashLearn'}</span>
              </span>
              <span style="color: #0f766e; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
                <span>Buka</span>
                <span class="fl-hover-arrow">
                  <Icon name="chevron-right" size={13} />
                </span>
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Page>
