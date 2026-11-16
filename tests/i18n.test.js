import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRANSLATIONS } from '../src/i18n/locales/index.js';
import { SUPPORTED_LOCALES } from '../src/i18n/meta.js';

const LOCALES_DIR = join(process.cwd(), 'src', 'i18n', 'locales');
const SRC_DIR = join(process.cwd(), 'src');

function placeholders(value) {
  return [...String(value).matchAll(/\{([^}]+)\}/g)]
    .map((match) => match[1])
    .sort();
}

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path === LOCALES_DIR) continue;
      out.push(...sourceFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(path);
    }
  }
  return out;
}

test('all ten locales expose the same keys in the same order', () => {
  assert.deepEqual(Object.keys(TRANSLATIONS), SUPPORTED_LOCALES);
  const englishKeys = Object.keys(TRANSLATIONS.en);
  for (const locale of SUPPORTED_LOCALES) {
    assert.deepEqual(Object.keys(TRANSLATIONS[locale]), englishKeys, locale);
  }
});

test('placeholders match English in every locale', () => {
  for (const [key, english] of Object.entries(TRANSLATIONS.en)) {
    const expected = placeholders(english);
    for (const locale of SUPPORTED_LOCALES) {
      assert.deepEqual(
        placeholders(TRANSLATIONS[locale][key]),
        expected,
        `${locale}:${key}`,
      );
    }
  }
});

test('every literal t() key used by source exists in English', () => {
  const used = new Set();
  const pattern = /\bt\(\s*(['"])([^'"]+)\1/g;
  for (const file of sourceFiles(SRC_DIR)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(pattern)) used.add(match[2]);
  }
  const missing = [...used].filter((key) => !(key in TRANSLATIONS.en));
  assert.deepEqual(missing, []);
});

test('locale modules do not contain duplicate keys', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const path = join(LOCALES_DIR, `${locale}.js`);
    const text = readFileSync(path, 'utf8');
    const keys = [...text.matchAll(/^\s+"([^"]+)":/gm)].map((match) => match[1]);
    assert.equal(new Set(keys).size, keys.length, locale);
  }
});
