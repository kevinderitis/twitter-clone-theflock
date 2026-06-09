import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { App } from './App';

const renderApp = (initialEntry: string) => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('App routing shell', () => {
  it('renders the login page', () => {
    renderApp('/login');

    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders the register page', () => {
    renderApp('/register');

    expect(
      screen.getByRole('heading', { name: /join the flock/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it('renders primary and mobile navigation in the main layout', () => {
    renderApp('/');

    expect(
      screen.getByRole('navigation', { name: /primary navigation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /mobile navigation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /a feed-shaped home screen/i }),
    ).toBeInTheDocument();
  });
});
