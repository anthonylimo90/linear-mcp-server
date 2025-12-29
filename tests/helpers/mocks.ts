import { jest } from '@jest/globals';
import {
  mockLinearTeams,
  mockLinearIssues,
  mockViewer,
  mockCreatedIssue,
  mockUpdatedIssue,
} from '../fixtures/linear-responses.js';

// Mock Linear SDK with explicit typing
export const mockLinearClient: any = {
  teams: jest.fn().mockResolvedValue({ nodes: mockLinearTeams }),
  issues: jest.fn().mockResolvedValue({ nodes: mockLinearIssues }),
  createIssue: jest.fn().mockResolvedValue({ issue: mockCreatedIssue }),
  updateIssue: jest.fn().mockResolvedValue({ issue: mockUpdatedIssue }),
  viewer: mockViewer,
};

// Mock the Linear SDK module
export const mockLinearSdk = () => {
  jest.unstable_mockModule('@linear/sdk', () => ({
    LinearClient: jest.fn(() => mockLinearClient),
  }));
};

// Mock logger to prevent output during tests
export const mockLogger = {
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock the logger module
export const mockLoggerModule = () => {
  jest.unstable_mockModule('../src/utils/logger.js', () => ({
    logger: mockLogger,
    AppError: jest.fn(),
    handleError: jest.fn(),
  }));
};

// Reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks();

  // Reset Linear client mocks
  mockLinearClient.teams.mockResolvedValue({ nodes: mockLinearTeams });
  mockLinearClient.issues.mockResolvedValue({ nodes: mockLinearIssues });
  mockLinearClient.createIssue.mockResolvedValue({ issue: mockCreatedIssue });
  mockLinearClient.updateIssue.mockResolvedValue({ issue: mockUpdatedIssue });

  // Reset logger mocks
  Object.values(mockLogger).forEach((mock: any) => mock.mockClear());
};

// Helper to mock Linear API errors
export const mockLinearError = (
  method: 'teams' | 'issues' | 'createIssue' | 'updateIssue',
  error: Error
) => {
  mockLinearClient[method].mockRejectedValueOnce(error);
};

// Helper to create custom Linear responses
export const mockLinearResponse = (
  method: 'teams' | 'issues' | 'createIssue' | 'updateIssue',
  response: any
) => {
  mockLinearClient[method].mockResolvedValueOnce(response);
};

// Helper to verify API calls
export const expectLinearCall = (
  method: 'teams' | 'issues' | 'createIssue' | 'updateIssue',
  ...args: any[]
) => {
  expect(mockLinearClient[method]).toHaveBeenCalledWith(...args);
};

// Helper to verify logger calls
export const expectLoggerCall = (level: keyof typeof mockLogger, message: string) => {
  expect(mockLogger[level]).toHaveBeenCalledWith(
    expect.stringContaining(message),
    expect.any(Object)
  );
};
