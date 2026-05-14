import type { ComponentCategory } from '@/lib/ai/schemas';
import { CATEGORY_META, categoryColor, categoryColorDeep } from '@/lib/categories';

export function CategoryChip({
  category,
  size = 'md',
}: {
  category: ComponentCategory;
  size?: 'sm' | 'md';
}) {
  const meta = CATEGORY_META[category];
  const px = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs';

  return (
    <span
      className={`grid place-items-center rounded-md font-mono font-semibold text-white ${px}`}
      style={{ backgroundColor: categoryColorDeep(category) }}
      aria-label={meta.label}
    >
      {meta.short}
    </span>
  );
}

export { categoryColor };