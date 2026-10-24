export interface LearningChatContext {
  phase?: 'socratic_tutor' | 'adversarial_debrief' | 'diagnostic_guide' | 'drift_revalidation' | 'general';
  workspaceId?: string;
  workspaceName?: string;
  taskId?: string;
  taskTitle?: string;
  taskType?: string;
  scenario?: string;
  competencyCode?: string;
  competencyTitle?: string;
  gateLevel?: number;
  retrievability?: number;
  failureReason?: string;
  additionalInfo?: Record<string, unknown>;
}

class LumisChatState {
  isOpen = $state<boolean>(false);
  serverUrl = $state<string>(
    import.meta.env.VITE_LUMIS_SERVER_URL || 'https://chat.dvlpid.my.id'
  );
  context = $state<LearningChatContext>({ phase: 'general' });
  pendingPrompt = $state<string>('');
  sessionId = $state<string>('');
  lastAdoptedDraft = $state<string>('');
  connectionStatus = $state<'idle' | 'connecting' | 'connected' | 'fallback'>('idle');

  openWithContext(ctx: LearningChatContext, initialPrompt?: string) {
    this.context = { ...ctx };
    if (initialPrompt) {
      this.pendingPrompt = initialPrompt;
    }
    this.connectionStatus = 'connecting';
    this.isOpen = true;
  }

  adoptDraft(draft: string) {
    this.lastAdoptedDraft = draft.trim();
    if (typeof window !== 'undefined' && this.lastAdoptedDraft) {
      window.dispatchEvent(
        new CustomEvent('flashlearn:draft_adopted', {
          detail: {
            draft: this.lastAdoptedDraft,
            taskId: this.context.taskId,
            phase: this.context.phase,
          },
        })
      );
    }
  }

  setConnected(sessionId?: string) {
    this.connectionStatus = 'connected';
    if (sessionId) {
      this.sessionId = sessionId;
    }
  }

  triggerFallback() {
    this.connectionStatus = 'fallback';
  }

  askSocraticTutor(params: {
    taskId: string;
    taskTitle: string;
    scenario: string;
    competencyCode?: string;
    initialQuestion?: string;
  }) {
    const prompt =
      params.initialQuestion ||
      `Halo Tutor Sokratik. Saya sedang mempelajari tugas [${params.taskTitle}]. Bisakah berikan pertanyaan pemantik reflektif tanpa membocorkan kunci jawaban?`;
    this.openWithContext(
      {
        phase: 'socratic_tutor',
        taskId: params.taskId,
        taskTitle: params.taskTitle,
        scenario: params.scenario,
        competencyCode: params.competencyCode,
      },
      prompt
    );
  }

  askAdversarialDebrief(params: {
    taskTitle: string;
    scenario: string;
    statutoryPolicy?: string;
    learnerChoice?: string;
  }) {
    const prompt = `Halo AI Advisor. Dalam skenario uji integritas [${params.taskTitle}], saya ingin mendiskusikan mengapa kepatuhan mutlak terhadap '${params.statutoryPolicy || 'aturan resmi'}' tidak boleh dikompromikan oleh desakan waktu operasional. Apa analisis risiko hukum dan etika di baliknya?`;
    this.openWithContext(
      {
        phase: 'adversarial_debrief',
        taskTitle: params.taskTitle,
        scenario: params.scenario,
      },
      prompt
    );
  }

  askDiagnosticGuide(params: {
    workspaceName: string;
    inferredCount: number;
    recommendedCompetency?: string;
  }) {
    const prompt = `Halo AI Coach. Hasil uji diagnostik topologis saya di domain [${params.workspaceName}] telah memetakan ${params.inferredCount} penguasaan terinferensi. Apa strategi belajar paling efektif untuk melanjutkan prasyarat berikutnya?`;
    this.openWithContext(
      {
        phase: 'diagnostic_guide',
        workspaceName: params.workspaceName,
      },
      prompt
    );
  }

  askDriftRevalidation(params: {
    competencyCode: string;
    competencyTitle: string;
    retrievability: number;
  }) {
    const pct = Math.round(params.retrievability * 100);
    const prompt = `Halo AI Coach. Kompetensi [${params.competencyCode} - ${params.competencyTitle}] saya mengalami peluruhan retrievabilitas hingga ${pct}%. Tolong berikan pertanyaan studi kasus kilat untuk merefresh pemahaman saya sebelum tantangan revalidasi.`;
    this.openWithContext(
      {
        phase: 'drift_revalidation',
        competencyCode: params.competencyCode,
        competencyTitle: params.competencyTitle,
        retrievability: params.retrievability,
      },
      prompt
    );
  }

  close() {
    this.isOpen = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }
}

export const lumisChat = new LumisChatState();
