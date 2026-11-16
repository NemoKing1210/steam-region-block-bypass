import { t } from '../../../i18n/index.js';
import { escapeAttr, escapeHtml } from '../../../utils/html.js';
import {
  buildCacheListHtml,
  buildCacheMeterHtml,
  getCacheUsageStats,
  paintCacheMeter,
} from '../../../core/page-cache.js';
import {
  getBlockedAppsCount,
  listBlockedAppsEntries,
} from '../../../core/blocked-apps.js';
import {
  createButton,
  createField,
  createHint,
  createNumberInput,
  createSection,
  createSwitchRow,
} from '../controls.js';
import { el } from '../../../utils/dom.js';

function buildBlockedListHtml() {
  const entries = listBlockedAppsEntries();
  if (!entries.length) {
    return `<div class="srbb-blocked-list" data-srbb-blocked-list>
      <div class="srbb-blocked-list__empty">${escapeHtml(t('blockedAppsEmpty'))}</div>
    </div>`;
  }
  const rows = entries
    .map((entry) => {
      const name = entry.name || t('blockedAppUntitled', { id: entry.id });
      const href = `https://store.steampowered.com/app/${entry.id}/`;
      return `<a class="srbb-blocked-list__item" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">
        <span class="srbb-blocked-list__name">${escapeHtml(name)}</span>
        <span class="srbb-blocked-list__id">${escapeHtml(entry.id)}</span>
      </a>`;
    })
    .join('');
  return `<div class="srbb-blocked-list" data-srbb-blocked-list>
    <div class="srbb-blocked-list__count">${escapeHtml(
      t('blockedAppsCount', { count: entries.length }),
    )}</div>
    ${rows}
  </div>`;
}

export const cachePage = {
  id: 'cache',
  titleKey: 'tabCache',
  icon: 'database',
  descKey: 'navCacheDesc',
  renderInto(pane, draft) {
    const stats = getCacheUsageStats(draft);

    const usage = createSection({ icon: 'database', title: t('sectionCache') });
    usage.appendChild(createHint(t('sectionCacheHint')));
    const meter = el('div');
    meter.innerHTML = buildCacheMeterHtml(stats);
    usage.appendChild(meter.firstElementChild || meter);
    pane.appendChild(usage);

    const duration = createSection({ icon: 'database', title: t('sectionCacheDuration') });
    duration.appendChild(
      createField({
        label: t('cacheMinutes'),
        hint: t('cacheMinutesHint'),
        control: createNumberInput({
          value: draft.cache.minutes,
          min: 0,
          max: 10080,
          onChange: (value) => {
            draft.cache.minutes = value;
            paintCacheMeter(pane, getCacheUsageStats(draft));
          },
        }),
      }),
    );
    pane.appendChild(duration);

    const limit = createSection({ icon: 'database', title: t('sectionCacheLimit') });
    limit.appendChild(
      createField({
        label: t('cacheMaxEntries'),
        hint: t('cacheMaxEntriesHint'),
        control: createNumberInput({
          value: draft.cache.maxEntries,
          min: 1,
          max: 100,
          onChange: (value) => {
            draft.cache.maxEntries = value;
            paintCacheMeter(pane, getCacheUsageStats(draft));
          },
        }),
      }),
    );
    pane.appendChild(limit);

    const sources = createSection({ icon: 'database', title: t('sectionCacheSources') });
    sources.appendChild(createHint(t('sectionCacheSourcesHint')));
    const appRow = createSwitchRow({
      checked: draft.cache.appPages !== false,
      label: t('cacheAppPages'),
      onChange: (checked) => {
        draft.cache.appPages = checked;
        paintCacheMeter(pane, getCacheUsageStats(draft));
      },
    });
    sources.appendChild(appRow);
    sources.appendChild(createHint(t('cacheAppPagesHint')));
    const searchRow = createSwitchRow({
      checked: draft.cache.searchPages !== false,
      label: t('cacheSearchPages'),
      onChange: (checked) => {
        draft.cache.searchPages = checked;
        paintCacheMeter(pane, getCacheUsageStats(draft));
      },
    });
    sources.appendChild(searchRow);
    sources.appendChild(createHint(t('cacheSearchPagesHint')));
    pane.appendChild(sources);

    const contents = createSection({ icon: 'database', title: t('sectionCacheContents') });
    contents.appendChild(createHint(t('sectionCacheContentsHint')));
    const list = el('div');
    list.innerHTML = buildCacheListHtml();
    contents.appendChild(list.firstElementChild || list);
    pane.appendChild(contents);

    const blocked = createSection({ icon: 'database', title: t('sectionCacheBlocked') });
    blocked.appendChild(createHint(t('sectionCacheBlockedHint')));
    const blockedList = el('div');
    blockedList.innerHTML = buildBlockedListHtml();
    blocked.appendChild(blockedList.firstElementChild || blockedList);
    pane.appendChild(blocked);

    const clear = createSection({ icon: 'database', title: t('sectionCacheClear') });
    clear.appendChild(createHint(t('sectionCacheClearHint')));
    const actions = el('div', 'srbb-cache-actions');
    const clearPages = createButton(
      t('clearPageCache'),
      () => {},
      'srbb-btn--ghost',
    );
    clearPages.dataset.srbbAction = 'clear-page-cache';
    clearPages.disabled = stats.pageCount === 0;
    const clearBlocked = createButton(
      t('clearBlockedApps'),
      () => {},
      'srbb-btn--ghost',
    );
    clearBlocked.dataset.srbbAction = 'clear-blocked-apps';
    clearBlocked.disabled = getBlockedAppsCount() === 0;
    const clearAll = createButton(t('clearAllCache'), () => {}, 'srbb-btn--danger');
    clearAll.dataset.srbbAction = 'clear-all-cache';
    clearAll.disabled = stats.pageCount === 0 && getBlockedAppsCount() === 0;
    actions.append(clearPages, clearBlocked, clearAll);
    clear.appendChild(actions);
    pane.appendChild(clear);
  },
};
