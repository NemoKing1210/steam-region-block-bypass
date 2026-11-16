import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from '../../../i18n/index.js';
import { t } from '../../../i18n/index.js';
import { TOAST_POSITIONS } from '../../../core/constants.js';
import {
  createField,
  createHint,
  createSection,
  createSelect,
  createSwitchRow,
  createTextInput,
} from '../controls.js';

const TOAST_POSITION_KEYS = {
  'top-right': 'toastPositionTopRight',
  'top-left': 'toastPositionTopLeft',
  'bottom-right': 'toastPositionBottomRight',
  'bottom-left': 'toastPositionBottomLeft',
};

export const generalPage = {
  id: 'general',
  titleKey: 'tabGeneral',
  icon: 'sliders',
  descKey: 'navGeneralDesc',
  renderInto(pane, draft) {
    const languageSection = createSection({ icon: 'globe', title: t('language') });
    languageSection.appendChild(
      createField({
        hint: t('languageHint'),
        control: createSelect(
          [
            { value: 'auto', label: t('languageAuto') },
            ...SUPPORTED_LOCALES.map((locale) => ({
              value: locale,
              label: LOCALE_NATIVE_NAMES[locale],
            })),
          ],
          draft.language,
          (value) => {
            draft.language = value;
          },
        ),
      }),
    );
    pane.appendChild(languageSection);

    const regionSection = createSection({ icon: 'globe', title: t('regionEnabled') });
    regionSection.appendChild(
      createSwitchRow({
        checked: draft.region.enabled !== false,
        label: t('regionEnabled'),
        onChange: (checked) => {
          draft.region.enabled = checked;
        },
      }),
    );
    regionSection.appendChild(createHint(t('regionEnabledHint')));
    regionSection.appendChild(
      createField({
        label: t('bypassTrigger'),
        hint: t('bypassTriggerHint'),
        control: createSelect(
          [
            { value: 'auto', label: t('bypassTriggerAuto') },
            { value: 'manual', label: t('bypassTriggerButton') },
          ],
          draft.region.mode,
          (value) => {
            draft.region.mode = value;
          },
        ),
      }),
    );
    regionSection.appendChild(
      createSwitchRow({
        checked: draft.region.showBanner !== false,
        label: t('showBanner'),
        onChange: (checked) => {
          draft.region.showBanner = checked;
        },
      }),
    );
    regionSection.appendChild(createHint(t('showBannerHint')));
    const country = createTextInput({
      value: draft.region.countryCode || '',
      placeholder: 'US / DE / KZ…',
      maxLength: 2,
      onChange: (value) => {
        const cc = String(value || '').trim().toUpperCase();
        draft.region.countryCode = /^[A-Z]{2}$/.test(cc) ? cc : '';
        country.value = draft.region.countryCode;
      },
    });
    regionSection.appendChild(
      createField({
        label: t('storeCountry'),
        hint: t('storeCountryHint'),
        control: country,
      }),
    );
    pane.appendChild(regionSection);

    const toastSection = createSection({ icon: 'bell', title: t('toastsEnabled') });
    toastSection.appendChild(
      createSwitchRow({
        checked: draft.toasts.enabled !== false,
        label: t('toastsEnabled'),
        onChange: (checked) => {
          draft.toasts.enabled = checked;
        },
      }),
    );
    toastSection.appendChild(createHint(t('toastsEnabledHint')));
    toastSection.appendChild(
      createField({
        label: t('toastPosition'),
        hint: t('toastPositionHint'),
        control: createSelect(
          TOAST_POSITIONS.map((position) => ({
            value: position,
            label: t(TOAST_POSITION_KEYS[position]),
          })),
          draft.toasts.position,
          (value) => {
            draft.toasts.position = value;
          },
        ),
      }),
    );
    pane.appendChild(toastSection);
  },
};
