"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Globe,
  Building,
  Lock,
  RefreshCw,
  Trash2,
  Undo2,
  AlertCircle,
  Sparkles,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  FeedPostItem,
  PostVisibility,
  fetchFeedPostById,
  updateFeedPost,
  getMediaUrl,
} from "@/lib/api/feed";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const POST_BACKGROUNDS = [
  { id: "none", label: "Default", class: "" },
  {
    id: "ocean",
    label: "Ocean",
    class:
      "bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[200px]",
  },
  {
    id: "sunset",
    label: "Sunset",
    class:
      "bg-gradient-to-tr from-rose-500 via-amber-500 to-yellow-400 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[200px]",
  },
  {
    id: "berry",
    label: "Berry",
    class:
      "bg-gradient-to-tr from-purple-800 via-pink-600 to-rose-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[200px]",
  },
  {
    id: "emerald",
    label: "Emerald",
    class:
      "bg-gradient-to-tr from-emerald-700 via-teal-600 to-cyan-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[200px]",
  },
  {
    id: "fire",
    label: "Fire",
    class:
      "bg-gradient-to-tr from-red-600 via-orange-600 to-amber-500 text-white font-bold text-center text-xl md:text-2xl p-8 rounded-xl flex items-center justify-center min-h-[200px]",
  },
];

export default function EditFeedPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params?.id as string;

  const [post, setPost] = useState<FeedPostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [theme, setTheme] = useState("none");
  const [visibility, setVisibility] = useState<PostVisibility>("campus");
  const [removedMediaIds, setRemovedMediaIds] = useState<Set<string>>(new Set());

  const isMultiCampus = user?.role === "admin" || user?.role === "director";

  useEffect(() => {
    if (!postId) return;

    let isMounted = true;
    setLoading(true);

    fetchFeedPostById(postId)
      .then((data) => {
        if (!isMounted) return;
        setPost(data);
        setContent(data.content || "");
        setTheme(data.theme || "none");
        setVisibility(data.visibility || "campus");
      })
      .catch((err) => {
        console.error("Failed to load post for editing:", err);
        toast.error("Failed to load post. It may have been deleted.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const toggleRemoveMedia = (mediaId: string) => {
    setRemovedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
      } else {
        next.add(mediaId);
      }
      return next;
    });
  };

  const remainingMediaCount =
    (post?.mediaItems?.length || 0) - removedMediaIds.size;
  const canUseTheme = remainingMediaCount === 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;

    if (!content.trim() && remainingMediaCount === 0) {
      toast.error("A post must contain text content or at least one image.");
      return;
    }

    try {
      setSaving(true);
      await updateFeedPost(postId, {
        content: content.trim(),
        visibility,
        theme: canUseTheme ? theme : "none",
        removeMediaIds: Array.from(removedMediaIds),
      });

      toast.success("Post updated successfully!");
      // Navigate back to the previous screen or default feed
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/admin/feed");
      }
    } catch (err: any) {
      console.error("Failed to update post:", err);
      toast.error(err?.response?.data?.message || "Failed to update post.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] p-4 sm:p-6 md:p-10 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 space-y-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-1/4" />
          <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
          <div className="h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg w-1/2" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] p-4 sm:p-6 md:p-10 flex justify-center items-start">
        <div className="w-full max-w-md bg-white dark:bg-[#242526] rounded-2xl border border-gray-200 dark:border-neutral-800 p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Post Not Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This post may have been removed or you do not have permission to view it.
          </p>
          <Button onClick={() => router.back()} className="rounded-xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const selectedBgObj = canUseTheme
    ? POST_BACKGROUNDS.find((b) => b.id === theme)
    : null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-[#242526] border border-gray-200 dark:border-neutral-700 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-neutral-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>Back</span>
          </button>

          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Post ID: {post.id.slice(0, 8)}...
          </span>
        </div>

        {/* Main Edit Form Card */}
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#242526] rounded-2xl border border-gray-200/80 dark:border-neutral-800 shadow-sm p-5 sm:p-7 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 dark:border-neutral-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Edit Post
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Update your post content, audience, and attached media
              </p>
            </div>

            {/* Author info pill */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-800/70 border border-gray-200/60 dark:border-neutral-700 px-3 py-1.5 rounded-full text-xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] overflow-hidden">
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
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {post.author.fullName}
              </span>
            </div>
          </div>

          {/* Visibility / Audience Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Audience Scope
            </label>
            <div className="relative">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#1877F2] transition-colors"
              >
                {isMultiCampus && (
                  <option value="public">🌍 Public (All Campuses)</option>
                )}
                <option value="campus">
                  🏫 Campus Community ({post.school?.name || "My School"})
                </option>
                <option value="private">🔒 Only Me (Private Draft)</option>
              </select>
            </div>
          </div>

          {/* Content Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Post Content
              </label>
              <span className="text-xs text-gray-400">
                {content.length} characters
              </span>
            </div>

            {/* Live Theme Preview if active */}
            {canUseTheme && selectedBgObj && selectedBgObj.id !== "none" ? (
              <div className="space-y-3">
                <div className={selectedBgObj.class}>
                  <p className="whitespace-pre-wrap select-text leading-relaxed break-words [overflow-wrap:anywhere]">
                    {content || "Your themed post text will appear here..."}
                  </p>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  className="w-full text-sm rounded-xl border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#18191A]"
                />
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={6}
                className="w-full text-sm rounded-xl border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#18191A] break-words [overflow-wrap:anywhere]"
              />
            )}
          </div>

          {/* Background Theme Selector (Only enabled if no media attached) */}
          {canUseTheme && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-neutral-800/40 rounded-xl border border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Background Theme</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {POST_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setTheme(bg.id)}
                    className={`w-9 h-9 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                      bg.id === "none"
                        ? "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 text-gray-400 text-xs"
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
                      theme === bg.id
                        ? "ring-3 ring-[#1877F2] scale-110 shadow-sm"
                        : "hover:scale-105"
                    }`}
                    title={bg.label}
                  >
                    {theme === bg.id && (
                      <Check
                        className={`w-4 h-4 ${
                          bg.id === "none"
                            ? "text-[#1877F2]"
                            : "text-white drop-shadow"
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attached Media Management */}
          {post.mediaItems && post.mediaItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Attached Media ({remainingMediaCount} active)
                </label>
                {removedMediaIds.size > 0 && (
                  <span className="text-xs text-rose-500 font-medium">
                    {removedMediaIds.size} marked for removal
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {post.mediaItems.map((m) => {
                  const isMarked = removedMediaIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`relative rounded-xl overflow-hidden border aspect-square transition-all ${
                        isMarked
                          ? "opacity-40 border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20"
                          : "border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800"
                      }`}
                    >
                      <img
                        src={getMediaUrl(m.fileUrl)}
                        alt={m.fileName}
                        className="w-full h-full object-cover"
                      />

                      {/* Remove / Undo Button */}
                      <button
                        type="button"
                        onClick={() => toggleRemoveMedia(m.id)}
                        className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition-all cursor-pointer ${
                          isMarked
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-black/60 hover:bg-rose-600 text-white"
                        }`}
                        title={isMarked ? "Undo remove" : "Remove image"}
                      >
                        {isMarked ? (
                          <Undo2 className="w-3.5 h-3.5" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isMarked && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[11px] font-bold text-rose-600 bg-white/90 dark:bg-black/80 px-2 py-1 rounded shadow-xs">
                            Removed
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || (!content.trim() && remainingMediaCount === 0)}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl px-6 font-semibold"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
