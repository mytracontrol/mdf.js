/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash, Multi } from '@mdf.js/crash';
import AJV, { AnySchema, ErrorObject, Options, SchemaObject } from 'ajv';
import AJVError from 'ajv-errors';
import AJVFormats from 'ajv-formats';
import AJVKeyWords from 'ajv-keywords';
import { AnyValidateFunction } from 'ajv/dist/core';
import { get } from 'jsonpointer';
import { cloneDeep, forOwn, omit } from 'lodash';
import { v4 } from 'uuid';

import DynamicDefaults, { DynamicDefaultFunc } from 'ajv-keywords/dist/definitions/dynamicDefaults';

const DEFAULT_SNIPPET_META_SCHEMA = {
  title: 'Default snippets',
  type: 'array',
  items: {
    title: 'VSCode snippet',
    type: 'object',
    properties: {
      label: { type: 'string' },
      description: { type: 'string' },
      body: {},
    },
    required: ['label', 'body'],
  },
};

export type SchemaSelector<T> = T extends void ? string : keyof T & string;
export type ValidatedOutput<T, K> = K extends keyof T ? T[K] : any;

/**
 * This is the AJV Options object, but `allErrors` property is always true by default
 *
 * See [AJV Options](https://ajv.js.org/options.html) for more information
 */
export interface DoorkeeperOptions extends Omit<Options, 'allErrors'> {
  /** Dynamic defaults to be used in the schemas */
  dynamicDefaults?: Record<string, DynamicDefaultFunc>;
}
export { JSONSchemaType } from 'ajv';

/** Callback function for the validation process */
export type ResultCallback<T, K> = (error?: Crash | Multi, result?: ValidatedOutput<T, K>) => void;

/**
 * Doorkeeper is a wrapper for AJV that allows us to validate JSONs against schemas.
 * It also allows us to register schemas and retrieve them later.
 * @category Doorkeeper
 * @public
 */
export class DoorKeeper<T = void> {
  readonly uuid = v4();
  /** AJV instance*/
  private readonly ajv: AJV;
  /**
   * Creates the Doorkeeper instance to validate JSONs using AJV with formats, keywords and errors
   * @param options - Doorkeeper options
   */
  constructor(public readonly options?: DoorkeeperOptions) {
    const AJVOptions: Options = this.options
      ? { ...this.options, allErrors: true }
      : { allErrors: true };
    if (this.options?.dynamicDefaults) {
      for (const [key, func] of Object.entries(this.options.dynamicDefaults)) {
        DynamicDefaults.DEFAULTS[key] = func;
      }
    }
    this.ajv = AJVFormats(AJVKeyWords(AJVError(new AJV(AJVOptions))));
    this.ajv.addKeyword({ keyword: 'markdownDescription', schemaType: 'string', valid: true });
    this.ajv.addKeyword({
      keyword: 'defaultSnippets',
      metaSchema: DEFAULT_SNIPPET_META_SCHEMA,
      valid: true,
    });
    this.options = AJVOptions;
  }
  /**
   * Add a new schema to the ajv collection
   * @param schema - schema to be added
   * @param key - identification key for the schema
   */
  private addSchema(schema: SchemaObject | AnySchema, key: string): void {
    try {
      this.ajv.addSchema(schema, key);
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(`Error adding the schema: [${key}] - error: [${error.message}]`, this.uuid, {
        cause: error,
      });
    }
  }
  /**
   * Compiles the schemas, adding them to the ajv collection
   * @param schemas - schemas to be compiled
   */
  private compileSchemas(schemas: AnySchema[]): void {
    for (const schema of schemas) {
      try {
        this.ajv.compile(schema);
      } catch (rawError) {
        const error = Crash.from(rawError);
        throw new Crash(
          `Error adding the schema: [${JSON.stringify(schema)}] - error: [${error.message}]`,
          this.uuid,
          { cause: error }
        );
      }
    }
  }
  /**
   * Create a Multi error from AJV ErrorObject array
   * @param errors - AJV errors
   * @param schema - schema applied
   * @param uuid - uuid string
   * @param data - JSON to be validated
   * @param stackableError - Error where the new crash errors should be stacked
   */
  private multify(
    errors: ErrorObject[],
    schema: string,
    uuid: string,
    data: any,
    stackableError?: Multi
  ): Multi {
    const validationError = stackableError
      ? stackableError
      : new Multi(`Errors during the schema validation process`, uuid, {
          name: 'ValidationError',
          info: { data, schema },
        });
    for (const error of errors) {
      if ('emUsed' in error && error.emUsed) {
        continue;
      }
      const message = this.errorFormatter(error, data);
      validationError.push(new Crash(message, uuid, { name: 'ValidationError', info: error }));
      if (error.params && error.params['errors']) {
        this.multify(error.params['errors'], schema, uuid, data, validationError);
      }
    }
    return validationError;
  }
  /**
   * Create a human readable error message
   * @param error - AJV error
   * @param data - JSON to be validated
   */
  private errorFormatter(error: ErrorObject, data: any): string {
    let message = `${error.message}`;
    if (error.propertyName) {
      message += ` - Property: [${error.propertyName}]`;
    }
    if (error.keyword === 'additionalProperties') {
      message += ` - Property: [${
        //@ts-ignore additionalProperties exists if the keyword is additionalProperties
        error.params.additionalProperties || error.params.additionalProperty
      }]`;
    }
    let value;
    if (error.instancePath) {
      message += ` - Path: [${error.instancePath}]`;
      value = get(data, error.instancePath);
    } else {
      value = data;
    }
    switch (typeof value) {
      case 'undefined':
        message += ` - no value`;
        break;
      case 'symbol':
        message += ` - Value: [${value.toString()}]`;
        break;
      case 'object':
        message += ` - Value: [${JSON.stringify(value)}]`;
        break;
      default:
        message += ` - Value: [${value}]`;
    }
    return message;
  }
  /**
   * Get a schema from the ajv collection
   * @param schema - schema to be retrieved
   * @param uuid - uuid string
   * @returns the schema validator
   * @throws Crash if the schema is not registered
   */
  private getSchema<K extends SchemaSelector<T>>(
    schema: K,
    uuid: string
  ): AnyValidateFunction<unknown> {
    const validator = this.ajv.getSchema(schema);
    if (validator === undefined) {
      throw new Crash(`${schema} is not registered in the collection.`, uuid, {
        name: 'ValidationError',
        info: { schema },
      });
    }
    return validator;
  }
  /**
   * Validates a JSON against a schema
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   */
  private checkSchema<K extends SchemaSelector<T>>(schema: K, data: any, uuid = v4()): void {
    const validator = this.getSchema(schema, uuid);
    if (!validator(data)) {
      if (validator.errors) {
        throw this.multify(validator.errors, schema, uuid, data);
      } else {
        throw new Crash(`Unexpected error in JSON schema validation process`, uuid, {
          name: 'ValidationError',
          info: { schema, data },
        });
      }
    }
  }
  /**
   * Registers a group of schemas from an object using the keys of the
   * object as key and the value as the validation schema
   * @param schemas - Object containing the [key, validation schema]
   * @returns - the instance
   */
  public register(schemas: Record<SchemaSelector<T>, AnySchema>): DoorKeeper<T>;
  /**
   * Registers a group of schemas from an array and compiles them
   * @param schemas - Array containing the
   * @returns - the instance
   */
  public register(schemas: AnySchema[]): DoorKeeper<T>;
  /**
   * Registers one schema with its key
   * @param key - the key with which identify the schema
   * @param validatorSchema - the schema to be registered
   * @returns - the instance
   */
  public register(key: SchemaSelector<T>, validatorSchema: AnySchema): DoorKeeper<T>;
  public register(
    keyOrArraySchemasOrObjectSchemas: SchemaSelector<T> | AnySchema[] | Record<string, AnySchema>,
    validatorSchema?: AnySchema
  ): DoorKeeper<T> {
    if (
      typeof keyOrArraySchemasOrObjectSchemas === 'string' &&
      typeof validatorSchema === 'object' &&
      !Array.isArray(validatorSchema)
    ) {
      this.addSchema(validatorSchema, keyOrArraySchemasOrObjectSchemas);
    } else if (Array.isArray(keyOrArraySchemasOrObjectSchemas)) {
      this.compileSchemas(keyOrArraySchemasOrObjectSchemas);
    } else if (typeof keyOrArraySchemasOrObjectSchemas === 'object') {
      for (const [key, _schema] of Object.entries(keyOrArraySchemasOrObjectSchemas)) {
        this.addSchema(_schema, key);
      }
    } else {
      throw new Crash('Invalid parameters, no schema will be registered', this.uuid);
    }
    return this;
  }
  /**
   * Checks if the input schema is registered
   * @param schema - schema asked for
   * @returns - if the schema is registered in the ajv collection
   */
  public isSchemaRegistered<K extends SchemaSelector<T>>(schema: K): boolean {
    return !!this.ajv.getSchema(schema);
  }
  /**
   * Validate an Object against the input schema
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   * @param callback - callback function with the result of the validation
   */
  public validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid: string,
    callback: ResultCallback<T, K>
  ): void;
  /**
   * Validate an Object against the input schema
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param callback - callback function with the result of the validation
   */
  public validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    callback: ResultCallback<T, K>
  ): void;
  /**
   * Validate an Object against the input schema
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   */
  public validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid: string
  ): Promise<ValidatedOutput<T, K>>;
  /**
   * Validate an Object against the input schema
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   */
  public validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any
  ): Promise<ValidatedOutput<T, K>>;
  public validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuidOrCallBack?: string | ResultCallback<T, K>,
    callbackOrUndefined?: ResultCallback<T, K>
  ): Promise<ValidatedOutput<T, K>> | void {
    let error: Crash | Multi | undefined;
    const uuid = typeof uuidOrCallBack === 'string' ? uuidOrCallBack : v4();
    const callback = typeof uuidOrCallBack === 'function' ? uuidOrCallBack : callbackOrUndefined;
    try {
      this.checkSchema(schema, data, uuid);
    } catch (rawError) {
      error = Crash.from(rawError);
    }
    if (callback) {
      callback(error, data);
    } else {
      if (error) {
        return Promise.reject(error);
      } else {
        return Promise.resolve(data);
      }
    }
  }
  /**
   * Try to validate an Object against the input schema or throw a ValidationError
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   */
  public attempt<K extends SchemaSelector<T>>(schema: K, data: any): ValidatedOutput<T, K>;
  /**
   * Try to validate an Object against the input schema or throw a ValidationError
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   */
  public attempt<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid: string
  ): ValidatedOutput<T, K>;
  public attempt<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid?: string
  ): ValidatedOutput<T, K> {
    this.checkSchema(schema, data, uuid);
    return data as ValidatedOutput<T, K>;
  }
  /**
   * Validate an Object against the input schema and return a boolean
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   */
  public check<K extends SchemaSelector<T>>(schema: K, data: any): boolean;
  /**
   * Validate an Object against the input schema and return a boolean
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   */
  public check<K extends SchemaSelector<T>>(schema: K, data: any, uuid: string): boolean;
  public check<K extends SchemaSelector<T>>(schema: K, data: any, uuid?: string): boolean {
    try {
      this.checkSchema(schema, data, uuid);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * Checks if the given data matches the specified schema.
   * @param schema - The schema to check against.
   * @param data - The data to validate.
   * @returns A boolean indicating whether the data matches the schema.
   */
  public is<K extends SchemaSelector<T>>(schema: K, data: any): data is ValidatedOutput<T, K> {
    return this.check(schema, data);
  }
  /**
   * Return a dereferenced schema with all the $ref resolved
   * @param schema - The schema we want to dereference
   * @param uuid - unique identifier for this operation
   * @returns A dereferenced schema with all the $ref resolved
   * @experimental This method is experimental and might change in the future without notice or be
   * removed from a future release. Use it at your own risk.
   */
  public dereference<K extends SchemaSelector<T>>(schema: K, uuid = v4()): AnySchema {
    const validatorSchema = this.getSchema(schema, uuid);
    if (typeof validatorSchema.schema === 'boolean') {
      throw new Crash('Invalid schema, no schema will be dereferenced', uuid, {
        name: 'ValidationError',
        info: { schema },
      });
    }
    const _schema = cloneDeep(validatorSchema.schema);
    const iterator = (
      entry: Record<string, any>,
      key: string,
      parentSchema: Record<string, any>
    ) => {
      if (entry['$ref']) {
        const refSchema = this.getSchema(entry['$ref'], uuid);
        parentSchema[key] = {
          ...forOwn(omit(cloneDeep(refSchema.schema) as object, ['$id', '$schema']), iterator),
          ...omit(cloneDeep(entry), ['$ref']),
        };
      } else if (typeof entry === 'object') {
        parentSchema[key] = forOwn(entry, iterator);
      }
    };
    return forOwn(_schema, iterator);
  }
}
