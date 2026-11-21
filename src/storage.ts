import { ChristmasLedgerData, GiftEntry, Recipient } from './types';

export const STORAGE_KEY = 'christmas_log_uk_v1';

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getStarterData(): ChristmasLedgerData {
  const now = Date.now();
  const recipients: Recipient[] = [
    { id: 'rec_mum', name: 'Mum', budget: 120, note: 'Family', createdAt: now - 40000 },
    { id: 'rec_dad', name: 'Dad', budget: 100, note: 'Family', createdAt: now - 30000 },
    { id: 'rec_clara', name: 'Clara', budget: 60, note: 'Sister', createdAt: now - 20000 },
    { id: 'rec_oliver', name: 'Oliver', budget: 50, note: 'Best friend', createdAt: now - 10000 },
  ];

  const gifts: GiftEntry[] = [
    {
      id: 'gift_1',
      recipientId: 'rec_mum',
      description: 'Cashmere winter scarf in oatmeal',
      estimatedCost: 85,
      purchased: true,
      createdAt: now - 35000,
      updatedAt: now - 35000,
    },
    {
      id: 'gift_2',
      recipientId: 'rec_mum',
      description: 'Spiced loose-leaf Christmas tea caddy',
      estimatedCost: 28,
      purchased: false,
      createdAt: now - 32000,
      updatedAt: now - 32000,
    },
    {
      id: 'gift_3',
      recipientId: 'rec_dad',
      description: 'Lambswool tartan overshirt',
      estimatedCost: 72,
      purchased: true,
      createdAt: now - 28000,
      updatedAt: now - 28000,
    },
    {
      id: 'gift_4',
      recipientId: 'rec_dad',
      description: 'Single-origin winter roast coffee beans',
      estimatedCost: 18.5,
      purchased: false,
      createdAt: now - 25000,
      updatedAt: now - 25000,
    },
    {
      id: 'gift_5',
      recipientId: 'rec_clara',
      description: 'Hardback botanical art book & linen bookmark',
      estimatedCost: 45,
      purchased: false,
      createdAt: now - 18000,
      updatedAt: now - 18000,
    },
    {
      id: 'gift_6',
      recipientId: 'rec_oliver',
      description: 'Vinyl LP pressing & velvet record brush',
      estimatedCost: 38,
      purchased: false,
      createdAt: now - 12000,
      updatedAt: now - 12000,
    },
  ];

  return {
    recipients,
    gifts,
  };
}

export function loadLedgerData(): ChristmasLedgerData {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem('noel_ledger_uk_v3');
    if (!raw) {
      const starter = getStarterData();
      saveLedgerData(starter);
      return starter;
    }
    const parsed = JSON.parse(raw) as Partial<ChristmasLedgerData>;
    const recipients = Array.isArray(parsed.recipients)
      ? parsed.recipients
          .filter(
            (r): r is Recipient =>
              Boolean(r && typeof r.id === 'string' && typeof r.name === 'string' && r.name.trim().length > 0)
          )
          .map((r) => ({
            ...r,
            budget:
              typeof r.budget === 'number' && Number.isFinite(r.budget) && r.budget >= 0
                ? r.budget
                : 0,
          }))
      : [];
    const gifts = Array.isArray(parsed.gifts)
      ? parsed.gifts
          .filter(
            (g): g is GiftEntry =>
              Boolean(
                g &&
                  typeof g.id === 'string' &&
                  typeof g.recipientId === 'string' &&
                  typeof g.description === 'string' &&
                  typeof g.estimatedCost === 'number' &&
                  Number.isFinite(g.estimatedCost)
              )
          )
          .map((g) => ({
            ...g,
            purchased: Boolean(g.purchased),
          }))
      : [];
    return { recipients, gifts };
  } catch {
    return getStarterData();
  }
}

export function saveLedgerData(data: ChristmasLedgerData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

const gbpFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactGbpFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return gbpFormatter.format(safe);
}

export function formatCurrencySmart(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (Math.abs(safe - Math.round(safe)) < 0.005) {
    return compactGbpFormatter.format(safe);
  }
  return gbpFormatter.format(safe);
}

export function getChristmasCountdownLabel(): string {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let christmas = new Date(now.getFullYear(), 11, 25);
  if (todayStart > christmas) {
    christmas = new Date(now.getFullYear() + 1, 11, 25);
  }
  const diffDays = Math.round((christmas.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Merry Christmas!';
  if (diffDays === 1) return '1 sleep until Christmas!';
  return `${diffDays} sleeps until Christmas!`;
}

export const HERITAGE_SEAL_COLORS = [
  { bg: '#D1202F', text: '#FFFFFF', ring: 'rgba(248, 197, 55, 0.55)' }, // Santa Red
  { bg: '#157A4B', text: '#FFFFFF', ring: 'rgba(248, 197, 55, 0.55)' }, // Jolly Pine
  { bg: '#D98E04', text: '#FFFFFF', ring: 'rgba(255, 224, 125, 0.6)' }, // Starlight Gold
  { bg: '#1D6FA5', text: '#FFFFFF', ring: 'rgba(255, 255, 255, 0.45)' }, // Frosty Winter Blue
  { bg: '#A62863', text: '#FFFFFF', ring: 'rgba(248, 197, 55, 0.5)' }, // Sugar Plum
  { bg: '#C65D21', text: '#FFFFFF', ring: 'rgba(255, 224, 125, 0.5)' }, // Gingerbread Spice
];

export function getRecipientSealColor(index: number) {
  return HERITAGE_SEAL_COLORS[Math.abs(index) % HERITAGE_SEAL_COLORS.length];
}
