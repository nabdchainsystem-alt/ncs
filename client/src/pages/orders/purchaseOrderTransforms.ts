export type RequestItemLike = {
  code?: string | null;
  description?: string | null;
  name?: string | null;
  qty?: number | string | null;
  unit?: string | null;
};

export type QuotationItemLike = {
  code?: string | null;
  name?: string | null;
  qty?: number | string | null;
  unit?: string | null;
  unitPrice?: number | string | null;
};

export type PurchaseOrderItemSeed = {
  materialCode?: string | null;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
};

function toKey(value: string | null | undefined): string {
  return (value ?? '').toString().trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickDescription(request?: RequestItemLike, quote?: QuotationItemLike): string {
  const requestDesc = request?.description ?? request?.name;
  if (requestDesc && requestDesc.trim().length) return requestDesc.trim();
  const quoteName = quote?.name;
  if (quoteName && quoteName.trim().length) return quoteName.trim();
  return '';
}

function pickUnit(request?: RequestItemLike, quote?: QuotationItemLike): string | null {
  const requestUnit = request?.unit;
  if (requestUnit && requestUnit.trim().length) return requestUnit.trim();
  const quoteUnit = quote?.unit;
  if (quoteUnit && quoteUnit.trim().length) return quoteUnit.trim();
  return null;
}

export function buildPurchaseOrderItemsFromSources(
  requestItems: RequestItemLike[] = [],
  quotationItems: QuotationItemLike[] = [],
): PurchaseOrderItemSeed[] {
  const result: PurchaseOrderItemSeed[] = [];
  const usedQuotation = new Set<number>();

  const normalizedQuotation = quotationItems.map((item, index) => ({
    index,
    item,
    codeKey: toKey(item.code ?? null),
    nameKey: toKey(item.name ?? null),
  }));

  requestItems.forEach((requestItem, requestIndex) => {
    const requestCodeKey = toKey(requestItem.code ?? null);
    const requestNameKey = toKey((requestItem.description ?? requestItem.name) ?? null);

    let match = normalizedQuotation.find((entry) => {
      if (usedQuotation.has(entry.index)) return false;
      if (requestCodeKey && entry.codeKey && requestCodeKey === entry.codeKey) return true;
      if (!requestCodeKey && requestNameKey && entry.nameKey && requestNameKey === entry.nameKey) return true;
      return false;
    });

    if (!match && !usedQuotation.has(requestIndex) && normalizedQuotation[requestIndex]) {
      match = normalizedQuotation[requestIndex];
    }

    const quoteItem = match ? match.item : undefined;
    if (match) usedQuotation.add(match.index);

    result.push({
      materialCode: requestItem.code ?? quoteItem?.code ?? null,
      description: pickDescription(requestItem, quoteItem),
      quantity: toNumber(requestItem.qty ?? quoteItem?.qty),
      unit: pickUnit(requestItem, quoteItem),
      unitPrice: toNumber(quoteItem?.unitPrice),
    });
  });

  normalizedQuotation.forEach((entry) => {
    if (usedQuotation.has(entry.index)) return;
    const quoteItem = entry.item;
    result.push({
      materialCode: quoteItem.code ?? null,
      description: pickDescription(undefined, quoteItem),
      quantity: toNumber(quoteItem.qty),
      unit: pickUnit(undefined, quoteItem),
      unitPrice: toNumber(quoteItem.unitPrice),
    });
  });

  return result.map((item) => ({
    materialCode: item.materialCode,
    description: item.description,
    quantity: Number.isFinite(item.quantity) ? item.quantity : 0,
    unit: item.unit ?? null,
    unitPrice: Number.isFinite(item.unitPrice) ? item.unitPrice : 0,
  }));
}
