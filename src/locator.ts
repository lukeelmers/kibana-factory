/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export interface LocatorParams {
  [key: string]: string;
}

export interface Locator {
  navigate(params: LocatorParams): string;
}

export function createLocator(basePath: string): Locator {
  return {
    navigate(params: LocatorParams): string {
      const url = new URL(basePath, window.location.origin);
      const searchParams = new URLSearchParams();

      for (const [key, value] of Object.entries(params)) {
        searchParams.set(key, value);
      }

      url.search = searchParams.toString();
      return url.pathname + url.search + url.hash;
    },
  };
}
