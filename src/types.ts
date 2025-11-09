// Common interfaces
export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  status?: string;
  url: string;
  assignee?: string;
  createdAt?: string | Date;
  team?: {
    id: string;
    name: string;
    key: string;
  };
  project?: {
    id: string;
    name: string;
    url?: string;
    status?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  key: string;
  description?: string;
}

// Request interfaces
export interface SearchIssuesArgs {
  query: string;
  teamId?: string;
  status?: string;
  assigneeId?: string;
  limit?: number;
}

export interface CreateIssueArgs {
  teamId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: number;
}

// Response interfaces
export interface SearchIssuesResponse {
  issues: Issue[];
}

export interface CreateIssueResponse {
  id: string;
  identifier: string;
  title: string;
  url: string;
}

export interface UpdateIssueArgs {
  issueId: string;
  title?: string;
  description?: string;
  assigneeId?: string | null;
  priority?: number;
  stateId?: string;
}

export interface UpdateIssueResponse {
  id: string;
  identifier: string;
  title: string;
  url: string;
  status?: string;
}

export interface GetTeamsResponse {
  teams: Team[];
}

export interface GetIssueArgs {
  issueId: string;
}

export interface GetWorkflowStatesArgs {
  teamId: string;
}

export interface AddCommentArgs {
  issueId: string;
  body: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  type: string;
  description?: string;
  position: number;
}

export interface GetWorkflowStatesResponse {
  states: WorkflowState[];
}

export interface AddCommentResponse {
  id: string;
  body: string;
  createdAt: string;
  issueId: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  apiConnected: boolean;
  userId?: string;
  userName?: string;
  error?: string;
} 