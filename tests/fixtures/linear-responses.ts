import type { Issue } from '../../src/types.js';

// Mock Linear SDK responses
export const mockLinearTeams = [
  {
    id: 'team-1',
    name: 'Engineering',
    key: 'ENG',
    description: 'Engineering team',
  },
  {
    id: 'team-2',
    name: 'Product',
    key: 'PRO',
    description: 'Product team',
  },
];

export const mockLinearIssues = [
  {
    id: 'issue-1',
    identifier: 'ENG-123',
    title: 'Fix login bug',
    description: 'Users cannot log in',
    url: 'https://linear.app/team/issue/ENG-123',
    createdAt: '2023-01-01T00:00:00.000Z',
    state: Promise.resolve({ id: 'state-1', name: 'In Progress' }),
    assignee: Promise.resolve({ id: 'user-1', name: 'John Doe' }),
    team: Promise.resolve({ id: 'team-1', name: 'Engineering', key: 'ENG' }),
    project: Promise.resolve({
      id: 'project-1',
      name: 'Core Platform',
      url: 'https://linear.app/project/project-1',
      state: 'Active',
    }),
  },
  {
    id: 'issue-2',
    identifier: 'PRO-456',
    title: 'User onboarding improvements',
    description: 'Improve the user onboarding flow',
    url: 'https://linear.app/team/issue/PRO-456',
    createdAt: '2023-01-02T00:00:00.000Z',
    state: Promise.resolve({ id: 'state-2', name: 'Backlog' }),
    assignee: Promise.resolve(null),
    team: Promise.resolve({ id: 'team-2', name: 'Product', key: 'PRO' }),
    project: Promise.resolve(null),
  },
];

export const mockFormattedIssues: Issue[] = [
  {
    id: 'issue-1',
    identifier: 'ENG-123',
    title: 'Fix login bug',
    description: 'Users cannot log in',
    status: 'In Progress',
    url: 'https://linear.app/team/issue/ENG-123',
    assignee: 'John Doe',
    createdAt: '2023-01-01T00:00:00.000Z',
    team: {
      id: 'team-1',
      name: 'Engineering',
      key: 'ENG',
    },
    project: {
      id: 'project-1',
      name: 'Core Platform',
      url: 'https://linear.app/project/project-1',
      status: 'Active',
    },
  },
  {
    id: 'issue-2',
    identifier: 'PRO-456',
    title: 'User onboarding improvements',
    description: 'Improve the user onboarding flow',
    status: 'Backlog',
    url: 'https://linear.app/team/issue/PRO-456',
    assignee: undefined,
    createdAt: '2023-01-02T00:00:00.000Z',
    team: {
      id: 'team-2',
      name: 'Product',
      key: 'PRO',
    },
    project: undefined,
  },
];

export const mockViewer = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
};

export const mockCreatedIssue = {
  id: 'new-issue-1',
  identifier: 'ENG-999',
  title: 'New test issue',
  url: 'https://linear.app/team/issue/ENG-999',
};

export const mockUpdatedIssue = {
  id: 'issue-1',
  identifier: 'ENG-123',
  title: 'Updated issue title',
  url: 'https://linear.app/team/issue/ENG-123',
  state: Promise.resolve({ id: 'state-3', name: 'Done' }),
};
