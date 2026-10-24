<script lang="ts">
  import { api } from '../stores/api';
  import type { ApiKeyItem } from '@flashlearn/shared';
  import Icon from './ui/Icon.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let keys = $state<ApiKeyItem[]>([]);
  let isLoading = $state(false);
  let newKeyName = $state('');
  let newlyGeneratedKey = $state<string | null>(null);
  let isGenerating = $state(false);
  let copied = $state(false);
  let aiCopied = $state(false);

  $effect(() => {
    if (isOpen) {
      loadKeys();
    }
  });

  async function loadKeys() {
    isLoading = true;
    try {
      keys = await api.apiKeys.list();
    } catch (err: any) {
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function handleCreateKey(e: Event) {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    isGenerating = true;
    try {
      const res = await api.apiKeys.create({
        name: newKeyName.trim(),
        permissions: ['*'],
      });
      newlyGeneratedKey = res.key;
      newKeyName = '';
      await loadKeys();
    } catch (err: any) {
      alert(`Gagal membuat API Key: ${err.message}`);
    } finally {
      isGenerating = false;
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Yakin ingin mencabut (revoke) API Key ini? Akses otomatis yang menggunakannya akan terhenti.')) {
      return;
    }
    try {
      await api.apiKeys.revoke(keyId);
      await loadKeys();
    } catch (err: any) {
      alert(`Gagal mencabut key: ${err.message}`);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function copyForAi(key: string) {
    const origin = window.location.origin;
    const prompt = `# FlashLearn AI Assistant Context

You have programmatic access to the **FlashLearn Education Engine** to create and manage workspaces, modules (materi, quiz, combined), and retrieve analytics.

## Connection Details
- **Base URL:** ${origin}/api/v1
- **API Key:** ${key}
- **OpenAPI Scalar Documentation:** ${origin}/docs
- **Authentication Header:** \`Authorization: Bearer ${key}\`

## Quick Start Workflows:
1. **List My Workspaces:**
   \`GET ${origin}/api/v1/workspaces?scope=mine\`

2. **Create New Content Module (Materi / Quiz / Combined):**
   \`POST ${origin}/api/v1/contents\`
   Header: \`Authorization: Bearer ${key}\`, \`Content-Type: application/json\`
   Body JSON:
   {
     "workspaceId": "<workspace-uuid>",
     "type": "quiz", // or "materi" or "combined"
     "title": "Judul Materi / Kuis",
     "summary": "Ringkasan singkat",
     "body": "# Isi Markdown Materi...",
     "questions": [
       {
         "id": "q1",
         "question": "Soal kuis?",
         "options": [
           { "id": "opt1", "text": "Pilihan A", "isCorrect": true },
           { "id": "opt2", "text": "Pilihan B", "isCorrect": false }
         ],
         "explanation": "Penjelasan detail mengapa opsi A benar.",
         "difficulty": "medium"
       }
     ],
     "isPublished": true
   }

3. **Public Shareable Link for Learners:**
   Once created, return this link to the user to share with students/WhatsApp group:
   \`${origin}/c/{content-id}\` (or direct: \`${origin}/#/content/{content-id}\`)

4. **Retrieve Quiz Analytics & Export Submissions:**
   - JSON Submissions: \`GET ${origin}/api/v1/contents/{content-id}/submissions\`
   - Excel Export (.xlsx): \`GET ${origin}/api/v1/contents/{content-id}/export?format=xlsx\`
   - CSV Export: \`GET ${origin}/api/v1/contents/{content-id}/export?format=csv\`

5. **Reversible CRUD (Rollback / Undo):**
   - Rollback to previous version snapshot: \`POST ${origin}/api/v1/contents/{content-id}/rollback\`
   - Restore soft-deleted content: \`POST ${origin}/api/v1/contents/{content-id}/restore\`

Task:
Please perform the requested task using the API details above, and return the public shareable link so the creator can preview and share it.`;

    navigator.clipboard.writeText(prompt);
    aiCopied = true;
    setTimeout(() => (aiCopied = false), 2500);
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; -webkit-overflow-scrolling: touch;"
    onclick={onClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && onClose()}
  >
    <!-- Modal Dialog -->
    <div
      style="background: #ffffff; width: 100%; max-width: 620px; border-radius: 20px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-height: 90vh; overflow-y: auto;"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
          <Icon name="key" size={20} />
          <span>Manajemen API Keys</span>
        </h2>
        <button
          onclick={onClose}
          class="fl-btn fl-btn-sm"
          style="background: #f1f5f9; border: none; width: 36px; height: 36px; min-height: 36px; border-radius: 50%; padding: 0; color: #64748b;"
          aria-label="Tutup"
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>

      <p style="color: #64748b; font-size: 0.9rem; margin-top: 0; margin-bottom: 20px; line-height: 1.5;">
        Gunakan API Key untuk mengizinkan coding agent (seperti AGY CLI atau Antigravity) membuat kuis, mengedit modul, mengekspor hasil ke Excel, dan melakukan rollback otomatis via REST API.
      </p>

      <!-- Newly Generated Secret Warning -->
      {#if newlyGeneratedKey}
        <div
          style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 14px; padding: 18px; margin-bottom: 20px;"
        >
          <div style="font-weight: 700; color: #166534; font-size: 0.95rem; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <Icon name="check-circle" size={16} />
            <span>API Key Berhasil Dibuat!</span>
          </div>
          <p style="font-size: 0.85rem; color: #15803d; margin: 0 0 12px 0;">
            Salin sekarang. Demi keamanan, kunci rahasia ini tidak akan ditampilkan lagi.
          </p>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
            <input
              type="text"
              readonly
              value={newlyGeneratedKey}
              style="flex: 1; min-width: 200px; font-family: monospace; background: #ffffff; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; color: #0f172a;"
            />
            <button
              onclick={() => copyToClipboard(newlyGeneratedKey!)}
              class="fl-btn fl-btn-sm"
              style="background: #16a34a; color: #ffffff; border: none; font-weight: 700; font-size: 0.85rem; white-space: nowrap;"
            >
              <Icon name="check" size={14} />
              <span>{copied ? 'Tersalin!' : 'Salin Key'}</span>
            </button>
          </div>

          <!-- Highlight: Copy for AI Agent Button -->
          <div style="border-top: 1px dashed #86efac; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 0.8rem; color: #15803d; font-weight: 600;">
              Ingin langsung serahkan ke coding agent (AGY CLI)?
            </span>
            <button
              onclick={() => copyForAi(newlyGeneratedKey!)}
              class="fl-btn fl-btn-sm"
              style="background: linear-gradient(135deg, #4f46e5, #0f766e); color: #ffffff; border: none; font-weight: 800; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);"
            >
              <Icon name="sparkles" size={14} />
              <span>{aiCopied ? 'Tersalin untuk AI!' : 'Copy for AI Agent'}</span>
            </button>
          </div>
        </div>
      {/if}

      <!-- Create New Key Form -->
      <form
        onsubmit={handleCreateKey}
        style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;"
      >
        <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 10px;">
          Buat API Key Baru
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <input
            type="text"
            placeholder="Label (contoh: Obsidian Sync, CLI Bot)..."
            bind:value={newKeyName}
            required
            style="flex: 1 1 200px; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem;"
          />
          <button
            type="submit"
            disabled={isGenerating}
            class="fl-btn fl-btn-md"
            style="background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.9rem;"
          >
            <Icon name="plus" size={15} />
            <span>{isGenerating ? 'Membuat...' : 'Buat Key'}</span>
          </button>
        </div>
      </form>

      <!-- Active Keys Table -->
      <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 12px;">
        Daftar Kunci Aktif
      </div>

      {#if isLoading}
        <div style="text-align: center; padding: 20px; color: #94a3b8;">Memuat daftar kunci...</div>
      {:else if keys.length === 0}
        <div style="text-align: center; padding: 20px; color: #94a3b8; background: #f8fafc; border-radius: 12px;">
          Belum ada API Key yang dibuat.
        </div>
      {:else}
        <div style="display: flex; flex-direction: column; gap: 10px;">
          {#each keys as k}
            <div
              style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 10px; flex-wrap: wrap; gap: 8px;"
            >
              <div>
                <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">{k.name}</div>
                <div style="font-family: monospace; font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                  {k.keyPrefix} • Dibuat: {new Date(k.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onclick={() => handleRevoke(k.id)}
                class="fl-btn fl-btn-sm"
                style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-size: 0.8rem; font-weight: 700;"
              >
                <Icon name="trash" size={13} />
                <span>Revoke</span>
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Example Usage Tip -->
      <div style="margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 10px; font-size: 0.825rem; color: #475569;">
        <strong>Cara Pakai:</strong> Kirim header HTTP berikut:<br />
        <code style="display: block; margin-top: 6px; padding: 6px 10px; background: #0f172a; color: #38bdf8; border-radius: 6px;">
          Authorization: Bearer fl_live_...
        </code>
      </div>
    </div>
  </div>
{/if}
