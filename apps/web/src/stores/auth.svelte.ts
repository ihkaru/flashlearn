import type { User, UserRole } from '@flashlearn/shared';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port !== '5173' ? '' : 'http://localhost:3001');

class AuthState {
  token = $state<string | null>(localStorage.getItem('flashlearn_token'));
  user = $state<User | null>(null);
  googleClientId = $state<string>('');
  isLoading = $state<boolean>(true);

  isLoggedIn = $derived(!!this.token && !!this.user);
  role = $derived<UserRole>(this.user?.role || 'guest');
  isSuperadmin = $derived(this.user?.role === 'superadmin');
  isCreator = $derived(this.user?.role === 'creator' || this.user?.role === 'superadmin');

  showApiKeyModal = $state<boolean>(false);

  openApiKeyModal() {
    this.showApiKeyModal = true;
  }

  closeApiKeyModal() {
    this.showApiKeyModal = false;
  }

  constructor() {
    this.init();
  }

  async init() {
    await this.fetchConfig();
    if (this.token) {
      await this.fetchMe();
    } else {
      this.isLoading = false;
    }
  }

  async fetchConfig() {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.googleClientId) {
          this.googleClientId = data.googleClientId;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch auth config:', e);
    }
  }

  async fetchMe() {
    if (!this.token) {
      this.isLoading = false;
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle(credential: string) {
    this.isLoading = true;
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const data = await res.json();
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('flashlearn_token', data.token);
      return data.user;
    } finally {
      this.isLoading = false;
    }
  }

  async loginAsDemo(params?: { email?: string; name?: string; role?: string }) {
    this.isLoading = true;
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Demo login failed');
      }

      const data = await res.json();
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('flashlearn_token', data.token);
      return data.user;
    } finally {
      this.isLoading = false;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('flashlearn_token');
  }
}

export const auth = new AuthState();
