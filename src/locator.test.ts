import { Locator } from './locator';

describe('Locator', () => {
  describe('navigate()', () => {
    it('should navigate with simple query params', () => {
      const locator = new Locator({ basePath: '/app/discover' });
      const url = locator.formatUrl({ query: 'field:value' });
      expect(url).toBe('/app/discover?query=field%3Avalue');
    });

    it('should encode ampersands in query params', () => {
      const locator = new Locator({ basePath: '/app/discover' });
      const url = locator.formatUrl({ query: 'field:value&foo=bar' });
      expect(url).toBe('/app/discover?query=field%3Avalue%26foo%3Dbar');
    });

    it('should encode hash characters in query params', () => {
      const locator = new Locator({ basePath: '/app/discover' });
      const url = locator.formatUrl({ query: 'value#anchor' });
      expect(url).toBe('/app/discover?query=value%23anchor');
    });

    it('should encode percent characters in query params', () => {
      const locator = new Locator({ basePath: '/app/discover' });
      const url = locator.formatUrl({ query: '100%' });
      expect(url).toBe('/app/discover?query=100%25');
    });

    it('should handle multiple special characters together', () => {
      const locator = new Locator({ basePath: '/app/discover' });
      const url = locator.formatUrl({ query: 'field:value&foo=bar#anchor' });
      expect(url).toBe('/app/discover?query=field%3Avalue%26foo%3Dbar%23anchor');
    });
  });
});
