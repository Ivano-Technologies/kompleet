"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "@/lib/convex/browser";
import { rejectDocsFile, type FileSource, type LibraryFile, type LinkType } from "./file-kind";

interface UploadOptions {
  source?: FileSource;
  linkType?: LinkType;
  linkId?: string;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  fileName: string | null;
  error: string | null;
}

async function postToStorage(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as { storageId?: string };
          if (!body.storageId) {
            reject(new Error("Upload failed"));
            return;
          }
          resolve(body.storageId);
        } catch {
          reject(new Error("Upload failed"));
        }
        return;
      }
      reject(new Error("Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export function useLibraryUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFileMetadata = useMutation(api.files.saveFileMetadata);
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    fileName: null,
    error: null,
  });

  const upload = useCallback(
    async (file: File, options: UploadOptions = {}): Promise<LibraryFile> => {
      const problem = rejectDocsFile(file);
      if (problem) {
        setState((prev) => ({ ...prev, error: problem }));
        throw new Error(problem);
      }
      setState({
        uploading: true,
        progress: 0,
        fileName: file.name,
        error: null,
      });
      try {
        const uploadUrl = await generateUploadUrl();
        const storageId = await postToStorage(uploadUrl, file, (pct) => {
          setState((prev) => ({ ...prev, progress: pct }));
        });
        const saved = await saveFileMetadata({
          storageId: storageId as Id<"_storage">,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          source: options.source ?? "documents",
          linkType: options.linkType,
          linkId: options.linkId,
        });
        setState({
          uploading: false,
          progress: 100,
          fileName: null,
          error: null,
        });
        return saved as LibraryFile;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setState({
          uploading: false,
          progress: 0,
          fileName: file.name,
          error: message,
        });
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [generateUploadUrl, saveFileMetadata],
  );

  return { upload, ...state };
}
