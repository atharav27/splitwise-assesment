import type { FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Input as UIInput } from "../ui/input";
import { Label as UILabel } from "../ui/label";
import * as React from "react";

const Input = UIInput as React.ElementType;
const Label = UILabel as React.ElementType;
import { cn } from "../../utils";

import type { BaseFormFieldProps } from "./types";

interface FormInputFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  readOnly?: boolean;
  optional?: boolean;
  showToggle?: boolean;
}

export function FormInputField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  className,
  disabled,
  readOnly,
  optional,
  type = "text",
  showToggle = false,
}: FormInputFieldProps<TFieldValues>) {
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });
  const isPasswordField = type === "password";
  const shouldShowToggle = isPasswordField && showToggle;
  const resolvedType = shouldShowToggle && showPassword ? "text" : type;

  return (
    <div className="gap-3 flex w-full flex-col">
      <Label
        htmlFor={name}
        className="text-xs md:text-sm text-slate-900 font-medium"
      >
        {label}
        {optional && <span className="text-slate-500 font-normal ml-1">(Optional)</span>}
      </Label>
      <div className="relative">
        <Input
          {...field}
          value={field.value ?? ""}
          id={name}
          type={resolvedType}
          placeholder={placeholder}
          className={cn(
            "text-xs md:text-sm text-slate-900 font-normal no-focus-outline",
            "placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-500 placeholder:font-normal",
            "py-4 md:py-5 rounded-md",
            shouldShowToggle && "pr-10",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {shouldShowToggle ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>
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

