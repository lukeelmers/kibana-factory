/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen } from '@testing-library/react';

import { createFleetTestRendererMock } from '../../../../../mock';

import { useGetEnrollmentAPIKeysQuery, useGetAgentPolicies } from '../../../hooks';

import { EnrollmentTokenListPage } from '.';

jest.mock('../../../hooks', () => ({
  ...jest.requireActual('../../../hooks'),
  useGetEnrollmentAPIKeysQuery: jest.fn(),
  useGetAgentPolicies: jest.fn(),
  useBreadcrumbs: jest.fn(),
  usePagination: jest.fn().mockReturnValue({
    pagination: { currentPage: 1, pageSize: 20 },
    setPagination: jest.fn(),
    pageSizeOptions: [20, 50, 100],
  }),
  useStartServices: jest.fn().mockReturnValue({
    notifications: { toasts: { addError: jest.fn() } },
  }),
  sendGetOneEnrollmentAPIKey: jest.fn(),
  sendDeleteOneEnrollmentAPIKey: jest.fn(),
}));

jest.mock('../../../components', () => ({
  NewEnrollmentTokenModal: () => null,
}));

jest.mock('../../../components/search_bar', () => ({
  SearchBar: () => <input data-testid="searchBar" />,
}));

jest.mock('../../../layouts', () => ({
  DefaultLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseGetEnrollmentAPIKeysQuery = useGetEnrollmentAPIKeysQuery as jest.MockedFunction<
  typeof useGetEnrollmentAPIKeysQuery
>;
const mockUseGetAgentPolicies = useGetAgentPolicies as jest.MockedFunction<
  typeof useGetAgentPolicies
>;

const createMockEnrollmentKey = (id: string, name: string, policyId: string) => ({
  id,
  name,
  api_key_id: `api-key-${id}`,
  api_key: `secret-${id}`,
  policy_id: policyId,
  active: true,
  created_at: '2024-01-01T00:00:00.000Z',
});

const createMockAgentPolicy = (
  id: string,
  name: string,
  { is_managed = false, supports_agentless = false } = {}
) => ({
  id,
  name,
  namespace: 'default',
  is_managed,
  supports_agentless,
  status: 'active' as const,
  updated_at: '2024-01-01T00:00:00.000Z',
  updated_by: 'system',
  revision: 1,
  is_protected: false,
});

describe('EnrollmentTokenListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not display managed policy tokens', () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: {
        items: [
          createMockEnrollmentKey('token-1', 'Normal Token', 'policy-1'),
          createMockEnrollmentKey('token-2', 'Cloud Managed Token', 'cloud-policy'),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      },
      isInitialLoading: false,
      refetch: jest.fn(),
    } as any);

    mockUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [
          createMockAgentPolicy('policy-1', 'Normal Policy'),
          createMockAgentPolicy('cloud-policy', 'Elastic Cloud Policy', { is_managed: true }),
        ],
        total: 2,
        page: 1,
        perPage: 100,
      },
      isLoading: false,
      isInitialRequest: false,
    } as any);

    const renderer = createFleetTestRendererMock();
    renderer.render(<EnrollmentTokenListPage />);

    expect(screen.getByText('Normal Token')).toBeInTheDocument();
    expect(screen.queryByText('Cloud Managed Token')).not.toBeInTheDocument();
  });

  it('should not display agentless policy tokens', () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: {
        items: [
          createMockEnrollmentKey('token-1', 'Normal Token', 'policy-1'),
          createMockEnrollmentKey('token-3', 'Agentless Token', 'agentless-policy'),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      },
      isInitialLoading: false,
      refetch: jest.fn(),
    } as any);

    mockUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [
          createMockAgentPolicy('policy-1', 'Normal Policy'),
          createMockAgentPolicy('agentless-policy', 'Agentless Policy', {
            supports_agentless: true,
          }),
        ],
        total: 2,
        page: 1,
        perPage: 100,
      },
      isLoading: false,
      isInitialRequest: false,
    } as any);

    const renderer = createFleetTestRendererMock();
    renderer.render(<EnrollmentTokenListPage />);

    expect(screen.getByText('Normal Token')).toBeInTheDocument();
    expect(screen.queryByText('Agentless Token')).not.toBeInTheDocument();
  });

  it('should show loading state when agent policies are still loading', () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: {
        items: [
          createMockEnrollmentKey('token-1', 'Normal Token', 'policy-1'),
          createMockEnrollmentKey('token-2', 'Cloud Managed Token', 'cloud-policy'),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      },
      isInitialLoading: false,
      refetch: jest.fn(),
    } as any);

    mockUseGetAgentPolicies.mockReturnValue({
      data: undefined,
      isLoading: true,
      isInitialRequest: false,
    } as any);

    const renderer = createFleetTestRendererMock();
    renderer.render(<EnrollmentTokenListPage />);

    // Should show loading message, not the unfiltered token list
    expect(screen.getByText('Loading enrollment tokens...')).toBeInTheDocument();
    expect(screen.queryByText('Normal Token')).not.toBeInTheDocument();
    expect(screen.queryByText('Cloud Managed Token')).not.toBeInTheDocument();
  });

  it('should not show tokens when agent policies data is empty (not yet loaded)', () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: {
        items: [
          createMockEnrollmentKey('token-1', 'Normal Token', 'policy-1'),
          createMockEnrollmentKey('token-2', 'Cloud Managed Token', 'cloud-policy'),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      },
      isInitialLoading: false,
      refetch: jest.fn(),
    } as any);

    // Agent policies returned but with empty items (edge case)
    mockUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        perPage: 100,
      },
      isLoading: false,
      isInitialRequest: false,
    } as any);

    const renderer = createFleetTestRendererMock();
    renderer.render(<EnrollmentTokenListPage />);

    // With no agent policies, the guard should prevent any tokens from rendering
    expect(screen.queryByText('Normal Token')).not.toBeInTheDocument();
    expect(screen.queryByText('Cloud Managed Token')).not.toBeInTheDocument();
  });

  it('should show loading when agent policies are refetching (non-initial request)', () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: {
        items: [
          createMockEnrollmentKey('token-1', 'Normal Token', 'policy-1'),
          createMockEnrollmentKey('token-2', 'Cloud Managed Token', 'cloud-policy'),
        ],
        total: 2,
        page: 1,
        perPage: 20,
      },
      isInitialLoading: false,
      refetch: jest.fn(),
    } as any);

    // Simulates navigating back to the tab: isInitialRequest is false, but isLoading is true
    mockUseGetAgentPolicies.mockReturnValue({
      data: undefined,
      isLoading: true,
      isInitialRequest: false,
    } as any);

    const renderer = createFleetTestRendererMock();
    renderer.render(<EnrollmentTokenListPage />);

    // The fix ensures isLoading includes agentPoliciesRequest.isLoading
    // regardless of isInitialRequest, so managed tokens should NOT flash
    expect(screen.queryByText('Cloud Managed Token')).not.toBeInTheDocument();
  });
});
