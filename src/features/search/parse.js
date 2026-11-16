import { SUGGEST_RESULT_COUNT } from '../../core/constants.js';
import { t } from '../../i18n/index.js';
import { formatMoneyAmount } from './app-details.js';

export {
  formatReleaseDateFromAppDetails,
  formatMoneyAmount,
  mapAppDetailsToSuggestFields,
  mapAppReviewsToSuggestFields,
} from './app-details.js';

export function parseJsonResponse(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  const jsonStart = trimmed.search(/[\[{]/);
  if (jsonStart < 0) return null;
  try {
    return JSON.parse(trimmed.slice(jsonStart));
  } catch {
    return null;
  }
}

export function parseReviewTooltip(tooltipHtml) {
  const text = String(tooltipHtml || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"');
  const parts = text
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  const summary = parts[0] || '';
  const detail = parts[1] || '';
  const percentMatch = detail.match(/(\d+)\s*%/);
  return {
    summary,
    percent: percentMatch ? percentMatch[1] : '',
    detail: detail || summary,
  };
}

export function emptySuggestItemFields() {
  return {
    priceLabel: '',
    priceOriginal: '',
    discountPct: 0,
    isFree: false,
    platforms: null,
    metascore: '',
    controllerSupport: '',
    releaseDate: '',
    reviewSummary: '',
    reviewPercent: '',
    reviewTone: '',
    reviewDetail: '',
  };
}

export function parseSearchResultRowType(row) {
  const href = String(row.getAttribute('href') || '');
  if (/\/bundle\//i.test(href) || row.hasAttribute('data-ds-bundleid')) return 'bundle';
  if (/\/sub\//i.test(href) || row.hasAttribute('data-ds-packageid')) return 'bundle';
  if (row.hasAttribute('data-ds-appid')) return 'game';
  return 'app';
}

export function parseSearchResultRowPrice(row) {
  let priceLabel = '';
  let priceOriginal = '';
  let discountPct = 0;
  let isFree = false;

  const discountBlock = row.querySelector('.discount_block, .search_discount_block');
  const finalEl = row.querySelector('.discount_final_price, .search_price');
  const originalEl = row.querySelector('.discount_original_price');
  priceLabel = (finalEl?.textContent || '').replace(/\s+/g, ' ').trim();
  priceOriginal = (originalEl?.textContent || '').replace(/\s+/g, ' ').trim();

  if (discountBlock) {
    const parsedDiscount = Number(discountBlock.getAttribute('data-discount'));
    if (Number.isFinite(parsedDiscount) && parsedDiscount > 0) {
      discountPct = parsedDiscount;
    }
    const priceFinal = Number(discountBlock.getAttribute('data-price-final'));
    if (Number.isFinite(priceFinal) && priceFinal === 0) isFree = true;
  }

  if (!priceLabel) {
    const freeEl = row.querySelector('.search_price.free, .discount_final_price.free');
    if (freeEl) {
      priceLabel = (freeEl.textContent || '').replace(/\s+/g, ' ').trim() || t('suggestFree');
      isFree = true;
    }
  }

  if (priceLabel && /free/i.test(priceLabel)) {
    isFree = true;
    priceLabel = t('suggestFree');
  }

  return { priceLabel, priceOriginal, discountPct, isFree };
}

export function parseSearchResultRowPlatforms(row) {
  const platRoot = row.querySelector('.search_platforms');
  if (!platRoot) return null;
  const platforms = {
    windows: !!platRoot.querySelector('.platform_img.win, .win'),
    mac: !!platRoot.querySelector('.platform_img.mac, .mac'),
    linux: !!platRoot.querySelector('.platform_img.linux, .linux'),
  };
  if (!platforms.windows && !platforms.mac && !platforms.linux) return null;
  return platforms;
}

export function parseSearchResultRowReviews(row) {
  const reviewEl = row.querySelector('.search_review_summary');
  if (!reviewEl) {
    return {
      reviewSummary: '',
      reviewPercent: '',
      reviewTone: '',
      reviewDetail: '',
    };
  }

  let reviewTone = '';
  if (reviewEl.classList.contains('positive')) reviewTone = 'positive';
  else if (reviewEl.classList.contains('mixed')) reviewTone = 'mixed';
  else if (reviewEl.classList.contains('negative')) reviewTone = 'negative';

  const parsed = parseReviewTooltip(reviewEl.getAttribute('data-tooltip-html') || '');
  return {
    reviewSummary: parsed.summary,
    reviewPercent: parsed.percent,
    reviewTone,
    reviewDetail: parsed.detail,
  };
}

export function parseSearchResultItems(html) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const items = [];
  const seen = Object.create(null);

  doc.querySelectorAll('a.search_result_row[data-ds-appid]').forEach((row) => {
    const rawId = String(row.getAttribute('data-ds-appid') || '')
      .split(',')[0]
      .trim();
    if (!rawId || seen[rawId]) return;
    seen[rawId] = true;

    const name = (row.querySelector('.title')?.textContent || '').trim();
    if (!name) return;

    const img = row.querySelector('.search_capsule img, img')?.getAttribute('src') || '';
    const price = parseSearchResultRowPrice(row);
    const reviews = parseSearchResultRowReviews(row);

    items.push({
      id: rawId,
      name,
      type: parseSearchResultRowType(row),
      img,
      ...emptySuggestItemFields(),
      ...price,
      platforms: parseSearchResultRowPlatforms(row),
      releaseDate: (row.querySelector('.search_released')?.textContent || '').trim(),
      ...reviews,
    });
  });

  return items;
}

export function mergeSuggestStoreExtras(items, storeItems) {
  if (!storeItems?.length || !items.length) return items;
  const byId = Object.create(null);
  storeItems.forEach((item) => {
    byId[item.id] = item;
  });
  return items.map((item) => {
    const extra = byId[item.id];
    if (!extra) return item;
    return {
      ...item,
      type: item.type || extra.type,
      img: item.img || extra.img,
      priceLabel: extra.priceLabel || item.priceLabel,
      priceOriginal: extra.priceOriginal || item.priceOriginal,
      discountPct: extra.discountPct || item.discountPct,
      isFree: extra.isFree || item.isFree,
      platforms: extra.platforms || item.platforms,
      metascore: extra.metascore || item.metascore,
      controllerSupport: extra.controllerSupport || item.controllerSupport,
    };
  });
}

export function mergeSuggestSearchFields(items, searchItems) {
  if (!searchItems?.length || !items.length) return items;
  const byId = Object.create(null);
  searchItems.forEach((item) => {
    byId[item.id] = item;
  });
  return items.map((item) => {
    const extra = byId[item.id];
    if (!extra) return item;
    return {
      ...item,
      type: extra.type || item.type,
      img: item.img || extra.img,
      priceLabel: item.priceLabel || extra.priceLabel,
      priceOriginal: item.priceOriginal || extra.priceOriginal,
      discountPct: item.discountPct || extra.discountPct,
      isFree: item.isFree || extra.isFree,
      platforms: item.platforms || extra.platforms,
      releaseDate: extra.releaseDate || item.releaseDate || '',
      reviewSummary: extra.reviewSummary || item.reviewSummary || '',
      reviewPercent: extra.reviewPercent || item.reviewPercent || '',
      reviewTone: extra.reviewTone || item.reviewTone || '',
      reviewDetail: extra.reviewDetail || item.reviewDetail || '',
    };
  });
}

export function mergeSuggestItemMeta(item, extra) {
  if (!extra) return item;
  return {
    ...item,
    name: item.name || extra.name || item.name,
    type: item.type || extra.type,
    img: item.img || extra.img,
    priceLabel: item.priceLabel || extra.priceLabel,
    priceOriginal: item.priceOriginal || extra.priceOriginal,
    discountPct: item.discountPct || extra.discountPct,
    isFree: item.isFree || extra.isFree,
    platforms: item.platforms || extra.platforms,
    metascore: item.metascore || extra.metascore,
    controllerSupport: item.controllerSupport || extra.controllerSupport,
    releaseDate: item.releaseDate || extra.releaseDate || '',
    reviewSummary: item.reviewSummary || extra.reviewSummary || '',
    reviewPercent: item.reviewPercent || extra.reviewPercent || '',
    reviewTone: item.reviewTone || extra.reviewTone || '',
    reviewDetail: item.reviewDetail || extra.reviewDetail || '',
  };
}

export function isSuggestItemSparse(item) {
  if (!item?.id) return false;
  if (String(item.type || '').toLowerCase() === 'bundle') return false;
  return (
    (!item.priceLabel && !item.isFree) ||
    !item.releaseDate ||
    !item.reviewSummary ||
    !item.platforms
  );
}

export function normalizeSuggestItem(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.appid;
  const name = item.name || '';
  if (!id || !name) return null;

  const type = String(item.type || 'game').toLowerCase();
  const img = item.small_cap || item.img || item.tiny_image || '';
  const platforms =
    item.platforms && typeof item.platforms === 'object'
      ? {
          windows: !!item.platforms.windows,
          mac: !!item.platforms.mac,
          linux: !!item.platforms.linux,
        }
      : null;

  let priceLabel = '';
  let priceOriginal = '';
  let discountPct = 0;
  let isFree = false;
  const price = item.price;
  if (price && typeof price === 'object') {
    const currency = price.currency || '';
    const final = price.final;
    const initial = price.initial;
    if (typeof final === 'number') {
      if (final === 0 && (!initial || initial === 0)) {
        isFree = true;
        priceLabel = t('suggestFree');
      } else {
        priceLabel = formatMoneyAmount(final, currency);
        if (typeof initial === 'number' && initial > final && initial > 0) {
          priceOriginal = formatMoneyAmount(initial, currency);
          discountPct = Math.round((1 - final / initial) * 100);
        }
      }
    }
  } else if (typeof price === 'string' && price.trim()) {
    priceLabel = price.trim();
    if (/free/i.test(priceLabel)) isFree = true;
  }

  return {
    id: String(id),
    name,
    type,
    img,
    priceLabel,
    priceOriginal,
    discountPct,
    isFree,
    platforms,
    metascore: String(item.metascore || '').trim(),
    controllerSupport: String(item.controller_support || '').toLowerCase(),
    releaseDate: '',
    reviewSummary: '',
    reviewPercent: '',
    reviewTone: '',
    reviewDetail: '',
  };
}

export function normalizeSuggestItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSuggestItem).filter(Boolean);
}

export function unionSuggestItems(...lists) {
  const seen = Object.create(null);
  const out = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item?.id || seen[item.id]) continue;
      seen[item.id] = true;
      out.push(item);
    }
  }
  return out;
}

export function trimSuggestItems(items, mustKeepIds) {
  if (items.length <= SUGGEST_RESULT_COUNT) return items;
  const mustKeep = mustKeepIds instanceof Set ? mustKeepIds : new Set(mustKeepIds || []);
  const kept = items.slice(0, SUGGEST_RESULT_COUNT);
  const keptIds = new Set(kept.map((item) => item.id));
  for (const item of items.slice(SUGGEST_RESULT_COUNT)) {
    if (!mustKeep.has(item.id) || keptIds.has(item.id)) continue;
    kept.push(item);
    keptIds.add(item.id);
  }
  return kept;
}

export function getSuggestTypeLabel(type) {
  const key = {
    game: 'suggestTypeGame',
    app: 'suggestTypeApp',
    software: 'suggestTypeSoftware',
    dlc: 'suggestTypeDlc',
    bundle: 'suggestTypeBundle',
  }[String(type || '').toLowerCase()];
  return key ? t(key) : String(type || '');
}
