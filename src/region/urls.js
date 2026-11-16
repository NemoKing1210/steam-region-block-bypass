import { ACCEPT_LANG_BY_STEAM } from '../core/constants.js';

export function buildTargetUrl(sourceUrl, { lang = '', cc = '' } = {}) {
  const url = new URL(sourceUrl);
  url.searchParams.delete('snr');
  if (lang) url.searchParams.set('l', lang);
  if (cc) url.searchParams.set('cc', String(cc).toLowerCase());
  return url.toString();
}

export function buildProxyBase(region = {}) {
  const host = String(region.proxyHost || '')
    .trim()
    .replace(/\/+$/, '');
  const port = String(region.proxyPort || '').trim();
  if (/^https?:\/\//i.test(host)) {
    if (port && !/:\d+$/.test(host.replace(/^https?:\/\//i, '').split('/')[0])) {
      return `${host}:${port}`;
    }
    return host;
  }
  return port ? `http://${host}:${port}` : `http://${host}`;
}

export function buildRequestUrl(targetUrl, region = {}) {
  if (!region.proxyEnabled || !String(region.proxyHost || '').trim()) {
    return targetUrl;
  }
  const base = buildProxyBase(region);
  const mode = region.proxyMode || 'gateway';
  if (mode === 'path') {
    return `${base}/${targetUrl.replace(/^https?:\/\//, '')}`;
  }
  if (mode === 'query') {
    return `${base}/?url=${encodeURIComponent(targetUrl)}`;
  }
  return `${base}/${targetUrl}`;
}

export function buildRequestHeaders({
  lang = 'english',
  cc = '',
  browserLang = '',
} = {}) {
  const cookies = [
    'birthtime=-3338496000',
    'mature_content=1',
    'wants_mature_content=1',
    'lastagecheckage=1-0-1980',
    `Steam_Language=${lang}`,
  ];
  if (cc) cookies.push(`steamCountry=${encodeURIComponent(`${cc}|0`)}`);
  return {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language':
      ACCEPT_LANG_BY_STEAM[lang] || browserLang || 'en-US,en;q=0.9',
    Cookie: cookies.join('; '),
  };
}
