const DEFAULT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const DEFAULT_API_URL =
  process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000';

const waitForUrl = async (url: string, label: string) => {
  const timeoutMs = 60_000;
  const intervalMs = 1_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }

  throw new Error(
    `${label} did not become ready at ${url} within ${timeoutMs}ms.`,
  );
};

const globalSetup = async () => {
  await waitForUrl(`${DEFAULT_API_URL}/health`, 'API');
  await waitForUrl(`${DEFAULT_BASE_URL}/login`, 'Web app');
};

export default globalSetup;
