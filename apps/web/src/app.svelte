<script lang="ts">
  import { App, View, f7 } from 'framework7-svelte';
  import { routes } from './routes';
  import { auth } from './stores/auth.svelte';
  import NavbarAuth from './components/NavbarAuth.svelte';
  import ApiKeyModal from './components/ApiKeyModal.svelte';
  import LumisChatAssistant from './components/chat/LumisChatAssistant.svelte';
  import Icon from './components/ui/Icon.svelte';

  const f7params = {
    name: 'FlashLearn',
    theme: 'auto',
    routes,
    darkMode: false,
    view: {
      browserHistory: true,
      browserHistorySeparator: '#',
    },
  };

  let mobileMenuOpen = $state(false);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function navigateTo(url: string, e?: Event) {
    if (e) e.preventDefault();
    closeMobileMenu();
    if (f7?.views?.main) {
      f7.views.main.router.navigate(url);
    } else {
      window.location.hash = `#${url}`;
    }
  }
</script>

<App {...f7params}>
  <!-- Top Persistent Global Navbar -->
  <header
    class="global-top-navbar"
    style="background: #ffffff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 9999; box-shadow: 0 1px 4px rgba(0,0,0,0.03); pointer-events: auto;"
  >
    <div
      style="max-width: 1040px; margin: 0 auto; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;"
    >
      <!-- Brand Title -->
      <a
        href="#/"
        onclick={(e) => navigateTo('/', e)}
        style="text-decoration: none; display: flex; align-items: center; gap: 9px; flex-shrink: 0;"
      >
        <div
          style="width: 32px; height: 32px; background: #0f766e; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #ffffff; box-shadow: 0 4px 10px rgba(15, 118, 110, 0.25);"
        >
          <Icon name="bolt" size={17} strokeWidth={2.2} />
        </div>
        <div>
          <span style="font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            FlashLearn
          </span>
        </div>
      </a>

      <!-- Middle Navigation Links (Desktop only) -->
      <nav class="desktop-nav-links" style="display: flex; align-items: center; gap: 16px;">
        <a
          href="#/"
          onclick={(e) => navigateTo('/', e)}
          style="color: #334155; text-decoration: none; font-weight: 600; font-size: 0.9rem;"
        >
          Eksplorasi
        </a>

        <a
          href="#/practice"
          onclick={(e) => navigateTo('/practice', e)}
          style="color: #0369a1; text-decoration: none; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;"
        >
          <Icon name="bolt" size={14} />
          <span>Latihan SM-2</span>
        </a>

        {#if auth.isCreator || auth.isSuperadmin}
          <a
            href="#/reviewer"
            onclick={(e) => navigateTo('/reviewer', e)}
            style="color: #7e22ce; text-decoration: none; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;"
          >
            <Icon name="award" size={14} />
            <span>Penilai Pakar</span>
          </a>
        {/if}

        {#if auth.isCreator}
          <a
            href="#/creator"
            onclick={(e) => navigateTo('/creator', e)}
            style="color: #0f766e; text-decoration: none; font-weight: 700; font-size: 0.9rem;"
          >
            Studio Kreator
          </a>
        {/if}

        {#if auth.isSuperadmin}
          <a
            href="#/admin"
            onclick={(e) => navigateTo('/admin', e)}
            style="color: #b91c1c; text-decoration: none; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 5px;"
          >
            <Icon name="shield-check" size={15} />
            <span>Superadmin</span>
          </a>
        {/if}

        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          style="color: #64748b; text-decoration: none; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;"
        >
          <span>OpenAPI Docs</span>
          <span style="font-size: 0.75rem;">↗</span>
        </a>
      </nav>

      <!-- Right Controls: Auth & Mobile Hamburger -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <NavbarAuth />

        <!-- Mobile Hamburger Toggle Button -->
        <button
          class="mobile-hamburger-btn fl-btn"
          onclick={toggleMobileMenu}
          aria-label="Menu navigasi"
          style="width: 44px; height: 44px; min-height: 44px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a; display: none; align-items: center; justify-content: center; padding: 0;"
        >
          <Icon name={mobileMenuOpen ? 'xmark' : 'bars-3'} size={20} />
        </button>
      </div>
    </div>

    <!-- Mobile Slide-Down Drawer Menu -->
    {#if mobileMenuOpen}
      <div
        class="mobile-drawer-menu"
        style="background: #ffffff; border-top: 1px solid #e2e8f0; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); max-height: 80vh; overflow-y: auto;"
      >
        {#if auth.isLoggedIn && auth.user}
          <!-- User Profile Card -->
          <div
            style="display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 12px 14px; border-radius: 12px; border: 1px solid #e2e8f0;"
          >
            {#if auth.user.avatar}
              <img
                src={auth.user.avatar}
                alt={auth.user.name}
                style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #0f766e; flex-shrink: 0;"
              />
            {/if}
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 800; font-size: 0.95rem; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                {auth.user.name}
              </div>
              <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                <span
                  style="display: inline-block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; background: {auth.isSuperadmin ? '#fee2e2' : '#ccfbf1'}; color: {auth.isSuperadmin ? '#b91c1c' : '#0f766e'};"
                >
                  {auth.user.role}
                </span>
                <span style="font-size: 0.75rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {auth.user.email}
                </span>
              </div>
            </div>
          </div>

          <!-- Highlight Mobile API Key Button -->
          <button
            onclick={() => { closeMobileMenu(); auth.openApiKeyModal(); }}
            class="fl-btn fl-btn-lg"
            style="width: 100%; background: #0f766e; color: #ffffff; border: none; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);"
          >
            <Icon name="key" size={16} />
            <span>Manajemen API Key (Coding Agent)</span>
          </button>
        {/if}

        <!-- Mobile Route Navigation Links -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <a
            href="#/"
            onclick={(e) => navigateTo('/', e)}
            style="padding: 10px 14px; border-radius: 10px; text-decoration: none; color: #1e293b; font-weight: 600; font-size: 0.95rem; background: #f8fafc; display: flex; align-items: center; gap: 10px;"
          >
            <Icon name="book-open" size={17} style="color: #64748b;" />
            <span>Eksplorasi Modul & Kuis</span>
          </a>

          <a
            href="#/practice"
            onclick={(e) => navigateTo('/practice', e)}
            style="padding: 10px 14px; border-radius: 10px; text-decoration: none; color: #0369a1; font-weight: 600; font-size: 0.95rem; background: #f0f9ff; display: flex; align-items: center; gap: 10px;"
          >
            <Icon name="bolt" size={17} style="color: #0284c7;" />
            <span>Latihan SM-2 Spaced Retrieval</span>
          </a>

          {#if auth.isCreator || auth.isSuperadmin}
            <a
              href="#/reviewer"
              onclick={(e) => navigateTo('/reviewer', e)}
              style="padding: 10px 14px; border-radius: 10px; text-decoration: none; color: #7e22ce; font-weight: 700; font-size: 0.95rem; background: #faf5ff; border: 1px solid #f3e8ff; display: flex; align-items: center; gap: 10px;"
            >
              <Icon name="award" size={17} style="color: #7e22ce;" />
              <span>Antrean Penilai Pakar (Kelas C)</span>
            </a>
          {/if}

          {#if auth.isCreator}
            <a
              href="#/creator"
              onclick={(e) => navigateTo('/creator', e)}
              style="padding: 10px 14px; border-radius: 10px; text-decoration: none; color: #0f766e; font-weight: 700; font-size: 0.95rem; background: #f0fdfa; border: 1px solid #ccfbf1; display: flex; align-items: center; gap: 10px;"
            >
              <Icon name="pencil" size={17} style="color: #0f766e;" />
              <span>Studio Kreator</span>
            </a>
          {/if}

          {#if auth.isSuperadmin}
            <a
              href="#/admin"
              onclick={(e) => navigateTo('/admin', e)}
              style="padding: 10px 14px; border-radius: 10px; text-decoration: none; color: #b91c1c; font-weight: 700; font-size: 0.95rem; background: #fef2f2; border: 1px solid #fecaca; display: flex; align-items: center; gap: 10px;"
            >
              <Icon name="shield-check" size={17} style="color: #b91c1c;" />
              <span>Superadmin Control Panel</span>
            </a>
          {/if}

          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            onclick={closeMobileMenu}
            style="padding: 10px 14px; border-radius: 10px; text-decoration: none; color: #475569; font-weight: 600; font-size: 0.9rem; background: #f8fafc; display: flex; align-items: center; justify-content: space-between;"
          >
            <span style="display: flex; align-items: center; gap: 10px;">
              <Icon name="link" size={16} style="color: #64748b;" />
              <span>OpenAPI Scalar Docs</span>
            </span>
            <span style="color: #94a3b8; font-size: 0.8rem;">↗</span>
          </a>
        </div>

        {#if auth.isLoggedIn}
          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <button
              onclick={() => { closeMobileMenu(); auth.logout(); }}
              class="fl-btn fl-btn-md"
              style="width: 100%; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; font-weight: 700; font-size: 0.9rem;"
            >
              <Icon name="xmark" size={16} />
              <span>Keluar ({auth.user?.name.split(' ')[0]})</span>
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </header>

  <!-- Mobile Backdrop -->
  {#if mobileMenuOpen}
    <div
      onclick={closeMobileMenu}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Escape' && closeMobileMenu()}
      style="position: fixed; inset: 0; top: 60px; background: rgba(15, 23, 42, 0.4); z-index: 9998; -webkit-tap-highlight-color: transparent;"
    ></div>
  {/if}

  <!-- Global API Key Modal -->
  <ApiKeyModal isOpen={auth.showApiKeyModal} onClose={() => auth.closeApiKeyModal()} />

  <!-- Global Lumis AI Learning Assistant Widget -->
  <LumisChatAssistant />

  <View main class="safe-areas" />
</App>

<style>
  @media (max-width: 768px) {
    :global(.desktop-nav-links) {
      display: none !important;
    }
    :global(.mobile-hamburger-btn) {
      display: flex !important;
    }
  }
</style>
