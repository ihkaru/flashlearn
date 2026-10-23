<script lang="ts">
  import type { QuizSubmissionRecord } from '@flashlearn/shared';
  import Icon from '../ui/Icon.svelte';

  interface Props {
    submissions: QuizSubmissionRecord[];
  }

  let { submissions }: Props = $props();

  let participantSearch = $state('');

  let filteredSubmissions = $derived(
    submissions.filter((s) => {
      const q = participantSearch.toLowerCase().trim();
      if (!q) return true;
      const name = (s.guestName || s.userName || '').toLowerCase();
      return name.includes(q);
    })
  );
</script>

<div style="display: flex; flex-direction: column; gap: 14px;">
  <!-- Search Participant Input -->
  <div style="position: relative; max-width: 360px;">
    <span
      style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; display: flex; align-items: center; pointer-events: none;"
    >
      <Icon name="search" size={16} />
    </span>
    <input
      type="text"
      placeholder="Cari nama peserta..."
      bind:value={participantSearch}
      style="width: 100%; padding: 8px 14px 8px 36px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; color: #0f172a; outline: none;"
    />
  </div>

  <!-- Table of Submissions -->
  <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
    <table style="width: 100%; border-collapse: collapse; font-size: 0.825rem; text-align: left;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
          <th style="padding: 10px 14px; white-space: nowrap;">No</th>
          <th style="padding: 10px 14px; white-space: nowrap;">Nama Peserta</th>
          <th style="padding: 10px 14px; white-space: nowrap;">Nilai (%)</th>
          <th style="padding: 10px 14px; white-space: nowrap;">Skor Benar</th>
          <th style="padding: 10px 14px; white-space: nowrap;">Status</th>
          <th style="padding: 10px 14px; white-space: nowrap;">Waktu Pengerjaan</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredSubmissions.length === 0}
          <tr>
            <td colspan="6" style="padding: 30px; text-align: center; color: #94a3b8;">
              Tidak ditemukan peserta yang sesuai dengan pencarian.
            </td>
          </tr>
        {/if}

        {#each filteredSubmissions as sub, idx}
          <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;">
            <td style="padding: 10px 14px; color: #94a3b8;">{idx + 1}</td>
            <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">
              {sub.guestName || sub.userName || 'Anonim'}
            </td>
            <td
              style="padding: 10px 14px; font-weight: 800; color: {sub.percentage >= 70
                ? '#16a34a'
                : '#dc2626'};"
            >
              {sub.percentage}%
            </td>
            <td style="padding: 10px 14px; color: #475569;">
              {sub.score} / {sub.totalQuestions}
            </td>
            <td style="padding: 10px 14px;">
              <span
                style="background: {sub.percentage >= 70
                  ? '#dcfce7'
                  : '#fee2e2'}; color: {sub.percentage >= 70
                  ? '#166534'
                  : '#991b1b'}; padding: 2px 8px; border-radius: 6px; font-size: 0.725rem; font-weight: 700;"
              >
                {sub.percentage >= 70 ? 'Lulus' : 'Belum Lulus'}
              </span>
            </td>
            <td style="padding: 10px 14px; color: #64748b; font-size: 0.775rem;">
              {new Date(sub.createdAt).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
