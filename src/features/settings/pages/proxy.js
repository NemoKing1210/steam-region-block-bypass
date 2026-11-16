import { t } from '../../../i18n/index.js';
import {
  createField,
  createHint,
  createSection,
  createSelect,
  createSwitchRow,
  createTextInput,
} from '../controls.js';
import { el } from '../../../utils/dom.js';

const PROXY_MODE_LABELS = {
  gateway: 'host:port/https://…',
  path: 'host:port/store.steampowered.com/…',
  query: 'host:port/?url=…',
};

export const proxyPage = {
  id: 'proxy',
  titleKey: 'tabProxy',
  icon: 'swap',
  descKey: 'navProxyDesc',
  renderInto(pane, draft) {
    const region = draft.region;
    const section = createSection({ icon: 'swap', title: t('useProxy') });
    const fields = el('div', 'srbb-proxy-fields');

    const mode = createSelect(
      Object.entries(PROXY_MODE_LABELS).map(([value, label]) => ({ value, label })),
      region.proxyMode,
      (value) => {
        region.proxyMode = value;
      },
    );
    const host = createTextInput({
      value: region.proxyHost || '',
      placeholder: '127.0.0.1',
      maxLength: 253,
      onChange: (value) => {
        region.proxyHost = String(value || '').trim();
      },
    });
    const port = createTextInput({
      value: region.proxyPort || '',
      placeholder: '8765',
      maxLength: 5,
      inputMode: 'numeric',
      onChange: (value) => {
        region.proxyPort = String(value || '').trim();
      },
    });
    const user = createTextInput({
      value: region.proxyUser || '',
      maxLength: 128,
      placeholder: t('optional'),
      onChange: (value) => {
        region.proxyUser = String(value || '');
      },
    });
    const pass = createTextInput({
      value: region.proxyPass || '',
      maxLength: 256,
      type: 'password',
      placeholder: t('optional'),
      onChange: (value) => {
        region.proxyPass = String(value || '');
      },
    });

    fields.appendChild(
      createField({
        label: t('gatewayMode'),
        control: mode,
      }),
    );
    fields.appendChild(
      createField({
        label: t('host'),
        control: host,
      }),
    );
    fields.appendChild(
      createField({
        label: t('port'),
        control: port,
      }),
    );
    fields.appendChild(
      createField({
        label: t('username'),
        control: user,
      }),
    );
    fields.appendChild(
      createField({
        label: t('password'),
        control: pass,
      }),
    );

    const controls = [mode, host, port, user, pass];
    const syncDisabled = (enabled) => {
      controls.forEach((control) => {
        control.disabled = !enabled;
      });
    };
    const toggle = createSwitchRow({
      checked: region.proxyEnabled === true,
      label: t('useProxy'),
      onChange: (checked) => {
        region.proxyEnabled = checked;
        syncDisabled(checked);
      },
    });
    syncDisabled(region.proxyEnabled === true);

    section.appendChild(toggle);
    section.appendChild(fields);
    section.appendChild(createHint(t('proxyHint')));
    pane.appendChild(section);
  },
};
