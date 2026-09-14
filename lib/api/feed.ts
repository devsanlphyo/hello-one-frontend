import { apiClient } from "./client";

export type PostVisibility = "public" | "campus" | "private";

export interface FeedMediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  sortOrder: number;
}

export interface FeedCommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  canDelete: boolean;
  replies?: FeedCommentItem[];
}

export interface FeedPostItem {
  id: string;
  content: string;
  visibility: PostVisibility;
  isAnnouncement: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  school?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  mediaItems: FeedMediaItem[];
  reactionCount: number;
  hasLiked: boolean;
  commentsCount: number;
  comments: FeedCommentItem[];
  canEdit: boolean;
  canDelete: boolean;
}

export interface FeedResponse {
  posts: FeedPostItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryFeedParams {
  schoolId?: string;
  filter?: "all" | "campus" | "public" | "my" | "announcements";
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateFeedPostInput {
  content: string;
  visibility?: PostVisibility;
  schoolId?: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
  files?: File[];
}

/**
 * 1. Fetch Feed (Flow 1 & Flow 2)
 */
export async function fetchFeed(params?: QueryFeedParams): Promise<FeedResponse> {
  const query = new URLSearchParams();
  if (params?.schoolId) query.append("schoolId", params.schoolId);
  if (params?.filter) query.append("filter", params.filter);
  if (params?.search) query.append("search", params.search);
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));

  const qs = query.toString();
  return apiClient.get<FeedResponse>(`/feed${qs ? `?${qs}` : ""}`);
}

/**
 * 2. Create Post (Flow 3 & Flow 4)
 */
export async function createFeedPost(input: CreateFeedPostInput): Promise<FeedPostItem> {
  if (input.files && input.files.length > 0) {
    const formData = new FormData();
    formData.append("content", input.content);
    if (input.visibility) formData.append("visibility", input.visibility);
    if (input.schoolId) formData.append("schoolId", input.schoolId);
    if (input.isAnnouncement !== undefined) {
      formData.append("isAnnouncement", String(input.isAnnouncement));
    }
    if (input.isPinned !== undefined) {
      formData.append("isPinned", String(input.isPinned));
    }
    input.files.forEach((file) => {
      formData.append("files", file);
    });

    return apiClient.upload<FeedPostItem>("/feed", formData);
  }

  return apiClient.post<FeedPostItem>("/feed", {
    content: input.content,
    visibility: input.visibility,
    schoolId: input.schoolId,
    isAnnouncement: input.isAnnouncement,
    isPinned: input.isPinned,
  });
}

/**
 * 3. Update Post (Flow 7 & Flow 8: Own Post?)
 */
export async function updateFeedPost(
  postId: string,
  input: { content: string; visibility?: PostVisibility },
): Promise<FeedPostItem> {
  return apiClient.patch<FeedPostItem>(`/feed/${postId}`, input);
}

/**
 * 4. Delete Post (Flow 5 & Flow 6: Own Post? / Admin Moderation)
 */
export async function deleteFeedPost(
  postId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/feed/${postId}`);
}

/**
 * 5. Toggle Like Reaction
 */
export async function toggleFeedReaction(
  postId: string,
): Promise<{ liked: boolean; reactionCount: number }> {
  return apiClient.post<{ liked: boolean; reactionCount: number }>(`/feed/${postId}/react`, {});
}

/**
 * 6. Add Comment or Reply
 */
export async function addFeedComment(
  postId: string,
  input: { content: string; parentId?: string },
): Promise<FeedCommentItem> {
  return apiClient.post<FeedCommentItem>(`/feed/${postId}/comments`, input);
}

/**
 * 7. Delete Comment
 */
export async function deleteFeedComment(
  commentId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(`/feed/comments/${commentId}`);
}
