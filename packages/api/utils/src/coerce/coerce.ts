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
