/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';

import { createFleetTestRendererMock } from '../../../../../mock';
import { useGetEnrollmentAPIKeysQuery, useGetAgentPolicies } from '../../../hooks';

import { EnrollmentTokenListPage } from '.';

jest.mock('../../../hooks', () => ({
  ...jest.requireActual('../../../hooks'),
  useBreadcrumbs: jest.fn(),
  usePagination: jest.fn().mockReturnValue({
    pagination: { currentPage: 1, pageSize: 20 },
    setPagination: jest.fn(),
    pageSizeOptions: [20, 50],
  }),
  useGetEnrollmentAPIKeysQuery: jest.fn(),
  useGetAgentPolicies: jest.fn(),
  sendGetOneEnrollmentAPIKey: jest.fn(),
  sendDeleteOneEnrollmentAPIKey: jest.fn(),
  useStartServices: jest.fn().mockReturnValue({
    notifications: {
      toasts: {
        addError: jest.fn(),
      },
    },
  }),
}));

const mockedUseGetEnrollmentAPIKeysQuery = useGetEnrollmentAPIKeysQuery as jest.Mock;
const mockedUseGetAgentPolicies = useGetAgentPolicies as jest.Mock;

function renderEnrollmentTokenList() {
  const renderer = createFleetTestRendererMock();
  const utils = renderer.render(<EnrollmentTokenListPage />);
  return { utils };
}

describe('EnrollmentTokenListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not display tokens for policies the user does not have access to', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      isInitialLoading: false,
      data: {
        items: [
          { id: 'token1', name: 'Token 1', policy_id: 'accessible_policy', active: true },
          { id: 'token2', name: 'Cloud Token', policy_id: 'cloud_policy_not_accessible', active: true },
        ],
        total: 2,
      },
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [
          { id: 'accessible_policy', name: 'My Policy', is_managed: false, supports_agentless: false },
        ],
      },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: any;
    await act(async () => {
      ({ utils } = renderEnrollmentTokenList());
    });

    await waitFor(() => {
      expect(utils.queryByText('Token 1')).toBeInTheDocument();
    });
    expect(utils.queryByText('Cloud Token')).not.toBeInTheDocument();
  });

  it('should not display tokens for managed policies', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      isInitialLoading: false,
      data: {
        items: [
          { id: 'token1', name: 'Token 1', policy_id: 'normal_policy', active: true },
          { id: 'token2', name: 'Managed Token', policy_id: 'managed_policy', active: true },
        ],
        total: 2,
      },
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [
          { id: 'normal_policy', name: 'Normal Policy', is_managed: false, supports_agentless: false },
          { id: 'managed_policy', name: 'Managed Policy', is_managed: true, supports_agentless: false },
        ],
      },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: any;
    await act(async () => {
      ({ utils } = renderEnrollmentTokenList());
    });

    await waitFor(() => {
      expect(utils.queryByText('Token 1')).toBeInTheDocument();
    });
    expect(utils.queryByText('Managed Token')).not.toBeInTheDocument();
  });

  it('should not display tokens for agentless policies', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      isInitialLoading: false,
      data: {
        items: [
          { id: 'token1', name: 'Token 1', policy_id: 'normal_policy', active: true },
          { id: 'token2', name: 'Agentless Token', policy_id: 'agentless_policy', active: true },
        ],
        total: 2,
      },
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [
          { id: 'normal_policy', name: 'Normal Policy', is_managed: false, supports_agentless: false },
          { id: 'agentless_policy', name: 'Agentless Policy', is_managed: false, supports_agentless: true },
        ],
      },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: any;
    await act(async () => {
      ({ utils } = renderEnrollmentTokenList());
    });

    await waitFor(() => {
      expect(utils.queryByText('Token 1')).toBeInTheDocument();
    });
    expect(utils.queryByText('Agentless Token')).not.toBeInTheDocument();
  });

  it('should not display tokens without a policy_id', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      isInitialLoading: false,
      data: {
        items: [
          { id: 'token1', name: 'Token 1', policy_id: 'normal_policy', active: true },
          { id: 'token2', name: 'Orphan Token', policy_id: undefined, active: true },
        ],
        total: 2,
      },
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [
          { id: 'normal_policy', name: 'Normal Policy', is_managed: false, supports_agentless: false },
        ],
      },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: any;
    await act(async () => {
      ({ utils } = renderEnrollmentTokenList());
    });

    await waitFor(() => {
      expect(utils.queryByText('Token 1')).toBeInTheDocument();
    });
    expect(utils.queryByText('Orphan Token')).not.toBeInTheDocument();
  });

  it('should display all accessible non-managed, non-agentless tokens', async () => {
    mockedUseGetEnrollmentAPIKeysQuery.mockReturnValue({
      isInitialLoading: false,
      data: {
        items: [
          { id: 'token1', name: 'Token A', policy_id: 'policy1', active: true },
          { id: 'token2', name: 'Token B', policy_id: 'policy2', active: true },
        ],
        total: 2,
      },
      refetch: jest.fn(),
    });
    mockedUseGetAgentPolicies.mockReturnValue({
      data: {
        items: [
          { id: 'policy1', name: 'Policy 1', is_managed: false, supports_agentless: false },
          { id: 'policy2', name: 'Policy 2', is_managed: false, supports_agentless: false },
        ],
      },
      isLoading: false,
      isInitialRequest: false,
    });

    let utils: any;
    await act(async () => {
      ({ utils } = renderEnrollmentTokenList());
    });

    await waitFor(() => {
      expect(utils.queryByText('Token A')).toBeInTheDocument();
      expect(utils.queryByText('Token B')).toBeInTheDocument();
    });
  });
});
