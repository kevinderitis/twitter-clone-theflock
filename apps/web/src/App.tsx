import { NavLink, Route, Routes } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { TimelinePage } from './pages/TimelinePage';

const navigationItems = [
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/profile/theflock', label: 'Profile' },
];

export const App = () => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-white shadow-sm lg:flex-row">
        <aside className="border-b border-slate-200 bg-white px-4 py-5 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
              The Flock
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Social UI scaffold
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              A mobile-first shell for the technical challenge.
            </p>
          </div>

          <nav
            aria-label="Primary navigation"
            className="flex gap-2 overflow-x-auto lg:flex-col"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <Routes>
            <Route path="/" element={<TimelinePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
