export interface Recipient {
  id: string;
  name: string;
  budget: number;
  note?: string;
  createdAt: number;
}

export interface GiftEntry {
  id: string;
  recipientId: string;
  description: string;
  estimatedCost: number;
  purchased: boolean;
  createdAt: number;
  updatedAt: number;
}

export type RecipientSortMode = 'alpha-asc' | 'alpha-desc' | 'custom' | 'spend-desc';

export interface ChristmasLedgerData {
  recipients: Recipient[];
  gifts: GiftEntry[];
  recipientSort?: RecipientSortMode;
}

export type AppView = 'gifts' | 'summary' | 'recipients';

export type SortMode = 'recent' | 'cost-desc' | 'cost-asc' | 'unbought';
