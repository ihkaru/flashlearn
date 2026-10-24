<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace, Content } from '@flashlearn/shared';
  import ContentEditorModal from '../components/ContentEditorModal.svelte';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.svelte';
  import QuizReviewModal from '../components/QuizReviewModal.svelte';
  import WorkspaceHeader from '../components/workspace/WorkspaceHeader.svelte';
  import ContentListItem from '../components/workspace/ContentListItem.svelte';
  import CompetencyDagView from '../components/competency/CompetencyDagView.svelte';
  import GatePassportsView from '../components/competency/GatePassportsView.svelte';
  import Icon from '../components/ui/Icon.svelte';

  interface Props {
    f7route?: any;
    f7router?: any;
    workspaceId?: string;
  }

  let { f7route, f7router, workspaceId }: Props = $props();

  const id = $derived(workspaceId || f7route?.params?.id || '');

  let workspace = $state<Workspace | null>(null);
  let contents = $state<Content[]>([]);
  let isLoading = $state(true);
  let activeFilter = $state<string>('all');
  let activeViewTab = $state<'competencies' | 'gates' | 'modules'>('competencies');

  // Creator Content Editor Modal state (Create & Edit)
  let showEditorModal = $state(false);
  let contentToEdit = $state<Content | null>(null);

  // Soft Delete confirmation modal state
  let showDeleteModal = $state(false);
  let contentToDelete = $state<Content | null>(null);
  let isDeleting = $state(false);
  let isRestoring = $state(false);

  // Post-Quiz Review & Submissions Modal State
  let showReviewModal = $state(false);
  let reviewInitialTab = $state<'analysis' | 'participants'>('analysis');
  let selectedContentForReview = $state<Content | null>(null);

  // Feedback state
  let copiedLinkId = $state<string | null>(null);

  $effect(() => {
    if (id) {
      loadWorkspaceData();
    }
  });

  async function loadWorkspaceData() {
    isLoading = true;
    try {
      const [ws, items] = await Promise.all([
        api.workspaces.get(id),
        api.contents.listByWorkspace(id),
      ]);
      workspace = ws;
      contents = items;
    } catch (err: any) {
      alert(`Gagal memuat workspace: ${err.message}`);
    } finally {
      isLoading = false;
    }
  }

  let isOwner = $derived(
    auth.isSuperadmin || (auth.isLoggedIn && workspace?.creatorId === auth.user?.id)
  );

  let activeContents = $derived(contents.filter((c) => !c.deletedAt));
  let deletedContents = $derived(contents.filter((c) => !!c.deletedAt));

  let filteredContents = $derived(
    activeFilter === 'trash'
      ? deletedContents
      : activeFilter === 'all'
      ? activeContents
      : activeContents.filter((c) => c.type === activeFilter)
  );

  function navigateToContent(c: Content) {
    if (c.deletedAt) return;
    if (f7router) {
      f7router.navigate(`/content/${c.id}`);
    } else {
      window.location.hash = `/content/${c.id}`;
    }
  }

  function copyShareLink(c: Content, e: Event) {
    e.stopPropagation();
    const url = `${window.location.origin}/c/${c.id}`;
    navigator.clipboard.writeText(url);
    copiedLinkId = c.id;
    setTimeout(() => (copiedLinkId = null), 2000);
  }

  function openQuizReview(c: Content, e: Event, tab: 'analysis' | 'participants' = 'analysis') {
    e.stopPropagation();
    selectedContentForReview = c;
    reviewInitialTab = tab;
    showReviewModal = true;
  }

  function openCreateModal() {
    contentToEdit = null;
    showEditorModal = true;
  }

  function openEditModal(c: Content, e: Event) {
    e.stopPropagation();
    contentToEdit = c;
    showEditorModal = true;
  }

  async function handleContentSaved(savedContent: Content) {
    showEditorModal = false;
    contentToEdit = null;
    await loadWorkspaceData();
  }

  function openDeleteModal(c: Content, e: Event) {
    e.stopPropagation();
    contentToDelete = c;
    showDeleteModal = true;
  }

  async function confirmDelete() {
    if (!contentToDelete) return;
    isDeleting = true;
    try {
      await api.contents.delete(contentToDelete.id);
      showDeleteModal = false;
      contentToDelete = null;
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal menghapus modul: ${err.message}`);
    } finally {
      isDeleting = false;
    }
  }

  async function handleRestoreContent(c: Content, e: Event) {
    e.stopPropagation();
    isRestoring = true;
    try {
      await api.contents.restore(c.id);
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal memulihkan modul: ${err.message}`);
    } finally {
      isRestoring = false;
    }
  }

  async function handleRollback(c: Content, e: Event) {
    e.stopPropagation();
    if (!confirm(`Kembalikan (rollback) "${c.title}" ke versi sebelumnya?`)) {
      return;
    }
    try {
      await api.contents.rollback(c.id);
      alert('Konten berhasil di-rollback ke versi sebelumnya.');
      await loadWorkspaceData();
    } catch (err: any) {
      alert(`Gagal rollback: ${err.message}`);
    }
  }
</script>

<Page name="workspace">
<div class="workspace-page" style="max-width: 900px; margin: 0 auto; padding: 20px 16px;">
  {#if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 500;">
      Memuat detail workspace...
    </div>
  {:else if workspace}
    <!-- Workspace Header Subcomponent -->
    <WorkspaceHeader {workspace} {isOwner} onCreateModule={openCreateModal} />

    <!-- Workspace Main Views Switcher -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
      <button
        onclick={() => (activeViewTab = 'competencies')}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: none; font-weight: 700; font-size: 0.88rem; background: {activeViewTab === 'competencies' ? '#0f766e' : '#f8fafc'}; color: {activeViewTab === 'competencies' ? '#ffffff' : '#64748b'};"
      >
        <Icon name="bolt" size={14} />
        <span>Peta Kompetensi (DAG)</span>
      </button>

      <button
        onclick={() => (activeViewTab = 'gates')}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: none; font-weight: 700; font-size: 0.88rem; background: {activeViewTab === 'gates' ? '#0f766e' : '#f8fafc'}; color: {activeViewTab === 'gates' ? '#ffffff' : '#64748b'};"
      >
        <Icon name="shield-check" size={14} />
        <span>Paspor Gerbang</span>
      </button>

      <button
        onclick={() => (activeViewTab = 'modules')}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: none; font-weight: 700; font-size: 0.88rem; background: {activeViewTab === 'modules' ? '#0f766e' : '#f8fafc'}; color: {activeViewTab === 'modules' ? '#ffffff' : '#64748b'};"
      >
        <Icon name="book-open" size={14} />
        <span>Modul & Kuis</span>
      </button>
    </div>

    {#if activeViewTab === 'modules'}
      <!-- Filters Bar (Horizontal Scrollable with Zero-Wrap Pills) -->
    <div
      style="display: flex; gap: 8px; margin-bottom: 18px; overflow-x: auto; padding-bottom: 4px; align-items: center; -webkit-overflow-scrolling: touch;"
    >
      <button
        onclick={() => (activeFilter = 'all')}
        class="fl-pill-btn"
        style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'all' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'all' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        <span>Semua</span>
        <span style="font-size: 0.75rem; opacity: 0.85;">({activeContents.length})</span>
      </button>

      <button
        onclick={() => (activeFilter = 'materi')}
        class="fl-pill-btn"
        style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'materi' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'materi' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        <Icon name="book-open" size={13} />
        <span>Materi</span>
        <span style="font-size: 0.75rem; opacity: 0.85;">({activeContents.filter(c => c.type === 'materi').length})</span>
      </button>

      <button
        onclick={() => (activeFilter = 'quiz')}
        class="fl-pill-btn"
        style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'quiz' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'quiz' ? '#ffffff' : '#64748b'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
      >
        <Icon name="check-circle" size={13} />
        <span>Kuis</span>
        <span style="font-size: 0.75rem; opacity: 0.85;">({activeContents.filter(c => c.type === 'quiz').length})</span>
      </button>

      {#if isOwner && deletedContents.length > 0}
        <button
          onclick={() => (activeFilter = 'trash')}
          class="fl-pill-btn"
          style="width: auto !important; padding: 7px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 700; border: none; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; background: {activeFilter === 'trash' ? '#e11d48' : '#fef2f2'}; color: {activeFilter === 'trash' ? '#ffffff' : '#be123c'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-left: auto;"
        >
          <Icon name="trash" size={13} />
          <span>Arsip</span>
          <span style="font-size: 0.75rem; opacity: 0.85;">({deletedContents.length})</span>
        </button>
      {/if}
    </div>

    <!-- Contents List -->
    {#if filteredContents.length === 0}
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 48px 20px; text-align: center;">
        <div style="color: #94a3b8; margin-bottom: 8px;">
          <Icon name={activeFilter === 'trash' ? 'trash' : 'book-open'} size={32} />
        </div>
        <p style="color: #64748b; margin: 0 0 14px 0; font-weight: 600; font-size: 0.95rem;">
          {activeFilter === 'trash'
            ? 'Tidak ada modul di arsip terhapus.'
            : 'Belum ada konten pada kategori ini.'}
        </p>
        {#if isOwner && activeFilter !== 'trash'}
          <button
            onclick={openCreateModal}
            class="fl-btn fl-btn-md"
            style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.875rem; box-shadow: 0 2px 8px rgba(15, 118, 110, 0.2);"
          >
            <Icon name="plus" size={14} />
            <span>Buat Modul Sekarang</span>
          </button>
        {/if}
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 12px;">
        {#each filteredContents as c (c.id)}
          <ContentListItem
            content={c}
            {isOwner}
            isTrash={activeFilter === 'trash'}
            {isRestoring}
            {copiedLinkId}
            onNavigate={navigateToContent}
            onCopyLink={copyShareLink}
            onOpenReview={openQuizReview}
            onOpenEdit={openEditModal}
            onRollback={handleRollback}
            onDelete={openDeleteModal}
            onRestore={handleRestoreContent}
          />
        {/each}
      </div>
    {/if}
  {:else if activeViewTab === 'competencies'}
    <CompetencyDagView workspaceId={workspace.id} />
  {:else if activeViewTab === 'gates'}
    <GatePassportsView workspaceId={workspace.id} />
  {/if}
{/if}
</div>

<!-- Modal Components -->
{#if showEditorModal && workspace}
  <ContentEditorModal
    isOpen={showEditorModal}
    workspaceId={workspace.id}
    content={contentToEdit}
    onClose={() => (showEditorModal = false)}
    onSaved={handleContentSaved}
  />
{/if}

{#if showDeleteModal && contentToDelete}
  <ConfirmDeleteModal
    isOpen={showDeleteModal}
    title="Arsipkan Modul Pembelajaran"
    message="Modul '{contentToDelete.title}' akan dipindahkan ke tab Arsip. Anda masih dapat memulihkannya kapan saja."
    confirmText="Ya, Pindahkan ke Arsip"
    isLoading={isDeleting}
    onConfirm={confirmDelete}
    onCancel={() => (showDeleteModal = false)}
  />
{/if}

{#if showReviewModal && selectedContentForReview}
  <QuizReviewModal
    isOpen={showReviewModal}
    content={selectedContentForReview}
    initialTab={reviewInitialTab}
    onClose={() => (showReviewModal = false)}
  />
{/if}
</Page>
