import type { Control, FieldPath, FieldValues } from "react-hook-form";

export interface BaseFormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

