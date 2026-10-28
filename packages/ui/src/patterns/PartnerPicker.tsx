import * as React from 'react';

export type PartnerOption = { id: string; code: string; name: string; nameAr?: string | null; kind: string };

export function PartnerPicker(props: {
  value?: string;
  onValueChange?: (id: string) => void;
  options: PartnerOption[];
  placeholder?: string;
  label?: string;
}): React.JSX.Element {
  const { value, onValueChange, options, placeholder = 'اختر جهة…', label = 'الجهة' } = props;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-start">{label}</label>
      <select
        aria-label={label}
        value={value ?? ''}
        onChange={e => onValueChange?.((e.target as HTMLSelectElement).value)}
        className="border rounded ps-3 pe-8 py-2 text-start"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name} — {o.code}</option>
        ))}
      </select>
    </div>
  );
}

export function usePartnerBalance(partnerId?: string): { openBalance: string; loading: boolean } {
  const [bal, setBal] = React.useState('0.0000');
  React.useEffect(() => {
    if (!partnerId) return;
    setBal('0.0000');
  }, [partnerId]);
  return { openBalance: bal, loading: false };
}
