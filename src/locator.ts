/**
 * Locator service for generating and navigating to URLs.
 */

export interface LocatorParams {
  [key: string]: string | undefined;
}

export interface Locator {
  navigate(params: LocatorParams): void;
  getUrl(params: LocatorParams): string;
}

export function formatUrl(basePath: string, params: LocatorParams): string {
  const url = new URL(basePath, window.location.origin);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  if (queryString) {
    url.search = queryString;
  }

  return url.pathname + url.search + url.hash;
}

export function createLocator(basePath: string): Locator {
  return {
    navigate(params: LocatorParams): void {
      const url = formatUrl(basePath, params);
      window.location.assign(url);
    },

    getUrl(params: LocatorParams): string {
      return formatUrl(basePath, params);
    },
  };
}
