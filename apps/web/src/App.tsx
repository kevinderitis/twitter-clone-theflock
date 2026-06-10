import { NavLink, Route, Routes } from 'react-router-dom';

import { ProtectedRoute, PublicOnlyRoute } from './modules/auth/AuthGate';
import { useAuth } from './modules/auth/use-auth';
import { FollowListPage } from './pages/FollowListPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { TimelinePage } from './pages/TimelinePage';

const navigationItems = [
  { to: '/', label: 'Home', shortLabel: 'Home' },
  { to: '/search', label: 'Search', shortLabel: 'Search' },
  { to: '/profile/demo', label: 'Profile', shortLabel: 'Profile' },
  { to: '/login', label: 'Login', shortLabel: 'Login' },
  { to: '/register', label: 'Register', shortLabel: 'Join' },
];

const navLinkClassName = (isActive: boolean) =>
  [
    'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ');

export const App = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-app-canvas text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="hidden w-full max-w-xs shrink-0 border-r border-white/70 bg-white/80 px-6 py-8 backdrop-blur lg:flex lg:flex-col">
          <NavLink
            to="/"
            className="rounded-3xl border border-slate-200/80 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-700">
              The Flock
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-slate-950">
              Build something worth refreshing.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A calm, mobile-first shell for the technical challenge. Ready for
              auth, feeds, and profile data in the next slices.
            </p>
          </NavLink>

          <nav
            aria-label="Primary navigation"
            className="mt-8 flex flex-col gap-2"
          >
            {navigationItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {({ isActive }) => (
                  <span className={navLinkClassName(isActive)}>
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-slate-200/80 bg-slate-50 p-5">
            {isAuthenticated && currentUser ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Signed In
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {currentUser.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  @{currentUser.username}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Demo Account
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  demo@example.com
                </p>
                <p className="mt-1 text-sm text-slate-600">Password123!</p>
              </>
            )}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-app-canvas/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
                  The Flock
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-slate-950">
                  Frontend foundation
                </h2>
              </div>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    void logout();
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
                >
                  Log out
                </button>
              ) : (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Guest
                </span>
              )}
            </div>
          </header>

          <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8">
            <div className="mx-auto w-full max-w-3xl">
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <TimelinePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timeline"
                  element={
                    <ProtectedRoute>
                      <TimelinePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/profile/:username"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:username/followers"
                  element={
                    <ProtectedRoute>
                      <FollowListPage mode="followers" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:username/following"
                  element={
                    <ProtectedRoute>
                      <FollowListPage mode="following" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </main>

          <nav
            aria-label="Mobile navigation"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:hidden"
          >
            <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
              {navigationItems.map((item) => (
                <NavLink key={item.to} to={item.to}>
                  {({ isActive }) => (
                    <span
                      className={[
                        'flex min-h-12 items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold transition',
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      {item.shortLabel}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};
