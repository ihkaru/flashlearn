<script lang="ts">
  import { Page } from 'framework7-svelte';
  import { api } from '../stores/api';
  import { auth } from '../stores/auth.svelte';
  import type { Workspace, Content, Domain, LearnerContentProgress } from '@flashlearn/shared';
  import ContentEditorModal from '../components/ContentEditorModal.svelte';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.svelte';
  import QuizReviewModal from '../components/QuizReviewModal.svelte';
  import WorkspaceHeader from '../components/workspace/WorkspaceHeader.svelte';
  import WorkspaceUnitAccordion from '../components/workspace/WorkspaceUnitAccordion.svelte';
  import CompetencyDagView from '../components/competency/CompetencyDagView.svelte';
  import GatePassportsView from '../components/competency/GatePassportsView.svelte';
  import DomainTrackSelector from '../components/workspace/DomainTrackSelector.svelte';
  import CreateDomainModal from '../components/workspace/CreateDomainModal.svelte';
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
  let progressByContentId = $state<Record<string, LearnerContentProgress>>({});
  let domains = $state<Domain[]>([]);
  let selectedDomainId = $state<string>('');
  let isLoading = $state(true);
  let activeFilter = $state<string>('all');
  let activeViewTab = $state<'modules' | 'competencies' | 'gates'>('modules');

  // Creator Content Editor Modal state (Create & Edit)
  let showEditorModal = $state(false);
  let contentToEdit = $state<Content | null>(null);
  let showCreateDomainModal = $state(false);

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
      const [ws, items, domRes, progressList] = await Promise.all([
        api.workspaces.get(id),
        api.contents.listByWorkspace(id),
        api.domains.listByWorkspace(id).catch(() => ({ domains: [] })),
        api.contents.listWorkspaceProgress(id).catch(() => []),
      ]);
      workspace = ws;
      contents = items;
      progressByContentId = Object.fromEntries(
        (Array.isArray(progressList) ? progressList : []).map((p) => [p.contentId, p])
      );
      domains = domRes.domains || [];
      if (domains.length > 0 && (!selectedDomainId || !domains.some(d => d.id === selectedDomainId))) {
        selectedDomainId = domains[0].id;
      }
      if (items.filter((c) => !c.deletedAt).length === 0) {
        activeViewTab = 'competencies';
      }
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
<div class="workspace-page" style="max-width: 900px; margin: 0 auto; padding: 20px 16px 32px;">
  {#if isLoading}
    <div style="text-align: center; padding: 48px; color: #94a3b8; font-weight: 500;">
      Memuat detail workspace...
    </div>
  {:else if workspace}
    <!-- Workspace Header Subcomponent -->
    <WorkspaceHeader
      {workspace}
      contents={activeContents}
      {domains}
      {isOwner}
      onCreateModule={openCreateModal}
    />

    {#if domains.length > 0}
      <DomainTrackSelector
        {domains}
        {selectedDomainId}
        onSelectDomain={(dId) => (selectedDomainId = dId)}
        {isOwner}
        onOpenCreateDomain={() => (showCreateDomainModal = true)}
      />
    {/if}

    <!-- Workspace Main Views Switcher -->
    <div class="fl-scroll-row" style="margin-bottom: 20px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px;">
      <button
        onclick={() => (activeViewTab = 'modules')}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: none; font-weight: 700; background: {activeViewTab === 'modules' ? '#0f766e' : '#f1f5f9'}; color: {activeViewTab === 'modules' ? '#ffffff' : '#475569'};"
      >
        <span>Topik Belajar</span>
      </button>

      <button
        onclick={() => (activeViewTab = 'competencies')}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: none; font-weight: 700; background: {activeViewTab === 'competencies' ? '#0f766e' : '#f1f5f9'}; color: {activeViewTab === 'competencies' ? '#ffffff' : '#475569'};"
      >
        <span>Peta Kompetensi</span>
      </button>

      <button
        onclick={() => (activeViewTab = 'gates')}
        class="fl-btn fl-btn-md fl-pill-btn"
        style="border: none; font-weight: 700; background: {activeViewTab === 'gates' ? '#0f766e' : '#f1f5f9'}; color: {activeViewTab === 'gates' ? '#ffffff' : '#475569'};"
      >
        <span>Paspor Gerbang</span>
      </button>
    </div>

    {#if activeViewTab === 'modules'}
      <!-- Filters Bar (Horizontal Scrollable with Zero-Wrap Pills) -->
    <div class="fl-scroll-row" style="margin-bottom: 18px;">
      <button
        onclick={() => (activeFilter = 'all')}
        class="fl-btn fl-btn-sm fl-pill-btn"
        style="border: 1px solid {activeFilter === 'all' ? '#0f766e' : '#e2e8f0'}; background: {activeFilter === 'all' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'all' ? '#ffffff' : '#475569'};"
      >
        <span>Semua ({activeContents.length})</span>
      </button>

      {#if activeContents.some((c) => c.type === 'interactive_module')}
        <button
          onclick={() => (activeFilter = 'interactive_module')}
          class="fl-btn fl-btn-sm fl-pill-btn"
          style="border: 1px solid {activeFilter === 'interactive_module' ? '#0f766e' : '#e2e8f0'}; background: {activeFilter === 'interactive_module' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'interactive_module' ? '#ffffff' : '#475569'};"
        >
          <span>Interaktif ({activeContents.filter(c => c.type === 'interactive_module').length})</span>
        </button>
      {/if}

      <button
        onclick={() => (activeFilter = 'materi')}
        class="fl-btn fl-btn-sm fl-pill-btn"
        style="border: 1px solid {activeFilter === 'materi' ? '#0f766e' : '#e2e8f0'}; background: {activeFilter === 'materi' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'materi' ? '#ffffff' : '#475569'};"
      >
        <span>Materi ({activeContents.filter(c => c.type === 'materi').length})</span>
      </button>

      <button
        onclick={() => (activeFilter = 'quiz')}
        class="fl-btn fl-btn-sm fl-pill-btn"
        style="border: 1px solid {activeFilter === 'quiz' ? '#0f766e' : '#e2e8f0'}; background: {activeFilter === 'quiz' ? '#0f766e' : '#ffffff'}; color: {activeFilter === 'quiz' ? '#ffffff' : '#475569'};"
      >
        <span>Kuis ({activeContents.filter(c => c.type === 'quiz').length})</span>
      </button>

      {#if isOwner && deletedContents.length > 0}
        <button
          onclick={() => (activeFilter = 'trash')}
          class="fl-btn fl-btn-sm fl-pill-btn"
          style="border: 1px solid {activeFilter === 'trash' ? '#e11d48' : '#fecdd3'}; background: {activeFilter === 'trash' ? '#e11d48' : '#fff1f2'}; color: {activeFilter === 'trash' ? '#ffffff' : '#be123c'}; margin-left: auto;"
        >
          <span>Arsip ({deletedContents.length})</span>
        </button>
      {/if}
    </div>

    <!-- Contents List -->
    {#if filteredContents.length === 0}
      <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 40px 20px; text-align: center;">
        <p style="color: #475569; margin: 0 0 14px 0; font-weight: 600; font-size: 0.95rem;">
          {activeFilter === 'trash'
            ? 'Tidak ada modul di arsip terhapus.'
            : 'Belum ada konten pada kategori ini.'}
        </p>
        {#if isOwner && activeFilter !== 'trash'}
          <button
            onclick={openCreateModal}
            class="fl-btn fl-btn-md"
            style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
          >
            <span>Buat Modul Sekarang</span>
          </button>
        {/if}
      </div>
    {:else}
      <WorkspaceUnitAccordion
        contents={filteredContents}
        {domains}
        {progressByContentId}
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
    {/if}
  {:else if activeViewTab === 'competencies'}
    <CompetencyDagView workspaceId={workspace.id} domainId={selectedDomainId} />
  {:else if activeViewTab === 'gates'}
    <GatePassportsView workspaceId={workspace.id} />
  {/if}
{/if}
</div>

<!-- Modal Components -->
{#if showCreateDomainModal && workspace}
  <CreateDomainModal
    workspaceId={workspace.id}
    onClose={() => (showCreateDomainModal = false)}
    onCreated={loadWorkspaceData}
  />
{/if}

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
