import type { FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";

import { Label as UILabel } from "../ui/label";
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from "../ui/select";
import * as React from "react";

const Label = UILabel as React.ElementType;
const Select = UISelect as React.ElementType;
const SelectContent = UISelectContent as React.ElementType;
const SelectItem = UISelectItem as React.ElementType;
const SelectTrigger = UISelectTrigger as React.ElementType;
const SelectValue = UISelectValue as React.ElementType;
import { cn } from "../../utils";

import type { BaseFormFieldProps, SelectOption } from "./types";

interface FormSelectFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends BaseFormFieldProps<TFieldValues> {
  options: string[] | SelectOption[];
  showDescription?: boolean;
}

export function FormSelectField<TFieldValues extends FieldValues = FieldValues>({
  control,
  name,
  label,
  placeholder,
  className,
  disabled,
  options,
  showDescription = false,
}: FormSelectFieldProps<TFieldValues>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const isStringArray = typeof options[0] === "string";

  return (
    <div className="gap-3 flex w-full flex-col">
      <Label 
        htmlFor={name} 
        className="text-xs md:text-sm text-slate-900 font-medium"
      >
        {label}
      </Label>
      <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
        <SelectTrigger
          id={name}
          className={cn(
            "w-full text-xs md:text-sm text-slate-900 font-normal no-focus-outline",
            "placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-500 placeholder:font-normal",
            "py-4 md:py-5 rounded-md shadow-none",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {isStringArray
            ? (options as string[]).map((option) => (
              <SelectItem key={option} value={option} className="text-xs md:text-sm text-slate-900 font-normal hover:bg-transparent cursor-pointer py-2 md:py-3 border-b rounded-none px-2 md:px-3">
                {option}
              </SelectItem>
            ))
            : (options as SelectOption[]).map((option) => (
              <SelectItem key={option.value} value={option.value} className={showDescription ? "py-2 md:py-3 border-b rounded-none" : ""}>
                {showDescription && option.description ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-900 text-xs md:text-sm">{option.label}</span>
                    <span className="text-xs text-slate-900 font-normal">{option.description}</span>
                  </div>
                ) : (
                  option.label
                )}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
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

