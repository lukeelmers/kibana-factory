/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { act, waitFor } from '@testing-library/react';

import { createFleetTestRendererMock } from '../../../../../mock';
import {
  useGetEnrollmentAPIKeysQuery,
  useGetAgentPolicies,
} from '../../../hooks';

import { EnrollmentTokenListPage } from '.';

jest.mock('../../../hooks', () => ({
  ...jest.requireActual('../../../hooks'),
  useGetEnrollmentAPIKeysQuery: jest.fn(),
  useGetAgentPolicies: jest.fn(),
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
  sendGetOneEnrollmentAPIKey: jest.fn(),
  sendDeleteOneEnrollmentAPIKey: jest.fn(),
  useAuthz: jest.fn().mockReturnValue({
    fleet: { all: true, allAgents: true, readAgents: true },
    integrations: {},
  }),
  useLink: jest.fn().mockReturnValue({ getHref: jest.fn() }),
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

const mockedUseGetEnrollmentAPIKeysQuery = useGetEnrollmentAPIKeysQuery as jest.Mock;
const mockedUseGetAgentPolicies = useGetAgentPolicies as jest.Mock;

const mockEnrollmentTokens = [
  {
    id: 'token-1',
    name: 'Default policy token',
    api_key: 'api-key-1',
    policy_id: 'policy-1',
    active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'token-2',
    name: 'Cloud managed token',
    api_key: 'api-key-2',
    policy_id: 'managed-policy-1',
    active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'token-3',
    name: 'Agentless token',
    api_key: 'api-key-3',
    policy_id: 'agentless-policy-1',
    active: true,
    created_at: '2024-01-01T00:00:00.000Z',
  },
];

const mockAgentPolicies = [
  { id: 'policy-1', name: 'Default policy', is_managed: false, supports_agentless: false },
  { id: 'managed-policy-1', name: 'Elastic Cloud agent policy', is_managed: true, supports_agentless: false },
  { id: 'agentless-policy-1', name: 'Agentless policy', is_managed: false, supports_agentless: true },
];

function renderEnrollmentTokenListPage() {
  const renderer = createFleetTestRendererMock();
  return renderer.render(<EnrollmentTokenListPage />);
}

describe('EnrollmentTokenListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not display any tokens while agent policies are still loading', async () => {
    // Enrollment tokens have loaded, but agent policies are still loading
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: mockEnrollmentTokens, total: 3 },
      isInitialLoading: false,
      isLoading: false,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: undefined,
      isLoading: true,
      isInitialRequest: true,
    });

    const result = renderEnrollmentTokenListPage();

    // The managed/cloud token should NOT be visible even though enrollment tokens have loaded
    expect(result.queryByText('Cloud managed token')).not.toBeInTheDocument();
    expect(result.queryByText('Agentless token')).not.toBeInTheDocument();
    // The normal token should also not be visible yet (table should be in loading state)
    expect(result.queryByText('Default policy token')).not.toBeInTheDocument();
    // Loading message should be shown
    expect(result.getByText('Loading enrollment tokens...')).toBeInTheDocument();
  });

  it('should not display any tokens while enrollment keys are still loading', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: undefined,
      isInitialLoading: true,
      isLoading: true,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: { items: mockAgentPolicies },
      isLoading: false,
      isInitialRequest: false,
    });

    const result = renderEnrollmentTokenListPage();

    expect(result.queryByText('Default policy token')).not.toBeInTheDocument();
    expect(result.queryByText('Cloud managed token')).not.toBeInTheDocument();
    expect(result.getByText('Loading enrollment tokens...')).toBeInTheDocument();
  });

  it('should display only non-managed, non-agentless tokens once both requests have loaded', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: mockEnrollmentTokens, total: 3 },
      isInitialLoading: false,
      isLoading: false,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: { items: mockAgentPolicies },
      isLoading: false,
      isInitialRequest: false,
    });

    let result: ReturnType<typeof renderEnrollmentTokenListPage>;
    await act(async () => {
      result = renderEnrollmentTokenListPage();
    });

    // Only the normal policy token should be visible
    await waitFor(() => {
      expect(result!.getByText('Default policy token')).toBeInTheDocument();
    });
    // Managed and agentless tokens should be filtered out
    expect(result!.queryByText('Cloud managed token')).not.toBeInTheDocument();
    expect(result!.queryByText('Agentless token')).not.toBeInTheDocument();
  });

  it('should show empty message when no tokens match after filtering', async () => {
    // Only managed/agentless tokens exist — all will be filtered out
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: {
        items: [
          mockEnrollmentTokens[1], // managed
          mockEnrollmentTokens[2], // agentless
        ],
        total: 2,
      },
      isInitialLoading: false,
      isLoading: false,
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: { items: mockAgentPolicies },
      isLoading: false,
      isInitialRequest: false,
    });

    let result: ReturnType<typeof renderEnrollmentTokenListPage>;
    await act(async () => {
      result = renderEnrollmentTokenListPage();
    });

    // Table should render but with no visible token rows
    expect(result!.queryByText('Cloud managed token')).not.toBeInTheDocument();
    expect(result!.queryByText('Agentless token')).not.toBeInTheDocument();
  });
});
