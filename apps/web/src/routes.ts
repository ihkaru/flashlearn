import HomePage from './pages/home.svelte';
import WorkspacePage from './pages/workspace.svelte';
import ContentDetailPage from './pages/content-detail.svelte';
import CreatorDashboardPage from './pages/creator-dashboard.svelte';
import SuperadminPage from './pages/superadmin.svelte';
import ReviewerQueuePage from './pages/reviewer-queue.svelte';
import SpacedPracticePage from './pages/spaced-practice.svelte';
import VerifyPassportPage from './pages/verify-passport.svelte';

export const routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/workspace/:id',
    component: WorkspacePage,
  },
  {
    path: '/content/:id',
    component: ContentDetailPage,
  },
  {
    path: '/c/:id',
    component: ContentDetailPage,
  },
  {
    path: '/creator',
    component: CreatorDashboardPage,
  },
  {
    path: '/admin',
    component: SuperadminPage,
  },
  {
    path: '/reviewer',
    component: ReviewerQueuePage,
  },
  {
    path: '/practice',
    component: SpacedPracticePage,
  },
  {
    path: '/verify/:id',
    component: VerifyPassportPage,
  },
];
