"use client";

import { useRef, useState } from "react";

import { Check, Dot, FileText, Loader, Trash2, Upload, X } from "lucide-react";
import type { FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";

import { Button as UIButton } from "../ui/button";
import { Label as UILabel } from "../ui/label";
import { Progress as UIProgress } from "../ui/progress";
import * as React from "react";

const Button = UIButton as React.ElementType;
const Label = UILabel as React.ElementType;
const Progress = UIProgress as React.ElementType;
import { cn } from "../../utils";

import type { BaseFormFieldProps } from "./types";

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPT = ".jpg,.jpeg,.png,.pdf";

interface FormFileUploadFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  maxSize?: number;
  accept?: string;
}

interface FileUploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "uploaded";
}

export function FormFileUploadField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  className,
  maxSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
}: FormFileUploadFieldProps<TFieldValues>) {
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Map<File, FileUploadProgress>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    field,
    fieldState: { error: fieldError },
  } = useController({
    name,
    control,
  });

  const files = Array.isArray(field.value) ? (field.value as File[]) : [];
  const simulateUpload = (file: File) => {
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev.get(file);
        if (!current) {
          return prev;
        }

        const newProgress = Math.min(current.progress + 10, 100);
        const newMap = new Map(prev);
        newMap.set(file, {
          ...current,
          progress: newProgress,
          status: newProgress === 100 ? "uploaded" : "uploading",
        });

        if (newProgress === 100) {
          clearInterval(progressInterval);
        }

        return newMap;
      });
    }, 200);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    setError(null);

    // Validate file sizes
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the maximum size of ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Validate file types
    const invalidFiles = selectedFiles.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return !accept.split(",").some((type) => type.replace(".", "") === extension);
    });
    if (invalidFiles.length > 0) {
      setError(`Some files are not allowed. Accepted types: ${accept}`);
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    field.onChange(newFiles);

    // Initialize upload progress for new files
    selectedFiles.forEach((file) => {
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(file, {
          file,
          progress: 0,
          status: "uploading",
        });
        return newMap;
      });
      // Simulate upload progress
      simulateUpload(file);
    });
  };

  const handleRemoveFile = (fileToRemove: File) => {
    const newFiles = files.filter((file) => file !== fileToRemove);
    field.onChange(newFiles);
    setUploadProgress((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileToRemove);
      return newMap;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="gap-3 flex w-full flex-col">
      <Label
        htmlFor={name}
        className="text-xs md:text-sm text-slate-900 font-medium"
      >
        {label}
      </Label>
      <div className={cn("space-y-3", className)}>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 gap-3">
          <Upload className="mb-3 size-5 md:size-6 text-slate-400" />
          <p className="mb-2 text-xs md:text-sm font-normal text-slate-400 md:px-16 text-center">
            Add images or files that help explain the issue. (JPG, PNG, PDF up to 10 MB)
          </p>
          <Button type="button" onClick={handleBrowseClick} className="rounded-full text-slate-400 text-sm md:text-base font-normal border-slate-400 border bg-white">
            Browse File
          </Button>
          <input
            ref={fileInputRef}
            id={name}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file) => {
              const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
              const fileSizeKB = (file.size / 1024).toFixed(0);
              const uploadInfo = uploadProgress.get(file);
              const progress = uploadInfo?.progress ?? 100;
              const status = uploadInfo?.status ?? "uploaded";
              const uploadedKB = ((file.size * progress) / 100 / 1024).toFixed(0);
              const isUploading = status === "uploading";

              return (
                <div
                  key={fileKey}
                  className="relative rounded-lg border border-slate-200 bg-white p-4 md:p-5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 md:size-5 text-slate-900 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <p className="text-xs md:text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center">
                        <p className="text-xs text-slate-400">
                          {uploadedKB} KB of {fileSizeKB} KB
                        </p>
                        <Dot className="text-slate-400" />
                      </div>
                      {isUploading && (
                        <>
                          <Loader className="size-4 md:size-5 animate-spin text-brand-blue-400" />
                          <span className="text-xs text-brand-blue-400">Uploading...</span>
                        </>
                      )}
                      {!isUploading && (
                        <>
                          <Check className="size-4 md:size-5 text-green-600 bg-green-100 rounded-full p-1 font-normal" />
                          <span className="text-xs text-green-600">Uploaded</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2">
                      <Progress value={progress} className="h-1.5" indicatorClassName="bg-brand-blue-400" />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 shrink-0"
                  >
                    {isUploading ? (
                      <X className="size-4 md:size-5 text-slate-900" strokeWidth={1.5} />
                    ) : (
                      <Trash2 className="size-4 md:size-5 text-slate-900" strokeWidth={1.5} />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {fieldError && (
        <p
          id={`${name}-error`}
          className="text-red-500 text-sm font-normal"
        >
          {fieldError.message}
        </p>
      )}
    </div>
  );
}
