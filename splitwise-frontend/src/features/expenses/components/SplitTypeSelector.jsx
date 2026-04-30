import { Button } from '../../../components/ui/button';

const splitTypes = [
  { value: 'equal', label: 'Equal' },
  { value: 'unequal', label: 'Unequal' },
  { value: 'percentage', label: 'Percentage' },
];

export const SplitTypeSelector = ({ value, onChange, disabled = false }) => (
  <div className="inline-flex rounded-lg border p-1">
    {splitTypes.map((type) => (
      <Button
        key={type.value}
        type="button"
        size="sm"
        disabled={disabled}
        variant={value === type.value ? 'default' : 'ghost'}
        onClick={() => onChange(type.value)}
      >
        {type.label}
      </Button>
    ))}
  </div>
);

