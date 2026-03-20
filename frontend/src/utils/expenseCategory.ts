import type { LucideIcon } from 'lucide-react';
import {
  Bus,
  CreditCard,
  Film,
  Home,
  Plane,
  Receipt,
  ShoppingBag,
  Utensils,
  Car,
} from 'lucide-react';

export type ExpenseCategoryKey = 'food' | 'travel' | 'rent' | 'shopping' | 'entertainment' | 'transport' | 'bills' | 'other';

function normalize(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.toLowerCase().trim();
}

export function inferExpenseCategoryKey(params: { title?: unknown; category?: unknown }): ExpenseCategoryKey {
  const title = normalize(params.title);
  const category = normalize(params.category);

  const text = `${category} ${title}`.trim();
  if (!text) return 'other';

  const has = (re: RegExp) => re.test(text);

  if (
    has(/\b(food|lunch|dinner|breakfast|coffee|tea|snack|grocery|restaurant|restaurant|meal|dessert)\b/)
  ) {
    return 'food';
  }

  if (has(/\b(hotel|stay|trip|travel|flight|air|vacation)\b/)) {
    return 'travel';
  }

  if (has(/\b(rent|apartment|house|lease)\b/)) {
    return 'rent';
  }

  if (has(/\b(shopping|shoes|clothes|clothing|clothing|store|amazon|market|bag|wardrobe)\b/)) {
    return 'shopping';
  }

  if (has(/\b(movie|cinema|netflix|concert|game|gaming|entertainment)\b/)) {
    return 'entertainment';
  }

  if (has(/\b(uber|ola|taxi|lyft|train|bus|toll)\b/)) {
    return 'transport';
  }

  if (has(/\b(fuel|petrol|diesel|gas)\b/)) {
    return 'transport';
  }

  if (has(/\b(electric|water|internet|bill|utility|gas bill|phone|mobile)\b/)) {
    return 'bills';
  }

  return 'other';
}

const iconMap: Record<
  ExpenseCategoryKey,
  {
    Icon: LucideIcon;
    colorClass: string;
    borderClass: string;
    containerBgClass: string;
    label: string;
  }
> = {
  food: {
    Icon: Utensils,
    colorClass: 'text-primary bg-primary/20',
    borderClass: 'border-primary/20',
    containerBgClass: 'bg-primary/20 text-primary border-primary/20',
    label: 'Food',
  },
  travel: {
    Icon: Plane,
    colorClass: 'text-warning bg-warning/20',
    borderClass: 'border-warning/20',
    containerBgClass: 'bg-warning/20 text-warning border-warning/20',
    label: 'Travel',
  },
  rent: {
    Icon: Home,
    colorClass: 'text-danger bg-danger/20',
    borderClass: 'border-danger/20',
    containerBgClass: 'bg-danger/20 text-danger border-danger/20',
    label: 'Rent',
  },
  shopping: {
    Icon: ShoppingBag,
    colorClass: 'text-success bg-success/20',
    borderClass: 'border-success/20',
    containerBgClass: 'bg-success/20 text-success border-success/20',
    label: 'Shopping',
  },
  entertainment: {
    Icon: Film,
    colorClass: 'text-secondary bg-white/10',
    borderClass: 'border-border-soft',
    containerBgClass: 'bg-white/10 text-secondary border-border-soft',
    label: 'Entertainment',
  },
  transport: {
    Icon: Bus,
    colorClass: 'text-warning bg-warning/20',
    borderClass: 'border-warning/20',
    containerBgClass: 'bg-warning/20 text-warning border-warning/20',
    label: 'Transport',
  },
  bills: {
    Icon: CreditCard,
    colorClass: 'text-secondary bg-white/10',
    borderClass: 'border-border-soft',
    containerBgClass: 'bg-white/10 text-secondary border-border-soft',
    label: 'Bills',
  },
  other: {
    Icon: Receipt,
    colorClass: 'text-secondary bg-white/10',
    borderClass: 'border-border-soft',
    containerBgClass: 'bg-white/10 text-secondary border-border-soft',
    label: 'Other',
  },
};

export function getExpenseCategoryIconProps(categoryKey: ExpenseCategoryKey) {
  return iconMap[categoryKey] ?? iconMap.other;
}

