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
import { Crash, Multi } from '@mdf.js/crash';
import AJV, { AnySchema, ErrorObject, Options, SchemaObject } from 'ajv';
import AJVError from 'ajv-errors';
import AJVFormats from 'ajv-formats';
import AJVKeyWords from 'ajv-keywords';
import { get } from 'jsonpointer';
import { v4 } from 'uuid';

type SchemaSelector<T> = T extends void ? string : keyof T & string;
type ValidatedOutput<T, K> = K extends keyof T ? T[K] : any;

/** AJV options but all errors must be true */
export type DoorkeeperOptions = Options;

/** Wrapping class for AJV */
export class DoorKeeper<T = void> {
  readonly uuid = v4();
  /** AJV instance*/
  private readonly ajv: AJV;
  /**
   * Creates the Doorkeeper instance to validate JSONs using AJV with formats, keywords and errors
   * @param options - Doorkeeper options
   */
  constructor(public readonly options?: DoorkeeperOptions) {
    this.options = options ? { ...options, allErrors: true } : { allErrors: true };
    this.ajv = AJVFormats(AJVKeyWords(AJVError(new AJV(this.options))));
    this.ajv.addKeyword({ keyword: 'markdownDescription' });
    this.ajv.addKeyword({ keyword: 'defaultSnippets' });
  }
  /**
   * Registers a group of schemas from an object using the keys of the
   * object as key and the value as the validation schema
   * @param schemas - Object containing the [key, validation schema]
   * @returns - the instance
   */
  register(schemas: Record<SchemaSelector<T>, AnySchema>): DoorKeeper<T>;
  /**
   * Registers a group of schemas from an array and compiles them
   * @param schemas - Array containing the
   * @returns - the instance
   */
  register(schemas: AnySchema[]): DoorKeeper<T>;
  /**
   * Registers one schema with its key
   * @param key - the key with which identify the schema
   * @param validatorSchema - the schema to be registered
   * @returns - the instance
   */
  register(key: SchemaSelector<T>, validatorSchema: AnySchema): DoorKeeper<T>;
  register(
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
   * Validate an Object against the input schema
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   * @param callback - callback function with the result of the validation
   */
  validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid: string,
    callback: (error?: Crash | Multi, result?: ValidatedOutput<T, K>) => void
  ): void;
  /**
   * Validate an Object against the input schema
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   */
  validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid: string
  ): Promise<ValidatedOutput<T, K>>;
  validate<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid: string,
    callback?: (error?: Crash | Multi, result?: ValidatedOutput<T, K>) => void
  ): Promise<ValidatedOutput<T, K>> | void {
    const validator = this.ajv.getSchema(schema);
    let error: Crash | Multi | undefined = undefined;
    // *********************************************************************************************
    // #region No valid schema
    if (validator === undefined) {
      error = new Crash(`${schema} is not registered in the collection.`, uuid, {
        name: 'ValidationError',
        info: { schema, data },
      });
    }
    // #endregion
    // *********************************************************************************************
    // #region Check the against schema
    else {
      if (!validator(data)) {
        if (validator.errors) {
          error = this.multify(validator.errors, schema, uuid, data);
        } else {
          error = new Crash(`Unexpected error in JSON schema validation process`, uuid, {
            name: 'ValidationError',
            info: { schema, data },
          });
        }
      }
    }
    // #endregion
    // *********************************************************************************************
    // #region Return the result
    if (callback) {
      callback(error, data);
    } else {
      if (error) {
        return Promise.reject(error);
      } else {
        return Promise.resolve(data);
      }
    }
    //#endregion
  }

  /**
   * Checks if the input schema is registered
   * @param schema - schema asked for
   * @returns - if the schema is registered in the ajv collection
   */
  isSchemaRegistered<K extends SchemaSelector<T>>(schema: K): boolean {
    return !!this.ajv.getSchema(schema);
  }

  /**
   * Try to validate an Object against the input schema or throw a validation
   * error
   * @param schema - The schema we want to validate
   * @param data - Object to be validated
   * @param uuid - unique identifier for this operation
   */
  public attempt<K extends SchemaSelector<T>>(
    schema: K,
    data: any,
    uuid: string
  ): ValidatedOutput<T, K> {
    const validator = this.ajv.getSchema(schema);
    // *********************************************************************************************
    // #region No valid schema
    if (validator === undefined) {
      throw new Crash(`${schema} is not registered in the collection.`, uuid, {
        name: 'ValidationError',
        info: { schema, data },
      });
    }
    // #endregion
    // *********************************************************************************************
    // #region Check the against schema
    else {
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
    // #endregion
    // *********************************************************************************************
    // #region Return the result
    return data as ValidatedOutput<T, K>;
    //#endregion
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
    if (error.instancePath) {
      message += ` - Path: [${error.instancePath}]`;
      const value = get(data, error.instancePath);
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
    }
    return message;
  }
}
