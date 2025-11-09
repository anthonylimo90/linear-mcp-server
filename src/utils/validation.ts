import { z } from 'zod';

/**
 * Zod validation schemas for MCP tool inputs
 */

// Search issues schema
export const SearchIssuesSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  teamId: z.string().optional(),
  status: z.string().optional(),
  assigneeId: z.string().optional(),
  limit: z.number().int().min(1).max(250).optional().default(50),
});

// Create issue schema
export const CreateIssueSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.number().int().min(0).max(4).optional(),
});

// Update issue schema
export const UpdateIssueSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(4).optional(),
  stateId: z.string().optional(),
});

// Get my issues schema
export const GetMyIssuesSchema = z.object({
  limit: z.number().int().min(1).max(250).optional().default(50),
});

// Get issue by ID schema
export const GetIssueSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
});

// Get workflow states schema
export const GetWorkflowStatesSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
});

// Add comment schema
export const AddCommentSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
  body: z.string().min(1, 'Comment body is required'),
});

// Type exports
export type SearchIssuesInput = z.infer<typeof SearchIssuesSchema>;
export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
export type GetMyIssuesInput = z.infer<typeof GetMyIssuesSchema>;
export type GetIssueInput = z.infer<typeof GetIssueSchema>;
export type GetWorkflowStatesInput = z.infer<typeof GetWorkflowStatesSchema>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
