import * as React from 'react';

export type ItemOption = { id: string; sku: string; name: string; nameAr?: string | null; uomId: string };

export function ItemPicker(props: {
  value?: string;
  onValueChange?: (id: string) => void;
  options: ItemOption[];
  placeholder?: string;
  label?: string;
}): React.JSX.Element {
  const { value, onValueChange, options, placeholder = 'اختر صنف…', label = 'الصنف' } = props;
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
          <option key={o.id} value={o.id}>{o.name} — {o.sku}</option>
        ))}
      </select>
    </div>
  );
}

export function useItemPricing(itemId?: string): { price: string; loading: boolean; provenance: string } {
  const [price, setPrice] = React.useState('0.000000');
  React.useEffect(() => { if (itemId) setPrice('0.000000'); }, [itemId]);
  return { price, loading: false, provenance: 'BASE' };
}
export function useStockAvailability(itemId?: string): { qty: string; loading: boolean } {
  const [qty, setQty] = React.useState('0');
  React.useEffect(() => { if (itemId) setQty('0'); }, [itemId]);
  return { qty, loading: false };
}
