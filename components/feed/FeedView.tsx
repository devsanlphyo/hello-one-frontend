"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Heart,
  Share2,
  MoreVertical,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Send,
  X,
  Pin,
  Megaphone,
  Globe,
  Building,
  Lock,
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  CornerDownRight,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  FeedPostItem,
  FeedCommentItem,
  fetchFeed,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  toggleFeedReaction,
  addFeedComment,
  deleteFeedComment,
  PostVisibility,
} from "@/lib/api/feed";
import { fetchSchools, School } from "@/lib/api/schools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface FeedViewProps {
  initialFilter?: "all" | "campus" | "public" | "my" | "announcements";
}

export function FeedView({ initialFilter = "all" }: FeedViewProps) {
  const { user } = useAuth();
  const isMultiCampus = user?.role === "admin" || user?.role === "director";

  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "campus" | "public" | "my" | "announcements"
  >(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);

  // Composer State
  const [composerOpen, setComposerOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newVisibility, setNewVisibility] = useState<PostVisibility>(
    isMultiCampus ? "public" : "campus",
  );
  const [newSchoolId, setNewSchoolId] = useState<string>("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<FeedPostItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState<PostVisibility>("campus");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirm State
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Comment input states: map of postId -> draft text
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [activeReplyTo, setActiveReplyTo] = useState<Record<string, string | null>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

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

  const loadFeed = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchFeed({
        filter: activeFilter,
        search: searchQuery || undefined,
        schoolId: isMultiCampus ? selectedSchoolId || undefined : undefined,
      });
      setPosts(res.posts || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      toast.error("You can attach a maximum of 10 images per post.");
      return;
    }

    const updatedFiles = [...selectedFiles, ...files];
    setSelectedFiles(updatedFiles);

    const previews = updatedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setFilePreviews(previews);
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

  // Submit new post (Flow 3 & Flow 4)
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
        files: selectedFiles,
      });

      toast.success(
        isAnnouncement
          ? "Official announcement published to feed!"
          : "Your post has been published successfully!",
      );
      setNewContent("");
      setSelectedFiles([]);
      setFilePreviews([]);
      setIsAnnouncement(false);
      setIsPinned(false);
      setComposerOpen(false);
      loadFeed(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal (Flow 7 & Flow 8: Own Post?)
  const handleStartEdit = (post: FeedPostItem) => {
    if (!post.canEdit) {
      toast.error("You can only edit your own posts.");
      return;
    }
    setEditingPost(post);
    setEditContent(post.content);
    setEditVisibility(post.visibility);
    setActiveMenuPostId(null);
  };

  // Save Edit (Flow 7 & Flow 8)
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty.");
      return;
    }

    setSavingEdit(true);
    try {
      const updated = await updateFeedPost(editingPost.id, {
        content: editContent.trim(),
        visibility: editVisibility,
      });

      setPosts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
      );
      toast.success("Post updated successfully!");
      setEditingPost(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  // Confirm Delete Post (Flow 5 & Flow 6)
  const handleConfirmDeletePost = async () => {
    if (!deletingPostId) return;

    setDeleting(true);
    try {
      await deleteFeedPost(deletingPostId);
      setPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
      toast.success("Post removed from feed");
      setDeletingPostId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  // Toggle Like Reaction
  const handleToggleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextLiked,
            reactionCount: nextLiked ? p.reactionCount + 1 : Math.max(0, p.reactionCount - 1),
          };
        }
        return p;
      }),
    );

    try {
      const res = await toggleFeedReaction(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, hasLiked: res.liked, reactionCount: res.reactionCount }
            : p,
        ),
      );
    } catch {
      // Revert if error
      loadFeed(true);
    }
  };

  // Submit Comment
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
              // Add to replies of parent comment
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
            const filterRecursive = (list: FeedCommentItem[]): FeedCommentItem[] => {
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
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "director":
        return "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800";
      case "admin":
        return "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800";
      case "headmaster":
        return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800";
      case "teacher":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800";
      case "officer":
        return "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* 1. Header Banner & Flow Architecture Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Process Flow Architecture
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isMultiCampus ? "Flow 2: Multi-Campus Oversight" : "Flow 1: Campus Scoped"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              School Community Feed
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl mt-1">
              {isMultiCampus
                ? "Global feed across all campuses with institutional announcement privileges and administrative moderation controls."
                : "Campus-level updates, announcements, and peer collaboration for your designated school."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadFeed(true)}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setComposerOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25"
            >
              <Edit2 className="w-4 h-4 mr-1.5" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Filter Tabs & Search Bar */}
      <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Posts", icon: Globe },
              { id: "campus", label: "Campus Community", icon: Building },
              { id: "announcements", label: "Announcements", icon: Megaphone },
              { id: "my", label: "My Posts", icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Director & Admin Campus Switcher */}
          {isMultiCampus && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <Filter className="w-3 h-3" /> Campus:
              </span>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="text-xs bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Campuses</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search feed by keyword or faculty name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadFeed()}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* 3. Post Composer (Flow 3 & Flow 4) */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div
            onClick={() => setComposerOpen(true)}
            className="flex-1 bg-muted/40 hover:bg-muted/70 border border-border/60 rounded-full px-4 py-2.5 text-sm text-muted-foreground cursor-pointer transition-colors"
          >
            {isMultiCampus
              ? "Publish an announcement, milestone, or multi-campus bulletin..."
              : "Share a lesson insight, campus update, or classroom project..."}
          </div>
        </div>

        {composerOpen && (
          <form onSubmit={handleCreatePost} className="pt-3 border-t border-border/60 space-y-4">
            <Textarea
              placeholder="What would you like to share with the faculty community?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[120px] resize-y text-base border-border focus-visible:ring-1 focus-visible:ring-primary"
              autoFocus
            />

            {/* Media previews */}
            {filePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {filePreviews.map((f, i) => (
                  <div
                    key={i}
                    className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-black/5"
                  >
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full opacity-90 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Composer Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Photo Upload Trigger */}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-8 border-border"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                  Add Images ({selectedFiles.length}/10)
                </Button>

                {/* Visibility Scoping */}
                <div className="flex items-center gap-1 bg-muted/60 px-2 py-1 rounded-md text-xs font-medium border border-border">
                  {newVisibility === "public" ? (
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  ) : newVisibility === "campus" ? (
                    <Building className="w-3.5 h-3.5 text-indigo-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold focus:outline-none"
                  >
                    {isMultiCampus && (
                      <option value="public">All Campuses (Public)</option>
                    )}
                    <option value="campus">Campus Community</option>
                    <option value="private">Private (Author Only)</option>
                  </select>
                </div>

                {/* Director / Admin target campus */}
                {isMultiCampus && newVisibility === "campus" && (
                  <select
                    value={newSchoolId}
                    onChange={(e) => setNewSchoolId(e.target.value)}
                    className="text-xs bg-muted/60 border border-border rounded-md px-2 py-1 font-medium"
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

              {/* Administrative options */}
              {isMultiCampus && (
                <div className="flex items-center gap-4 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnnouncement}
                      onChange={(e) => setIsAnnouncement(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Megaphone className="w-3 h-3 text-rose-500" />
                      Official Notice
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Pin className="w-3 h-3 text-amber-500" />
                      Pin to Top
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Composer Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setComposerOpen(false);
                  setNewContent("");
                  setSelectedFiles([]);
                  setFilePreviews([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Publish
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* 4. Feed Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border/60 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
              <div className="h-16 bg-muted/60 rounded-lg" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card border border-dashed border-border rounded-2xl space-y-3">
          <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No posts found in feed</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? `No feed posts matched "${searchQuery}". Try clearing search or filters.`
              : "Be the first to share an update, curriculum breakthrough, or announcement!"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveFilter("all");
              setSearchQuery("");
              loadFeed();
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const isCommentsOpen = !!expandedComments[post.id];
            const mediaCount = post.mediaItems?.length || 0;
            const allMediaUrls = post.mediaItems?.map((m) => m.fileUrl) || [];

            return (
              <article
                key={post.id}
                className="bg-card border border-border/70 hover:border-border rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative"
              >
                {/* Pinned or Announcement Header Banner */}
                {(post.isPinned || post.isAnnouncement) && (
                  <div className="flex items-center gap-2 text-xs font-semibold pb-2 border-b border-border/50 text-muted-foreground">
                    {post.isPinned && (
                      <span className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        <Pin className="w-3 h-3" /> Pinned Post
                      </span>
                    )}
                    {post.isAnnouncement && (
                      <span className="flex items-center gap-1 text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                        <Megaphone className="w-3 h-3" /> Official Notice
                      </span>
                    )}
                  </div>
                )}

                {/* Post Author Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-800 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden">
                      {post.author.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt={post.author.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        post.author.fullName.charAt(0)
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm md:text-base font-bold text-foreground">
                          {post.author.fullName}
                        </h4>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border uppercase tracking-wide ${getRoleBadgeVariant(
                            post.author.role,
                          )}`}
                        >
                          {post.author.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>•</span>
                        {post.school ? (
                          <span className="flex items-center gap-1 text-foreground/80 font-medium">
                            <Building className="w-3 h-3 text-indigo-500" />
                            {post.school.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Globe className="w-3 h-3" />
                            Institutional BroadCast
                          </span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{post.visibility}</span>
                      </div>
                    </div>
                  </div>

                  {/* Options Menu (Flow 5/6 Deletion & Flow 7/8 Editing) */}
                  {(post.canEdit || post.canDelete) && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)
                        }
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuPostId === post.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-xl shadow-lg py-1 z-20 text-xs font-medium">
                          {post.canEdit && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(post)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-foreground transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                              Edit Post
                            </button>
                          )}
                          {post.canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingPostId(post.id);
                                setActiveMenuPostId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-500/10 text-left text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              {isMultiCampus && post.author.id !== user?.id
                                ? "Delete (Moderation)"
                                : "Delete Post"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="text-sm md:text-[15px] leading-relaxed text-foreground whitespace-pre-line break-words">
                  {post.content}
                </div>

                {/* Media Grid */}
                {mediaCount > 0 && (
                  <div
                    className={`grid gap-2 rounded-xl overflow-hidden ${
                      mediaCount === 1
                        ? "grid-cols-1"
                        : mediaCount === 2
                        ? "grid-cols-2"
                        : mediaCount === 3
                        ? "grid-cols-3"
                        : "grid-cols-2"
                    }`}
                  >
                    {post.mediaItems.slice(0, 4).map((m, idx) => {
                      const isFourth = idx === 3 && mediaCount > 4;
                      return (
                        <div
                          key={m.id}
                          onClick={() => openLightbox(allMediaUrls, idx)}
                          className={`relative group aspect-video md:aspect-[4/3] bg-muted/40 cursor-pointer overflow-hidden ${
                            mediaCount === 1 ? "max-h-96" : ""
                          }`}
                        >
                          <img
                            src={m.fileUrl}
                            alt={m.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isFourth && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xl font-bold">
                              +{mediaCount - 4} more
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Bar (Likes, Comments, Share) */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-sm">
                  <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 font-semibold transition-transform active:scale-95 ${
                        post.hasLiked
                          ? "text-rose-500"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          post.hasLiked ? "fill-rose-500 text-rose-500 animate-in zoom-in-50" : ""
                        }`}
                      />
                      <span>{post.reactionCount}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id],
                        }))
                      }
                      className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/feed#post-${post.id}`,
                      );
                      toast.success("Post link copied to clipboard!");
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div className="pt-4 border-t border-border/40 space-y-4">
                    {/* Add Top-Level Comment Input */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {user?.fullName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 border border-border">
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
                              handleAddComment(post.id, activeReplyTo[post.id] || undefined);
                            }
                          }}
                          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAddComment(post.id, activeReplyTo[post.id] || undefined)
                          }
                          disabled={!commentDrafts[post.id]?.trim()}
                          className="text-primary hover:text-primary/80 disabled:opacity-40 p-1"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Active Reply Banner */}
                    {activeReplyTo[post.id] && (
                      <div className="flex items-center justify-between text-xs text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-md">
                        <span className="flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5" />
                          Replying to comment
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveReplyTo((prev) => ({ ...prev, [post.id]: null }))
                          }
                          className="hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Comments List */}
                    {post.comments?.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex items-start gap-2.5 group">
                              <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                {comment.author.fullName.charAt(0)}
                              </div>
                              <div className="flex-1 bg-muted/60 rounded-2xl px-3.5 py-2.5 text-xs text-foreground space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <span>{comment.author.fullName}</span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold border ${getRoleBadgeVariant(
                                        comment.author.role,
                                      )}`}
                                    >
                                      {comment.author.role}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm leading-snug">{comment.content}</p>
                              </div>

                              {/* Comment Actions */}
                              <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveReplyTo((prev) => ({
                                      ...prev,
                                      [post.id]: comment.id,
                                    }))
                                  }
                                  className="text-[11px] text-muted-foreground hover:text-indigo-500 font-medium px-1"
                                >
                                  Reply
                                </button>
                                {comment.canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                    className="text-muted-foreground hover:text-rose-500 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-9 pl-3 border-l-2 border-border/50 space-y-2 pt-1">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-2 group">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                                      {reply.author.fullName.charAt(0)}
                                    </div>
                                    <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2 text-xs text-foreground space-y-0.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 font-bold">
                                          <span>{reply.author.fullName}</span>
                                          <span
                                            className={`text-[8px] px-1 rounded uppercase font-semibold border ${getRoleBadgeVariant(
                                              reply.author.role,
                                            )}`}
                                          >
                                            {reply.author.role}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatTimeAgo(reply.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-xs leading-snug">{reply.content}</p>
                                    </div>
                                    {reply.canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(post.id, reply.id)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 p-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-1">
                        No comments yet. Start the conversation!
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Edit Post Modal (Flow 7 & Flow 8) */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" />
                Edit Post
              </h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground">Content</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px] text-sm"
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Visibility</label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {isMultiCampus && <option value="public">All Campuses (Public)</option>}
                  <option value="campus">Campus Community</option>
                  <option value="private">Private (Author Only)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPost(null)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="bg-primary text-primary-foreground"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirm Modal (Flow 5 & Flow 6) */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Feed Post</h3>
                <p className="text-xs text-muted-foreground">
                  {isMultiCampus
                    ? "Administrative Moderation Action"
                    : "Confirm removal from feed"}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently remove this post and all of its comments? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPostId(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDeletePost}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Image Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Download button */}
          <a
            href={lightboxImages[lightboxIndex]}
            download
            target="_blank"
            rel="noreferrer"
            className="absolute top-4 right-16 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
          >
            <Download className="w-6 h-6" />
          </a>

          {/* Navigation buttons */}
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

          {/* Image display */}
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
    </div>
  );
}
