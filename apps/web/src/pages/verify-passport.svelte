<script lang="ts">
  import { onMount } from 'svelte';
  import { Page, Block } from 'framework7-svelte';
  import { api } from '../stores/api';
  import type { PublicGateVerificationResponse } from '@flashlearn/shared';
  import Icon from '../components/ui/Icon.svelte';

  interface Props {
    f7route: {
      params: {
        id: string;
      };
    };
  }

  let { f7route }: Props = $props();
  const grantId = $derived(f7route.params.id);

  let passport = $state<PublicGateVerificationResponse | null>(null);
  let isLoading = $state(true);
  let errorMessage = $state<string | null>(null);

  onMount(async () => {
    try {
      passport = await api.gates.verifyPassport(grantId);
    } catch (err: any) {
      errorMessage = err.message || 'Paspor wewenang tidak valid atau tidak terdaftar.';
    } finally {
      isLoading = false;
    }
  });

  function formatDate(iso: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<Page name="verify-passport">
  <div style="max-width: 680px; margin: 32px auto; padding: 0 16px;">
    {#if isLoading}
      <div style="text-align: center; padding: 48px; color: #64748b;">
        <Icon name="refresh" size={24} />
        <p style="margin-top: 10px; font-weight: 600;">Memverifikasi Keabsahan Paspor Otorisasi...</p>
      </div>
    {:else if errorMessage || !passport}
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 28px; text-align: center;">
        <span style="color: #dc2626; display: inline-flex; margin-bottom: 8px;">
          <Icon name="alert-triangle" size={36} />
        </span>
        <h3 style="margin: 0 0 8px; color: #991b1b; font-size: 1.2rem; font-weight: 800;">
          Verifikasi Gagal
        </h3>
        <p style="margin: 0; color: #7f1d1d; font-size: 0.9rem;">
          {errorMessage || 'Dokumen paspor otorisasi tidak ditemukan dalam ledger akreditasi resmi.'}
        </p>
      </div>
    {:else}
      <!-- Verified Certificate Card -->
      <div
        style="background: #ffffff; border-radius: 20px; border: 1px solid {passport.isCurrentlyValid ? '#10b981' : '#f87171'}; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1); overflow: hidden;"
      >
        <!-- Header Ribbon -->
        <div
          style="background: {passport.isCurrentlyValid ? '#0f766e' : '#991b1b'}; color: #ffffff; padding: 20px 24px; text-align: center;"
        >
          <div style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.9;">
            Portal Verifikasi Akreditasi Wewenang Nasional
          </div>
          <h2 style="margin: 6px 0 0; font-size: 1.35rem; font-weight: 800;">
            Paspor Otorisasi Tingkat {passport.gateLevel}
          </h2>
        </div>

        <!-- Body Content -->
        <div style="padding: 24px; display: flex; flex-direction: column; gap: 18px;">
          <!-- Status Banner -->
          <div
            style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 12px; background: {passport.isCurrentlyValid ? '#ecfdf5' : '#fef2f2'}; border: 1px solid {passport.isCurrentlyValid ? '#a7f3d0' : '#fecaca'};"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <Icon name={passport.isCurrentlyValid ? 'check-circle' : 'alert-triangle'} size={20} />
              <span style="font-weight: 800; font-size: 0.95rem; color: {passport.isCurrentlyValid ? '#065f46' : '#991b1b'};">
                {passport.isCurrentlyValid ? 'STATUS: RESMI & AKTIF' : 'STATUS: DITANGGUHKAN / DICABUT'}
              </span>
            </div>
            <span style="font-family: monospace; font-size: 0.75rem; color: #64748b; font-weight: 700;">
              ID: {passport.grantId.slice(0, 13)}...
            </span>
          </div>

          {#if !passport.isCurrentlyValid && passport.revocationReason}
            <div style="font-size: 0.85rem; color: #991b1b; background: #fff1f2; padding: 10px 14px; border-radius: 8px; border-left: 4px solid #e11d48;">
              <strong>Alasan Penangguhan:</strong> {passport.revocationReason}
            </div>
          {/if}

          <!-- Credential Details Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Pemegang Wewenang
              </div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-top: 2px;">
                {passport.holderName}
              </div>
            </div>

            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Domain Kompetensi
              </div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #0f766e; margin-top: 2px;">
                {passport.workspaceName}
              </div>
            </div>

            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Waktu Pengesahan
              </div>
              <div style="font-size: 0.88rem; font-weight: 600; color: #334155; margin-top: 2px;">
                {formatDate(passport.grantedAt)}
              </div>
            </div>

            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Verifikator Resmi
              </div>
              <div style="font-size: 0.88rem; font-weight: 600; color: #334155; margin-top: 2px;">
                {passport.grantedBy === 'system' ? 'Sistem Audit Otomatis (Kelas A/B)' : 'Pakar Senior (Kelas C Sign-off)'}
              </div>
            </div>
          </div>

          <!-- Scope of Authority -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 14px; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px;">
              Lingkup Kewenangan & Tanggung Jawab Hukum:
            </div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
              {passport.gateTitle}
            </div>
            <div style="font-size: 0.85rem; color: #475569; line-height: 1.45;">
              {passport.gateDescription}
            </div>
          </div>

          <!-- Evidence Snapshot -->
          {#if passport.evidenceSnapshot?.verifiedCompetencyIds}
            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                Kompetensi Prasyarat yang Telah Diverifikasi:
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                {#each passport.evidenceSnapshot.verifiedCompetencyIds as compId}
                  <span style="font-family: monospace; font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 7px; border-radius: 5px; font-weight: 700;">
                    ✓ {compId.slice(0, 8)}...
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</Page>
