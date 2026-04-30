import { Button } from '../../../components/ui/button';

const splitTypes = [
  { value: 'equal', label: 'Equal' },
  { value: 'unequal', label: 'Unequal' },
  { value: 'percentage', label: 'Percentage' },
];

export const SplitTypeSelector = ({ value, onChange, disabled = false }) => (
  <div className="grid w-full grid-cols-3 rounded-lg border p-1">
    {splitTypes.map((type) => (
      <Button
        key={type.value}
        type="button"
        size="sm"
        disabled={disabled}
        variant={value === type.value ? 'default' : 'ghost'}
        className="px-2 text-xs sm:text-sm"
        onClick={() => onChange(type.value)}
      >
        {type.label}
      </Button>
    ))}
  </div>
);

