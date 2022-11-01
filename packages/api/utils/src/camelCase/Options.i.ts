/* eslint-disable max-len */
/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

export interface Options {
  /**
   * Uppercase the first character: `foo-bar` → `FooBar`.
   * @default false
   */
  readonly pascalCase?: boolean;
  /**
   * Preserve consecutive uppercase characters: `foo-BAR` → `FooBAR`.
   * @default false
   */
  readonly preserveConsecutiveUppercase?: boolean;
  /**
   * The locale parameter indicates the locale to be used to convert to upper/lower case according
   * to any locale-specific case mappings. If multiple locales are given in an array, the best
   * available locale is used.
   * Setting `locale: false` ignores the platform locale and uses the
   * [Unicode Default Case Conversion](https://unicode-org.github.io/icu/userguide/transforms/casemappings.html#simple-single-character-case-mapping)
   * algorithm.
   * Default: The host environment’s current locale.
   * @example
   * ```ts
   * import { camelCase } from 'camelCase';
   * camelCase('lorem-ipsum', {locale: 'en-US'});
   * //=> 'loremIpsum'
   * camelCase('lorem-ipsum', {locale: 'tr-TR'});
   * //=> 'loremİpsum'
   * camelCase('lorem-ipsum', {locale: ['en-US', 'en-GB']});
   * //=> 'loremIpsum'
   * camelCase('lorem-ipsum', {locale: ['tr', 'TR', 'tr-TR']});
   * //=> 'loremİpsum'
   * ```
   */
  readonly locale?: string | string[];
}
