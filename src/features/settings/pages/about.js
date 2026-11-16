import {
  AUTHOR_URL,
  ISSUES_URL,
  REPO_URL,
  SCRIPT_AUTHOR,
  SCRIPT_LICENSE,
  SCRIPT_NAME,
} from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import { getScriptVersion } from '../panel.js';

function link(className, href, text) {
  const node = document.createElement('a');
  node.className = className;
  node.href = href;
  node.target = '_blank';
  node.rel = 'noopener noreferrer';
  node.textContent = text;
  return node;
}

export const aboutPage = {
  id: 'about',
  titleKey: 'tabAbout',
  icon: 'info',
  descKey: 'navAboutDesc',
  renderInto(pane) {
    const about = el('div', 'srbb-about');
    const hero = el('div', 'srbb-about__hero');
    hero.appendChild(el('div', 'srbb-about__name', SCRIPT_NAME));
    hero.appendChild(el('span', 'srbb-panel__version', `v${getScriptVersion()}`));
    about.appendChild(hero);
    about.appendChild(el('p', 'srbb-about__blurb', t('aboutBlurb')));

    const meta = el('dl', 'srbb-about__meta');
    const authorRow = el('div', 'srbb-about__row');
    authorRow.appendChild(el('dt', '', t('aboutAuthor')));
    const authorValue = el('dd');
    authorValue.appendChild(link('srbb-about__link', AUTHOR_URL, SCRIPT_AUTHOR));
    authorRow.appendChild(authorValue);
    meta.appendChild(authorRow);

    const licenseRow = el('div', 'srbb-about__row');
    licenseRow.appendChild(el('dt', '', t('aboutLicense')));
    const licenseValue = el('dd');
    licenseValue.appendChild(link('srbb-about__link', REPO_URL, SCRIPT_LICENSE));
    licenseRow.appendChild(licenseValue);
    meta.appendChild(licenseRow);
    about.appendChild(meta);

    about.appendChild(el('p', 'srbb-about__disclaimer', t('aboutDisclaimer')));
    const actions = el('div', 'srbb-about__actions');
    actions.appendChild(link('srbb-btn srbb-btn--ghost', REPO_URL, t('aboutSource')));
    actions.appendChild(link('srbb-btn srbb-btn--ghost', ISSUES_URL, t('aboutIssues')));
    about.appendChild(actions);
    pane.appendChild(about);
  },
};
