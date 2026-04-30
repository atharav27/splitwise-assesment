import type { FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";

import { Textarea as UITextarea } from "../ui/textarea";
import { Label as UILabel } from "../ui/label";
import * as React from "react";

const Textarea = UITextarea as React.ElementType;
const Label = UILabel as React.ElementType;
import { cn } from "../../utils";

import type { BaseFormFieldProps } from "./types";

interface FormTextareaFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  rows?: number;
  minHeight?: string;
}

export function FormTextareaField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  className,
  disabled,
  rows,
  minHeight = "min-h-24",
}: FormTextareaFieldProps<TFieldValues>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <div className="gap-3 flex w-full flex-col">
      <Label 
        htmlFor={name} 
        className="text-xs md:text-sm text-slate-900 font-medium"
      >
        {label}
      </Label>
      <Textarea
        {...field}
        id={name}
        placeholder={placeholder}
        className={cn(
          minHeight,
          "text-xs md:text-sm text-slate-900 font-normal no-focus-outline",
          "placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-500 placeholder:font-normal",
          "py-2 rounded-md",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p 
          id={`${name}-error`}
          className="text-red-500 text-sm font-normal"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}

