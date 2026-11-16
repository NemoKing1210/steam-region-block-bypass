import { buildSuggestBlockedBadgeHtml } from '../../core/blocked-apps.js';
import { t } from '../../i18n/index.js';
import { escapeAttr, escapeHtml } from '../../utils/html.js';
import { getSuggestTypeLabel } from './parse.js';
import { buildAppHref, buildBlockedAppCapsule } from './urls.js';

export function buildSuggestPriceHtml(item) {
  if (!item.priceLabel && !item.isFree) return '';
  const parts = [];
  if (item.discountPct > 0) {
    parts.push(`<span class="srbb-suggest__discount">-${item.discountPct}%</span>`);
  }
  if (item.priceOriginal) {
    parts.push(`<span class="srbb-suggest__price-old">${escapeHtml(item.priceOriginal)}</span>`);
  }
  if (item.priceLabel) {
    parts.push(
      `<span class="srbb-suggest__price${item.isFree ? ' srbb-suggest__price--free' : ''}">${escapeHtml(item.priceLabel)}</span>`,
    );
  }
  return `<div class="srbb-suggest__prices">${parts.join('')}</div>`;
}

export function buildSuggestPlatformsHtml(item) {
  if (!item.platforms) return '';
  const chips = [];
  if (item.platforms.windows) {
    chips.push('<span class="srbb-suggest__plat" title="Windows">Win</span>');
  }
  if (item.platforms.mac) {
    chips.push('<span class="srbb-suggest__plat" title="macOS">Mac</span>');
  }
  if (item.platforms.linux) {
    chips.push('<span class="srbb-suggest__plat" title="Linux">Linux</span>');
  }
  if (!chips.length) return '';
  return `<div class="srbb-suggest__platforms">${chips.join('')}</div>`;
}

export function buildSuggestFactsHtml(item) {
  const parts = [];
  if (item.reviewSummary) {
    const toneClass = item.reviewTone ? ` srbb-suggest__review--${item.reviewTone}` : '';
    const label = item.reviewPercent
      ? t('suggestReviews', {
          summary: item.reviewSummary,
          percent: item.reviewPercent,
        })
      : item.reviewSummary;
    const title = item.reviewDetail || item.reviewSummary;
    parts.push(
      `<span class="srbb-suggest__review${toneClass}" title="${escapeAttr(title)}">${escapeHtml(label)}</span>`,
    );
  }
  if (!parts.length) return '';
  return `<div class="srbb-suggest__facts">${parts.join('')}</div>`;
}

export function buildSuggestDetailsHtml(item) {
  return `
    <div class="srbb-suggest__details">
      ${buildSuggestPriceHtml(item)}
      ${
        item.releaseDate
          ? `<span class="srbb-suggest__release">${escapeHtml(item.releaseDate)}</span>`
          : ''
      }
      ${buildSuggestPlatformsHtml(item)}
    </div>
  `;
}

export function buildSuggestExtrasHtml(item) {
  const chips = [];
  const typeLabel = getSuggestTypeLabel(item.type);
  if (typeLabel) {
    chips.push(`<span class="srbb-suggest__chip">${escapeHtml(typeLabel)}</span>`);
  }
  if (item.metascore) {
    chips.push(
      `<span class="srbb-suggest__chip srbb-suggest__chip--score">${escapeHtml(t('suggestMetascore', { score: item.metascore }))}</span>`,
    );
  }
  if (item.controllerSupport === 'full') {
    chips.push(
      `<span class="srbb-suggest__chip">${escapeHtml(t('suggestControllerFull'))}</span>`,
    );
  } else if (item.controllerSupport === 'partial') {
    chips.push(
      `<span class="srbb-suggest__chip">${escapeHtml(t('suggestControllerPartial'))}</span>`,
    );
  }
  if (!chips.length) return '';
  return `<div class="srbb-suggest__chips">${chips.join('')}</div>`;
}

export function renderSuggestItemHtml(item, index) {
  const href = buildAppHref(item.id, item.name);
  const img = item.img || '';
  const blockedClass = item.regionBlocked ? ' srbb-suggest__item--blocked' : '';
  return `
    <a class="srbb-suggest__item${blockedClass}" role="option" data-srbb-suggest-index="${index}" data-srbb-app-id="${escapeAttr(String(item.id))}" href="${escapeAttr(href)}">
      ${img ? `<img class="srbb-suggest__img" alt="" src="${escapeAttr(img)}" loading="lazy" />` : ''}
      <div class="srbb-suggest__meta">
        <div class="srbb-suggest__title-row">
          <div class="srbb-suggest__name">${escapeHtml(item.name)}</div>
          <span class="srbb-suggest__probe-spin" hidden aria-hidden="true"></span>
          ${buildSuggestBlockedBadgeHtml(item)}
        </div>
        ${buildSuggestDetailsHtml(item)}
        ${buildSuggestFactsHtml(item)}
        <div class="srbb-suggest__footer">
          ${buildSuggestExtrasHtml(item)}
          <span class="srbb-suggest__id">${escapeHtml(t('suggestAppId', { id: item.id }))}</span>
        </div>
      </div>
    </a>
  `;
}

export function buildSuggestSkeletonHtml(count = 5) {
  return Array.from(
    { length: count },
    () => `
    <div class="srbb-suggest__skel" aria-hidden="true">
      <div class="srbb-skel srbb-suggest__skel-img"></div>
      <div class="srbb-suggest__skel-meta">
        <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--title"></div>
        <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--sub"></div>
        <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--facts"></div>
        <div class="srbb-suggest__skel-chips">
          <div class="srbb-skel srbb-suggest__skel-chip"></div>
          <div class="srbb-skel srbb-suggest__skel-chip"></div>
          <div class="srbb-skel srbb-suggest__skel-chip srbb-suggest__skel-chip--short"></div>
        </div>
      </div>
    </div>`,
  ).join('');
}

export function buildSuggestMessageHtml(message) {
  return `<div class="srbb-suggest__message">${escapeHtml(message)}</div>`;
}

export function buildInjectedSearchRowHtml(item) {
  const href = buildAppHref(item.id, item.name);
  const img = item.img || buildBlockedAppCapsule(item.id);
  const release = item.releaseDate
    ? `<div class="search_released responsive_secondrow">${escapeHtml(item.releaseDate)}</div>`
    : '<div class="search_released responsive_secondrow"></div>';
  const price = item.priceLabel
    ? `<div class="search_price_discount_combined responsive_secondrow"><div class="discount_block search_discount_block"><div class="discount_prices"><div class="discount_final_price">${escapeHtml(item.priceLabel)}</div></div></div></div>`
    : '<div class="search_price_discount_combined responsive_secondrow"></div>';
  return `
    <a href="${escapeAttr(href)}" data-ds-appid="${escapeAttr(String(item.id))}" data-ds-itemkey="App_${escapeAttr(String(item.id))}" class="search_result_row ds_collapse_flag srbb-search-row--injected">
      <div class="search_capsule"><img src="${escapeAttr(img)}" alt=""></div>
      <div class="responsive_search_name_combined">
        <div class="search_name ellipsis"><span class="title">${escapeHtml(item.name)}</span></div>
        ${release}
        ${price}
      </div>
    </a>
  `;
}

export function buildSearchPageSkeletonHtml(count = 8) {
  const rows = Array.from({ length: count }, (_, i) => {
    const wTitle = 42 + ((i * 17) % 38);
    const wMeta = 28 + ((i * 11) % 30);
    return `
      <div class="srbb-search-skel__row" aria-hidden="true">
        <div class="srbb-skel srbb-search-skel__cap"></div>
        <div class="srbb-search-skel__body">
          <div class="srbb-skel srbb-search-skel__title" style="width:${wTitle}%"></div>
          <div class="srbb-skel srbb-search-skel__meta" style="width:${wMeta}%"></div>
        </div>
        <div class="srbb-skel srbb-search-skel__price"></div>
      </div>
    `;
  }).join('');
  return `
    <div class="srbb-search-skel" aria-busy="true" aria-label="${escapeAttr(t('searchPageLoading'))}">
      ${rows}
    </div>
  `;
}
