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
  useBreadcrumbs: jest.fn(),
  usePagination: jest.fn().mockReturnValue({
    pagination: { currentPage: 1, pageSize: 20 },
    setPagination: jest.fn(),
    pageSizeOptions: [20, 50, 100],
  }),
  useGetEnrollmentAPIKeysQuery: (...args: any[]) => mockUseGetEnrollmentAPIKeysQuery(...args),
  useGetAgentPolicies: (...args: any[]) => mockUseGetAgentPolicies(...args),
  sendGetOneEnrollmentAPIKey: jest.fn(),
  sendDeleteOneEnrollmentAPIKey: jest.fn(),
  useStartServices: jest.fn().mockReturnValue({
    notifications: {
      toasts: {
        addError: jest.fn(),
      },
    },
    cloud: {},
    docLinks: { links: { kibana: { secureSavedObject: 'my-link' } } },
  }),
  useLink: jest.fn().mockReturnValue({ getHref: jest.fn() }),
  useAuthz: jest
    .fn()
    .mockReturnValue({ fleet: { all: true, allAgents: true, readAgents: true }, integrations: {} }),
  useFleetStatus: jest.fn().mockReturnValue({}),
  FleetStatusProvider: (props: any) => props.children,
  UIExtensionsContext: {
    Provider: (props: any) => props.children,
  },
}));

jest.mock('../../../components/search_bar', () => ({
  SearchBar: () => <>SearchBar</>,
}));

jest.mock('../../../layouts', () => ({
  DefaultLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const enrollmentTokens = [
  {
    id: 'token-1',
    name: 'Default token',
    api_key: 'api-key-1',
    policy_id: 'policy-1',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'token-2',
    name: 'Cloud managed token',
    api_key: 'api-key-2',
    policy_id: 'managed-policy',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'token-3',
    name: 'Agentless token',
    api_key: 'api-key-3',
    policy_id: 'agentless-policy',
    active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const agentPolicies = [
  { id: 'policy-1', name: 'Default policy', is_managed: false, supports_agentless: false },
  {
    id: 'managed-policy',
    name: 'Elastic Cloud agent policy',
    is_managed: true,
    supports_agentless: false,
  },
  {
    id: 'agentless-policy',
    name: 'Agentless policy',
    is_managed: false,
    supports_agentless: true,
  },
];

function renderPage() {
  const renderer = createFleetTestRendererMock();
  return renderer.render(<EnrollmentTokenListPage />);
}

describe('EnrollmentTokenListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter out managed and agentless policy tokens', async () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: enrollmentTokens, total: enrollmentTokens.length },
      isInitialLoading: false,
      refetch: jest.fn(),
    });
    mockUseGetAgentPolicies.mockReturnValue({
      data: { items: agentPolicies },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: RenderResult;
    await act(async () => {
      utils = renderPage();
    });

    await waitFor(() => {
      expect(utils!.getByText('Default token')).toBeInTheDocument();
    });

    expect(utils!.queryByText('Cloud managed token')).not.toBeInTheDocument();
    expect(utils!.queryByText('Agentless token')).not.toBeInTheDocument();
  });

  it('should not show unfiltered rows while agent policies are still loading', async () => {
    // Enrollment keys have resolved, but agent policies are still loading.
    // This is the scenario that caused the flicker bug.
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: enrollmentTokens, total: enrollmentTokens.length },
      isInitialLoading: false,
      refetch: jest.fn(),
    });
    mockUseGetAgentPolicies.mockReturnValue({
      data: undefined,
      isLoading: true,
      isInitialRequest: false,
    });

    let utils: RenderResult;
    await act(async () => {
      utils = renderPage();
    });

    // The table should be in a loading state, not showing any token names
    expect(utils!.getByText('Loading enrollment tokens...')).toBeInTheDocument();
    expect(utils!.queryByText('Default token')).not.toBeInTheDocument();
    expect(utils!.queryByText('Cloud managed token')).not.toBeInTheDocument();
    expect(utils!.queryByText('Agentless token')).not.toBeInTheDocument();
  });

  it('should show loading state during initial load of enrollment keys', async () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: undefined,
      isInitialLoading: true,
      refetch: jest.fn(),
    });
    mockUseGetAgentPolicies.mockReturnValue({
      data: undefined,
      isLoading: true,
      isInitialRequest: true,
    });

    let utils: RenderResult;
    await act(async () => {
      utils = renderPage();
    });

    expect(utils!.getByText('Loading enrollment tokens...')).toBeInTheDocument();
  });

  it('should render tokens once both data sources are loaded', async () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: {
        items: [enrollmentTokens[0]], // Only the non-managed, non-agentless token
        total: 1,
      },
      isInitialLoading: false,
      refetch: jest.fn(),
    });
    mockUseGetAgentPolicies.mockReturnValue({
      data: { items: agentPolicies },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: RenderResult;
    await act(async () => {
      utils = renderPage();
    });

    await waitFor(() => {
      expect(utils!.getByText('Default token')).toBeInTheDocument();
      expect(utils!.getByText('Default policy')).toBeInTheDocument();
    });
  });

  it('should show empty message when no tokens match filter', async () => {
    mockUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      data: { items: [], total: 0 },
      isInitialLoading: false,
      refetch: jest.fn(),
    });
    mockUseGetAgentPolicies.mockReturnValue({
      data: { items: agentPolicies },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: RenderResult;
    await act(async () => {
      utils = renderPage();
    });

    expect(utils!.getByText('No enrollment tokens found.')).toBeInTheDocument();
  });
});
