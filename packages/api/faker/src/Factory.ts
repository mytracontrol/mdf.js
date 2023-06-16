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
import _ from 'lodash';

/** Function type to create attributes */
type AttributeBuilder<T, K extends keyof T> = (...args: any) => T[K] | undefined;
/** Function type to create options */
type OptionsBuilder = (...args: any) => any;
type AttributeDependencies<T, K extends keyof T> = (K | string)[] | AttributeBuilder<T, K> | T[K];
/** Interface for options generation */
interface Option<T> {
  dependencies?: (keyof T | string)[];
  builder: OptionsBuilder;
}
/** Interface for attribute generation */
interface Attribute<T> {
  dependencies?: (keyof T | string)[];
  builder: AttributeBuilder<T, keyof T>;
}

/** Factory for building JavaScript objects, mostly useful for setting up test data */
export class Factory<T extends Record<string, any>> {
  /** Options for programmatic generation of attributes */
  private _opts: {
    [key: string]: Option<T>;
  };
  /** Attributes of this factory, based on a interface */
  private _attrs: {
    [K in keyof T]?: Attribute<T>;
  };
  /** Auto incrementing sequence attribute */
  private _seques: {
    [K in keyof T]?: number;
  };
  /** Callback function array */
  private readonly _callbacks: ((object: T, options: { [key: string]: any }) => T | void)[];
  /** Chance object for probabilistic wrong value generation */
  private readonly _chance;
  /** Create a new factory instance */
  public constructor() {
    this._opts = {};
    this._attrs = {};
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
  public attr<K extends keyof T>(attr: K): Factory<T>;
  /**
   * Define an attribute on this factory using a default value (e.g. a string or number)
   * @param attr - Name of attribute
   * @param defaultValue - Default value of attribute
   * @example
   * ```typescript
   * factory.attr('name', 'John Doe');
   * ```
   */
  public attr<K extends keyof T>(attr: K, defaultValue: T[K]): Factory<T>;
  /**
   * Define an attribute on this factory using a generator function
   * @param attr - Name of attribute
   * @param generator - Value generator function
   * @example
   * ```typescript
   * factory.attr('name', () => function() { return 'John Doe'; });
   * ```
   */
  public attr<K extends keyof T>(attr: K, generator: AttributeBuilder<T, K>): Factory<T>;
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
    dependencies: (K | string)[],
    generator: AttributeBuilder<T, K>
  ): Factory<T>;
  public attr<K extends keyof T>(
    attr: K,
    attributeDependencies?: AttributeDependencies<T, K>,
    generator?: AttributeBuilder<T, K>
  ): Factory<T> {
    this._attrs[attr] = this._SafeType(attributeDependencies, generator);
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
  public attrs(attributes: { [K in keyof T]: AttributeBuilder<T, K> | T[K] }): Factory<T> {
    for (const attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        this.attr(attr, this._ReturnFunction(attributes[attr]));
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
  public option(opt: string, defaultValue: any): Factory<T>;
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
  public option(opt: string, generator: OptionsBuilder): Factory<T>;
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
  public option(opt: string, dependencies: string[], generator: OptionsBuilder): Factory<T>;
  public option(
    opt: string,
    dependencies: string[] | OptionsBuilder | any,
    generator?: OptionsBuilder
  ): Factory<T> {
    this._opts[opt] = this._SafeType(dependencies, generator);
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
  public sequence<K extends keyof T>(attr: K): Factory<T>;
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
  public sequence<K extends keyof T>(attr: K, generator: AttributeBuilder<T, K>): Factory<T>;
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
    generator: AttributeBuilder<T, K>
  ): Factory<T>;
  public sequence<K extends keyof T>(
    attr: K,
    dependencies?: (K | string)[] | AttributeBuilder<T, K> | T[K],
    generator?: AttributeBuilder<T, K>
  ): Factory<T> {
    const _dependencies = dependencies || [];
    const _generator = generator || (i => i);
    const _attribute = this._SafeType(_dependencies, _generator);
    if (_attribute.dependencies === undefined) {
      _attribute.dependencies = [];
    }
    return this.attr(attr, _attribute.dependencies, () => {
      const args: any[] = [].slice.call(_attribute.builder.arguments);
      this._seques[attr] = (this._seques[attr] as number) + 1 || 1;
      args.unshift(this._seques[attr] as number);
      return _attribute.builder(...args);
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
  public after(callback: (object: T, options: { [key: string]: any }) => T | void): Factory<T> {
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
      throw new Crash('Error, likelihood must be a number between 0 and 100', {
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
        _attributes[attr] as Attribute<T>,
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
      const obj = callback(returnableObject as T, resolvedOptions);
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
  public extend<P extends T>(factory: Factory<T>): Factory<P> {
    Object.assign(this._attrs, factory._attrs);
    Object.assign(this._opts, factory._opts);
    this._callbacks.push(...factory._callbacks);
    return this as unknown as Factory<P>;
  }
  /** Reset all the sequences of this factory */
  public reset(): void {
    this._seques = {};
  }
  /**
   * Create an object with standard Options from a key-value pairs object
   * @param options - object containing option key value pairs
   */
  private _ConvertToOptions(options: { [key: string]: any }): { [key: string]: Option<T> } {
    const opts: { [key: string]: Option<T> } = {};
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
    meta: Attribute<T> | Option<T>,
    object: { [K in keyof T]?: T[K] },
    resolvedOptions: { [key: string]: any },
    attributes: { [K in keyof T]?: Attribute<T> },
    options: { [key: string]: Option<T> },
    stack: (keyof T | string)[],
    likelihood = 100
  ): any {
    if (!meta) {
      throw new Error('Error in factory build process');
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
    attributes: { [K in keyof T]?: Attribute<T> },
    options: { [key: string]: Option<T> },
    stack: (keyof T | string)[]
  ): any[] {
    return dependencies.map(dep => {
      if (stack.indexOf(dep) >= 0) {
        throw new Error(`Detect a dependency cycle: ${stack.concat([dep]).join(' -> ')}`);
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
          attributes[dep as keyof T] as Attribute<T>,
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
  private _ReturnFunction<K extends keyof T>(
    generator: AttributeBuilder<T, K> | T[K] | undefined
  ): AttributeBuilder<T, K> {
    if (generator instanceof Function) {
      return generator;
    } else {
      return () => generator;
    }
  }
  /**
   * Return a Attribute generator object from attribute function parameter
   * @param attributeDependencies - Dependency array
   * @param generator - Default value or generator function
   */
  private _SafeType<K extends keyof T>(
    attributeDependencies?: AttributeDependencies<T, K>,
    generator?: AttributeBuilder<T, K> | T[K]
  ): Attribute<T> {
    let _dependencies: (K | string)[] | undefined;
    let _builder: AttributeBuilder<T, K>;
    if (generator === undefined) {
      if (!Array.isArray(attributeDependencies)) {
        _dependencies = undefined;
        _builder = this._ReturnFunction(attributeDependencies);
      } else {
        throw new Crash('Generator function is required if dependencies are defined', {
          attributeDependencies,
        });
      }
    } else {
      if (Array.isArray(attributeDependencies)) {
        _dependencies = attributeDependencies;
        _builder = this._ReturnFunction(generator);
      } else {
        throw new Crash('Dependencies must be an array', { attributeDependencies });
      }
    }
    return { dependencies: _dependencies, builder: _builder };
  }
  /**
   * Generate wrong data, excluding the correct data type
   * @param type - type of good data
   */
  private _wrongData(type: string): any {
    const _typeof: string[] = ['undefined', 'boolean', 'number', 'string'].filter(
      entry => entry !== type
    );
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
    [K in keyof T]?: Attribute<T>;
  } {
    const attrs: { [K in keyof T]?: Attribute<T> } = {};
    for (const attr in attributes) {
      attrs[attr] = { dependencies: undefined, builder: () => attributes[attr] };
    }
    return attrs;
  }
}
