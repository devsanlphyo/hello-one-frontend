"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ThumbsUp,
  MessageCircle,
  Smile,
  Video,
  Image as ImageIcon,
  MoreHorizontal,
  X,
  Globe,
  Building,
  Lock,
  Megaphone,
  Pin,
  Edit2,
  Trash2,
  Send,
  CornerDownRight,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  FeedPostItem,
  FeedCommentItem,
  fetchFeed,
  createFeedPost,
  deleteFeedPost,
  toggleFeedReaction,
  addFeedComment,
  deleteFeedComment,
  PostVisibility,
  getMediaUrl,
} from "@/lib/api/feed";
import { fetchSchools, School } from "@/lib/api/schools";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FeedViewProps {
  initialFilter?: "all" | "campus" | "public" | "my" | "announcements";
}

// Facebook Reaction Emojis
const REACTION_EMOJIS = [
  { id: "like", label: "Like", emoji: "👍", color: "text-[#1877F2]" },
  { id: "love", label: "Love", emoji: "❤️", color: "text-[#FA383E]" },
  { id: "care", label: "Care", emoji: "🥰", color: "text-[#F7B125]" },
  { id: "haha", label: "Haha", emoji: "😂", color: "text-[#F7B125]" },
  { id: "wow", label: "Wow", emoji: "😮", color: "text-[#F7B125]" },
  { id: "sad", label: "Sad", emoji: "😢", color: "text-[#F7B125]" },
  { id: "angry", label: "Angry", emoji: "😡", color: "text-[#E24E33]" },
];

// Facebook Colored Post Background Presets
const POST_BACKGROUNDS = [
  { id: "none", label: "Default", class: "" },
  {
    id: "ocean",
    label: "Ocean",
    class:
      "bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[220px]",
  },
  {
    id: "sunset",
    label: "Sunset",
    class:
      "bg-gradient-to-tr from-rose-500 via-amber-500 to-yellow-400 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[220px]",
  },
  {
    id: "berry",
    label: "Berry",
    class:
      "bg-gradient-to-tr from-purple-800 via-pink-600 to-rose-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[220px]",
  },
  {
    id: "emerald",
    label: "Emerald",
    class:
      "bg-gradient-to-tr from-emerald-700 via-teal-600 to-cyan-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[220px]",
  },
  {
    id: "fire",
    label: "Fire",
    class:
      "bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[220px]",
  },
];

export function FeedView({ initialFilter = "all" }: FeedViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isMultiCampus = user?.role === "admin" || user?.role === "director";

  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "campus" | "public" | "my" | "announcements"
  >(initialFilter);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);

  // Expandable post text state ("See more")
  const [expandedTextPostIds, setExpandedTextPostIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpandText = (postId: string) => {
    setExpandedTextPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // Download Image Helper
  const handleDownloadImage = async (imageUrl: string) => {
    try {
      toast.loading("Downloading image...", { id: "download-img" });
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const fileName =
        imageUrl.split("/").pop() || `feed-image-${Date.now()}.png`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Image downloaded successfully", { id: "download-img" });
    } catch (err) {
      console.error("Failed to download image:", err);
      toast.dismiss("download-img");
      window.open(imageUrl, "_blank");
    }
  };

  // Comment Likes map
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
    new Set(),
  );

  // Hover reaction popup tracking
  const [hoverReactionPostId, setHoverReactionPostId] = useState<string | null>(
    null,
  );
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Facebook Create Post Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [selectedBgStyle, setSelectedBgStyle] = useState<string>("none");
  const [newVisibility, setNewVisibility] = useState<PostVisibility>(
    isMultiCampus ? "public" : "campus",
  );
  const [newSchoolId, setNewSchoolId] = useState<string>("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    { name: string; url: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Delete Confirm State
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Comment input states: map of postId -> draft text
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [activeReplyTo, setActiveReplyTo] = useState<
    Record<string, string | null>
  >({});
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Active three-dot menu postId
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  useEffect(() => {
    if (isMultiCampus) {
      fetchSchools()
        .then((res: any) => {
          if (Array.isArray(res)) setSchools(res);
          else if (res?.data) setSchools(res.data);
        })
        .catch(() => {});
    }
  }, [isMultiCampus]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await fetchFeed({
        filter: activeFilter,
        schoolId: isMultiCampus ? selectedSchoolId || undefined : undefined,
      });
      setPosts(res.posts || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [activeFilter, selectedSchoolId]);

  // Handle image files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      toast.error("Maximum 10 images allowed per post.");
      return;
    }

    const updatedFiles = [...selectedFiles, ...files];
    setSelectedFiles(updatedFiles);

    const previews = updatedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setFilePreviews(previews);
    setSelectedBgStyle("none");
    setComposerOpen(true);
    if (e.target) {
      e.target.value = "";
    }
  };

  const removeFile = (idx: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updatedFiles);
    const previews = updatedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setFilePreviews(previews);
  };

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() && selectedFiles.length === 0) {
      toast.error("Please add text or an image to share your post.");
      return;
    }

    setSubmitting(true);
    try {
      await createFeedPost({
        content: newContent.trim(),
        visibility: newVisibility,
        schoolId: isMultiCampus ? newSchoolId || undefined : undefined,
        isAnnouncement,
        isPinned,
        theme: selectedFiles.length === 0 ? selectedBgStyle : "none",
        files: selectedFiles,
      });

      toast.success(
        isAnnouncement
          ? "Official announcement published to feed!"
          : "Your post has been published to feed!",
      );
      setNewContent("");
      setSelectedFiles([]);
      setFilePreviews([]);
      setSelectedBgStyle("none");
      setIsAnnouncement(false);
      setIsPinned(false);
      setComposerOpen(false);
      loadFeed();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Page
  const handleStartEdit = (post: FeedPostItem) => {
    if (!post.canEdit) {
      toast.error("You can only edit your own posts.");
      return;
    }
    setActiveMenuPostId(null);
    router.push(`/feed/edit/${post.id}`);
  };

  // Confirm Delete Post
  const handleConfirmDeletePost = async () => {
    if (!deletingPostId) return;

    setDeleting(true);
    try {
      await deleteFeedPost(deletingPostId);
      setPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
      toast.success("Post deleted from feed");
      setDeletingPostId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  // Toggle Reaction (Like, Love, Care, Haha, Wow, Sad, Angry)
  const handleToggleLike = async (postId: string, reactionType = "like") => {
    try {
      const res = await toggleFeedReaction(postId, reactionType);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                hasLiked: res.liked,
                userReaction: res.userReaction,
                reactionCount: res.reactionCount,
                reactionTypes:
                  res.reactionTypes || (res.liked ? [reactionType] : []),
              }
            : p,
        ),
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update reaction");
    }
  };

  // Add Comment or Reply
  const handleAddComment = async (postId: string, parentId?: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;

    try {
      const newComment = await addFeedComment(postId, {
        content: text,
        parentId,
      });

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            if (parentId) {
              const updatedComments = p.comments.map((c) => {
                if (c.id === parentId) {
                  return {
                    ...c,
                    replies: [...(c.replies || []), newComment],
                  };
                }
                return c;
              });
              return {
                ...p,
                comments: updatedComments,
                commentsCount: p.commentsCount + 1,
              };
            } else {
              return {
                ...p,
                comments: [...p.comments, newComment],
                commentsCount: p.commentsCount + 1,
              };
            }
          }
          return p;
        }),
      );

      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setActiveReplyTo((prev) => ({ ...prev, [postId]: null }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      toast.success("Comment added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add comment");
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteFeedComment(commentId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const filterRecursive = (
              list: FeedCommentItem[],
            ): FeedCommentItem[] => {
              return list
                .filter((c) => c.id !== commentId)
                .map((c) => ({
                  ...c,
                  replies: c.replies ? filterRecursive(c.replies) : [],
                }));
            };
            return {
              ...p,
              comments: filterRecursive(p.comments),
              commentsCount: Math.max(0, p.commentsCount - 1),
            };
          }
          return p;
        }),
      );
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  // Toggle Comment Like
  const handleToggleCommentLike = (commentId: string) => {
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  // Lightbox handlers
  const openLightbox = (mediaUrls: string[], startIndex: number) => {
    setLightboxImages(mediaUrls);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevLightboxImage = () => {
    setLightboxIndex(
      (prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length,
    );
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Reaction hover dock management
  const handleReactionMouseEnter = (postId: string) => {
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    setHoverReactionPostId(postId);
  };

  const handleReactionMouseLeave = () => {
    reactionTimeoutRef.current = setTimeout(() => {
      setHoverReactionPostId(null);
    }, 300);
  };

  // Helper to highlight #hashtags and @mentions
  const renderFormattedText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if ((word.startsWith("#") || word.startsWith("@")) && word.length > 1) {
        return (
          <span
            key={i}
            className="text-[#1877F2] font-medium hover:underline cursor-pointer"
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const visiblePosts = posts;

  return (
    <div className="w-full max-w-[590px] md:max-w-[620px] mx-auto pb-20 select-text">
      {/* ============================================================== */}
      {/* 1. FACEBOOK POST COMPOSER CARD                                 */}
      {/* ============================================================== */}
      <div className="bg-white mb-4 dark:bg-[#242526] rounded-xl border border-gray-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-3 sm:p-4 space-y-3">
        {/* Top Row: User Avatar + Pill Input Box */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden shrink-0 cursor-pointer">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex-1 text-left bg-[#F0F2F5] dark:bg-[#3A3B3C] hover:bg-[#E4E6E9] dark:hover:bg-[#4E4F50] rounded-full px-4 py-2.5 text-[15px] text-[#65676B] dark:text-[#B0B3B8] transition-colors cursor-pointer truncate"
          >
            What's on your mind, {user?.fullName?.split(" ")[0] || "Faculty"}?
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-neutral-800" />

        {/* Bottom Row: Facebook Action Buttons */}
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-[14px] font-semibold text-[#65676B] dark:text-[#B0B3B8] transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-[#45BD62]" />
            <span>Photo/video</span>
          </button>

          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-[14px] font-semibold text-[#65676B] dark:text-[#B0B3B8] transition-colors"
          >
            <Smile className="w-5 h-5 text-[#F7B125]" />
            <span className="hidden sm:inline">Feeling/activity</span>
            <span className="sm:hidden">Feeling</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FACEBOOK POST FEED STREAM                                   */}
      {/* ============================================================== */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#242526] border border-gray-200/80 dark:border-neutral-800 rounded-xl p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-1/5" />
                </div>
              </div>
              <div className="h-16 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="bg-white dark:bg-[#242526] border border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F2F5] dark:bg-[#3A3B3C] flex items-center justify-center mx-auto text-[#65676B] dark:text-[#B0B3B8]">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#050505] dark:text-[#E4E6EB]">
            No posts in feed
          </h3>
          <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] max-w-sm mx-auto">
            Be the first to share an update, milestone, or classroom insight!
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveFilter("all");
              loadFeed();
            }}
            className="rounded-lg text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const isCommentsOpen = !!expandedComments[post.id];
            const mediaCount = post.mediaItems?.length || 0;
            const allMediaUrls =
              post.mediaItems?.map((m) => getMediaUrl(m.fileUrl)) || [];
            const isReactionHovered = hoverReactionPostId === post.id;
            const isLongText = post.content.length > 250;
            const isTextExpanded = expandedTextPostIds.has(post.id);
            const isThemedPost =
              post.theme && post.theme !== "none" && mediaCount === 0;
            const bgStyleObj = isThemedPost
              ? POST_BACKGROUNDS.find((b) => b.id === post.theme)
              : null;
            const isShortStatus =
              post.content.length < 85 && mediaCount === 0 && !isThemedPost;

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-[#242526] rounded-xl border border-gray-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.1)] relative overflow-hidden transition-shadow"
              >
                {/* Pinned or Announcement Header Banner */}
                {(post.isPinned || post.isAnnouncement) && (
                  <div className="px-4 py-2 bg-gray-50/70 dark:bg-neutral-800/40 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between text-[12px] text-[#65676B] dark:text-[#B0B3B8]">
                    <div className="flex items-center gap-2">
                      {post.isPinned && (
                        <span className="flex items-center gap-1.5 font-semibold text-amber-500">
                          <Pin className="w-3.5 h-3.5 fill-amber-500" /> Pinned
                          Post
                        </span>
                      )}
                      {post.isAnnouncement && (
                        <span className="flex items-center gap-1.5 font-semibold text-rose-500">
                          <Megaphone className="w-3.5 h-3.5 fill-rose-500" />{" "}
                          Official Announcement
                        </span>
                      )}
                    </div>
                    {post.school && (
                      <span className="text-[11px] font-medium text-[#65676B] dark:text-[#B0B3B8]">
                        {post.school.name}
                      </span>
                    )}
                  </div>
                )}

                {/* 1. Facebook Header: Author Avatar, Name, Timestamp, Privacy Icon, Options */}
                <div className="p-3 sm:p-4 pb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Author Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-800 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden shrink-0 cursor-pointer">
                      {post.author.avatarUrl ? (
                        <img
                          src={getMediaUrl(post.author.avatarUrl)}
                          alt={post.author.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        post.author.fullName.charAt(0)
                      )}
                    </div>

                    {/* Name & Subtitle */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[15px] font-semibold text-[#050505] dark:text-[#E4E6EB] hover:underline cursor-pointer leading-tight">
                          {post.author.fullName}
                        </h4>
                        {post.author.role === "admin" && (
                          <span className="text-[10px] bg-rose-500/10 text-rose-600 font-semibold px-1.5 py-0.2 rounded border border-rose-200">
                            Admin
                          </span>
                        )}
                        {post.author.role === "director" && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-600 font-semibold px-1.5 py-0.2 rounded border border-purple-200">
                            Director
                          </span>
                        )}
                      </div>

                      {/* Timestamp & Privacy icon */}
                      <div className="flex items-center gap-1 text-[13px] text-[#65676B] dark:text-[#B0B3B8] mt-0.5">
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>·</span>
                        {post.visibility === "public" ? (
                          <span
                            className="flex items-center gap-0.5"
                            title="Public"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </span>
                        ) : post.visibility === "campus" ? (
                          <span
                            className="flex items-center gap-1"
                            title={post.school?.name || "Campus Community"}
                          >
                            <Building className="w-3.5 h-3.5 text-[#1877F2]" />
                            <span className="text-[12px] truncate max-w-[140px]">
                              {post.school?.name || "Campus"}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-0.5"
                            title="Only me"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Menu & Facebook Close (X) */}
                  <div className="flex items-center gap-0.5">
                    {/* Three-dots menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuPostId(
                            activeMenuPostId === post.id ? null : post.id,
                          )
                        }
                        className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-[#3A3B3C] flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {activeMenuPostId === post.id && (
                        <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#242526] border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl py-1.5 z-20 text-[13px] font-medium">
                          {post.canEdit && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(post)}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-left text-[#050505] dark:text-[#E4E6EB] transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-[#1877F2]" />
                              Edit post
                            </button>
                          )}
                          {post.canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingPostId(post.id);
                                setActiveMenuPostId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                              {isMultiCampus && post.author.id !== user?.id
                                ? "Delete (Moderation)"
                                : "Delete post"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Post Content Text (Colored Theme Background or Standard Text) */}
                {isThemedPost && bgStyleObj ? (
                  <div className={`mx-3 sm:mx-4 my-2 ${bgStyleObj.class}`}>
                    <p className="whitespace-pre-wrap select-text leading-relaxed break-words [overflow-wrap:anywhere]">
                      {renderFormattedText(post.content)}
                    </p>
                  </div>
                ) : (
                  <div className="px-4 pt-1 pb-2">
                    <div
                      className={`${
                        isShortStatus
                          ? "text-[20px] font-normal leading-snug"
                          : "text-[15px] leading-relaxed"
                      } text-[#050505] dark:text-[#E4E6EB] break-words [overflow-wrap:anywhere] whitespace-pre-wrap`}
                    >
                      {isLongText ? (
                        !isTextExpanded ? (
                          <>
                            <span>
                              {renderFormattedText(post.content.slice(0, 240))}
                              ...
                            </span>{" "}
                            <button
                              type="button"
                              onClick={() => toggleExpandText(post.id)}
                              className="font-semibold text-[#1877F2] hover:underline cursor-pointer inline-block ml-1"
                            >
                              See more
                            </button>
                          </>
                        ) : (
                          <>
                            <span>{renderFormattedText(post.content)}</span>{" "}
                            <button
                              type="button"
                              onClick={() => toggleExpandText(post.id)}
                              className="font-semibold text-[#1877F2] hover:underline cursor-pointer inline-block ml-1"
                            >
                              See less
                            </button>
                          </>
                        )
                      ) : (
                        renderFormattedText(post.content)
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Facebook Multi-Image Collage */}
                {mediaCount === 1 && (
                  <div
                    onClick={() => openLightbox(allMediaUrls, 0)}
                    className="mt-2 w-full max-h-[550px] bg-neutral-100 dark:bg-neutral-800/40 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group"
                  >
                    <img
                      src={getMediaUrl(post.mediaItems[0].fileUrl)}
                      alt={post.mediaItems[0].fileName}
                      className="max-h-[550px] w-full object-contain group-hover:scale-[1.01] transition-transform duration-200"
                    />
                  </div>
                )}

                {mediaCount === 2 && (
                  <div className="grid grid-cols-2 gap-1 mt-2 aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {post.mediaItems.slice(0, 2).map((m, idx) => (
                      <div
                        key={m.id}
                        onClick={() => openLightbox(allMediaUrls, idx)}
                        className="relative group bg-neutral-200 dark:bg-neutral-700 cursor-pointer overflow-hidden h-full"
                      >
                        <img
                          src={getMediaUrl(m.fileUrl)}
                          alt={m.fileName}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {mediaCount === 3 && (
                  <div className="grid grid-cols-2 grid-rows-2 gap-1 mt-2 aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    <div
                      onClick={() => openLightbox(allMediaUrls, 0)}
                      className="row-span-2 col-span-1 relative group bg-neutral-200 dark:bg-neutral-700 cursor-pointer overflow-hidden h-full"
                    >
                      <img
                        src={getMediaUrl(post.mediaItems[0].fileUrl)}
                        alt={post.mediaItems[0].fileName}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </div>
                    {post.mediaItems.slice(1, 3).map((m, idx) => (
                      <div
                        key={m.id}
                        onClick={() => openLightbox(allMediaUrls, idx + 1)}
                        className="col-span-1 row-span-1 relative group bg-neutral-200 dark:bg-neutral-700 cursor-pointer overflow-hidden h-full"
                      >
                        <img
                          src={getMediaUrl(m.fileUrl)}
                          alt={m.fileName}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {mediaCount >= 4 && (
                  <div className="grid grid-cols-2 grid-rows-2 gap-1 mt-2 aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {post.mediaItems.slice(0, 4).map((m, idx) => {
                      const isFourth = idx === 3 && mediaCount > 4;
                      return (
                        <div
                          key={m.id}
                          onClick={() => openLightbox(allMediaUrls, idx)}
                          className="col-span-1 row-span-1 relative group bg-neutral-200 dark:bg-neutral-700 cursor-pointer overflow-hidden h-full"
                        >
                          <img
                            src={getMediaUrl(m.fileUrl)}
                            alt={m.fileName}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                          {isFourth && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-2xl font-bold">
                              +{mediaCount - 4}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Facebook Engagement Counts Row (Above Action Buttons) */}
                <div className="px-4 py-2.5 flex items-center justify-between text-[13px] text-[#65676B] dark:text-[#B0B3B8]">
                  {/* Left: Overlapping Reaction Badges + Total Reaction Count */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1 items-center">
                      {(post.reactionTypes && post.reactionTypes.length > 0
                        ? post.reactionTypes
                        : post.hasLiked
                          ? [post.userReaction || "like"]
                          : []
                      )
                        .slice(0, 3)
                        .map((rType) => {
                          const rObj = REACTION_EMOJIS.find(
                            (r) => r.id === rType,
                          ) || {
                            id: "like",
                            label: "Like",
                            emoji: "👍",
                          };
                          return (
                            <span
                              key={rType}
                              className="w-[18px] h-[18px] rounded-full bg-white dark:bg-[#242526] shadow-xs flex items-center justify-center text-[10px]"
                            >
                              {rObj.emoji}
                            </span>
                          );
                        })}
                      {(!post.reactionTypes ||
                        post.reactionTypes.length === 0) &&
                        post.reactionCount > 0 && (
                          <span className="w-[18px] h-[18px] rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] shadow-xs">
                            👍
                          </span>
                        )}
                    </div>
                    <span className="hover:underline cursor-pointer font-normal text-[#65676B] dark:text-[#B0B3B8]">
                      {post.reactionCount > 0 ? post.reactionCount : 0}
                    </span>
                  </div>

                  {/* Right: Comments Count */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }))
                      }
                      className="hover:underline"
                    >
                      {post.commentsCount} comments
                    </button>
                  </div>
                </div>

                {/* 5. Facebook 2-Button Action Row (Like/React, Comment) */}
                <div className="mx-4 my-1 py-0.5 grid grid-cols-2 gap-1 relative">
                  {/* Floating Facebook Reaction Emoji Dock on Hover */}
                  {isReactionHovered && (
                    <div
                      onMouseEnter={() => handleReactionMouseEnter(post.id)}
                      onMouseLeave={handleReactionMouseLeave}
                      className="absolute -top-12 left-2 z-30 bg-white dark:bg-[#242526] border border-gray-200 dark:border-neutral-700 shadow-2xl rounded-full px-3 py-1.5 flex items-center gap-2 animate-in zoom-in-90 slide-in-from-bottom-2 duration-150"
                    >
                      {REACTION_EMOJIS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            handleToggleLike(post.id, r.id);
                            setHoverReactionPostId(null);
                          }}
                          className="text-2xl hover:scale-135 transition-transform duration-150 transform origin-bottom px-1 cursor-pointer"
                          title={r.label}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Like / Reaction Button */}
                  <div
                    className="relative"
                    onMouseEnter={() => handleReactionMouseEnter(post.id)}
                    onMouseLeave={handleReactionMouseLeave}
                  >
                    {(() => {
                      const userReactionObj = post.hasLiked
                        ? REACTION_EMOJIS.find(
                            (r) => r.id === post.userReaction,
                          ) || {
                            id: "like",
                            label: "Like",
                            emoji: "👍",
                            color: "text-[#1877F2]",
                          }
                        : null;

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (post.hasLiked) {
                              handleToggleLike(
                                post.id,
                                post.userReaction || "like",
                              );
                            } else {
                              handleToggleLike(post.id, "like");
                            }
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-[14px] font-semibold transition-colors ${
                            userReactionObj
                              ? userReactionObj.color
                              : "text-[#65676B] dark:text-[#B0B3B8]"
                          }`}
                        >
                          {userReactionObj ? (
                            <>
                              <span className="text-base leading-none">
                                {userReactionObj.emoji}
                              </span>
                              <span>{userReactionObj.label}</span>
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="w-4 h-4 text-[#65676B] dark:text-[#B0B3B8]" />
                              <span>Like</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>

                  {/* Comment Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComments((prev) => ({
                        ...prev,
                        [post.id]: !prev[post.id],
                      }))
                    }
                    className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3A3B3C] text-[14px] font-semibold text-[#65676B] dark:text-[#B0B3B8] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                </div>

                {/* 6. Facebook Comment Section */}
                {isCommentsOpen && (
                  <div className="px-4 pt-2 pb-3.5 space-y-3">
                    {/* Sort Filter Row */}
                    <div className="text-[13px] text-[#65676B] dark:text-[#B0B3B8] px-1">
                      <span className="font-semibold text-[#050505] dark:text-[#E4E6EB]">
                        Comments ({post.commentsCount})
                      </span>
                    </div>

                    {/* Sticky Comment Capsule Input Box */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {user?.fullName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-[20px] px-3.5 py-2 border border-transparent focus-within:border-gray-300 dark:focus-within:border-neutral-600 transition-colors">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentDrafts[post.id] || ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddComment(
                                post.id,
                                activeReplyTo[post.id] || undefined,
                              );
                            }
                          }}
                          className="flex-1 bg-transparent text-[14px] text-[#050505] dark:text-[#E4E6EB] focus:outline-none placeholder:text-[#65676B] dark:placeholder:text-[#B0B3B8]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAddComment(
                              post.id,
                              activeReplyTo[post.id] || undefined,
                            )
                          }
                          disabled={!commentDrafts[post.id]?.trim()}
                          className="text-[#1877F2] hover:text-[#1877F2]/80 disabled:opacity-30 p-1"
                          title="Send comment"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Active Reply Banner */}
                    {activeReplyTo[post.id] && (
                      <div className="flex items-center justify-between text-xs text-[#1877F2] bg-[#1877F2]/10 px-3 py-1 rounded-lg">
                        <span className="flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          Replying to comment
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveReplyTo((prev) => ({
                              ...prev,
                              [post.id]: null,
                            }))
                          }
                          className="hover:underline font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Comments List (Facebook Rounded Bubbles) */}
                    {post.comments?.length > 0 ? (
                      <div className="space-y-3 pt-1">
                        {post.comments.map((comment) => {
                          const isCommentLiked = likedCommentIds.has(
                            comment.id,
                          );

                          return (
                            <div key={comment.id} className="space-y-1.5">
                              <div className="flex items-start gap-2.5 group">
                                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                                  {comment.author.fullName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  {/* Speech Bubble */}
                                  <div className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-[18px] px-3.5 py-2 inline-block max-w-[92%] relative">
                                    <h5 className="font-semibold text-[13px] text-[#050505] dark:text-[#E4E6EB] hover:underline cursor-pointer">
                                      {comment.author.fullName}
                                    </h5>
                                    <p className="text-[14px] leading-snug text-[#050505] dark:text-[#E4E6EB] mt-0.5 break-words">
                                      {comment.content}
                                    </p>

                                    {/* Floating reaction badge if liked */}
                                    {isCommentLiked && (
                                      <span className="absolute -bottom-2 -right-1 bg-white dark:bg-[#242526] border border-gray-200 dark:border-neutral-700 rounded-full px-1 py-0.2 shadow-xs flex items-center gap-0.5 text-[10px]">
                                        👍 1
                                      </span>
                                    )}
                                  </div>

                                  {/* Sub-actions Row Under Bubble */}
                                  <div className="flex items-center gap-3 text-[12px] font-semibold text-[#65676B] dark:text-[#B0B3B8] ml-3 mt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleCommentLike(comment.id)
                                      }
                                      className={`hover:underline cursor-pointer ${
                                        isCommentLiked ? "text-[#1877F2]" : ""
                                      }`}
                                    >
                                      Like
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setActiveReplyTo((prev) => ({
                                          ...prev,
                                          [post.id]: comment.id,
                                        }))
                                      }
                                      className="hover:underline cursor-pointer"
                                    >
                                      Reply
                                    </button>
                                    <span className="font-normal">
                                      {formatTimeAgo(comment.createdAt)}
                                    </span>
                                    {comment.canDelete && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteComment(
                                            post.id,
                                            comment.id,
                                          )
                                        }
                                        className="text-[#65676B] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Nested Replies with Facebook connector indentation */}
                              {comment.replies &&
                                comment.replies.length > 0 && (
                                  <div className="ml-10 pl-3 border-l-2 border-gray-200 dark:border-neutral-700 space-y-2 pt-1">
                                    {comment.replies.map((reply) => {
                                      const isReplyLiked = likedCommentIds.has(
                                        reply.id,
                                      );

                                      return (
                                        <div
                                          key={reply.id}
                                          className="flex items-start gap-2 group"
                                        >
                                          <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                            {reply.author.fullName.charAt(0)}
                                          </div>
                                          <div className="flex-1">
                                            <div className="bg-[#F0F2F5] dark:bg-[#3A3B3C] rounded-[16px] px-3 py-1.5 inline-block max-w-[92%] relative">
                                              <h6 className="font-semibold text-[12px] text-[#050505] dark:text-[#E4E6EB]">
                                                {reply.author.fullName}
                                              </h6>
                                              <p className="text-[13px] text-[#050505] dark:text-[#E4E6EB] mt-0.5 leading-snug">
                                                {reply.content}
                                              </p>
                                              {isReplyLiked && (
                                                <span className="absolute -bottom-2 -right-1 bg-white dark:bg-[#242526] border border-gray-200 dark:border-neutral-700 rounded-full px-1 py-0.2 shadow-xs flex items-center gap-0.5 text-[9px]">
                                                  👍 1
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-[#65676B] dark:text-[#B0B3B8] ml-3 mt-0.5 font-semibold">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleToggleCommentLike(
                                                    reply.id,
                                                  )
                                                }
                                                className={`hover:underline cursor-pointer ${
                                                  isReplyLiked
                                                    ? "text-[#1877F2]"
                                                    : ""
                                                }`}
                                              >
                                                Like
                                              </button>
                                              <span className="font-normal">
                                                {formatTimeAgo(reply.createdAt)}
                                              </span>
                                              {reply.canDelete && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleDeleteComment(
                                                      post.id,
                                                      reply.id,
                                                    )
                                                  }
                                                  className="text-[#65676B] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                  <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#65676B] dark:text-[#B0B3B8] italic py-1 px-1">
                        No comments yet. Write the first comment!
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FACEBOOK "CREATE POST" MODAL DIALOG                         */}
      {/* ============================================================== */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] border border-gray-200 dark:border-neutral-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 space-y-0">
            {/* Modal Header */}
            <div className="relative px-5 py-3.5 border-b border-gray-200 dark:border-neutral-700 text-center">
              <h3 className="text-base font-bold text-[#050505] dark:text-[#E4E6EB]">
                Create post
              </h3>
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(false);
                  setNewContent("");
                  setSelectedFiles([]);
                  setFilePreviews([]);
                  setSelectedBgStyle("none");
                }}
                className="absolute right-3.5 top-3 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 dark:hover:bg-neutral-600 flex items-center justify-center text-[#65676B] dark:text-[#B0B3B8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-4 space-y-3.5">
              {/* Author & Audience Pill Selector */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {user?.fullName?.charAt(0) || "U"}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#050505] dark:text-[#E4E6EB] leading-none">
                    {user?.fullName || "Faculty Member"}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Audience Selector */}
                    <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-[#3A3B3C] px-2 py-0.5 rounded-md text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] border border-gray-200 dark:border-neutral-700">
                      {newVisibility === "public" ? (
                        <Globe className="w-3 h-3 text-emerald-500" />
                      ) : newVisibility === "campus" ? (
                        <Building className="w-3 h-3 text-[#1877F2]" />
                      ) : (
                        <Lock className="w-3 h-3 text-amber-500" />
                      )}
                      <select
                        value={newVisibility}
                        onChange={(e) =>
                          setNewVisibility(e.target.value as any)
                        }
                        className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        {isMultiCampus && (
                          <option value="public">Public (All Campuses)</option>
                        )}
                        <option value="campus">Campus Community</option>
                        <option value="private">Only Me</option>
                      </select>
                    </div>

                    {/* School selector if multi-campus */}
                    {isMultiCampus && newVisibility === "campus" && (
                      <select
                        value={newSchoolId}
                        onChange={(e) => setNewSchoolId(e.target.value)}
                        className="text-xs bg-gray-100 dark:bg-[#3A3B3C] border border-gray-200 dark:border-neutral-700 rounded-md px-2 py-0.5 font-semibold text-[#65676B] dark:text-[#B0B3B8]"
                      >
                        <option value="">Default School</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Input Area (Supports Colored Backgrounds) */}
              <div
                className={`relative rounded-xl transition-all ${
                  selectedBgStyle !== "none"
                    ? POST_BACKGROUNDS.find((b) => b.id === selectedBgStyle)
                        ?.class
                    : ""
                }`}
              >
                <textarea
                  placeholder={`What's on your mind, ${
                    user?.fullName?.split(" ")[0] || "Faculty"
                  }?`}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className={`w-full bg-transparent resize-none focus:outline-none placeholder:text-[#65676B] dark:placeholder:text-[#B0B3B8] ${
                    selectedBgStyle !== "none"
                      ? "text-center text-white placeholder:text-white/70 text-xl font-bold min-h-[140px]"
                      : "min-h-[100px] text-base text-[#050505] dark:text-[#E4E6EB]"
                  }`}
                  autoFocus
                />
              </div>

              {/* Background Color Picker Palette (Aa Button) */}
              {filePreviews.length === 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] mr-1">
                    Theme:
                  </span>
                  {POST_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBgStyle(bg.id)}
                      className={`w-6 h-6 rounded-md border transition-transform ${
                        bg.id === "none"
                          ? "bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600"
                          : bg.id === "ocean"
                            ? "bg-gradient-to-tr from-blue-600 to-cyan-500 border-blue-400"
                            : bg.id === "sunset"
                              ? "bg-gradient-to-tr from-rose-500 to-yellow-400 border-amber-400"
                              : bg.id === "berry"
                                ? "bg-gradient-to-tr from-purple-800 to-pink-600 border-purple-400"
                                : bg.id === "emerald"
                                  ? "bg-gradient-to-tr from-emerald-700 to-teal-400 border-emerald-400"
                                  : "bg-gradient-to-tr from-red-600 to-amber-500 border-red-400"
                      } ${
                        selectedBgStyle === bg.id
                          ? "scale-115 ring-2 ring-[#1877F2]"
                          : "hover:scale-105"
                      }`}
                      title={bg.label}
                    />
                  ))}
                </div>
              )}

              {/* Media Previews Grid */}
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto">
                  {filePreviews.map((f, i) => (
                    <div
                      key={i}
                      className="relative group aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 bg-black/5"
                    >
                      <img
                        src={f.url}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full opacity-90 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {filePreviews.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700 hover:border-[#1877F2] dark:hover:border-[#1877F2] flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#1877F2] transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-xs font-semibold">Add more</span>
                    </button>
                  )}
                </div>
              )}

              {/* "Add to your post" Facebook Toolbar Capsule */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-xs bg-gray-50/50 dark:bg-neutral-800/30">
                <span className="text-xs font-semibold text-[#050505] dark:text-[#E4E6EB]">
                  Add to your post
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-[#45BD62] transition-colors cursor-pointer"
                    title="Photo/video"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toast.info("Feeling/activity badge added")}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-[#F7B125] transition-colors"
                    title="Feeling/activity"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {isMultiCampus && (
                    <button
                      type="button"
                      onClick={() => setIsAnnouncement((prev) => !prev)}
                      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors ${
                        isAnnouncement
                          ? "text-rose-500 bg-rose-500/10"
                          : "text-[#65676B] dark:text-[#B0B3B8]"
                      }`}
                      title="Official announcement"
                    >
                      <Megaphone className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Admin Moderation Extras */}
              {isMultiCampus && (
                <div className="flex items-center gap-4 text-xs font-semibold text-[#65676B] dark:text-[#B0B3B8] px-1">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-gray-300 text-[#1877F2] focus:ring-[#1877F2]"
                    />
                    <span className="flex items-center gap-1">
                      <Pin className="w-3 h-3 text-amber-500" /> Pin post to top
                    </span>
                  </label>
                </div>
              )}

              {/* Full Width Facebook Blue "Post" Button */}
              <Button
                type="submit"
                disabled={
                  submitting ||
                  (!newContent.trim() && selectedFiles.length === 0)
                }
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-2.5 rounded-xl shadow-md disabled:opacity-50 transition-all text-sm"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Publishing to feed...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DELETE CONFIRM MODAL                                        */}
      {/* ============================================================== */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] border border-gray-200 dark:border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#050505] dark:text-[#E4E6EB]">
                  Move to trash?
                </h3>
                <p className="text-xs text-[#65676B] dark:text-[#B0B3B8]">
                  Permanent removal from feed
                </p>
              </div>
            </div>

            <p className="text-sm text-[#65676B] dark:text-[#B0B3B8]">
              Are you sure you want to permanently delete this post and all of
              its comments? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPostId(null)}
                disabled={deleting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDeletePost}
                disabled={deleting}
                className="rounded-xl"
              >
                {deleting ? "Deleting..." : "Delete Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. IMAGE LIGHTBOX MODAL                                        */}
      {/* ============================================================== */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => handleDownloadImage(lightboxImages[lightboxIndex])}
            className="absolute top-4 right-16 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10 cursor-pointer"
            title="Download image"
          >
            <Download className="w-6 h-6" />
          </button>

          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevLightboxImage}
                className="absolute left-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={nextLightboxImage}
                className="absolute right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
            <img
              src={lightboxImages[lightboxIndex]}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {lightboxImages.length > 1 && (
              <p className="text-white/70 text-xs font-semibold mt-3">
                {lightboxIndex + 1} of {lightboxImages.length}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input for Image Uploads */}
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
