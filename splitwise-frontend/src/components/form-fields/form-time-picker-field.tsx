import { Clock } from "lucide-react";
import type { FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import * as React from "react";
import { format, isValid } from "date-fns";

import { Input as UIInput } from "../ui/input";
import { Label as UILabel } from "../ui/label";

const Input = UIInput as React.ElementType;
const Label = UILabel as React.ElementType;
import { cn } from "../../utils";

import type { BaseFormFieldProps } from "./types";

interface FormTimePickerFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  hideLabel?: boolean;
  onChange?: (value: string) => void;
}

export function FormTimePickerField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder = "13:00",
  className,
  disabled,
  hideLabel = false,
  onChange: onChangeOverride,
}: FormTimePickerFieldProps<TFieldValues>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const timeValue = React.useMemo(() => {
    if (!field.value) return "";
    if (typeof field.value === "string") return field.value;
    const date = new Date(field.value);
    if (isValid(date)) {
      return format(date, "HH:mm");
    }
    return "";
  }, [field.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onChangeOverride) {
      onChangeOverride(value);
    } else {
      field.onChange(value);
    }
  };

  return (
    <div className="gap-3 flex w-full flex-col">
      <Label
        htmlFor={name}
        className={hideLabel ? "opacity-0" : "text-xs md:text-sm text-slate-900 font-medium"}
      >
        {label}
      </Label>
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          {...field}
          value={timeValue}
          onChange={handleChange}
          id={name}
          type="time"
          placeholder={placeholder}
          className={cn(
            "pl-10 text-xs md:text-sm text-slate-900 font-normal no-focus-outline",
            "placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-500 placeholder:font-normal",
            "py-4 md:py-5 rounded-md",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${name}-error` : undefined}
        />
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
