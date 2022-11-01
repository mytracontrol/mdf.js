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

import { Crash } from '@mdf.js/crash';
import { Options } from './Options.i';

const UPPERCASE = /[\p{Lu}]/u;
const LOWERCASE = /[\p{Ll}]/u;
const LEADING_CAPITAL = /^[\p{Lu}](?![\p{Lu}])/gu;
const IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u;
const SEPARATORS = /[_.\- ]+/;

const LEADING_SEPARATORS = new RegExp('^' + SEPARATORS.source);
const SEPARATORS_AND_IDENTIFIER = new RegExp(SEPARATORS.source + IDENTIFIER.source, 'gu');
const NUMBERS_AND_IDENTIFIER = new RegExp('\\d+' + IDENTIFIER.source, 'gu');

type StringTransformer = (input: string) => string;
/**
 * Convert a dash/dot/underscore/space separated string to camelCase or PascalCase:
 *  - `foo-bar` → `fooBar`.
 * Correctly handles Unicode strings.
 * @param input - String to convert to camel case.
 * @example
 * ```
 * import camelCase from 'camelcase';
 * camelCase('foo-bar');
 * //=> 'fooBar'
 * camelCase('foo_bar');
 * //=> 'fooBar'
 * camelCase('Foo-Bar');
 * //=> 'fooBar'
 * camelCase('розовый_пушистый_единорог');
 * //=> 'розовыйПушистыйЕдинорог'
 * camelCase('Foo-Bar', {pascalCase: true});
 * //=> 'FooBar'
 * camelCase('--foo.bar', {pascalCase: false});
 * //=> 'fooBar'
 * camelCase('Foo-BAR', {preserveConsecutiveUppercase: true});
 * //=> 'fooBAR'
 * camelCase('fooBAR', {pascalCase: true, preserveConsecutiveUppercase: true}));
 * //=> 'FooBAR'
 * camelCase('foo bar');
 * //=> 'fooBar'
 * console.log(process.argv[3]);
 * //=> '--foo-bar'
 * camelCase(process.argv[3]);
 * //=> 'fooBar'
 * camelCase(['foo', 'bar']);
 * //=> 'fooBar'
 * camelCase(['__foo__', '--bar'], {pascalCase: true});
 * //=> 'FooBar'
 * camelCase(['foo', 'BAR'], {pascalCase: true, preserveConsecutiveUppercase: true})
 * //=> 'FooBAR'
 * camelCase('lorem-ipsum', {locale: 'en-US'});
 * //=> 'loremIpsum'
 * ```
 * @returns
 */
export function camelCase(input: string | string[], options?: Options) {
  if (!(typeof input === 'string' || Array.isArray(input))) {
    throw new Crash('Expected the input to be `string | string[]`', { name: 'TypeError' });
  }

  const _options = {
    pascalCase: false,
    preserveConsecutiveUppercase: false,
    ...options,
  };
  const cleanedString = cleanString(input);
  if (isTooShortString(cleanedString)) {
    return transformShortString(cleanedString, _options.pascalCase, _options.locale);
  } else {
    return postProcess(transformString(cleanedString, _options), toUpperCase(_options.locale));
  }
}

/**
 * Removes the leading and trailing white space and line terminator characters from a string or
 * array of strings.
 * @param input - string of array of strings to be cleaned
 * @returns
 */
function cleanString(input: string | string[]): string {
  if (Array.isArray(input)) {
    return input
      .map(x => x.trim())
      .filter(x => x.length)
      .join('-');
  } else {
    return input.trim();
  }
}
/**
 * Transform a string based in the options passed
 * @param input - string to be transformed
 * @param options - transform options
 * @returns
 */
function transformString(input: string, options: Options): string {
  let transformedString: string = input;
  if (hasUpperCase(input, options.locale)) {
    transformedString = preserveCamelCase(
      input,
      toLowerCase(options.locale),
      toUpperCase(options.locale)
    );
  }
  transformedString = transformedString.replace(LEADING_SEPARATORS, '');
  transformedString = options.preserveConsecutiveUppercase
    ? preserveConsecutiveUppercase(transformedString, toLowerCase(options.locale))
    : toLowerCase(options.locale)(transformedString);

  if (options.pascalCase) {
    transformedString =
      toUpperCase(options.locale)(transformedString.charAt(0)) + transformedString.slice(1);
  }
  return transformedString;
}
/**
 * Check if a string is to short to apply a complete conversion
 * @param input - string to be checked
 * @returns
 */
function isTooShortString(input: string): boolean {
  return input.length < 2;
}
/**
 * Transform short strings (0 or 1 characters)
 * @param input - string to be transformed
 * @param pascalCase - boolean to determine if the string should be transformed to pascal case
 * @param locale - indicates the locale to be used to convert to upper/lower case
 * @returns
 */
function transformShortString(
  input: string,
  pascalCase?: boolean,
  locale?: string | string[]
): string {
  if (input.length === 0) {
    return '';
  } else {
    if (SEPARATORS.test(input)) {
      return '';
    }
    return pascalCase ? toUpperCase(locale)(input) : toLowerCase(locale)(input);
  }
}
/**
 * Wrapping function to convert a string to upper case
 * @param locale - indicates the locale to be used to convert to upper/lower case
 * @returns
 */
function toUpperCase(locale?: string | string[]): StringTransformer {
  return locale === undefined
    ? (input: string) => input.toUpperCase()
    : (input: string) => input.toLocaleUpperCase(locale);
}
/**
 * Wrapping function to convert a string to lower case
 * @param locale - indicates the locale to be used to convert to upper/lower case
 * @returns
 */
function toLowerCase(locale?: string | string[]): StringTransformer {
  return locale === undefined
    ? (input: string) => input.toLowerCase()
    : (input: string) => input.toLocaleLowerCase(locale);
}
/**
 * Check if a string has upper case characters
 * @param input - string to be checked
 * @param locale - indicates the locale to be used to convert to upper/lower case
 * @returns
 */
function hasUpperCase(input: string, locale?: string | string[]): boolean {
  return input !== toLowerCase(locale)(input);
}
/**
 * Preserve camel case in a string
 * @param input - string to be transformed
 * @param toLowerCase - string processor to convert a string to lower case
 * @param toUpperCase - string processor to convert strings to upper case
 * @returns
 */
function preserveCamelCase(
  input: string,
  toLowerCase: StringTransformer,
  toUpperCase: StringTransformer
): string {
  let isLastCharLower = false;
  let isLastCharUpper = false;
  let isLastLastCharUpper = false;
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (isLastCharLower && UPPERCASE.test(character)) {
      input = input.slice(0, index) + '-' + input.slice(index);
      isLastCharLower = false;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = true;
      index++;
    } else if (isLastCharUpper && isLastLastCharUpper && LOWERCASE.test(character)) {
      input = input.slice(0, index - 1) + '-' + input.slice(index - 1);
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = false;
      isLastCharLower = true;
    } else {
      isLastCharLower =
        toLowerCase(character) === character && toUpperCase(character) !== character;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper =
        toUpperCase(character) === character && toLowerCase(character) !== character;
    }
  }
  return input;
}
/**
 * Preserve consecutive uppercase characters
 * @param input - string to be processed
 * @param toLowerCase - string processor to convert strings to lower case
 * @returns
 */
function preserveConsecutiveUppercase(input: string, toLowerCase: StringTransformer): string {
  LEADING_CAPITAL.lastIndex = 0;
  return input.replace(LEADING_CAPITAL, m1 => toLowerCase(m1));
}
/**
 * Post processing of the transformed string
 * @param input - string to be processed
 * @param toUpperCase - string processor to convert strings to upper case
 * @returns
 */
function postProcess(input: string, toUpperCase: StringTransformer): string {
  SEPARATORS_AND_IDENTIFIER.lastIndex = 0;
  NUMBERS_AND_IDENTIFIER.lastIndex = 0;
  return input
    .replace(SEPARATORS_AND_IDENTIFIER, (_, identifier) => toUpperCase(identifier))
    .replace(NUMBERS_AND_IDENTIFIER, m => toUpperCase(m));
}
