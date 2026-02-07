"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export function AvatarUpload() {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          
          // Update Clerk user avatar
          await user?.setProfileImage({ file: base64Image });
          
          // Refresh user data
          await user?.reload();
          
          setUploading(false);
        } catch (err: any) {
          setError(err.message || "Failed to upload avatar");
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {user?.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.fullName || "User avatar"}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
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
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? "Uploading..." : "Change Avatar"}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Upload a profile picture. Max size 5MB. Supported formats: JPG, PNG, GIF
      </p>
    </div>
  );
}
