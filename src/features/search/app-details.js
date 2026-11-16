import { t } from '../../i18n/index.js';
import { buildBlockedAppCapsule } from './urls.js';

export function formatReleaseDateFromAppDetails(release) {
  if (!release || typeof release !== 'object') return '';
  const date = String(release.date || '').trim();
  if (date) return date;
  if (release.coming_soon) return t('suggestComingSoon');
  return '';
}

export function formatMoneyAmount(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  const value = amount / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency || ''}`.trim();
  }
}

export function mapAppDetailsToSuggestFields(appId, data) {
  if (!data || typeof data !== 'object') return null;

  const platforms =
    data.platforms && typeof data.platforms === 'object'
      ? {
          windows: !!data.platforms.windows,
          mac: !!data.platforms.mac,
          linux: !!data.platforms.linux,
        }
      : null;

  let priceLabel = '';
  let priceOriginal = '';
  let discountPct = 0;
  let isFree = !!data.is_free;
  const price = data.price_overview;
  if (price && typeof price === 'object') {
    if (typeof price.final_formatted === 'string' && price.final_formatted.trim()) {
      priceLabel = price.final_formatted.trim();
    } else if (typeof price.final === 'number') {
      priceLabel = formatMoneyAmount(price.final, price.currency || '');
    }
    if (typeof price.initial_formatted === 'string' && price.initial_formatted.trim()) {
      priceOriginal = price.initial_formatted.trim();
    } else if (typeof price.initial === 'number' && price.initial > (price.final || 0)) {
      priceOriginal = formatMoneyAmount(price.initial, price.currency || '');
    }
    if (typeof price.discount_percent === 'number' && price.discount_percent > 0) {
      discountPct = price.discount_percent;
    }
    if (typeof price.final === 'number' && price.final === 0) {
      isFree = true;
      priceLabel = priceLabel || t('suggestFree');
    }
  } else if (isFree) {
    priceLabel = t('suggestFree');
  }

  const img =
    data.capsule_image ||
    data.capsule_imagev5 ||
    data.header_image ||
    buildBlockedAppCapsule(appId);
  const metascore =
    data.metacritic && data.metacritic.score != null ? String(data.metacritic.score) : '';

  return {
    id: String(appId),
    name: String(data.name || '').trim(),
    type: String(data.type || 'game').toLowerCase(),
    img,
    priceLabel,
    priceOriginal,
    discountPct,
    isFree,
    platforms,
    metascore,
    controllerSupport: String(data.controller_support || '').toLowerCase(),
    releaseDate: formatReleaseDateFromAppDetails(data.release_date),
    reviewSummary: '',
    reviewPercent: '',
    reviewTone: '',
    reviewDetail: '',
  };
}

export function mapAppReviewsToSuggestFields(parsed) {
  const summary = parsed && parsed.query_summary;
  if (!summary || !summary.total_reviews) {
    return {
      reviewSummary: '',
      reviewPercent: '',
      reviewTone: '',
      reviewDetail: '',
    };
  }

  const total = Number(summary.total_reviews) || 0;
  const positive = Number(summary.total_positive) || 0;
  const percent = total > 0 ? String(Math.round((positive / total) * 100)) : '';
  const reviewSummary = String(summary.review_score_desc || '').trim();
  const score = Number(summary.review_score);
  let reviewTone = '';
  if (Number.isFinite(score) && score > 0) {
    if (score >= 6) reviewTone = 'positive';
    else if (score === 5) reviewTone = 'mixed';
    else reviewTone = 'negative';
  }

  const reviewDetail = percent
    ? `${percent}% of the ${total.toLocaleString()} user reviews for this game are positive.`
    : reviewSummary;

  return {
    reviewSummary,
    reviewPercent: percent,
    reviewTone,
    reviewDetail,
  };
}
