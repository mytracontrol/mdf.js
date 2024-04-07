/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Constructs a string type by joining two string types with a period (`.`),
 * except when the second string type is empty, in which case it returns just the first string type.
 * This utility type is used for generating nested property paths as string literals.
 *
 * @param K - A string or number type representing the key of an object.
 * @param P - A string or number type representing the next key in the nested object path.
 * @returns A string literal type representing the joined path.
 */
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

/**
 * A helper tuple for controlling recursion depth in the `Paths` type.
 * It works by decrementing the depth at each recursive step.
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

/**
 * Recursively constructs a union type of string literal types representing all possible paths
 * through an object `T`, up to a maximum depth `D`. This includes paths through nested objects and
 * arrays, where each key in the path is joined by a period (`.`). The depth is controlled to avoid
 * excessive recursion which can lead to type computation issues in TypeScript.
 *
 * @param T - The target object type to generate paths for.
 * @param D - The maximum recursion depth, defaulting to 10.
 * @returns A union type of string literal types representing the paths.
 */
export type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
          : never;
      }[keyof T]
    : '';

/**
 * Resolves the type at the end of a path `P` within an object type `T`.
 * Given a path represented as a string literal type, this utility type recursively resolves
 * and returns the type of the value at that path. It is capable of navigating through nested
 * objects based on the provided path.
 *
 * @param T - The target object type to resolve the value type for.
 * @param P - The path through the object, represented as a string literal type.
 * @returns The resolved value type at the end of the path.
 */
export type PathValue<T, P extends Paths<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Paths<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;
