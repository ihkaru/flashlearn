<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Content } from '@flashlearn/shared';
  import MaterialViewer from '../components/MaterialViewer.svelte';
  import QuizRunner from '../components/QuizRunner.svelte';
  import CombinedModule from '../components/CombinedModule.svelte';
  import ContentEditorModal from '../components/ContentEditorModal.svelte';
  import QuizReviewModal from '../components/QuizReviewModal.svelte';
  import Icon from '../components/ui/Icon.svelte';
  import ChipBadge from '../components/ui/ChipBadge.svelte';

  interface Props {
    f7route?: any;
    f7router?: any;
    contentId?: string;
  }

  let { f7route, f7router, contentId }: Props = $props();

  const id = $derived(contentId || f7route?.params?.id || '');

  let content = $state<Content | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);
  let showEditModal = $state(false);
  let showReviewModal = $state(false);

  let canEdit = $derived(auth.isSuperadmin || auth.isCreator);

  $effect(() => {
    if (id) {
      loadContent();
    }
  });

  async function loadContent() {
    isLoading = true;
    errorMessage = null;
    try {
      content = await api.contents.get(id);
    } catch (err: any) {
      errorMessage = err.message;
    } finally {
      isLoading = false;
    }
  }

  function goBack() {
    if (f7router) {
      f7router.back();
    } else {
      window.history.back();
    }
  }

  function handleContentSaved(updated: Content) {
    showEditModal = false;
    content = updated;
    loadContent();
  }
</script>

<Page name="content-detail">
<div class="content-detail-page" style="min-height: 100vh; padding-bottom: 40px;">
  <!-- Sub-navbar Back Bar -->
  <div style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 10px 16px;">
    <div style="max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
      <button
        onclick={goBack}
        class="fl-btn fl-btn-sm"
        style="background: none; border: none; font-size: 0.9rem; font-weight: 700; color: #0f766e; white-space: nowrap;"
      >
        <Icon name="arrow-left" size={15} />
        <span>Kembali ke Workspace</span>
      </button>

      {#if content}
        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap;">
          <ChipBadge
            variant={content.type === 'quiz' ? 'quiz' : content.type === 'materi' ? 'materi' : 'combined'}
            icon={content.type === 'quiz' ? 'check-circle' : content.type === 'materi' ? 'book-open' : 'layers'}
            label={content.type.toUpperCase()}
          />

          {#if canEdit}
            {#if content.type !== 'materi'}
              <button
                type="button"
                class="fl-btn fl-btn-sm fl-pill-btn"
                onclick={() => (showReviewModal = true)}
                title="Bahas butir soal kuis & analisis kesalahan peserta"
                style="background: #f0fdfa; color: #0f766e; border: 1.5px solid #99f6e4; font-weight: 700; font-size: 0.8rem;"
              >
                <Icon name="sparkles" size={13} />
                <span>Bahas Kuis</span>
              </button>
            {/if}
            <button
              type="button"
              class="fl-btn fl-btn-sm fl-pill-btn"
              onclick={() => (showEditModal = true)}
              style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.8rem; box-shadow: 0 2px 6px rgba(15,118,110,0.25);"
            >
              <Icon name="pencil" size={13} />
              <span>Edit Modul</span>
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  {#if isLoading}
    <div style="text-align: center; padding: 60px 16px; color: #94a3b8;">
      Memuat modul pembelajaran...
    </div>
  {:else if errorMessage}
    <div style="max-width: 600px; margin: 40px auto; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 16px; padding: 24px; text-align: center;">
      <h3 style="margin: 0 0 8px 0; color: #b91c1c;">Gagal Memuat Konten</h3>
      <p style="color: #7f1d1d; margin: 0 0 16px 0;">{errorMessage}</p>
      <button
        onclick={goBack}
        style="background: #0f766e; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer;"
      >
        Kembali
      </button>
    </div>
  {:else if content}
    <!-- Dynamically Render Based on Triple Content Types -->
    {#if content.type === 'materi'}
      <MaterialViewer {content} onCompleted={() => {}} />
    {:else if content.type === 'quiz'}
      <QuizRunner {content} />
    {:else if content.type === 'combined'}
      <CombinedModule {content} />
    {/if}
  {/if}
</div>

{#if content && showEditModal}
  <ContentEditorModal
    isOpen={showEditModal}
    workspaceId={content.workspaceId}
    contentToEdit={content}
    onClose={() => (showEditModal = false)}
    onSaved={handleContentSaved}
  />
{/if}

{#if content && showReviewModal}
  <QuizReviewModal
    {content}
    isOpen={showReviewModal}
    initialTab="analysis"
    onClose={() => (showReviewModal = false)}
  />
{/if}
</Page>
