<script lang="ts">
  import {
    buildGuidedLearningSteps,
    type Content,
    type DiagnosticEvaluationResult,
    type InteractiveModulePayload,
    type LearnerContentProgress,
  } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import { readLocalProgress, writeLocalProgress, getLearnerSessionKey } from '../../lib/learnerSession';
  import AdaptiveDeckStage from './AdaptiveDeckStage.svelte';
  import GuidedStepBody from './GuidedStepBody.svelte';
  import GlossaryDisclosure from './GlossaryDisclosure.svelte';

  interface Props {
    content: Content;
    onFinished?: () => void;
  }

  let { content, onFinished }: Props = $props();

  const payload = $derived(content.interactivePayload as InteractiveModulePayload);
  const steps = $derived(payload ? buildGuidedLearningSteps(payload) : []);

  let currentStepIndex = $state(0);
  let currentSlideIndex = $state(0);
  let completedStepIds = $state<string[]>([]);
  let anchoringCompleted = $state(false);
  let stressTestSolved = $state(false);
  let diagnosticAttempts = $state(0);
  let lastLossScore = $state<number | null>(null);
  let lossVector = $state<LearnerContentProgress['lossVector']>(null);
  let thetaMastery = $state(0.2);
  let resumedBannerStep = $state<number | null>(null);
  let saveStateLabel = $state<'idle' | 'saving' | 'saved'>('idle');

  let deckHtml = $state<string | null>(null);
  let simHtml = $state<string | null>(null);
  let showDeckPane = $state(true);
  let isFullscreenDeck = $state(false);
  let hydrated = $state(false);

  const activeStep = $derived(steps[currentStepIndex] || steps[0]);
  const progressPct = $derived(steps.length > 0 ? Math.round(((currentStepIndex + 1) / steps.length) * 100) : 0);

  const canAdvance = $derived.by(() => {
    if (!activeStep) return false;
    if (activeStep.kind === 'anchoring_lab') return anchoringCompleted;
    if (activeStep.kind === 'stress_test') return stressTestSolved;
    return true;
  });

  $effect(() => {
    if (!content.id || hydrated) return;
    hydrated = true;
    hydrateSessionAndArtifacts();
  });

  // Auto-open fullscreen deck cleanly when phone rotates to compact landscape
  $effect(() => {
    if (typeof window === 'undefined' || !deckHtml) return;
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 520px)');
    const syncOrientation = () => {
      if (mq.matches && showDeckPane) isFullscreenDeck = true;
      else if (!mq.matches && isFullscreenDeck) isFullscreenDeck = false;
    };
    mq.addEventListener?.('change', syncOrientation);
    return () => mq.removeEventListener?.('change', syncOrientation);
  });

  function applySavedProgress(p: LearnerContentProgress) {
    const safeIdx = Math.min(Math.max(0, p.currentStepIndex), Math.max(0, steps.length - 1));
    currentStepIndex = safeIdx;
    currentSlideIndex = p.currentSlideIndex || 0;
    completedStepIds = p.completedStepIds || [];
    anchoringCompleted = Boolean(p.anchoringCompleted);
    diagnosticAttempts = p.diagnosticAttempts || 0;
    lastLossScore = p.lastLossScore;
    lossVector = p.lossVector;
    thetaMastery = p.thetaMastery || 0.2;
    stressTestSolved = completedStepIds.includes('step-stress-test') || Boolean(p.isCompleted);
    if (safeIdx > 0 && !p.isCompleted) {
      resumedBannerStep = safeIdx + 1;
    }
  }

  async function hydrateSessionAndArtifacts() {
    const local = readLocalProgress(content.id);
    if (local) applySavedProgress(local);

    const tasks: Promise<void>[] = [
      api.contents.getProgress(content.id).then((remote) => {
        if (remote && !('notStarted' in remote)) {
          const localTime = local ? Date.parse(local.updatedAt || '0') : 0;
          const remoteTime = Date.parse(remote.updatedAt || '0');
          if (remoteTime >= localTime) applySavedProgress(remote);
        }
      }).catch((err) => console.debug('[guided] remote progress unavailable', err)),
    ];

    if (content.hasSlideDeck) {
      tasks.push(
        api.contents.getArtifact(content.id, 'slide_deck_html')
          .then((art) => { deckHtml = art.htmlContent; })
          .catch((err) => console.debug('[guided] slide deck fetch skipped', err))
      );
    }

    if (content.hasAnchoringSim) {
      tasks.push(
        api.contents.getArtifact(content.id, 'anchoring_sim_html')
          .then((art) => { simHtml = art.htmlContent; })
          .catch((err) => console.debug('[guided] sim fetch skipped', err))
      );
    }

    await Promise.all(tasks);
  }

  async function persistProgress(extra: { incrementStepsToday?: number; incrementProbesToday?: number } = {}) {
    const isCompleted = currentStepIndex >= steps.length - 1 && stressTestSolved;
    const snapshot: LearnerContentProgress = {
      contentId: content.id,
      sessionKey: getLearnerSessionKey(),
      currentStepIndex,
      totalSteps: steps.length || 1,
      currentSlideIndex,
      completedStepIds,
      anchoringCompleted,
      diagnosticAttempts,
      lastLossScore,
      lossVector,
      thetaMastery,
      isCompleted,
      dailyActivityLog: {},
      updatedAt: new Date().toISOString(),
    };
    writeLocalProgress(content.id, snapshot);

    saveStateLabel = 'saving';
    try {
      await api.contents.saveProgress(content.id, {
        sessionKey: snapshot.sessionKey || undefined,
        currentStepIndex,
        totalSteps: snapshot.totalSteps,
        currentSlideIndex,
        completedStepIds,
        anchoringCompleted,
        diagnosticAttempts,
        lastLossScore,
        lossVector,
        thetaMastery,
        isCompleted,
        ...extra,
      });
      saveStateLabel = 'saved';
    } catch (err) {
      console.debug('[guided] cloud save deferred to local', err);
      saveStateLabel = 'saved';
    }
  }

  function goToStep(nextIndex: number) {
    const clamped = Math.max(0, Math.min(steps.length - 1, nextIndex));
    if (activeStep && clamped > currentStepIndex && !completedStepIds.includes(activeStep.id)) {
      completedStepIds = [...completedStepIds, activeStep.id];
    }
    currentStepIndex = clamped;
    resumedBannerStep = null;
    const targetSlide = steps[clamped]?.slideIndex;
    if (typeof targetSlide === 'number') {
      currentSlideIndex = targetSlide;
    }
    void persistProgress({ incrementStepsToday: clamped > currentStepIndex ? 1 : 0 });
  }

  function handleAnchoringDone() {
    anchoringCompleted = true;
    if (activeStep && !completedStepIds.includes(activeStep.id)) {
      completedStepIds = [...completedStepIds, activeStep.id];
    }
    void persistProgress({ incrementStepsToday: 1 });
  }

  function handleDiagnosticResult(res: DiagnosticEvaluationResult) {
    diagnosticAttempts += 1;
    lastLossScore = res.lossScore;
    lossVector = res.lossVector;
    thetaMastery = res.nextTheta;
    if (res.isCorrect) {
      stressTestSolved = true;
      if (activeStep && !completedStepIds.includes(activeStep.id)) {
        completedStepIds = [...completedStepIds, activeStep.id];
      }
    }
    void persistProgress({ incrementProbesToday: res.isCorrect ? 1 : 0 });
  }

  function restartFromBeginning() {
    currentStepIndex = 0;
    currentSlideIndex = steps[0]?.slideIndex ?? 0;
    resumedBannerStep = null;
    void persistProgress();
  }
</script>

{#if payload && activeStep}
  <div style="max-width: 720px; margin: 0 auto; padding: 16px 16px 96px;">
    <!-- Calm top progress bar -->
    <div style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; font-weight: 700; color: #0f766e;">
          Langkah {activeStep.stepNumber} dari {activeStep.totalSteps}
        </span>
        <div style="display: flex; align-items: center; gap: 10px;">
          {#if deckHtml}
            <button
              type="button"
              onclick={() => (showDeckPane = !showDeckPane)}
              style="background: transparent; border: none; color: #0f766e; font-size: 0.8rem; font-weight: 700; padding: 4px 6px; cursor: pointer;"
            >
              {showDeckPane ? 'Sembunyikan Slide' : 'Tampilkan Slide'}
            </button>
          {/if}
          <span style="font-size: 0.76rem; color: #64748b;">
            {saveStateLabel === 'saving' ? 'Menyimpan...' : 'Progres tersimpan'}
          </span>
        </div>
      </div>

      <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
        <div
          style="height: 100%; width: 100%; background: #0f766e; transform-origin: left center; transform: scaleX({progressPct / 100}); transition: transform 0.22s ease-out;"
        ></div>
      </div>
    </div>

    {#if resumedBannerStep !== null}
      <div style="margin-bottom: 14px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.84rem; color: #115e59;">
        <span>Melanjutkan dari Langkah {resumedBannerStep}.</span>
        <button
          type="button"
          onclick={restartFromBeginning}
          style="background: transparent; border: none; color: #0f766e; font-weight: 700; text-decoration: underline; cursor: pointer; padding: 2px 4px;"
        >
          Mulai dari awal
        </button>
      </div>
    {/if}

    <!-- Optional Visual Slide Stage (Adaptive Portrait 16:9 / Landscape Fullscreen) -->
    {#if deckHtml && showDeckPane}
      <div style="margin-bottom: 16px;">
        <AdaptiveDeckStage
          rawHtml={deckHtml}
          slideIndex={currentSlideIndex}
          slideNotes={payload.slideNotes || []}
          isFullscreen={isFullscreenDeck}
          onSlideChange={(idx) => {
            currentSlideIndex = idx;
            void persistProgress();
          }}
          onToggleFullscreen={() => (isFullscreenDeck = !isFullscreenDeck)}
        />
      </div>
    {/if}

    <!-- Single-Focus Guided Instruction Card -->
    <section style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: clamp(18px, 3vw, 26px);">
      <h2 style="margin: 0 0 6px 0; font-size: clamp(1.2rem, 3vw, 1.45rem); font-weight: 800; color: #0f172a; line-height: 1.3;">
        {activeStep.title}
      </h2>
      <p style="margin: 0 0 18px 0; font-size: 0.9rem; color: #475569; line-height: 1.55;">
        {activeStep.actionPrompt}
      </p>

      <GuidedStepBody
        step={activeStep}
        {payload}
        {simHtml}
        {anchoringCompleted}
        {stressTestSolved}
        {thetaMastery}
        onAnchoringCompleted={handleAnchoringDone}
        onDiagnosticEvaluated={handleDiagnosticResult}
      />

      <GlossaryDisclosure
        glossary={payload.glossary || []}
        citations={payload.sourceCitations || []}
      />
    </section>

    <!-- Single Clear Bottom Navigation Bar -->
    <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <button
        type="button"
        disabled={currentStepIndex === 0}
        onclick={() => goToStep(currentStepIndex - 1)}
        class="fl-btn fl-btn-md"
        style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1; opacity: {currentStepIndex === 0 ? 0.45 : 1};"
      >
        Sebelumnya
      </button>

      {#if currentStepIndex < steps.length - 1}
        <button
          type="button"
          disabled={!canAdvance}
          onclick={() => goToStep(currentStepIndex + 1)}
          class="fl-btn fl-btn-md"
          style="background: {canAdvance ? '#0f766e' : '#cbd5e1'}; color: #ffffff; border: none; font-weight: 700; min-width: 140px;"
        >
          {activeStep.kind === 'anchoring_lab' && !anchoringCompleted
            ? 'Coba dulu di atas'
            : activeStep.kind === 'stress_test' && !stressTestSolved
            ? 'Jawab dulu di atas'
            : 'Lanjut'}
        </button>
      {:else}
        <button
          type="button"
          onclick={() => onFinished?.()}
          class="fl-btn fl-btn-md"
          style="background: #0f766e; color: #ffffff; border: none; font-weight: 700;"
        >
          Pilih Topik Lain
        </button>
      {/if}
    </div>
  </div>
{/if}
