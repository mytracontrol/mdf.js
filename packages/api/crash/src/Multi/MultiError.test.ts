/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { v4 } from 'uuid';
import { Crash } from '../Crash/CrashError';
import { CONFIG_MAX_ERROR_MESSAGE_LENGTH } from '../const';
import { Multi } from './MultiError';
const uuidTest = v4();
const causes: Array<Crash | Error> = [];
for (let i = 0; i < 5; i++) {
  causes.push(new Crash('Crash Error', uuidTest, { name: 'ValidationError' }));
}
describe('In #Multi class the ', () => {
  describe('constructor ', () => {
    it('Should create an instance with (message) parameter such that: name=Multi, cause=undefined, info=undefined, message=Example', () => {
      const errorTest = new Multi('Example', uuidTest);
      expect(errorTest.name).toEqual('MultiError');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.causes).toBeUndefined();
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, name) parameter such that: name=ERROR_TYPE, cause=undefined, info=undefined, message=Example', () => {
      const errorTest = new Multi('Example', uuidTest, {
        name: 'ERROR_TYPE',
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.causes).toBeUndefined();
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, name, info) parameter such that: name=ERROR_TYPE, cause=undefined, info=objectTest, message=Example', () => {
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Multi('Example', uuidTest, {
        name: 'ERROR_TYPE',
        info: objectTest,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.causes).toBeUndefined();
      expect(errorTest.info).toEqual(objectTest);
    });
    it('Should create an instance with (message, name, error) parameter such that: name=ERROR_TYPE, cause=Cause, info=undefined, message=Example', () => {
      const cause = new Error('Cause');
      const errorTest = new Multi('Example', uuidTest, {
        name: 'ERROR_TYPE',
        causes: cause,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.causes?.length).toEqual(1);
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, name, causes) parameter such that: name=ERROR_TYPE, cause=cause[0], causes= causes, info=undefined, message=Example', () => {
      const errorTest = new Multi('Example', uuidTest, {
        name: 'ERROR_TYPE',
        causes,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.causes?.length).toEqual(5);
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toEqual(causes[0]);
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, name, error, info) parameter such that: name=ERROR_TYPE, cause=Cause, info=objectTest, message=Example', () => {
      const cause = new Error('Cause');
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Multi('Example', uuidTest, {
        name: 'ERROR_TYPE',
        causes: cause,
        info: objectTest,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toEqual(cause);
      expect(errorTest.info).toEqual(objectTest);
    });
    it('Should create an instance with (message, name, causes, info) parameter such that: name=ERROR_TYPE, cause=cause[0], causes=causes, info=objectTest, message=Example', () => {
      const cause = new Error('Cause');
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Multi('Example', uuidTest, {
        name: 'ERROR_TYPE',
        causes,
        info: objectTest,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.causes?.length).toEqual(5);
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toEqual(causes[0]);
      expect(errorTest.info).toEqual(objectTest);
    });
    it('Should create an instance with (message, error) parameter such that: name=Crash, cause=Cause, info=undefined, message=Example', () => {
      const cause = new Crash('Cause', uuidTest);
      const errorTest = new Multi('Example', uuidTest, { causes: cause });
      expect(errorTest.name).toEqual('MultiError');
      expect(errorTest.message).toEqual('Example');
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toEqual(cause);
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, causes) parameter such that: name=Crash, cause=cause[0], causes=causes, info=undefined, message=Example', () => {
      const errorTest = new Multi('Example', uuidTest, { causes });
      expect(errorTest.name).toEqual('MultiError');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.causes?.length).toEqual(5);
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toEqual(causes[0]);
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, error, info) parameter such that: name=Crash, cause=Cause, info=objectTest, message=Example', () => {
      const cause = new Crash('Cause', uuidTest);
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Multi('Example', uuidTest, {
        causes: cause,
        info: objectTest,
      });
      expect(errorTest.name).toEqual('MultiError');
      expect(errorTest.message).toEqual('Example');
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toEqual(cause);
      expect(errorTest.info).toEqual(objectTest);
    });
    it('Should create an instance with (message, causes, info) parameter such that: name=Crash, cause=cases[0], causes=causes, info=objectTest, message=Example', () => {
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Multi('Example', uuidTest, {
        causes,
        info: objectTest,
      });
      expect(errorTest.name).toEqual('MultiError');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.causes?.length).toEqual(5);
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toEqual(causes[0]);
      expect(errorTest.info).toEqual(objectTest);
    });
    it('Should throw a Crash error if message!=string', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Multi(5, uuidTest);
      };
      expect(test).toThrowError('Message parameter must be a string');
    });
    it(`Should truncate the message if message is to large (>${CONFIG_MAX_ERROR_MESSAGE_LENGTH})`, () => {
      const error = new Crash('o'.padEnd(CONFIG_MAX_ERROR_MESSAGE_LENGTH + 1, 'o'), uuidTest);
      expect(error.message.length).toEqual(CONFIG_MAX_ERROR_MESSAGE_LENGTH);
      expect(error.message).toContain('...too long error');
    });
    it('Should throw a Crash error if name!=string', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Multi('Error', uuidTest, { name: 5 });
      };
      expect(test).toThrowError('Parameter name must a string');
    });
    it('Should throw a Crash error if the UUID is not valid', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Multi('Error', 5, new Error(), {}, 'tooMuch');
      };
      expect(test).toThrowError('uuid parameter must be an string and RFC 4122 based');
    });
    it('Should throw a Crash error if the causes is not an Array', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Multi('Error', uuidTest, { causes: 1 });
      };
      expect(test).toThrowError('Options[causes] must be an array of Error/Crash');
    });
    it('Should throw a Crash error if the causes are not error or Crash', () => {
      //@ts-ignore - Test environment
      causes.push(5);
      const test = () => {
        new Multi('Error', uuidTest, { causes });
      };
      expect(test).toThrowError('Options[causes] must be an array of Error/Crash');
      causes.pop();
    });
  });
  describe('methods ', () => {
    const query = { query: 'fake' };
    const request = { request: 'fake' };
    const endpoint = { method: 'get' };
    const controllerCrashError = new Multi('Getting', uuidTest, {
      name: 'ControllerError',
      causes,
      info: endpoint,
    });
    beforeAll(done => {
      causes.push(new Error('Regular Error'));
      done();
    });
    afterAll(done => {
      causes.pop();
      done();
    });
    it('isMulti return true', () => {
      const errorTest = new Multi('Example', uuidTest);
      expect(errorTest.isMulti).toBeTruthy();
    });
    it('uuid return the uuid', () => {
      const errorTest = new Multi('Example', uuidTest);
      expect(errorTest.uuid).toEqual(uuidTest);
    });
    it('causes return undefined if there is no cause', () => {
      const errorTest = new Multi('Example', uuidTest);
      expect(errorTest.causes).toBeUndefined();
    });
    it('causes return an Error if there is the cause is an error', () => {
      const errorCause = new Error('Cause');
      const errorTest = new Multi('Example', uuidTest, { causes: errorCause });
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toBeInstanceOf(Error);
      //@ts-ignore - Test environment
      expect(errorTest.causes[0].name).toEqual('Error');
      //@ts-ignore - Test environment
      expect(errorTest.causes[0].message).toEqual('Cause');
    });
    it('causes return an Error if there is the cause is an error created by causes', () => {
      const errorTest = new Multi('Example', uuidTest, { causes });
      //@ts-ignore - Test environment
      expect(errorTest.causes[0]).toBeInstanceOf(Crash);
      //@ts-ignore - Test environment
      expect(errorTest.causes[0].name).toEqual('ValidationError');
      //@ts-ignore - Test environment
      expect(errorTest.causes[0].message).toEqual('Crash Error');
    });
    it('info return undefined if there is no info', () => {
      const errorCause = new Error('Cause');
      const errorTest = new Multi('Example', uuidTest, { causes: errorCause });
      expect(errorTest.info).toBeUndefined();
    });
    it('info return info if there is info', () => {
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorCause = new Error('Cause');
      const errorTest = new Multi('Example', uuidTest, {
        causes: errorCause,
        info: objectTest,
      });
      expect(errorTest.info).toEqual(objectTest);
    });
    it('toString() return a string with "name: message"', () => {
      const errorTest = new Multi('Example', uuidTest);
      expect(errorTest.toString()).toEqual('MultiError: Example');
    });
    it('trace() return a string with "name: message; caused by name: message; caused by ..."', () => {
      const str = [
        'ValidationError: Crash Error',
        'ValidationError: Crash Error',
        'ValidationError: Crash Error',
        'ValidationError: Crash Error',
        'ValidationError: Crash Error',
        'Error: Regular Error',
      ];
      expect(controllerCrashError.trace()).toEqual(str);
    });
    it('findCauseByName() should find a cause when this cause exists', () => {
      const cause = controllerCrashError.findCauseByName('ValidationError');
      expect(cause).toBeInstanceOf(Crash);
      expect(cause?.name).toEqual('ValidationError');
      expect(cause?.message).toEqual('Crash Error');
    });
    it('findCauseByName() should not find a cause when this cause no exists in a long nested chain', () => {
      const cause = controllerCrashError.findCauseByName('no');
      expect(cause).toBeUndefined();
    });
    it('findCauseByName() should not find a cause when this cause no exists in a single error', () => {
      const errorTest = new Multi('Error', uuidTest);
      const cause = errorTest.findCauseByName('no');
      expect(cause).toBeUndefined();
    });
    it('hasCauseWithName() should return a true when try to find a cause and this cause exists', () => {
      const cause = controllerCrashError.hasCauseWithName('ValidationError');
      expect(cause).toBeTruthy();
    });
    it('hasCauseWithName() should return a false when try to find a cause and this cause exists', () => {
      const cause = controllerCrashError.hasCauseWithName('no');
      expect(cause).toBeFalsy();
    });
    it('fullStack() should return the complete trace of the error sequence in a long nested chain', () => {
      const stack = controllerCrashError.fullStack();
      expect(stack).toContain('ControllerError');
      expect(stack).toContain('ValidationError');
    });
    it('fullStack() should return the complete trace of the error sequence in a single error', () => {
      const errorTest = new Multi('Error', uuidTest);
      const stack = errorTest.fullStack();
      expect(stack).toContain('MultiError');
    });
    it('push() should add a new error to causes', () => {
      const errorTest = new Multi('Error', uuidTest, { causes });
      errorTest.push(new Error('Regular Error'));
      expect(errorTest.causes?.length).toEqual(7);
    });
    it('pop() should remove a error in causes', () => {
      const errorTest = new Multi('Error', uuidTest, { causes });
      const dropError = errorTest.pop();
      expect(errorTest.causes?.length).toEqual(6);
      expect(dropError).toBeInstanceOf(Error);
    });
    it('toJSON() should return a JSON well formatted', () => {
      const errorTest = new Multi('Error', uuidTest, { causes });
      const erroObject = errorTest.toJSON();
      expect(erroObject).toEqual({
        name: 'MultiError',
        message: 'Error',
        trace: [
          'ValidationError: Crash Error',
          'ValidationError: Crash Error',
          'ValidationError: Crash Error',
          'ValidationError: Crash Error',
          'ValidationError: Crash Error',
          'Error: Regular Error',
        ],
        timestamp: errorTest.date.toISOString(),
        subject: 'common',
        uuid: uuidTest,
        info: undefined,
      });
    });
    it('size should return the size of a multi error', () => {
      const errorTestZero = new Multi('Error', uuidTest);
      const errorTestOne = new Multi('Error', uuidTest);
      errorTestOne.push(new Error());
      expect(errorTestOne.size).toEqual(1);
      expect(errorTestZero.size).toEqual(0);
    });
  });
});

