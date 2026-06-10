import { NavLink, Route, Routes, useLocation } from 'react-router-dom';

import { ProtectedRoute, PublicOnlyRoute } from './modules/auth/AuthGate';
import { useAuth } from './modules/auth/use-auth';
import { FollowListPage } from './pages/FollowListPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { TimelinePage } from './pages/TimelinePage';

const primaryNavigationItems = [
  { to: '/', label: 'Home', shortLabel: 'Home' },
  { to: '/search', label: 'Search', shortLabel: 'Search' },
  { to: '/profile/:username', label: 'Profile', shortLabel: 'Profile' },
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
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const resolvedProfilePath = currentUser
    ? `/profile/${currentUser.username}`
    : '/profile/demo';
  const desktopNavigationItems = primaryNavigationItems.map((item) => ({
    ...item,
    to: item.to === '/profile/:username' ? resolvedProfilePath : item.to,
  }));

  return (
    <div className="min-h-screen bg-app-canvas text-slate-950">
      <aside
        aria-label="Desktop sidebar"
        className={`fixed inset-y-0 left-0 z-30 w-80 border-r border-slate-200 bg-white/95 px-6 py-8 backdrop-blur ${
          isAuthPage ? 'hidden' : 'hidden lg:flex lg:flex-col'
        }`}
      >
        <NavLink to="/" className="inline-flex items-center">
          <p className="font-display text-3xl font-semibold text-slate-950">
            The Flock
          </p>
        </NavLink>

        <nav
          aria-label="Primary navigation"
          className="mt-10 flex flex-col gap-2"
        >
          {desktopNavigationItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <span className={navLinkClassName(isActive)}>{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {isAuthenticated && currentUser ? (
          <div className="mt-auto rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-sm font-semibold text-brand-700">
                {currentUser.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {currentUser.name}
                </p>
                <p className="truncate text-sm text-slate-500">
                  @{currentUser.username}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className="mt-4 w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        ) : null}
      </aside>

      <div className={`flex min-h-screen flex-1 flex-col${isAuthPage ? '' : ' lg:pl-80'}`}>
        <main className="flex-1 px-4 pb-28 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
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

        {!isAuthPage ? (
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:hidden"
          >
          <div
            className={`mx-auto grid max-w-xl gap-2 ${
              isAuthenticated ? 'grid-cols-4' : 'grid-cols-5'
            }`}
          >
            {desktopNavigationItems.map((item) => (
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
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                className="flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-rose-100 hover:text-rose-700"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/login">
                  {({ isActive }) => (
                    <span
                      className={[
                        'flex min-h-12 items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold transition',
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      Login
                    </span>
                  )}
                </NavLink>
                <NavLink to="/register">
                  {({ isActive }) => (
                    <span
                      className={[
                        'flex min-h-12 items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold transition',
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 text-slate-700',
                      ].join(' ')}
                    >
                      Join
                    </span>
                  )}
                </NavLink>
              </>
            )}
          </div>
        </nav>
      ) : null}
      </div>
    </div>
  );
};
