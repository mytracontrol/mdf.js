/**
 * Copyright 2023 Netin Systems S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin Systems S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin Systems S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin Systems S.L.
 */
import { Crash } from '@mdf.js/crash';
import { Chance } from 'chance';
import _, { merge } from 'lodash';

/** Type for attribute dependencies */
export type Dependencies<T, K extends keyof T> = (K | string)[];
/** Type for function for attribute builder function */
export type Builder<T, K extends keyof T> = (...args: any) => T[K] | undefined;
/** Type for attribute default value */
export type DefaultValue<T, K extends keyof T> = T[K];
/** Type for attribute value option */
type GeneratorOptions<T, K extends keyof T> =
  | Builder<T, K>
  | DefaultValue<T, K>
  | Dependencies<T, K>;
/** Interface for attribute generation */
interface Entry<T> {
  dependencies?: Dependencies<T, keyof T>;
  builder: Builder<T, keyof T>;
}
/** Interface for default object */
export interface DefaultObject {
  [key: string]: any;
}
/** Interface for default options */
export interface DefaultOptions {
  likelihood?: number;
  [key: string]: any;
}

/** Factory for building JavaScript objects, mostly useful for setting up test data */
export class Factory<
  T extends DefaultObject = DefaultObject,
  R extends DefaultOptions = DefaultOptions
> {
  /** Options for programmatic generation of attributes */
  private _opts: {
    [K in keyof R]: Entry<R>;
  };
  /** Attributes of this factory, based on a interface */
  private _attrs: {
    [K in keyof T]: Entry<T>;
  };
  /** Auto incrementing sequence attribute */
  private _seques: {
    [K in keyof T]?: number;
  };
  /** Callback function array */
  private readonly _callbacks: ((object: T, options: R) => T)[];
  /** Chance object for probabilistic wrong value generation */
  private readonly _chance;
  /** Create a new factory instance */
  public constructor() {
    this._opts = {} as { [K in keyof R]: Entry<R> };
    this._attrs = {} as { [K in keyof T]: Entry<T> };
    this._seques = {};
    this._callbacks = [];
    this._chance = new Chance();
  }
  /**
   * Define an attribute on this factory
   * @param attr - Name of attribute
   * @example
   * ```typescript
   * factory.attr('name');
   * ```
   */
  public attr<K extends keyof T>(attr: K): Factory<T, R>;
  /**
   * Define an attribute on this factory using a default value (e.g. a string or number)
   * @param attr - Name of attribute
   * @param defaultValue - Default value of attribute
   * @example
   * ```typescript
   * factory.attr('name', 'John Doe');
   * ```
   */
  public attr<K extends keyof T>(attr: K, defaultValue: DefaultValue<T, K>): Factory<T, R>;
  /**
   * Define an attribute on this factory using a generator function
   * @param attr - Name of attribute
   * @param generator - Value generator function
   * @example
   * ```typescript
   * factory.attr('name', () => function() { return 'John Doe'; });
   * ```
   */
  public attr<K extends keyof T>(attr: K, generator: Builder<T, K>): Factory<T, R>;
  /**
   * Define an attribute on this factory using a generator function and dependencies on options or
   * other attributes
   * @param attr - Name of attribute
   * @param dependencies - Array of dependencies as option or attribute names that are used by the
   * generator function to generate the value of this attribute
   * @param generator - Value generator function. The generator function will be called with the
   * resolved values of the dependencies as arguments.
   * @example
   * ```typescript
   * factory.attr('name', ['firstName', 'lastName'], (firstName, lastName) => {
   *  return `${firstName} ${lastName}`;
   * });
   * ```
   */
  public attr<K extends keyof T>(
    attr: K,
    dependencies: Dependencies<T, K>,
    generator: Builder<T, K>
  ): Factory<T, R>;
  public attr<K extends keyof T>(
    attr: K,
    generatorOptions?: GeneratorOptions<T, K>,
    builder?: Builder<T, K>
  ): Factory<T, R> {
    this._attrs[attr] = this._SafeType<T>(generatorOptions, builder);
    return this;
  }
  /**
   * Define multiple attributes on this factory using a default value (e.g. a string or number) or
   * generator function. If you need to define dependencies on options or other attributes, use the
   * `attr` method instead.
   * @param attributes - Object with multiple attributes
   * @example
   * ```typescript
   * factory.attrs({
   *   name: 'John Doe',
   *   age: function() { return 21; },
   * });
   * ```
   */
  public attrs(attributes: {
    [K in keyof T]: DefaultValue<T, K> | Builder<T, K>;
  }): Factory<T, R> {
    for (const attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        this.attr(attr, attributes[attr]);
      }
    }
    return this;
  }
  /**
   * Define an option for this factory using a default value. Options are values that are not
   * directly used in the generated object, but can be used to influence the generation process.
   * For example, you could define an option `withAddress` that, when set to `true`, would generate
   * an address and add it to the generated object. Like attributes, options can have dependencies
   * on other options but not on attributes.
   * @param opt - Name of option
   * @param defaultValue - Default value of option
   * @example
   * ```typescript
   * factory.option('withAddress', false);
   * ```
   */
  public option<K extends keyof R>(opt: K, defaultValue: DefaultValue<R, K>): Factory<T, R>;
  /**
   * Define an option for this factory using a generator function. Options are values that are not
   * directly used in the generated object, but can be used to influence the generation process.
   * For example, you could define an option `withAddress` that, when set to `true`, would generate
   * an address and add it to the generated object. Like attributes, options can have dependencies
   * on other options but not on attributes.
   * @param opt - Name of option
   * @param generator - Value generator function
   * @example
   * ```typescript
   * factory.option('withAddress', () => function() { return false; });
   * ```
   */
  public option<K extends keyof R>(opt: K, generator: Builder<R, K>): Factory<T, R>;
  /**
   * Define an option for this factory using a generator function with dependencies in other
   * options. Options are values that are not directly used in the generated object, but can be
   * used to influence the generation process. For example, you could define an option
   * `withAddress` that, when set to `true`, would generate an address and add it to the generated
   * object. Like attributes, options can have dependencies on other options but not on attributes.
   * @param opt - Name of option
   * @param dependencies - Array of dependencies as option names that are used by the generator
   * function to generate the value of this option
   * @param generator - Value generator function with dependencies in other options. The generator
   * function will be called with the resolved values of the dependencies as arguments.
   */
  public option<K extends keyof R>(
    opt: K,
    dependencies: Dependencies<R, K>,
    generator: Builder<R, K>
  ): Factory<T, R>;
  public option<K extends keyof R>(
    opt: K,
    generatorOptions: GeneratorOptions<R, K>,
    builder?: Builder<R, K>
  ): Factory<T, R> {
    this._opts[opt] = this._SafeType<R>(generatorOptions, builder);
    return this;
  }
  /**
   * Define an auto incrementing sequence attribute of the object. Default value is 1.
   * @param attr - Name of attribute
   * @example
   * ```typescript
   * factory.sequence('id');
   * ```
   */
  public sequence<K extends keyof T>(attr: K): Factory<T, R>;
  /**
   * Define an auto incrementing sequence attribute of the object where the sequence value is
   * generated by a generator function that is called with the current sequence value as argument.
   * @param attr - Name of attribute
   * @param generator - Value generator function
   * @example
   * ```typescript
   * factory.sequence('id', (i) => function() { return i + 11; });
   * ```
   */
  public sequence<K extends keyof T>(attr: K, generator: Builder<T, K>): Factory<T, R>;
  /**
   * Define an auto incrementing sequence attribute of the object where the sequence value is
   * generated by a generator function that is called with the current sequence value as argument
   * and dependencies on options or other attributes.
   * @param attr - Name of attribute
   * @param dependencies - Array of dependencies as option or attribute names that are used by the
   * generator function to generate the value of the sequence attribute
   * @param generator - Value generator function
   * @example
   * ```typescript
   * factory.sequence('id', ['idPrefix'], (i, idPrefix) => function() {
   *  return `${idPrefix}${i}`;
   * });
   * ```
   */
  public sequence<K extends keyof T>(
    attr: K,
    dependencies: (K | string)[],
    generator: Builder<T, K>
  ): Factory<T, R>;
  public sequence<K extends keyof T>(
    attr: K,
    generatorOptions?: GeneratorOptions<T, K>,
    builder?: Builder<T, K>
  ): Factory<T, R> {
    const _attribute = this._SafeType(generatorOptions, builder);
    if (generatorOptions === undefined && builder === undefined) {
      _attribute.builder = i => i + 1;
      _attribute.dependencies = [];
    }

    return this.attr(attr, _attribute.dependencies || [], (...args: any[]) => {
      const value = _attribute.builder(this._seques[attr] || 0, ...args);
      this._seques[attr] = value;
      return value;
    });
  }
  /**
   * Register a callback function to be called after the object is generated. The callback function
   * receives the generated object as first argument and the resolved options as second argument.
   * @param callback - Callback function
   * @example
   * ```typescript
   * factory.after((user) => {
   *  user.name = user.name.toUpperCase();
   * });
   * ```
   */
  public after(callback: (object: T, options: R) => T): Factory<T, R> {
    this._callbacks.push(callback);
    return this;
  }
  /**
   * Returns an object that is generated by the factory.
   * The optional option `likelihood` is a number between 0 and 100 that defines the probability
   * that the generated object contains wrong data. This is useful for testing if your code can
   * handle wrong data. The default value is 100, which means that the generated object always
   * contains correct data.
   * @param attributes - object containing attribute override key value pairs
   * @param options - object containing option key value pairs
   */
  public build(
    attributes: { [K in keyof T]?: T[K] } = {},
    options: { likelihood?: number; [key: string]: any } = { likelihood: 100 }
  ): T {
    if (options && options['likelihood'] === undefined) {
      options = { ...options, likelihood: 100 };
    }
    if (
      typeof options['likelihood'] !== 'number' ||
      options['likelihood'] < 0 ||
      options['likelihood'] > 100
    ) {
      throw new Crash('Likelihood must be a number between 0 and 100', {
        likelihood: options['likelihood'],
      });
    }
    const _attributes = _.merge(_.cloneDeep(this._attrs), this._convertToAttributes(attributes));
    const _options = _.merge(this._opts, this._ConvertToOptions(options));
    let returnableObject: { [K in keyof T]?: T[K] } = {};
    const resolvedOptions: { [key: string]: any } = {};
    for (const attr in this._attrs) {
      const stack: (keyof T | string)[] = [];
      returnableObject[attr] = this._Build(
        _attributes[attr] as Entry<T>,
        returnableObject,
        resolvedOptions,
        _attributes,
        _options,
        stack,
        options['likelihood']
      );
    }
    if (
      (Object.keys(this._attrs).length === 0 || Object.keys(resolvedOptions).length === 0) &&
      Object.keys(_options).length > 0
    ) {
      for (const opts in _options) {
        const stack: (keyof T | string)[] = [];
        resolvedOptions[opts] = this._Build(
          _options[opts],
          returnableObject,
          resolvedOptions,
          _attributes,
          _options,
          stack
        );
      }
    }
    for (const callback of this._callbacks) {
      const obj = callback(returnableObject as T, resolvedOptions as R);
      if (obj !== undefined) {
        returnableObject = obj;
      }
    }
    return returnableObject as T;
  }
  /**
   * Returns an array of objects that are generated by the factory.
   * The optional option `likelihood` is a number between 0 and 100 that defines the probability
   * that the generated object contains wrong data. This is useful for testing if your code can
   * handle wrong data. The default value is 100, which means that the generated object always
   * contains correct data.
   * @param size - number of objects to generate
   * @param attributes - object containing attribute override key value pairs
   * @param options - object containing option key value pairs
   * @example
   * ```typescript
   * factory.buildList(3, { name: 'John Doe' });
   * ```
   */
  public buildList(
    size: number,
    attributes: { [K in keyof T]?: T[K] } = {},
    options: { likelihood?: number; [key: string]: any } = { likelihood: 100 }
  ): T[] {
    const objs = [];
    for (let i = 0; i < size; i++) {
      objs.push(this.build(attributes, options));
    }
    return objs;
  }
  /**
   * Extend this factory with another factory. The attributes and options of the other factory are
   * merged into this factory. If an attribute or option with the same name already exists, it is
   * overwritten.
   * @param factory - Factory to extend this factory with
   */
  public extend<P extends Partial<T>, J extends Partial<R>>(factory: Factory<P, J>): Factory<T, R> {
    Object.assign(this._attrs, factory._attrs);
    Object.assign(this._opts, factory._opts);
    this._callbacks.push(...factory._callbacks.map(this.wrapCallback));
    return this;
  }
  /** Reset all the sequences of this factory */
  public reset(): void {
    this._seques = {};
  }
  /**
   * Wrap a callback function to add type safety and avoid lost of data of extended factories
   * @param callback - Callback function
   */
  private wrapCallback = <P extends Partial<T>, J extends Partial<R>>(
    callback: (object: P, options: J) => P
  ): ((object: T, options: R) => T) => {
    return (object: T, options: R) => {
      const result = callback(object as unknown as P, options as unknown as J);
      return merge(object, result) as T;
    };
  };
  /**
   * Create an object with standard Options from a key-value pairs object
   * @param options - object containing option key value pairs
   */
  private _ConvertToOptions(options: { [key: string]: any }): { [key: string]: Entry<T> } {
    const opts: { [key: string]: Entry<T> } = {};
    for (const opt in options) {
      opts[opt] = { dependencies: undefined, builder: () => options[opt] };
    }
    return opts;
  }
  /**
   * Resolve the value of the options or attributes
   * @param meta - metadata information of option or attribute
   * @param object - object with resolved attributes
   * @param resolvedOptions - object with resolved options
   * @param attributes - attributes object
   * @param options - options object
   * @param stack - stack of recursive calls
   */
  private _Build(
    meta: Entry<T>,
    object: { [K in keyof T]?: T[K] },
    resolvedOptions: { [key: string]: any },
    attributes: { [K in keyof T]?: Entry<T> },
    options: { [key: string]: Entry<T> },
    stack: (keyof T | string)[],
    likelihood = 100
  ): any {
    if (!meta) {
      throw new Crash('Error in factory build process', {
        meta,
        object,
        resolvedOptions,
        attributes,
        options,
        stack,
      });
    }
    if (!meta.dependencies) {
      if (!this._chance.bool({ likelihood })) {
        return this._wrongData(typeof meta.builder());
      } else {
        return meta.builder();
      }
    } else {
      const args = this._BuildWithDependencies(
        meta.dependencies,
        object,
        resolvedOptions,
        attributes,
        options,
        stack
      );
      if (!this._chance.bool({ likelihood })) {
        return this._wrongData(typeof meta.builder(...args));
      } else {
        return meta.builder(...args);
      }
    }
  }
  /**
   * Resolve the value of the options or attributes if this has dependencies
   * @param dependencies - option or attribute dependencies
   * @param object - object with resolved attributes
   * @param resolvedOptions - object with resolved options
   * @param attributes - attributes object
   * @param options - options object
   * @param stack - stack of recursive calls
   */
  private _BuildWithDependencies(
    dependencies: (string | keyof T)[],
    object: { [K in keyof T]?: T[K] },
    resolvedOptions: { [key: string]: any },
    attributes: { [K in keyof T]?: Entry<T> },
    options: { [key: string]: Entry<T> },
    stack: (keyof T | string)[]
  ): any[] {
    return dependencies.map(dep => {
      if (stack.indexOf(dep) >= 0) {
        throw new Crash(`Detect a dependency cycle: ${stack.concat([dep]).join(' -> ')}`, {
          stack: stack.concat([dep]),
        });
      }
      let value: any;
      if (object[dep as keyof T] !== undefined) {
        value = object[dep as keyof T];
      } else if (resolvedOptions[dep as string] !== undefined) {
        value = resolvedOptions[dep as string];
      } else if (options[dep as string]) {
        resolvedOptions[dep as string] = this._Build(
          options[dep as string],
          object,
          resolvedOptions,
          attributes,
          options,
          stack.concat([dep])
        );
        value = resolvedOptions[dep as string];
      } else if (attributes[dep as keyof T]) {
        object[dep as keyof T] = this._Build(
          attributes[dep as keyof T] as Entry<T>,
          object,
          resolvedOptions,
          attributes,
          options,
          stack.concat([dep])
        );
        value = object[dep as keyof T];
      }
      return value;
    });
  }
  /**
   * Return Generator function if the argument is not a function
   * @param generator - Generator function or value
   */
  private _ReturnFunction<H extends T | R>(
    generator?: Builder<H, keyof H> | DefaultValue<H, keyof H>
  ): Builder<H, keyof H> {
    if (generator instanceof Function) {
      return generator;
    } else {
      return () => generator;
    }
  }
  /**
   * Return a Entry object with dependencies and builder function
   * @param generatorOptions - Default value or generator function or dependencies
   * @param generator - Generator function or value
   */
  private _SafeType<H extends T | R>(
    generatorOptions?: GeneratorOptions<H, keyof H>,
    generator?: Builder<H, keyof H>
  ): Entry<H> {
    let _dependencies: Dependencies<H, keyof H> | undefined;
    let _builder: Builder<H, keyof H>;
    if (generator === undefined) {
      if (Array.isArray(generatorOptions)) {
        throw new Crash('Generator function is required if dependencies are defined', {
          attributeDependencies: generatorOptions,
        });
      }
      _dependencies = undefined;
      _builder = this._ReturnFunction<H>(generatorOptions);
    } else {
      if (Array.isArray(generatorOptions)) {
        _dependencies = generatorOptions;
        _builder = this._ReturnFunction(generator);
      } else {
        throw new Crash('Dependencies must be an array', {
          attributeDependencies: generatorOptions,
        });
      }
    }
    return { dependencies: _dependencies, builder: _builder };
  }
  /**
   * Generate wrong data, excluding the correct data type
   * @param type - type of good data
   */
  private _wrongData(type: string): any {
    const _typeof: string[] = [
      'undefined',
      'boolean',
      'number',
      'string',
      'object',
      'symbol',
      'bigint',
      'function',
    ].filter(entry => entry !== type);
    const selected = this._chance.pickone(_typeof);
    switch (selected) {
      case 'undefined':
        return undefined;
      case 'object':
        return undefined;
      case 'boolean':
        return this._chance.bool();
      case 'number':
        if (this._chance.bool()) {
          return this._chance.floating();
        } else {
          return this._chance.natural();
        }
      case 'string':
        return this._chance.string();
      default:
        return null;
    }
  }
  /**
   * Create an object with standard Attributes from a key-value pairs object
   * @param attributes - object containing attribute override key value pairs
   */
  private _convertToAttributes(attributes: { [K in keyof T]?: T[K] }): {
    [K in keyof T]?: Entry<T>;
  } {
    const attrs: { [K in keyof T]?: Entry<T> } = {};
    for (const attr in attributes) {
      attrs[attr] = { dependencies: undefined, builder: () => attributes[attr] };
    }
    return attrs;
  }
}
