<script lang="ts">
  import { auth } from '../stores/auth.svelte';
  import Icon from './ui/Icon.svelte';

  let googleButtonContainer: HTMLDivElement | undefined = $state();

  const clientId = $derived(
    auth.googleClientId ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '133588067257-0huo4ja0kaavpg704si2htphl0kvgobt.apps.googleusercontent.com'
  );

  $effect(() => {
    if (!auth.isLoggedIn && googleButtonContainer && clientId) {
      initGoogleLogin();
    }
  });

  function initGoogleLogin() {
    if (!clientId) return;
    if (typeof (window as any).google === 'undefined') {
      setTimeout(initGoogleLogin, 500);
      return;
    }

    try {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      if (googleButtonContainer) {
        (window as any).google.accounts.id.renderButton(googleButtonContainer, {
          theme: 'outline',
          size: 'medium',
          text: 'signin_with',
          shape: 'pill',
        });
      }
    } catch (err) {
      console.error('Google GIS Init error:', err);
    }
  }

  async function handleGoogleResponse(response: any) {
    if (response.credential) {
      try {
        await auth.loginWithGoogle(response.credential);
      } catch (err: any) {
        alert(`Login gagal: ${err.message}`);
      }
    }
  }
</script>

<div class="navbar-auth" style="display: flex; align-items: center; gap: 8px;">
  {#if auth.isLoading}
    <div style="font-size: 0.85rem; color: #94a3b8; white-space: nowrap;">Memeriksa akun...</div>
  {:else if auth.isLoggedIn && auth.user}
    <!-- User Profile & Badges -->
    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
      {#if auth.user.avatar}
        <img
          src={auth.user.avatar}
          alt={auth.user.name}
          style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0f766e; flex-shrink: 0;"
        />
      {/if}
      <div class="desktop-user-info" style="display: flex; flex-direction: column; text-align: right; min-width: 0;">
        <span style="font-weight: 700; font-size: 0.85rem; color: #0f172a; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {auth.user.name.split(' ')[0]}
        </span>
        <span
          style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: {auth.isSuperadmin ? '#b91c1c' : '#0f766e'}; line-height: 1;"
        >
          {auth.user.role}
        </span>
      </div>
    </div>

    <!-- API Key Button -->
    <button
      onclick={() => auth.openApiKeyModal()}
      title="Manajemen API Key"
      style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer; color: #0f766e; display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0;"
    >
      <Icon name="key" size={14} />
      <span class="desktop-apikey-label">API Key</span>
    </button>

    <!-- Logout Button (Desktop only, mobile has it in drawer) -->
    <button
      class="desktop-logout-button"
      onclick={() => auth.logout()}
      style="background: none; border: none; color: #ef4444; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 4px; white-space: nowrap; flex-shrink: 0;"
    >
      Keluar
    </button>
  {:else}
    <!-- Quick Demo Login Button -->
    <button
      onclick={() => auth.loginAsDemo()}
      title="Masuk Instan sebagai Pembelajar Terverifikasi"
      style="background: #0f766e; color: #ffffff; border: none; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0;"
    >
      <Icon name="bolt" size={13} />
      <span>Demo Pembelajar</span>
    </button>
    <!-- Guest Google Login Button -->
    <div bind:this={googleButtonContainer} style="display: flex; align-items: center; flex-shrink: 0;"></div>
  {/if}
</div>

<style>
  @media (max-width: 768px) {
    .desktop-user-info,
    .desktop-logout-button {
      display: none !important;
    }
  }
</style>
