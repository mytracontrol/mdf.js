/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AnySchemaObject, KeywordDefinition, SchemaObject } from 'ajv';

/**
 * Our custom keyword definition.
 * This keyword will be named "dateOrString" (you can choose another name).
 *
 * Usage example in the schema:
 * {
 *   "type": "object",
 *   "properties": {
 *     "myDate": {
 *       "JSDate": { "toDate": true }
 *     }
 *   }
 * }
 */
export const JSDateKeyword: KeywordDefinition = {
  /** Custom keyword */
  keyword: 'JSDate',
  /** Allow in-place modification of the data (transforming string into a Date) */
  modifying: true,
  /** Objet schema type schemaType DateKeywordSchema.*/
  schemaType: 'object',
  /** Compile function, AJV calls once per schema usage of this keyword */
  compile: (schemaValue: { toDate: boolean }, parentSchema: AnySchemaObject, it: SchemaObject) => {
    // Return a validation function that AJV will call to check the data.
    return (
      data: unknown, // The actual data value for the property
      dataCtx?: {
        parentData: Record<string, any>;
        parentDataProperty: string | number;
      }
    ) => {
      // If the data is already a Date object, just check if it's valid.
      if (data instanceof Date) {
        // Check if it's a valid date (getTime() is not NaN).
        return !isNaN(data.getTime());
      } else if (typeof data === 'string') {
        // Check if is a valid ISO 8601 date
        const date = new Date(data);
        if (isNaN(date.getTime()) || date.toISOString() !== data) {
          return false;
        }
        if (schemaValue.toDate && dataCtx) {
          dataCtx.parentData[dataCtx.parentDataProperty] = date;
        }
        return true;
      }
      // If the data is not a string or a Date, fail validation.
      return false;
    };
  },
  /** We'll provide our own error messages if validation fails */
  errors: true,
  error: {
    message: 'should be a valid Date or a string in ISO 8601 format',
  },
};
