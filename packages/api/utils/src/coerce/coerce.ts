/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

type Coerceable = boolean | number | Record<string, any> | any[] | null;
/**
 * Coerce an environment variable
 * @param env - Environment
 */
export function coerce(env: string | undefined): Coerceable;
/**
 * Coerce an environment variable to a boolean value
 * @param env - Environment
 * @param alternative - default value
 */
export function coerce(env: string | undefined, alternative: boolean): boolean;
/**
 * Coerce an environment variable to a numerical value
 * @param env - Environment
 * @param alternative - default value
 */
export function coerce(env: string | undefined, alternative: number): number;
/**
 * Coerce an environment variable to an object
 * @param env - Environment
 * @param alternative - default value
 */
export function coerce(
  env: string | undefined,
  alternative: Record<string, any>
): Record<string, any>;
/**
 * Coerce an environment variable to an array
 * @param env - Environment
 * @param alternative - default value
 */
export function coerce(env: string | undefined, alternative: any[]): any[];
/**
 * Coerce an environment variable to a valid value
 * @param env - Environment
 */
export function coerce<T extends Coerceable>(env: string | undefined): T | undefined;
/**
 * Coerce an environment variable to a valid value
 * @param env - Environment
 * @param alternative - default value
 */
export function coerce(env: string | undefined, alternative: any): any;
export function coerce(env: string | undefined, alternative?: any): Coerceable | undefined {
  if (typeof env !== 'string') {
    return alternative;
  } else if (env.toLowerCase() === 'true') {
    return true;
  } else if (env.toLowerCase() === 'false') {
    return false;
  } else if (env.toLowerCase() === 'null') {
    return null;
  } else {
    try {
      return JSON.parse(env);
    } catch (error) {
      return alternative;
    }
  }
}
