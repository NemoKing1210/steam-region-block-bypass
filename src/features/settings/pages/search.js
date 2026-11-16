import { t } from '../../../i18n/index.js';
import { isHostLoggedIn } from '../../../region/detect.js';
import {
  createField,
  createHint,
  createNumberInput,
  createSection,
  createSelect,
  createSwitchRow,
} from '../controls.js';

export const searchPage = {
  id: 'search',
  titleKey: 'tabSearch',
  icon: 'search',
  descKey: 'navSearchDesc',
  renderInto(pane, draft) {
    const search = draft.search;

    const guestSection = createSection({ icon: 'search', title: t('searchUnblocked') });
    guestSection.appendChild(
      createSwitchRow({
        checked: search.suggestEnabled !== false,
        label: t('searchUnblocked'),
        onChange: (checked) => {
          search.suggestEnabled = checked;
        },
      }),
    );
    guestSection.appendChild(createHint(t('searchUnblockedHint')));
    guestSection.appendChild(
      createSwitchRow({
        checked: search.pageEnabled === true,
        label: t('searchPageUnblocked'),
        onChange: (checked) => {
          search.pageEnabled = checked;
        },
      }),
    );
    guestSection.appendChild(createHint(t('searchPageUnblockedHint')));
    pane.appendChild(guestSection);

    const blockedSection = createSection({ icon: 'database', title: t('rememberBlockedApps') });
    blockedSection.appendChild(
      createSwitchRow({
        checked: search.rememberBlocked !== false,
        label: t('rememberBlockedApps'),
        onChange: (checked) => {
          search.rememberBlocked = checked;
        },
      }),
    );
    blockedSection.appendChild(createHint(t('rememberBlockedAppsHint')));
    blockedSection.appendChild(
      createSwitchRow({
        checked: search.markBlocked !== false,
        label: t('markBlockedInSearch'),
        onChange: (checked) => {
          search.markBlocked = checked;
        },
      }),
    );
    blockedSection.appendChild(createHint(t('markBlockedInSearchHint')));
    pane.appendChild(blockedSection);

    const probeSection = createSection({ icon: 'search', title: t('probeBlockedInSearch') });
    probeSection.appendChild(
      createSwitchRow({
        checked: search.probeEnabled !== false,
        label: t('probeBlockedInSearch'),
        onChange: (checked) => {
          search.probeEnabled = checked;
        },
      }),
    );
    probeSection.appendChild(createHint(t('probeBlockedInSearchHint')));
    probeSection.appendChild(
      createField({
        label: t('probeBlockedScope'),
        control: createSelect(
          [
            { value: 'both', label: t('probeBlockedScopeBoth') },
            { value: 'suggest', label: t('probeBlockedScopeSuggest') },
            { value: 'search', label: t('probeBlockedScopeSearch') },
          ],
          search.probeScope,
          (value) => {
            search.probeScope = value;
          },
        ),
      }),
    );
    probeSection.appendChild(
      createField({
        label: t('probeBlockedConcurrency'),
        hint: t('probeBlockedConcurrencyHint'),
        control: createNumberInput({
          value: search.probeConcurrency,
          min: 1,
          max: 5,
          onChange: (value) => {
            search.probeConcurrency = value;
          },
        }),
      }),
    );
    if (!isHostLoggedIn()) probeSection.appendChild(createHint(t('probeNeedLogin')));
    if (!search.rememberBlocked) {
      probeSection.appendChild(createHint(t('probeNeedRemember')));
    }
    pane.appendChild(probeSection);
  },
};
