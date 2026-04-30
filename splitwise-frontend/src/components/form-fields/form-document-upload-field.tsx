"use client";

import { useRef } from "react";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";

import { FileText, Upload, X } from "lucide-react";

import { Button as UIButton } from "../ui/button";
import * as React from "react";

const Button = UIButton as React.ElementType;

interface FormDocumentUploadFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  documentName: string;
  accept?: string;
  maxSize?: number;
  className?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPT = ".pdf";

export function FormDocumentUploadField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  documentName,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  className,
}: FormDocumentUploadFieldProps<TFieldValues>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) {
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      // Error will be handled by form validation
      return;
    }

    // Validate file type
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    const acceptedTypes = accept.split(",").map((type) => type.replace(".", "").trim());
    if (extension && !acceptedTypes.includes(extension)) {
      // Error will be handled by form validation
      return;
    }

    onChange(selectedFile);
  };

  const handleRemoveFile = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between shadow-xs rounded-md border bg-white px-2 md:px-3 py-1">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
          <FileText className="size-4 md:size-5 text-slate-900 shrink-0" strokeWidth={1.5} />
          <span className="text-xs md:text-sm font-normal text-slate-900 truncate">{documentName}</span>
          {value && (
            <span className="text-xs text-slate-500 truncate">({value.name})</span>
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="h-7 w-7 md:h-8 md:w-8 cursor-pointer"
            >
              <X className="size-3.5 md:size-4 text-slate-900" strokeWidth={1.5} />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleUploadClick}
            className="h-7 w-7 md:h-8 md:w-8 cursor-pointer"
          >
            <Upload className="size-3.5 md:size-4 text-slate-900" strokeWidth={1.5} />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm font-normal mt-1">
          {error.message}
        </p>
      )}
    </div>
  );
}

