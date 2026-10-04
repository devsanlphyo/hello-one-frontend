"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDeviceName, getOrCreateDeviceId } from "@/lib/device";
import {
  fetchFeed,
  createFeedPost,
  deleteFeedPost,
  toggleFeedReaction,
  addFeedComment,
  deleteFeedComment,
  FeedPostItem,
  FeedMediaItem,
  getMediaUrl,
  PostVisibility,
} from "@/lib/api/feed";
import { uploadMyAvatar } from "@/lib/api/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  School,
  Shield,
  Laptop,
  CheckCircle2,
  LogOut,
  Plus,
  MessageSquare,
  Calendar,
  Mail,
  FileText,
  Sparkles,
  Trash2,
  Edit3,
  Globe,
  Building,
  Megaphone,
  X,
  Info,
  MoreHorizontal,
  ThumbsUp,
  Send,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

/* ── FACEBOOK MULTI-IMAGE COLLAGE COMPONENT ── */
function PostMediaCollage({
  mediaItems,
  onImageClick,
}: {
  mediaItems: FeedMediaItem[];
  onImageClick: (urls: string[], index: number) => void;
}) {
  const mediaUrls = mediaItems.map((m) => getMediaUrl(m.fileUrl));
  const count = mediaItems.length;

  if (count === 1) {
    return (
      <div
        onClick={() => onImageClick(mediaUrls, 0)}
        className="w-full max-h-[460px] bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center cursor-pointer group overflow-hidden"
      >
        <img
          src={mediaUrls[0]}
          alt={mediaItems[0].fileName || "Post attachment"}
          className="max-h-[460px] w-full object-contain group-hover:scale-[1.01] transition-transform duration-200"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 aspect-[4/3] sm:aspect-[16/10] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
        {mediaItems.slice(0, 2).map((m, idx) => (
          <div
            key={m.id}
            onClick={() => onImageClick(mediaUrls, idx)}
            className="relative group bg-neutral-200 dark:bg-neutral-800 cursor-pointer overflow-hidden h-full"
          >
            <img
              src={getMediaUrl(m.fileUrl)}
              alt={m.fileName || "Post attachment"}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
        <div
          onClick={() => onImageClick(mediaUrls, 0)}
          className="row-span-2 col-span-1 relative group bg-neutral-200 dark:bg-neutral-800 cursor-pointer overflow-hidden h-full"
        >
          <img
            src={mediaUrls[0]}
            alt={mediaItems[0].fileName || "Post attachment"}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          />
        </div>
        {mediaItems.slice(1, 3).map((m, idx) => (
          <div
            key={m.id}
            onClick={() => onImageClick(mediaUrls, idx + 1)}
            className="col-span-1 row-span-1 relative group bg-neutral-200 dark:bg-neutral-800 cursor-pointer overflow-hidden h-full"
          >
            <img
              src={getMediaUrl(m.fileUrl)}
              alt={m.fileName || "Post attachment"}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
      {mediaItems.slice(0, 4).map((m, idx) => {
        const isFourth = idx === 3 && count > 4;
        return (
          <div
            key={m.id}
            onClick={() => onImageClick(mediaUrls, idx)}
            className="col-span-1 row-span-1 relative group bg-neutral-200 dark:bg-neutral-800 cursor-pointer overflow-hidden h-full"
          >
            <img
              src={getMediaUrl(m.fileUrl)}
              alt={m.fileName || "Post attachment"}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
            {isFourth && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-2xl font-bold">
                +{count - 4}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StaffProfileTab() {
  const { user, logout, updateUserAvatar } = useAuth();
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceName, setDeviceName] = useState<string>("");

  // Navigation tabs: "timeline" (Posts), "about" (Staff Info), "workstation" (Device Security)
  const [activeTab, setActiveTab] = useState<"timeline" | "about" | "workstation">("timeline");

  // Bio state (stored in localStorage for personal customization)
  const defaultBio = `Dedicated staff member at ${user?.school?.name || "Oakridge High School"}, supporting academic operations and instructional excellence.`;
  const [bio, setBio] = useState<string>("");
  const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
  const [bioInput, setBioInput] = useState<string>("");

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);

  // Timeline posts state
  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Comments state
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Quick Post Compose Modal (Triggered by "+ New Post" button)
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [composeContent, setComposeContent] = useState<string>("");
  const [composeVisibility, setComposeVisibility] = useState<PostVisibility>("campus");
  const [composeIsAnnouncement, setComposeIsAnnouncement] = useState<boolean>(false);
  const [composeFiles, setComposeFiles] = useState<File[]>([]);
  const [submittingPost, setSubmittingPost] = useState<boolean>(false);
  const composeFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    setDeviceName(getDeviceName());

    if (typeof window !== "undefined" && user?.id) {
      const savedBio = localStorage.getItem(`staff_bio_${user.id}`);
      if (savedBio !== null) {
        setBio(savedBio);
      } else {
        setBio(defaultBio);
      }
    } else {
      setBio(defaultBio);
    }
  }, [user?.id, user?.school?.name]);

  // Load user's own posts for the Timeline tab
  const loadMyPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetchFeed({ filter: "my", limit: 20 });
      setPosts(res.posts || []);
    } catch (err: any) {
      console.error("Failed to load user posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "timeline") {
      loadMyPosts();
    }
  }, [activeTab]);

  const handleSaveBio = () => {
    const trimmed = bioInput.trim();
    if (typeof window !== "undefined" && user?.id) {
      localStorage.setItem(`staff_bio_${user.id}`, trimmed);
    }
    setBio(trimmed || defaultBio);
    setIsEditingBio(false);
    toast.success("Profile bio updated");
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      setUploadingAvatar(true);
      toast.loading("Updating profile photo...", { id: "upload-avatar" });
      const res = await uploadMyAvatar(file);
      if (res.isSuccess && res.user.avatarUrl) {
        updateUserAvatar(res.user.avatarUrl);
        toast.success("Profile photo updated", { id: "upload-avatar" });
      } else {
        toast.error("Failed to update profile photo", { id: "upload-avatar" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image", { id: "upload-avatar" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleComposeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setComposeFiles((prev) => [...prev, ...newFiles]);
  };

  const removeComposeFile = (index: number) => {
    setComposeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublishPost = async () => {
    if (!composeContent.trim() && composeFiles.length === 0) {
      toast.error("Please enter text or select photos");
      return;
    }

    try {
      setSubmittingPost(true);
      await createFeedPost({
        content: composeContent.trim(),
        visibility: composeVisibility,
        isAnnouncement: composeIsAnnouncement,
        schoolId: user?.schoolId || undefined,
        files: composeFiles.length > 0 ? composeFiles : undefined,
      });

      toast.success("Post published to Campus Feed");
      setComposeContent("");
      setComposeFiles([]);
      setShowComposeModal(false);
      loadMyPosts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish post");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteFeedPost(postId);
      toast.success("Post deleted from timeline");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete post");
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await toggleFeedReaction(postId, "like");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                hasLiked: res.liked,
                userReaction: res.userReaction,
                reactionCount: res.reactionCount,
              }
            : p,
        ),
      );
    } catch {
      toast.error("Failed to update reaction");
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedCommentPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleSubmitComment = async (postId: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;

    try {
      const newComment = await addFeedComment(postId, { content: text });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [...(p.comments || []), newComment],
                commentsCount: p.commentsCount + 1,
              }
            : p,
        ),
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      toast.success("Comment added");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteFeedComment(commentId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: (p.comments || []).filter((c) => c.id !== commentId),
                commentsCount: Math.max(0, p.commentsCount - 1),
              }
            : p,
        ),
      );
      toast.success("Comment removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete comment");
    }
  };

  const handleOpenLightbox = (urls: string[], index: number) => {
    setLightboxImages(urls);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  const campusName = user?.school?.name || "Oakridge High School";

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* ── 1. FACEBOOK-STYLE PROFILE HERO CARD ── */}
      <Card className="shadow-xs overflow-hidden border-border/70 bg-card">
        {/* Cover Photo / Campus Banner */}
        <div className="h-32 sm:h-36 bg-linear-to-r from-blue-700 via-indigo-700 to-sky-600 relative p-3 flex flex-col justify-between select-none">
          {/* Top Campus Network Badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-xs text-white text-[11px] font-medium tracking-wide shadow-xs">
              <School className="h-3 w-3" />
              <span>Hello One Campus Network</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-semibold">
              Verified Portal
            </span>
          </div>

          {/* Campus Tagline at Cover Bottom */}
          <div className="text-white/90 text-xs font-medium flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{campusName}</span>
          </div>
        </div>

        {/* Profile Avatar & Info Body */}
        <CardContent className="pt-0 pb-5 px-4 sm:px-5">
          <div className="flex flex-col items-center text-center">
            {/* Overlapping Avatar with Camera Trigger */}
            <div className="relative -mt-14 sm:-mt-16 group">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-card shadow-md bg-muted">
                <AvatarImage
                  src={user?.avatarUrl ? getMediaUrl(user.avatarUrl) : undefined}
                  alt={user?.fullName || "Staff Member"}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Verified Active Badge on Avatar */}
              <div
                className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center shadow-xs"
                title="Active Staff Member"
              >
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>

              {/* Upload Avatar Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Upload profile picture"
                className="absolute bottom-0 -left-1 p-1.5 rounded-full bg-muted/90 hover:bg-muted text-foreground border border-border/80 shadow-xs transition-transform hover:scale-105 cursor-pointer"
                title="Update photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            {/* Staff Identity */}
            <div className="mt-3 space-y-1">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {user?.fullName || "Staff Member"}
              </h2>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="capitalize text-xs font-semibold px-2.5 py-0.5"
                >
                  {user?.role || "Staff"}
                </Badge>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {campusName}
                </span>
              </div>
            </div>

            {/* Domain Bio / Staff Motto */}
            <div className="mt-2.5 max-w-md w-full">
              {isEditingBio ? (
                <div className="space-y-2 text-left animate-in fade-in-50">
                  <Textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Describe your role, academic focus, or campus mission..."
                    rows={2}
                    className="text-xs resize-none"
                    maxLength={160}
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{bioInput.length}/160</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-2 cursor-pointer"
                        onClick={() => setIsEditingBio(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3 cursor-pointer"
                        onClick={handleSaveBio}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="group relative text-center">
                  <p className="text-xs text-muted-foreground leading-relaxed px-4 italic">
                    &ldquo;{bio || defaultBio}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBioInput(bio || defaultBio);
                      setIsEditingBio(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium mt-1 cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Bio</span>
                  </button>
                </div>
              )}
            </div>

            {/* Facebook-style Action Buttons Row */}
            <div className="mt-4 pt-3 border-t w-full flex items-center justify-center gap-2 flex-wrap">
              <Button
                size="sm"
                className="text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
                onClick={() => setShowComposeModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Post</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs font-medium gap-1.5 cursor-pointer"
                onClick={() => setActiveTab("workstation")}
              >
                <Laptop className="h-3.5 w-3.5 text-emerald-600" />
                <span>Workstation</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. FACEBOOK-STYLE PROFILE NAVIGATION PILLS ── */}
      <div className="flex items-center justify-between border-b pb-1 gap-1 text-xs select-none">
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === "timeline"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Timeline</span>
          {posts.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "timeline"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {posts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("about")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === "about"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Info className="h-3.5 w-3.5" />
          <span>About</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workstation")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === "workstation"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Laptop className="h-3.5 w-3.5" />
          <span>Workstation</span>
        </button>
      </div>

      {/* ── 3. TAB CONTENT ── */}

      {/* ── TAB A: TIMELINE (MY POSTS WITH COMPLETE FACEBOOK POST UX) ── */}
      {activeTab === "timeline" && (
        <div className="space-y-3.5 animate-in fade-in-50 duration-150">
          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              <p>Loading your campus timeline...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center border rounded-xl border-dashed bg-card/50 p-6 space-y-2.5">
              <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">No posts published yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Share academic updates, classroom announcements, or campus notices with your fellow educators and staff.
              </p>
              <Button
                size="sm"
                onClick={() => setShowComposeModal(true)}
                className="text-xs gap-1.5 mt-2 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Your First Post</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {posts.map((post) => {
                const authorInitials = post.author.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "ST";

                const isCommentsOpen = expandedCommentPostIds.has(post.id);

                return (
                  <article
                    key={post.id}
                    className="bg-card rounded-xl border border-border/80 shadow-xs overflow-hidden transition-shadow"
                  >
                    {/* Post Header */}
                    <div className="p-3 sm:p-3.5 pb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-10 w-10 border border-border/60">
                          <AvatarImage
                            src={post.author.avatarUrl ? getMediaUrl(post.author.avatarUrl) : undefined}
                            alt={post.author.fullName}
                          />
                          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                            {authorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-[14px] font-semibold text-foreground leading-tight hover:underline cursor-pointer">
                              {post.author.fullName}
                            </h4>
                            <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0 font-medium">
                              {post.author.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <span>{formatTimeAgo(post.createdAt)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 capitalize">
                              {post.visibility === "public" ? (
                                <Globe className="h-3 w-3" />
                              ) : (
                                <Building className="h-3 w-3 text-primary" />
                              )}
                              <span>{post.visibility === "campus" ? (post.school?.name || "Campus") : "Public"}</span>
                            </span>
                            {post.isAnnouncement && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                                  <Megaphone className="h-3 w-3" />
                                  Announcement
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Options Dropdown Menu (3-dots) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                          className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {activeMenuPostId === post.id && (
                          <div className="absolute right-0 top-9 z-20 w-36 bg-popover text-popover-foreground border rounded-lg shadow-lg py-1 animate-in fade-in-80 zoom-in-95 duration-100 text-xs font-medium">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuPostId(null);
                                handleDeletePost(post.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 text-left transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete post</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post Text Content */}
                    {post.content && (
                      <div className="px-3.5 sm:px-4 pt-1 pb-2.5">
                        <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Facebook Multi-Image Collage (Edge-to-Edge) */}
                    {post.mediaItems && post.mediaItems.length > 0 && (
                      <div className="border-t border-b">
                        <PostMediaCollage
                          mediaItems={post.mediaItems}
                          onImageClick={handleOpenLightbox}
                        />
                      </div>
                    )}

                    {/* Engagement Stats Row */}
                    <div className="px-3.5 sm:px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] shadow-xs">
                          👍
                        </span>
                        <span>{post.reactionCount}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className="hover:underline cursor-pointer"
                      >
                        {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
                      </button>
                    </div>

                    {/* Facebook 2-Button Action Bar (Like / Comment) */}
                    <div className="px-2 py-0.5 border-t grid grid-cols-2 gap-1 text-xs font-semibold text-muted-foreground select-none">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer ${
                          post.hasLiked ? "text-primary font-bold" : ""
                        }`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${post.hasLiked ? "fill-primary text-primary" : ""}`} />
                        <span>{post.hasLiked ? "Liked" : "Like"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Comment</span>
                      </button>
                    </div>

                    {/* Expandable Inline Comments Section */}
                    {isCommentsOpen && (
                      <div className="p-3 sm:p-4 bg-muted/20 border-t space-y-3 animate-in fade-in-50 duration-150">
                        {/* Comment List */}
                        {post.comments && post.comments.length > 0 ? (
                          <div className="space-y-2.5">
                            {post.comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-2">
                                <Avatar className="h-7 w-7 mt-0.5 border">
                                  <AvatarImage
                                    src={comment.author.avatarUrl ? getMediaUrl(comment.author.avatarUrl) : undefined}
                                  />
                                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                    {comment.author.fullName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/60 dark:bg-muted/40 rounded-xl px-3 py-2 text-xs">
                                  <div className="font-semibold text-foreground flex items-center justify-between">
                                    <span>{comment.author.fullName}</span>
                                    {comment.canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                        className="text-muted-foreground hover:text-destructive text-[10px] cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-foreground mt-0.5 leading-relaxed">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            No comments yet. Be the first to reply!
                          </p>
                        )}

                        {/* Add Comment Input Bar */}
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar className="h-7 w-7 border shrink-0">
                            <AvatarImage
                              src={user?.avatarUrl ? getMediaUrl(user.avatarUrl) : undefined}
                            />
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex items-center gap-1.5 bg-background border rounded-full px-3 py-1.5 shadow-2xs">
                            <input
                              type="text"
                              value={commentDrafts[post.id] || ""}
                              onChange={(e) =>
                                setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmitComment(post.id);
                                }
                              }}
                              placeholder="Write a comment..."
                              className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitComment(post.id)}
                              disabled={!commentDrafts[post.id]?.trim()}
                              className="text-primary hover:text-primary/80 disabled:opacity-40 disabled:hover:text-primary cursor-pointer p-0.5"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB B: ABOUT (FACEBOOK-STYLE INTRO & ACADEMIC CREDENTIALS) ── */}
      {activeTab === "about" && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                <span>Academic &amp; Staff Intro</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Your verified credentials and institutional affiliations within the school network.
              </CardDescription>
            </CardHeader>

            {/* Facebook Iconic Intro Bullet List */}
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-muted text-primary shrink-0 mt-0.5">
                  <School className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Campus / Facility</span>
                  <span className="font-semibold text-foreground">{campusName}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-muted text-primary shrink-0 mt-0.5">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Academic Role</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-foreground capitalize">{user?.role || "Staff"}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20 font-semibold">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-muted text-primary shrink-0 mt-0.5">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Verified Email</span>
                  <span className="font-medium text-foreground">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-muted text-primary shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Academic Session</span>
                  <span className="font-medium text-foreground">Term 2026 – 2027</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-muted text-primary shrink-0 mt-0.5">
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Authorized Device</span>
                  <span className="font-medium text-foreground">{deviceName || "Personal Computer"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Scope Guidelines */}
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Portal Operational Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                • Your views and tools are tailored specifically for your operational role (
                <strong className="text-foreground capitalize">{user?.role}</strong>).
              </p>
              <p>
                • System administration, user credential issuance, and platform configurations are managed centrally by the school administration.
              </p>
              <p>
                • For role changes or class reassignments, please coordinate with your campus administration.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB C: WORKSTATION & SECURITY ── */}
      {activeTab === "workstation" && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          <Card className="shadow-xs border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Current Workstation Device
                  </CardTitle>
                </div>
                <Badge className="text-[10px] bg-emerald-600 text-white font-medium gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Authorized
                </Badge>
              </div>
              <CardDescription className="text-xs">
                This browser session is securely recognized by the administration system.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-background/80 border">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Device Name</span>
                  <span className="font-semibold text-foreground truncate block">{deviceName || "Personal Computer"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Unique Device Token</span>
                  <span className="font-mono text-[11px] text-muted-foreground truncate block">{deviceId || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Account Security Actions</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your active session and portal security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-xs">
              <p className="text-muted-foreground">
                Signing out will invalidate your current session cookie. You will need your login credentials to sign back in.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out from this Device</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 4. QUICK POST COMPOSE MODAL (WITH PHOTO ATTACHMENTS) ── */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
          <div className="bg-background border rounded-xl shadow-xl max-w-md w-full p-4 sm:p-5 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Create Campus Post</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Author Snippet */}
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 border">
                <AvatarImage
                  src={user?.avatarUrl ? getMediaUrl(user.avatarUrl) : undefined}
                  alt={user?.fullName || "Staff"}
                />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-xs text-foreground">{user?.fullName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <select
                    value={composeVisibility}
                    onChange={(e) => setComposeVisibility(e.target.value as PostVisibility)}
                    className="text-[11px] bg-muted/70 rounded px-1.5 py-0.5 border text-muted-foreground font-medium cursor-pointer"
                  >
                    <option value="campus">🏫 Campus Only</option>
                    <option value="public">🌐 Public</option>
                  </select>

                  <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={composeIsAnnouncement}
                      onChange={(e) => setComposeIsAnnouncement(e.target.checked)}
                      className="rounded text-primary h-3 w-3"
                    />
                    <span>Announcement</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Content Input */}
            <Textarea
              value={composeContent}
              onChange={(e) => setComposeContent(e.target.value)}
              placeholder={`What's on your mind, ${user?.fullName?.split(" ")[0]}? Share campus news, notes or announcements...`}
              rows={3}
              className="text-xs resize-none"
              autoFocus
            />

            {/* Selected File Previews */}
            {composeFiles.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {composeFiles.map((file, idx) => (
                  <div key={idx} className="relative h-16 w-16 rounded-md overflow-hidden border shrink-0 group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Selected preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeComposeFile(idx)}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Attach Photos Toolbar */}
            <div className="flex items-center justify-between border rounded-lg p-2 bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">Add to your post</span>
              <button
                type="button"
                onClick={() => composeFileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Photos</span>
              </button>
              <input
                ref={composeFileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleComposeFileSelect}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComposeModal(false)}
                disabled={submittingPost}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePublishPost}
                disabled={submittingPost || (!composeContent.trim() && composeFiles.length === 0)}
                className="text-xs cursor-pointer"
              >
                {submittingPost ? "Publishing..." : "Publish Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. FULLSCREEN IMAGE LIGHTBOX MODAL ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in-80 duration-150">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
                className="absolute left-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10 cursor-pointer"
                title="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10 cursor-pointer"
                title="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
            <img
              src={lightboxImages[lightboxIndex]}
              alt="Enlarged view"
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
