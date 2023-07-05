/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { v4 as uuidV4, v4 } from 'uuid';
import { Multi } from '../Multi';
import { CONFIG_MAX_ERROR_MESSAGE_LENGTH } from '../const';
import { Crash } from './CrashError';
const uuidTest = uuidV4();
const query = { query: 'fake' };
const request = { request: 'fake' };
const endpoint = { method: 'get' };
const sourceError = new RangeError('Ranged');
const modelCrashError = new Crash('Reading', uuidTest, {
  name: 'ModelError',
  cause: sourceError,
  info: query,
});
const serviceCrashError = new Crash('Requesting', uuidTest, {
  name: 'ServiceError',
  cause: modelCrashError,
  info: request,
});
const controllerCrashError = new Crash('Getting', uuidTest, {
  name: 'ControllerError',
  cause: serviceCrashError,
  info: endpoint,
});
const eval1Error = new Crash('Evaluation1 Error', uuidTest);
const eval2Error = new Crash('Evaluation2 Error', uuidTest);
const multiError = new Multi('Evaluation Errors', uuidTest, {
  causes: [eval1Error, eval2Error],
});
const wrappedEvaluationError = new Crash('Wrapped Evaluation Error', uuidTest, {
  cause: multiError,
});
// #endregion
// *************************************************************************************************
// #region Tests
describe('#Crash error', () => {
  describe('#Happy path ', () => {
    it('Should create an instance with (message) parameter such that: name=Crash, cause=undefined, info=undefined, message=Example', () => {
      const errorTest = new Crash('Example', uuidTest);
      expect(errorTest.date).toBeDefined();
      expect(errorTest.name).toEqual('CrashError');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeUndefined();
      expect(errorTest.info).toBeUndefined();
      expect(errorTest.toJSON()).toEqual({
        timestamp: errorTest.date.toISOString(),
        name: 'CrashError',
        message: 'Example',
        cause: undefined,
        info: undefined,
        uuid: errorTest.uuid,
        subject: 'common',
        trace: ['CrashError: Example'],
      });
    });
    it('Should create an instance with (message, name) parameter such that: name=ERROR_TYPE, cause=undefined, info=undefined, message=Example and without uuid', () => {
      const errorTest = new Crash('Example', {
        name: 'ERROR_TYPE',
        info: { date: new Date(10) },
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeUndefined();
      expect(errorTest.info).toBeUndefined();
      expect(errorTest.toJSON()).toEqual({
        timestamp: errorTest.date.toISOString(),
        name: 'ERROR_TYPE',
        message: 'Example',
        cause: undefined,
        info: undefined,
        uuid: errorTest.uuid,
        subject: 'common',
        trace: ['ERROR_TYPE: Example'],
      });
      //@ts-ignore - Test environment
      const otherErrorTest = new Crash('Example', undefined, {
        name: 'ERROR_TYPE',
        info: { date: new Date(10) },
      });
      expect(otherErrorTest.name).toEqual('ERROR_TYPE');
      expect(otherErrorTest.message).toEqual('Example');
      expect(otherErrorTest.cause).toBeUndefined();
      expect(otherErrorTest.info).toBeUndefined();
      expect(otherErrorTest.toJSON()).toEqual({
        timestamp: otherErrorTest.date.toISOString(),
        name: 'ERROR_TYPE',
        message: 'Example',
        cause: undefined,
        info: undefined,
        uuid: otherErrorTest.uuid,
        subject: 'common',
        trace: ['ERROR_TYPE: Example'],
      });
    });
    it('Should create an instance with (message, name) parameter such that: name=ERROR_TYPE, cause=undefined, info=undefined, message=Example', () => {
      const errorTest = new Crash('Example', uuidTest, {
        name: 'ERROR_TYPE',
        info: { date: new Date(10), subject: 'test' },
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeUndefined();
      expect(errorTest.info).toBeUndefined();
      expect(errorTest.toJSON()).toEqual({
        timestamp: errorTest.date.toISOString(),
        name: 'ERROR_TYPE',
        message: 'Example',
        cause: undefined,
        info: undefined,
        uuid: errorTest.uuid,
        subject: 'test',
        trace: ['ERROR_TYPE: Example'],
      });
    });
    it('Should create an instance with (message, name, info) parameter such that: name=ERROR_TYPE, cause=undefined, info=objectTest, message=Example', () => {
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Crash('Example', uuidTest, {
        name: 'ERROR_TYPE',
        info: objectTest,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeUndefined();
      expect(errorTest.info).toEqual(objectTest);
    });
    it('Should create an instance with (message, name, info) parameter such that: name=ERROR_TYPE, cause=undefined, info=objectTest, message=Example', () => {
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Crash('Example', uuidTest, {
        name: 'ERROR_TYPE',
        info: objectTest,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeUndefined();
      expect(errorTest.info).toEqual(objectTest);
    });
    it('Should create an instance with (message, name, error) parameter such that: name=ERROR_TYPE, cause=Cause, info=undefined, message=Example', () => {
      const cause = new Error('Cause');
      const errorTest = new Crash('Example', uuidTest, { name: 'ERROR_TYPE', cause: cause });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeInstanceOf(Error);
      expect(errorTest.cause?.name).toEqual('Error');
      expect(errorTest.cause?.message).toEqual('Cause');
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, name, error, info) parameter such that: name=ERROR_TYPE, cause=Cause, info=objectTest, message=Example', () => {
      const cause = new Error('Cause');
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Crash('Example', uuidTest, {
        name: 'ERROR_TYPE',
        cause: cause,
        info: objectTest,
      });
      expect(errorTest.name).toEqual('ERROR_TYPE');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeInstanceOf(Error);
      expect(errorTest.cause?.name).toEqual('Error');
      expect(errorTest.cause?.message).toEqual('Cause');
      expect(errorTest.info).toEqual(objectTest);
      expect(errorTest.toJSON()).toEqual({
        info: {
          cause: undefined,
          date: undefined,
          par1: 'info1',
          par2: 'info2',
          subject: undefined,
        },
        message: 'Example',
        name: 'ERROR_TYPE',
        subject: 'common',
        timestamp: errorTest.date.toISOString(),
        trace: ['ERROR_TYPE: Example', 'caused by Error: Cause'],
        uuid: errorTest.uuid,
      });
    });
    it('Should create an instance with (message, error) parameter such that: name=Crash, cause=Cause, info=undefined, message=Example', () => {
      const cause = new Crash('Cause', uuidTest);
      const errorTest = new Crash('Example', uuidTest, { cause });
      expect(errorTest.name).toEqual('CrashError');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeInstanceOf(Error);
      expect(errorTest.cause?.name).toEqual('CrashError');
      expect(errorTest.cause?.message).toEqual('Cause');
      expect(errorTest.info).toBeUndefined();
    });
    it('Should create an instance with (message, error, info) parameter such that: name=Crash, cause=Cause, info=objectTest, message=Example', () => {
      const cause = new Crash('Cause', uuidTest);
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorTest = new Crash('Example', uuidTest, { cause, info: objectTest });
      expect(errorTest.name).toEqual('CrashError');
      expect(errorTest.message).toEqual('Example');
      expect(errorTest.cause).toBeInstanceOf(Error);
      expect(errorTest.cause?.name).toEqual('CrashError');
      expect(errorTest.cause?.message).toEqual('Cause');
      expect(errorTest.info).toEqual(objectTest);
    });
    it(`Should truncate the message if message is to large (>${CONFIG_MAX_ERROR_MESSAGE_LENGTH})`, () => {
      const error = new Crash('o'.padEnd(CONFIG_MAX_ERROR_MESSAGE_LENGTH + 1, 'o'), uuidTest);
      expect(error.message.length).toEqual(CONFIG_MAX_ERROR_MESSAGE_LENGTH);
      expect(error.message).toContain('...too long error');
    });
    it('isCrash method should return true', () => {
      const errorTest = new Crash('Example', uuidTest);
      expect(errorTest.isCrash).toBeTruthy();
    });
    it('uuid method should return the uuid', () => {
      const errorTest = new Crash('Example', uuidTest);
      expect(errorTest.uuid).toEqual(uuidTest);
    });
    it('cause method should return undefined if there is no cause', () => {
      const errorTest = new Crash('Example', uuidTest);
      expect(errorTest.cause).toBeUndefined();
    });
    it('cause method should return an Error if there is the cause is an error', () => {
      const errorCause = new Error('Cause');
      const errorTest = new Crash('Example', uuidTest, { cause: errorCause });
      expect(errorTest.cause).toBeInstanceOf(Error);
      expect(errorTest.cause?.name).toEqual('Error');
      expect(errorTest.cause?.message).toEqual('Cause');
    });
    it('info method should return undefined if there is no info', () => {
      const errorCause = new Error('Cause');
      const errorTest = new Crash('Example', uuidTest, { cause: errorCause });
      expect(errorTest.info).toBeUndefined();
    });
    it('info method should return info if there is info', () => {
      const objectTest = {
        par1: 'info1',
        par2: 'info2',
      };
      const errorCause = new Error('Cause');
      const errorTest = new Crash('Example', uuidTest, {
        cause: errorCause,
        info: objectTest,
      });
      expect(errorTest.info).toEqual(objectTest);
    });
    it('toString() method should return a string with "name: message"', () => {
      const errorTest = new Crash('Example', uuidTest);
      expect(errorTest.toString()).toEqual('CrashError: Example');
    });
    it('trace() method should return a string with "name: message; caused by name: message; caused by ..."', () => {
      const str = [
        'ControllerError: Getting',
        'caused by ServiceError: Requesting',
        'caused by ModelError: Reading',
        'caused by RangeError: Ranged',
      ];
      expect(controllerCrashError.trace()).toEqual(str);
    });
    it('trace() method should return a string with "name: message; failed by: name: message; failed by ... if there are Multi errors in the stack"', () => {
      const str = [
        'CrashError: Wrapped Evaluation Error',
        'caused by MultiError: Evaluation Errors',
        'failed with CrashError: Evaluation1 Error',
        'failed with CrashError: Evaluation2 Error',
      ];
      expect(wrappedEvaluationError.trace()).toEqual(str);
    });
    it('findCauseByName() should find a cause when this cause exists', () => {
      const cause = controllerCrashError.findCauseByName('ModelError');
      expect(cause).toBeInstanceOf(Crash);
      expect(cause?.name).toEqual('ModelError');
      expect(cause?.message).toEqual('Reading');
    });
    it('findCauseByName() should not find a cause when this cause no exists in a long nested chain', () => {
      const cause = controllerCrashError.findCauseByName('no');
      expect(cause).toBeUndefined();
    });
    it('findCauseByName() should not find a cause when this cause no exists in a single error', () => {
      const errorTest = new Crash('Error', uuidTest);
      const cause = errorTest.findCauseByName('no');
      expect(cause).toBeUndefined();
    });
    it('hasCauseWithName() should return a true when try to find a cause and this cause exists', () => {
      const cause = controllerCrashError.hasCauseWithName('ModelError');
      expect(cause).toBeTruthy();
    });
    it('hasCauseWithName() should return a false when try to find a cause and this cause exists', () => {
      const cause = controllerCrashError.hasCauseWithName('no');
      expect(cause).toBeFalsy();
    });
    it('fullStack() should return the complete trace of the error sequence in a long nested chain', () => {
      const stack = controllerCrashError.fullStack();
      expect(stack).toContain('ControllerError');
      expect(stack).toContain('ModelError');
      expect(stack).toContain('ServiceError');
      expect(stack).toContain('RangeError');
    });
    it('fullStack() should return the complete trace of the error sequence in a single error', () => {
      const errorTest = new Crash('Error', uuidTest);
      const stack = errorTest.fullStack();
      expect(stack).toContain('CrashError');
    });
    it('Should pass the test if generate an Crash object from a Error', () => {
      const error = Crash.from(new Error('test'));
      expect(error.message).toEqual('test');
      expect(error).toBeInstanceOf(Crash);
    });
    it('Should pass the test if generate an Crash object from a Error with a Name', () => {
      const rawError = new Error('test');
      rawError.name = 'TestError';
      const error = Crash.from(rawError);
      expect(error.name).toEqual('TestError');
      expect(error.message).toEqual('test');
      expect(error).toBeInstanceOf(Crash);
    });
    it('Should pass the test if generate an Crash object from a Crash error', () => {
      const error = Crash.from(new Crash('test', v4()));
      expect(error.message).toEqual('test');
      expect(error).toBeInstanceOf(Crash);
    });
    it('Should pass the test if generate an Crash object from a string', () => {
      const error = Crash.from('test');
      expect(error.message).toEqual('test');
      expect(error).toBeInstanceOf(Crash);
    });
    it('Should pass the test if generate an Crash object from a object with a property `message`', () => {
      const error = Crash.from({ message: 'test' });
      expect(error.message).toEqual('test');
      expect(error).toBeInstanceOf(Crash);
    });
    it('Should pass the test if generate an Crash object from a non valid type', () => {
      const error = Crash.from(3);
      expect(error.message).toEqual('Unexpected error type');
      expect(error).toBeInstanceOf(Crash);
    });
  });
  describe('#Sad path', () => {
    it('Should throw a Crash error if message!=string', () => {
      const test = () => {
        //@ts-ignore Test environment
        new Crash(5, uuidTest);
      };
      expect(test).toThrowError('Message parameter must be a string');
    });
    it('Should throw a Crash error if name!=string', () => {
      const test = () => {
        //@ts-ignore Test environment
        new Crash('Error', uuidTest, { name: 5 });
      };
      expect(test).toThrowError('Parameter name must a string');
    });
    it('Should throw a Crash error if cause!=Error | Crash', () => {
      const test = () => {
        //@ts-ignore Test environment
        new Crash('Error', uuidTest, { cause: 5 });
      };
      expect(test).toThrowError('Parameter cause must be an Error/Crash');
    });
    it('Should throw a Crash error if the UUID is not valid', () => {
      const test = () => {
        //@ts-ignore Test environment
        new Crash('Error', 5, new Error(), {}, 'tooMuch');
      };
      expect(test).toThrowError('uuid parameter must be an string and RFC 4122 based');
    });
    it('Should throw a Crash error if options!=object', () => {
      const test = () => {
        //@ts-ignore Test environment
        new Crash('Error', uuidTest, []);
      };
      expect(test).toThrowError('options parameter must be an object');
    });
    it('Should throw a Crash error if options.info.date!=Date | undefined', () => {
      const test = () => {
        //@ts-ignore Test environment
        new Crash('Error', uuidTest, { info: { date: 5 } });
      };
      expect(test).toThrowError('Option Parameter info.date, if its setted, must be a Date');
    });
    it('Should throw a Crash error if options.info.subject!=string', () => {
      const test = () => {
        //@ts-ignore Test environment
        new Crash('Error', uuidTest, { info: { subject: 5 } });
      };
      expect(test).toThrowError('Option Parameter info.subject, if it is setted, must be a string');
    });
  });
});
