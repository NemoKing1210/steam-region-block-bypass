export function isSearchPage(url = location.href) {
  try {
    const path = new URL(url, location.origin).pathname.replace(/\/+$/, '') || '/';
    return path === '/search';
  } catch {
    return false;
  }
}

export function getSearchPageSize(sourceUrl = location.href) {
  try {
    const count = parseInt(
      new URL(sourceUrl, location.origin).searchParams.get('count') || '',
      10,
    );
    if (Number.isFinite(count) && count > 0 && count <= 100) return count;
  } catch {
    /* ignore */
  }
  return 25;
}

export function getActiveSearchPageFromDom() {
  const pag = document.querySelector('.search_pagination_right');
  if (!pag) return null;
  for (const node of pag.children) {
    if (node.tagName !== 'SPAN') continue;
    const n = parseInt(String(node.textContent || '').trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function getSearchStartOffset(sourceUrl = location.href) {
  try {
    const url = new URL(sourceUrl, location.origin);
    const start = parseInt(url.searchParams.get('start') || '', 10);
    if (Number.isFinite(start) && start >= 0) return start;
    const page = parseInt(url.searchParams.get('page') || '', 10);
    if (Number.isFinite(page) && page >= 1) {
      return (page - 1) * getSearchPageSize(sourceUrl);
    }
  } catch {
    /* ignore */
  }
  const domPage = getActiveSearchPageFromDom();
  if (domPage && domPage >= 1) {
    return (domPage - 1) * getSearchPageSize(sourceUrl);
  }
  return 0;
}

export function extractSearchResultsRoot(doc) {
  const rows = doc.querySelector('#search_resultsRows');
  if (rows) {
    return (
      rows.closest('#search_results') ||
      rows.closest('#search_result_container') ||
      rows.parentElement
    );
  }
  return (
    doc.querySelector('#search_results') ||
    doc.querySelector('#search_result_container') ||
    doc.querySelector('#search_results_ctn') ||
    doc.querySelector('.search_results') ||
    null
  );
}

export function findLiveSearchResultsRoot() {
  const rows = document.querySelector('#search_resultsRows');
  if (rows) {
    return (
      rows.closest('#search_results') ||
      rows.closest('#search_result_container') ||
      rows.parentElement
    );
  }
  return (
    document.querySelector('#search_results') ||
    document.querySelector('#search_result_container') ||
    document.querySelector('#search_results_ctn') ||
    document.querySelector('.search_results') ||
    null
  );
}

export function getSearchTermFromLocation() {
  try {
    return new URL(location.href).searchParams.get('term') || '';
  } catch {
    return '';
  }
}
