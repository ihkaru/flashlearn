<script lang="ts">
  import type { Content } from '@flashlearn/shared';
  import MaterialViewer from './MaterialViewer.svelte';
  import QuizRunner from './QuizRunner.svelte';

  interface Props {
    content: Content;
  }

  let { content }: Props = $props();

  let activeTab = $state<'materi' | 'quiz'>('materi');

  function proceedToQuiz() {
    activeTab = 'quiz';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<div class="combined-module" style="max-width: 740px; margin: 0 auto;">
  <!-- Tab Navigator -->
  <div style="display: flex; gap: 8px; margin: 16px; background: #e2e8f0; padding: 4px; border-radius: 12px;">
    <button
      onclick={() => (activeTab = 'materi')}
      class="fl-btn-wrap"
      style="flex: 1; min-width: 0; min-height: 44px; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; text-align: center; line-height: 1.25; background: {activeTab === 'materi' ? '#ffffff' : 'transparent'}; color: {activeTab === 'materi' ? '#0f766e' : '#475569'}; box-shadow: {activeTab === 'materi' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'};"
    >
      1. Pelajari Materi
    </button>
    <button
      onclick={() => (activeTab = 'quiz')}
      class="fl-btn-wrap"
      style="flex: 1; min-width: 0; min-height: 44px; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; text-align: center; line-height: 1.25; background: {activeTab === 'quiz' ? '#ffffff' : 'transparent'}; color: {activeTab === 'quiz' ? '#0f766e' : '#475569'}; box-shadow: {activeTab === 'quiz' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'};"
    >
      2. Uji Pemahaman (Kuis)
    </button>
  </div>

  {#if activeTab === 'materi'}
    <MaterialViewer {content} onCompleted={proceedToQuiz} />
    <div style="margin: 20px 16px 40px; text-align: center;">
      <button
        onclick={proceedToQuiz}
        class="fl-btn fl-btn-lg"
        style="background: #ea580c; color: #ffffff; border: none; font-weight: 700;"
      >
        Lanjut ke Kuis Pengujian
      </button>
    </div>
  {:else}
    <QuizRunner {content} />
  {/if}
</div>
