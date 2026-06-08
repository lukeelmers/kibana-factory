/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';

import { createFleetTestRendererMock } from '../../../../../mock';

import { EnrollmentTokenListPage } from '.';

const mockedUseGetEnrollmentAPIKeysQuery = jest.fn();
const mockedUseGetAgentPolicies = jest.fn();

jest.mock('../../../hooks', () => ({
  ...jest.requireActual('../../../hooks'),
  useGetEnrollmentAPIKeysQuery: (...args: any[]) => mockedUseGetEnrollmentAPIKeysQuery(...args),
  useGetAgentPolicies: (...args: any[]) => mockedUseGetAgentPolicies(...args),
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
    docLinks: { links: { kibana: { secureSavedObject: 'my-link' } } },
  }),
  usePagination: jest.fn().mockReturnValue({
    pagination: { currentPage: 1, pageSize: 20 },
    setPagination: jest.fn(),
    pageSizeOptions: [20, 50, 100],
  }),
}));

const unmanagedPolicy = {
  id: 'policy1',
  name: 'Agent policy 1',
  is_managed: false,
  supports_agentless: false,
};

const managedPolicy = {
  id: 'managed-policy',
  name: 'Elastic Cloud agent policy',
  is_managed: true,
  supports_agentless: false,
};

const agentlessPolicy = {
  id: 'agentless-policy',
  name: 'Agentless policy',
  is_managed: false,
  supports_agentless: true,
};

const enrollmentTokens = [
  {
    id: 'token1',
    api_key_id: 'key1',
    api_key: 'abc123',
    name: 'Token for policy1',
    policy_id: 'policy1',
    active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'token2',
    api_key_id: 'key2',
    api_key: 'def456',
    name: 'Token for managed policy',
    policy_id: 'managed-policy',
    active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'token3',
    api_key_id: 'key3',
    api_key: 'ghi789',
    name: 'Token for agentless policy',
    policy_id: 'agentless-policy',
    active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

describe('EnrollmentTokenListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state when agent policies are still loading', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: enrollmentTokens, total: 3 },
      isInitialLoading: false,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const renderer = createFleetTestRendererMock();
    let utils: ReturnType<typeof renderer.render>;

    await act(async () => {
      utils = renderer.render(<EnrollmentTokenListPage />);
    });

    expect(utils!.getByText('Loading enrollment tokens...')).toBeInTheDocument();
  });

  it('should show loading state when enrollment keys are initially loading', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: undefined,
      isInitialLoading: true,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: { items: [unmanagedPolicy, managedPolicy, agentlessPolicy] },
      isLoading: false,
    });

    const renderer = createFleetTestRendererMock();
    let utils: ReturnType<typeof renderer.render>;

    await act(async () => {
      utils = renderer.render(<EnrollmentTokenListPage />);
    });

    expect(utils!.getByText('Loading enrollment tokens...')).toBeInTheDocument();
  });

  it('should filter out managed and agentless policy tokens when both queries are loaded', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: enrollmentTokens, total: 3 },
      isInitialLoading: false,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: { items: [unmanagedPolicy, managedPolicy, agentlessPolicy] },
      isLoading: false,
    });

    const renderer = createFleetTestRendererMock();
    let utils: ReturnType<typeof renderer.render>;

    await act(async () => {
      utils = renderer.render(<EnrollmentTokenListPage />);
    });

    await waitFor(() => {
      // Only the unmanaged policy token should be visible
      expect(utils!.getByText('Token for policy1')).toBeInTheDocument();
      expect(utils!.queryByText('Token for managed policy')).not.toBeInTheDocument();
      expect(utils!.queryByText('Token for agentless policy')).not.toBeInTheDocument();
    });
  });

  it('should not briefly show managed tokens when agent policies are refetching', async () => {
    // Simulate a refetch scenario: enrollment keys are cached, but agent policies are refetching
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: enrollmentTokens, total: 3 },
      isInitialLoading: false,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: { items: [unmanagedPolicy, managedPolicy, agentlessPolicy] },
      isLoading: true, // refetching
    });

    const renderer = createFleetTestRendererMock();
    let utils: ReturnType<typeof renderer.render>;

    await act(async () => {
      utils = renderer.render(<EnrollmentTokenListPage />);
    });

    // Should show loading state, not the token list
    expect(utils!.getByText('Loading enrollment tokens...')).toBeInTheDocument();
    expect(utils!.queryByText('Token for managed policy')).not.toBeInTheDocument();
  });
});
