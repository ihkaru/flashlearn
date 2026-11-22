import {
  createTranscriptBundle,
  type LumisChatMessage,
} from '@flashlearn/shared';
import { api } from './api';

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
  context = $state<LearningChatContext>({ phase: 'general' });
  pendingPrompt = $state<string>('');
  sessionId = $state<string>('');
  lastAdoptedDraft = $state<string>('');
  connectionStatus = $state<'idle' | 'connecting' | 'connected' | 'fallback'>('idle');
  messages = $state<LumisChatMessage[]>([]);
  isThinking = $state<boolean>(false);

  appendMessage(role: 'user' | 'assistant', content: string) {
    if (!content.trim()) return;
    this.messages.push({
      role,
      content: content.trim(),
      timestamp: Date.now(),
    });
  }

  async sendMessage(promptText: string) {
    const text = promptText.trim();
    if (!text || this.isThinking) return;

    this.appendMessage('user', text);
    this.isThinking = true;
    this.connectionStatus = 'connecting';

    try {
      const history = this.messages.slice(0, -1).slice(-8).map((m) => ({
        role: m.role,
        text: m.content,
      }));

      if (this.context.taskId) {
        const res = await api.tasks.askSocraticHint(this.context.taskId, text, history);

        let reply = res.socraticGuidance;
        if (res.reflectiveQuestion) {
          reply += `\n\nPertanyaan Reflektif:\n${res.reflectiveQuestion}`;
        }
        if (res.citationReferences && res.citationReferences.length > 0) {
          const citations = res.citationReferences
            .map((c) => `- ${c.sourceCode}${c.locationTag ? ` (${c.locationTag})` : ''}: ${c.relevantPrinciple || ''}`)
            .join('\n');
          reply += `\n\nRujukan Naskah Standar:\n${citations}`;
        }
        if (res.suggestedAction) {
          reply += `\n\nLangkah Tindak Lanjut:\n${res.suggestedAction}`;
        }

        this.appendMessage('assistant', reply);
        this.lastAdoptedDraft = reply;
        this.sessionId = `socratic-${this.context.taskId}-${Date.now()}`;
        this.connectionStatus = 'connected';
      } else {
        const res = await api.socraticChat.chat({
          message: text,
          conversationHistory: history,
          context: {
            phase: this.context.phase,
            workspaceName: this.context.workspaceName,
            taskTitle: this.context.taskTitle,
            scenario: this.context.scenario,
            competencyCode: this.context.competencyCode,
            competencyTitle: this.context.competencyTitle,
          },
        });
        this.appendMessage('assistant', res.reply);
        this.lastAdoptedDraft = res.reply;
        this.connectionStatus = 'connected';
      }
    } catch (err: any) {
      this.appendMessage('assistant', `Maaf, koneksi ke AI Tutor gagal: ${err.message || 'Server AI tidak tersedia'}. Pastikan Anda telah masuk dan AI Gateway aktif.`);
      this.connectionStatus = 'fallback';
    } finally {
      this.isThinking = false;
    }
  }

  openWithContext(ctx: LearningChatContext, initialPrompt?: string) {
    this.context = { ...ctx };
    this.messages = [];
    this.sessionId = `session-${Date.now()}`;
    this.isOpen = true;

    if (initialPrompt) {
      this.sendMessage(initialPrompt);
    } else {
      this.connectionStatus = 'connected';
    }
  }

  adoptDraft(draft: string) {
    this.lastAdoptedDraft = draft.trim();
    if (this.lastAdoptedDraft) {
      this.appendMessage('assistant', this.lastAdoptedDraft);
    }
    if (typeof window !== 'undefined' && this.lastAdoptedDraft) {
      const auditBundle = createTranscriptBundle(
        this.sessionId || `session-${Date.now()}`,
        this.messages
      );
      window.dispatchEvent(
        new CustomEvent('flashlearn:draft_adopted', {
          detail: {
            draft: this.lastAdoptedDraft,
            taskId: this.context.taskId,
            phase: this.context.phase,
            conversationAudit: auditBundle,
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
    const prompt = `Halo AI Advisor. Dalam skenario uji integritas [${params.taskTitle}], saya ingin mendiskusikan mengapa kepatuhan mutlak terhadap aturan resmi tidak boleh dikompromikan oleh desakan waktu operasional. Apa analisis risiko hukum dan etika di baliknya?`;
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
    const prompt = `Halo AI Coach. Kompetensi [${params.competencyCode} - ${params.competencyTitle}] saya mengalami peluruhan retrievabilitas hingga ${pct}%. Tolong berikan studi kasus kilat untuk merefresh pemahaman saya.`;
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
