"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export function AvatarUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      const data = await response.json();
      setAvatarUrl(data.url);
      setUploading(false);
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Get user initials for fallback avatar
  const getInitials = () => {
    if (!user?.email) return "?";
    const email = user.email;
    return email.charAt(0).toUpperCase();
  };

  const displayAvatarUrl = avatarUrl || user?.user_metadata?.avatar_url;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-light-border dark:bg-dark-border border-4 border-white flex items-center justify-center">
          {displayAvatarUrl ? (
            <Image
              src={displayAvatarUrl}
              alt="User avatar"
              width={128}
              height={128}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-bold">
              {getInitials()}
            </div>
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={handleClick}
        disabled={uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-light-text-tertiary disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "Uploading..." : "Change Avatar"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary text-center max-w-xs">
        Upload a profile picture. Max size 5MB. Supported formats: JPG, PNG, GIF
      </p>
    </div>
  );
}
