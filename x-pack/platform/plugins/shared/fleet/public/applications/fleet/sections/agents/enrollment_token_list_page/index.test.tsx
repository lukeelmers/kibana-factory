/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { RenderResult } from '@testing-library/react';
import { act, waitFor } from '@testing-library/react';

import { createFleetTestRendererMock } from '../../../../../mock';

import { EnrollmentTokenListPage } from '.';

const mockUseGetEnrollmentAPIKeysQuery = jest.fn();
const mockUseGetAgentPolicies = jest.fn();

jest.mock('../../../hooks', () => ({
  ...jest.requireActual('../../../hooks'),
  useGetEnrollmentAPIKeysQuery: (...args: any[]) => mockUseGetEnrollmentAPIKeysQuery(...args),
  useGetAgentPolicies: (...args: any[]) => mockUseGetAgentPolicies(...args),
  sendGetOneEnrollmentAPIKey: jest.fn(),
  sendDeleteOneEnrollmentAPIKey: jest.fn(),
  useBreadcrumbs: jest.fn(),
  useStartServices: jest.fn().mockReturnValue({
    notifications: {
      toasts: {
        addError: jest.fn(),
      },
    },
    cloud: {},
  }),
  usePagination: jest.fn().mockReturnValue({
    pagination: { currentPage: 1, pageSize: 20 },
    setPagination: jest.fn(),
    pageSizeOptions: [20, 50, 100],
  }),
}));

jest.mock('../../../components', () => ({
  NewEnrollmentTokenModal: () => null,
}));

jest.mock('../../../components/search_bar', () => ({
  SearchBar: () => <div data-test-subj="mockSearchBar" />,
}));

jest.mock('../../../layouts', () => ({
  DefaultLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const MANAGED_POLICY = {
  id: 'managed-policy',
  name: 'Elastic Cloud agent policy',
  is_managed: true,
  supports_agentless: false,
};

const REGULAR_POLICY = {
  id: 'regular-policy',
  name: 'Default policy',
  is_managed: false,
  supports_agentless: false,
};

const AGENTLESS_POLICY = {
  id: 'agentless-policy',
  name: 'Agentless policy',
  is_managed: false,
  supports_agentless: true,
};

const MANAGED_TOKEN = {
  id: 'token-managed',
  name: 'Managed token',
  api_key: 'abc123',
  policy_id: 'managed-policy',
  active: true,
  created_at: '2024-01-01T00:00:00.000Z',
};

const REGULAR_TOKEN = {
  id: 'token-regular',
  name: 'Regular token',
  api_key: 'def456',
  policy_id: 'regular-policy',
  active: true,
  created_at: '2024-01-01T00:00:00.000Z',
};

const AGENTLESS_TOKEN = {
  id: 'token-agentless',
  name: 'Agentless token',
  api_key: 'ghi789',
  policy_id: 'agentless-policy',
  active: true,
  created_at: '2024-01-01T00:00:00.000Z',
};

function renderEnrollmentTokenList() {
  const renderer = createFleetTestRendererMock();
  const utils = renderer.render(<EnrollmentTokenListPage />);
  return { utils };
}

describe('EnrollmentTokenListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading states', () => {
    it('should show loading when enrollment keys are initially loading', async () => {
      mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
        isInitialLoading: true,
        data: undefined,
        refetch: jest.fn(),
      });
      mockUseGetAgentPolicies.mockReturnValue({
        isLoading: false,
        data: { items: [REGULAR_POLICY] },
      });

      let utils: RenderResult;
      await act(async () => {
        ({ utils } = renderEnrollmentTokenList());
      });

      expect(utils!.getByText('Loading enrollment tokens...')).toBeInTheDocument();
    });

    it('should show loading when agent policies are loading and no cached data exists', async () => {
      mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
        isInitialLoading: false,
        data: { items: [REGULAR_TOKEN, MANAGED_TOKEN], total: 2 },
        refetch: jest.fn(),
      });
      mockUseGetAgentPolicies.mockReturnValue({
        isLoading: true,
        data: undefined,
      });

      let utils: RenderResult;
      await act(async () => {
        ({ utils } = renderEnrollmentTokenList());
      });

      expect(utils!.getByText('Loading enrollment tokens...')).toBeInTheDocument();
    });

    it('should NOT show loading when agent policies are loading but cached data exists', async () => {
      mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
        isInitialLoading: false,
        data: { items: [REGULAR_TOKEN], total: 1 },
        refetch: jest.fn(),
      });
      mockUseGetAgentPolicies.mockReturnValue({
        isLoading: true,
        data: { items: [REGULAR_POLICY] },
      });

      let utils: RenderResult;
      await act(async () => {
        ({ utils } = renderEnrollmentTokenList());
      });

      expect(utils!.queryByText('Loading enrollment tokens...')).not.toBeInTheDocument();
    });
  });

  describe('filtering managed and agentless tokens', () => {
    it('should display tokens for regular (non-managed, non-agentless) policies', async () => {
      mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
        isInitialLoading: false,
        data: { items: [REGULAR_TOKEN], total: 1 },
        refetch: jest.fn(),
      });
      mockUseGetAgentPolicies.mockReturnValue({
        isLoading: false,
        data: { items: [REGULAR_POLICY] },
      });

      let utils: RenderResult;
      await act(async () => {
        ({ utils } = renderEnrollmentTokenList());
      });

      expect(utils!.getByText('Regular token')).toBeInTheDocument();
    });

    it('should filter out tokens for managed policies', async () => {
      mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
        isInitialLoading: false,
        data: { items: [REGULAR_TOKEN, MANAGED_TOKEN], total: 2 },
        refetch: jest.fn(),
      });
      mockUseGetAgentPolicies.mockReturnValue({
        isLoading: false,
        data: { items: [REGULAR_POLICY, MANAGED_POLICY] },
      });

      let utils: RenderResult;
      await act(async () => {
        ({ utils } = renderEnrollmentTokenList());
      });

      expect(utils!.getByText('Regular token')).toBeInTheDocument();
      expect(utils!.queryByText('Managed token')).not.toBeInTheDocument();
    });

    it('should filter out tokens for agentless policies', async () => {
      mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
        isInitialLoading: false,
        data: { items: [REGULAR_TOKEN, AGENTLESS_TOKEN], total: 2 },
        refetch: jest.fn(),
      });
      mockUseGetAgentPolicies.mockReturnValue({
        isLoading: false,
        data: { items: [REGULAR_POLICY, AGENTLESS_POLICY] },
      });

      let utils: RenderResult;
      await act(async () => {
        ({ utils } = renderEnrollmentTokenList());
      });

      expect(utils!.getByText('Regular token')).toBeInTheDocument();
      expect(utils!.queryByText('Agentless token')).not.toBeInTheDocument();
    });

    it('should not render any tokens when agent policies have not loaded yet', async () => {
      mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
        isInitialLoading: false,
        data: { items: [REGULAR_TOKEN, MANAGED_TOKEN], total: 2 },
        refetch: jest.fn(),
      });
      mockUseGetAgentPolicies.mockReturnValue({
        isLoading: true,
        data: undefined,
      });

      let utils: RenderResult;
      await act(async () => {
        ({ utils } = renderEnrollmentTokenList());
      });

      // The table should be in a loading state, not showing unfiltered tokens
      expect(utils!.queryByText('Regular token')).not.toBeInTheDocument();
      expect(utils!.queryByText('Managed token')).not.toBeInTheDocument();
    });
  });
});
