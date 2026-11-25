<script lang="ts">
  import {
    buildGuidedLearningSteps,
    type Content,
    type DiagnosticEvaluationResult,
    type InteractiveModulePayload,
    type LearnerContentProgress,
  } from '@flashlearn/shared';
  import { api } from '../../stores/api';
  import { learningFeedback } from '../../lib/learningFeedback.svelte';
  import {
    progressSync,
    buildProgressSnapshot,
    toSaveProgressPayload,
  } from '../../stores/progressSync.svelte';
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
  let deckManualOverride = $state<boolean | null>(null);
  let isFullscreenDeck = $state(false);
  let hydrated = $state(false);

  const activeStep = $derived(steps[currentStepIndex] || steps[0]);
  const progressPct = $derived(steps.length > 0 ? Math.round(((currentStepIndex + 1) / steps.length) * 100) : 0);

  // Calm mobile ergonomics: auto-collapse slide stage into a 1-tap bar on interactive steps
  const showDeckPane = $derived.by(() => {
    if (deckManualOverride !== null) return deckManualOverride;
    return !activeStep?.preferCollapsedDeck;
  });

  const activeStepSolved = $derived(
    Boolean(activeStep && completedStepIds.includes(activeStep.id))
  );

  const canAdvance = $derived.by(() => {
    if (!activeStep) return false;
    if (activeStep.kind === 'anchoring_lab') {
      return activeStepSolved || (activeStep.id === 'step-anchoring' && anchoringCompleted);
    }
    if (activeStep.kind === 'stress_test') {
      return activeStepSolved || (activeStep.id === 'step-stress-test' && stressTestSolved);
    }
    if (
      activeStep.kind === 'hinge_check' ||
      activeStep.kind === 'erroneous_example' ||
      activeStep.kind === 'explain_back'
    ) {
      return activeStepSolved;
    }
    return true;
  });

  $effect(() => {
    if (!content.id || hydrated) return;
    hydrated = true;
    hydrateSessionAndArtifacts();
  });

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

  async function persistProgress(
    extra: { incrementStepsToday?: number; incrementProbesToday?: number; forceCompleted?: boolean } = {}
  ) {
    const allStressSolved = steps
      .filter((s) => s.kind === 'stress_test')
      .every((s) => completedStepIds.includes(s.id) || (s.id === 'step-stress-test' && stressTestSolved));
    const isCompleted =
      Boolean(extra.forceCompleted) || (currentStepIndex >= steps.length - 1 && allStressSolved);
    const snapshot = buildProgressSnapshot({
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
    });
    writeLocalProgress(content.id, snapshot);
    progressSync.notifySaved(snapshot);

    saveStateLabel = 'saving';
    try {
      await api.contents.saveProgress(content.id, toSaveProgressPayload(snapshot, extra));
      saveStateLabel = 'saved';
    } catch (err) {
      console.debug('[guided] cloud save deferred to local', err);
      saveStateLabel = 'saved';
    }
  }

  async function finishAndLeave() {
    if (activeStep && !completedStepIds.includes(activeStep.id)) {
      completedStepIds = [...completedStepIds, activeStep.id];
    }
    await persistProgress({ forceCompleted: true, incrementStepsToday: 1 });
    onFinished?.();
  }

  function goToStep(nextIndex: number) {
    const clamped = Math.max(0, Math.min(steps.length - 1, nextIndex));
    if (activeStep && clamped > currentStepIndex && !completedStepIds.includes(activeStep.id)) {
      completedStepIds = [...completedStepIds, activeStep.id];
    }
    const movingForward = clamped > currentStepIndex;
    currentStepIndex = clamped;
    deckManualOverride = null;
    resumedBannerStep = null;
    const targetSlide = steps[clamped]?.slideIndex;
    if (typeof targetSlide === 'number') {
      currentSlideIndex = targetSlide;
    }
    void persistProgress({ incrementStepsToday: movingForward ? 1 : 0 });
  }

  function markStepDone(stepId: string) {
    if (!completedStepIds.includes(stepId)) {
      completedStepIds = [...completedStepIds, stepId];
    }
    void persistProgress({ incrementStepsToday: 1 });
  }

  function handleAnchoringDone() {
    if (!activeStep || activeStep.id === 'step-anchoring') anchoringCompleted = true;
    if (activeStep) markStepDone(activeStep.id);
  }

  function handleDiagnosticResult(res: DiagnosticEvaluationResult) {
    diagnosticAttempts += 1;
    lastLossScore = res.lossScore;
    lossVector = res.lossVector;
    thetaMastery = res.nextTheta;
    if (res.isCorrect) {
      if (!activeStep || activeStep.id === 'step-stress-test') stressTestSolved = true;
      if (activeStep && !completedStepIds.includes(activeStep.id)) {
        completedStepIds = [...completedStepIds, activeStep.id];
      }
      const stressSteps = steps.filter((s) => s.kind === 'stress_test');
      const allSolved = stressSteps.every(
        (s) => completedStepIds.includes(s.id) || (s.id === 'step-stress-test' && stressTestSolved)
      );
      if (allSolved) {
        learningFeedback.onCelebration('Uji Pemahaman Tuntas!', content.title);
      } else {
        learningFeedback.onCorrect(Math.max(1, completedStepIds.length), true);
      }
    } else {
      learningFeedback.onMiss();
    }
    void persistProgress({ incrementProbesToday: res.isCorrect ? 1 : 0 });
  }

  function restartFromBeginning() {
    currentStepIndex = 0;
    currentSlideIndex = steps[0]?.slideIndex ?? 0;
    deckManualOverride = null;
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
              onclick={() => (deckManualOverride = !showDeckPane)}
              style="background: transparent; border: none; color: #0f766e; font-size: 0.8rem; font-weight: 700; padding: 4px 6px; cursor: pointer;"
            >
              {showDeckPane ? 'Lipat Slide' : `Buka Slide (${currentSlideIndex + 1})`}
            </button>
          {/if}
          <span style="font-size: 0.76rem; color: #64748b;">
            {saveStateLabel === 'saving' ? 'Menyimpan...' : 'Progres tersimpan'}
          </span>
        </div>
      </div>

      <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
        <div
          class="fl-progress-bar-fill"
          style="background: var(--ws-accent, #0f766e); transform: scaleX({progressPct / 100});"
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

    <!-- Visual Slide Stage (or calm 1-tap strip when auto-collapsed for interaction) -->
    {#if deckHtml}
      {#if showDeckPane}
        <div style="margin-bottom: 16px;">
          <AdaptiveDeckStage
            rawHtml={deckHtml}
            slideIndex={currentSlideIndex}
            slideRange={activeStep.slideRange}
            slideNotes={payload.slideNotes || []}
            isFullscreen={isFullscreenDeck}
            onSlideChange={(idx) => {
              currentSlideIndex = idx;
              void persistProgress();
            }}
            onToggleFullscreen={() => (isFullscreenDeck = !isFullscreenDeck)}
          />
        </div>
      {:else}
        <button
          type="button"
          onclick={() => (deckManualOverride = true)}
          style="width: 100%; margin-bottom: 14px; padding: 10px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid #cbd5e1; color: #0f766e; font-size: 0.83rem; font-weight: 700; display: flex; justify-content: space-between; align-items: center; cursor: pointer;"
        >
          <span>Slide visual dilipat agar fokus interaksi</span>
          <span>Lihat Slide {currentSlideIndex + 1}</span>
        </button>
      {/if}
    {/if}

    <!-- Single-Focus Guided Instruction Card -->
    {#key activeStep.id}
      <section class="fl-step-enter" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: clamp(18px, 3vw, 26px);">
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
          stepCompleted={activeStepSolved}
          {thetaMastery}
          onAnchoringCompleted={handleAnchoringDone}
          onDiagnosticEvaluated={handleDiagnosticResult}
          onStepInteractionSolved={markStepDone}
        />

        <GlossaryDisclosure
          glossary={payload.glossary || []}
          citations={payload.sourceCitations || []}
          figures={payload.figures || []}
          {steps}
        />
      </section>
    {/key}

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
            : !canAdvance
            ? 'Selesaikan dulu di atas'
            : 'Lanjut'}
        </button>
      {:else}
        <button
          type="button"
          onclick={finishAndLeave}
          class="fl-btn fl-btn-md"
          style="background: var(--ws-accent, #0f766e); color: #ffffff; border: none; font-weight: 700;"
        >
          Selesai &amp; Pilih Topik Lain
        </button>
      {/if}
    </div>
  </div>
{/if}
