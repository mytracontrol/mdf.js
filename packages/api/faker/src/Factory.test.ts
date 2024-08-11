/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Factory } from './Factory';
describe('#Faker #package', () => {
  describe('#Happy path', () => {
    it('Should be able to create a new instance', () => {
      expect(new Factory()).toBeInstanceOf(Factory);
    });
    it('Should be able to create a new instance and add some attributes one by one with default values', () => {
      const factory = new Factory();
      factory.attr('name', 'John');
      factory.attr('age', 24);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ name: 'John', age: 24 });
    });
    it('Should be able to create a new instance and add some attributes one by one with custom values', () => {
      const factory = new Factory();
      factory.attr('name', 'John');
      factory.attr('age');
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build({ name: 'Jane', age: 24 })).toEqual({ name: 'Jane', age: 24 });
    });
    it('Should be able to create a new instance and add some attributes one by one with generators', () => {
      const factory = new Factory();
      factory.attr('name', () => 'John');
      factory.attr('age', () => 24);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ name: 'John', age: 24 });
    });
    it('Should be able to create a new instance and add some attributes one by one with generators and custom values', () => {
      const factory = new Factory();
      factory.attr('name', () => 'John');
      factory.attr('age', () => 24);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build({ name: 'Jane' })).toEqual({ name: 'Jane', age: 24 });
    });
    it('Should be able to create a new instance and add some attributes in bulk with default values', () => {
      const factory = new Factory();
      factory.attrs({ name: 'John', age: 24 });
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ name: 'John', age: 24 });
    });
    it(`Should be able to create a new instance and add some attributes based in options`, () => {
      const factory = new Factory();
      factory.option('name', () => 'John');
      factory.attr('surname', () => 'Doe');
      factory.attr('completeName', ['name', 'surname'], (name, surname) => `${name} ${surname}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ surname: 'Doe', completeName: 'John Doe' });
    });
    it(`Should be able to create a new instance and add some attributes based in options with custom values`, () => {
      const factory = new Factory();
      factory.option('name', () => 'John');
      factory.attr('surname', () => 'Doe');
      factory.attr('completeName', ['name', 'surname'], (name, surname) => `${name} ${surname}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build({}, { name: 'Jane' })).toEqual({
        surname: 'Doe',
        completeName: 'Jane Doe',
      });
    });
    it(`Should be able to create a new instance and add some sequence attributes`, () => {
      const factory = new Factory();
      factory.sequence('id');
      factory.attr('name', ['id'], id => `John ${id}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ id: 1, name: 'John 1' });
      expect(factory.build()).toEqual({ id: 2, name: 'John 2' });
    });
    it(`Should be able to create a new instance and add some sequence attributes and reset the sequence`, () => {
      const factory = new Factory();
      factory.sequence('id');
      factory.attr('name', ['id'], id => `John ${id}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ id: 1, name: 'John 1' });
      expect(factory.build()).toEqual({ id: 2, name: 'John 2' });
      factory.reset();
      expect(factory.build()).toEqual({ id: 1, name: 'John 1' });
      expect(factory.build()).toEqual({ id: 2, name: 'John 2' });
    });
    it(`Should be able to create a new instance and add some sequence attributes with custom values`, () => {
      const factory = new Factory();
      factory.sequence('id');
      factory.attr('name', ['id'], id => `John ${id}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build({ id: 3 })).toEqual({ id: 3, name: 'John 3' });
      expect(factory.build({ id: 4 })).toEqual({ id: 4, name: 'John 4' });
    });
    it(`Should be able to create a new instance and add some sequence attributes with custom generator`, () => {
      const factory = new Factory();
      factory.sequence('id', i => i + 2);
      factory.attr('name', ['id'], id => `John ${id}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ id: 2, name: 'John 2' });
      expect(factory.build()).toEqual({ id: 4, name: 'John 4' });
    });
    it(`Should be able to create a new instance and add some sequence attributes with custom generator with dependencies`, () => {
      const factory = new Factory();
      factory.option('seed', () => 10);
      factory.sequence('id', ['seed'], (i, seed) => seed + i + 2);
      factory.attr('name', ['id'], id => `John ${id}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ id: 12, name: 'John 12' });
      expect(factory.build()).toEqual({ id: 24, name: 'John 24' });
    });
    it(`Should be able to create a new instance and modify the final result object with after callback`, () => {
      const factory = new Factory<{ name: string }>();
      factory.option('times', () => 2);
      factory.attr('name', 'John');
      factory.after((object, options) => {
        object.name = `${object.name} ${options['times']}`;
        return object;
      });
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({ name: 'John 2' });
    });
    it(`Should be able to create several object with 'buildList' method of a instance`, () => {
      const factory = new Factory();
      factory.option('times', () => 2);
      factory.attr('name', ['times'], times => `John ${times}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.buildList(2)).toEqual([{ name: 'John 2' }, { name: 'John 2' }]);
    });
    it(`Should be able to create several object with 'buildList' method of a instance with custom values`, () => {
      const factory = new Factory();
      factory.option('times', () => 2);
      factory.attr('name', ['times'], times => `John ${times}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.buildList(2, { name: 'Jane' })).toEqual([{ name: 'Jane' }, { name: 'Jane' }]);
    });
    it(`Should be able to create several object with 'buildList' method of a instance with custom values and options`, () => {
      const factory = new Factory();
      factory.option('times', () => 2);
      factory.attr('name', ['times'], times => `John ${times}`);
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.buildList(2, {}, { times: 3 })).toEqual([
        { name: 'John 3' },
        { name: 'John 3' },
      ]);
    });
    it(`Should be able to extend a factory instance with new attributes and options`, () => {
      const factory = new Factory();
      factory.option('times', () => 2);
      factory.attr('name', ['times'], times => `John ${times}`);
      const extendedFactory = new Factory().extend(factory);
      extendedFactory.option('times', () => 3);
      extendedFactory.attr('surname', () => 'Doe');
      expect(extendedFactory).toBeInstanceOf(Factory);
      expect(extendedFactory.build()).toEqual({ name: 'John 3', surname: 'Doe' });
    });
    it(`Should be able to generate wrong data if the likelihood is not 100`, () => {
      const factory = new Factory();
      factory.option('seed', () => 10);
      factory.attr('surname', 'Doe');
      factory.attr('age', ['seed'], seed => seed + 14);
      const result = { surname: 'Doe', age: 24 };
      expect(factory).toBeInstanceOf(Factory);
      for (let i = 0; i < 100; i++) {
        expect(factory.build({}, { likelihood: 100 })).toEqual(result);
        expect(factory.build({}, { likelihood: 0 })).not.toEqual(result);
      }
    });
    it(`Should be possible to generate complex instances with several nested objects that are generated by other factories`, () => {
      const johnFactory = new Factory();
      johnFactory.attr('name', () => 'John');
      johnFactory.attr('surname', () => 'Doe');
      johnFactory.attr('age', () => 24);
      const janeFactory = new Factory();
      janeFactory.attr('name', () => 'Jane');
      janeFactory.attr('surname', () => 'Doe');
      janeFactory.attr('age', () => 24);

      const userFactory = new Factory();
      userFactory.option('name', 'John');
      userFactory.after((object, options) => {
        if (options['name'] === 'John') {
          return johnFactory.build();
        }
        return janeFactory.build();
      });

      const addressFactory = new Factory();
      addressFactory.option('name', 'John');
      addressFactory.attr('street', ['name'], name => `${name} Street`);
      addressFactory.attr('number', ['name'], name => `${name} Number`);
      addressFactory.attr('city', ['country'], country => `${country} City`);
      addressFactory.attr('country', () => 'Fake Country');

      const factory = new Factory();
      factory.option('name', 'John');
      factory.attr('user', ['name'], name => userFactory.build({}, { name }));
      factory.attr('address', ['user'], user => addressFactory.build({}, { name: user.surname }));
      expect(factory).toBeInstanceOf(Factory);
      expect(factory.build()).toEqual({
        user: { name: 'John', surname: 'Doe', age: 24 },
        address: {
          street: 'Doe Street',
          number: `Doe Number`,
          city: 'Fake Country City',
          country: 'Fake Country',
        },
      });
    });
  });
  describe('#Sad path', () => {
    it('Should throw an error if no attributes are set', () => {
      const factory = new Factory();
      // @ts-expect-error Testing purposes
      expect(() => factory.attr('a', 9, () => 'John')).toThrowError(
        'Dependencies must be an array'
      );
    });
    it('Should throw an error if the dependencies are not an array', () => {
      const factory = new Factory();
      // @ts-expect-error Testing purposes
      expect(() => factory.attr('a', 9, () => 'John')).toThrowError(
        'Dependencies must be an array'
      );
    });
    it('Should throw an error if the dependencies are defined but the generator is not', () => {
      const factory = new Factory();
      expect(() => factory.attr('a', ['d'])).toThrowError(
        'Generator function is required if dependencies are defined'
      );
    });
    it('Should throw an error if likelihood options is not number', () => {
      const factory = new Factory();
      factory.option('name', () => 'John');
      factory.attr('surname', () => 'Doe');
      // @ts-expect-error Testing purposes
      expect(() => factory.build({}, { likelihood: 'a' })).toThrowError(
        'Likelihood must be a number between 0 and 100'
      );
      expect(() => factory.build({}, { likelihood: 101 })).toThrowError(
        'Likelihood must be a number between 0 and 100'
      );
      expect(() => factory.build({}, { likelihood: -1 })).toThrowError(
        'Likelihood must be a number between 0 and 100'
      );
    });
    it('Should throw an error if there is an dependency cycle', () => {
      const factory = new Factory();
      factory.attr('a', ['b'], () => 'John');
      factory.attr('b', ['a'], () => 'Doe');
      expect(() => factory.build()).toThrowError('Detect a dependency cycle: b -> a -> b');
    });
  });
});
