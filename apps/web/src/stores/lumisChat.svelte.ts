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
      if (this.context.taskId) {
        const history = this.messages.slice(-6).map((m) => ({
          role: m.role,
          text: m.content,
        }));
        const res = await api.tasks.askSocraticHint(this.context.taskId, text);

        let reply = res.socraticGuidance;
        if (res.reflectiveQuestion) {
          reply += `\n\n💡 **Pertanyaan Reflektif:**\n${res.reflectiveQuestion}`;
        }
        if (res.citationReferences && res.citationReferences.length > 0) {
          const citations = res.citationReferences
            .map((c) => `• ${c.sourceCode}${c.locationTag ? ` (${c.locationTag})` : ''}: ${c.relevantPrinciple || ''}`)
            .join('\n');
          reply += `\n\n📜 **Rujukan Naskah Standar:**\n${citations}`;
        }
        if (res.suggestedAction) {
          reply += `\n\n🎯 **Langkah Tindak Lanjut:**\n${res.suggestedAction}`;
        }

        this.appendMessage('assistant', reply);
        this.lastAdoptedDraft = reply;
        this.sessionId = `socratic-${this.context.taskId}-${Date.now()}`;
        this.connectionStatus = 'connected';
      } else {
        // Fallback pedagogical reflection for general or domain navigation
        await new Promise((r) => setTimeout(r, 600));
        let reply = '';
        if (this.context.phase === 'adversarial_debrief') {
          reply = `Dalam skenario bertekanan tinggi seperti "${this.context.taskTitle || 'Tugas Dilema'}", kaidah integritas dan pemisahan kewenangan (Segregation of Duties) bersifat mutlak.\n\n💡 **Pertanyaan Reflektif:** Mengapa kepatuhan prosedural wajib dipertahankan meskipun terdapat desakan percepatan atau ancaman eskalasi?`;
        } else if (this.context.phase === 'diagnostic_guide') {
          reply = `Berdasarkan peta diagnostik di workspace "${this.context.workspaceName || 'Domain'}", fokuskan pembelajaran Anda pada node-node fondasi yang berstatus 'Ready'. Menyelesaikan prasyarat awal akan otomatis membuka akses ke tingkat wewenang berikutnya.`;
        } else {
          reply = `Saya adalah Tutor Sokratik FlashLearn. Silakan pilih salah satu kompetensi atau tugas pada Peta Kompetensi (DAG) agar saya dapat memberikan bimbingan reflektif berbasis pasal dan standar teknis resmi.`;
        }
        this.appendMessage('assistant', reply);
        this.lastAdoptedDraft = reply;
        this.connectionStatus = 'connected';
      }
    } catch (err: any) {
      this.appendMessage('assistant', `⚠️ Maaf, terjadi kendala saat menelaah: ${err.message || 'Gagal menghubungi server Sokratik'}. Pastikan Anda telah masuk sebagai pembelajar.`);
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
