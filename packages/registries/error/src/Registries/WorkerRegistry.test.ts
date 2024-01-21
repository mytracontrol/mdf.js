/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Crash } from '@mdf.js/crash';
import { undoMocks } from '@mdf.js/utils';
import { WorkerRegistry } from '.';
import { RegisterMessage, RegisterMessageType } from '../types';
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Registry #Worker', () => {
  describe('#Happy path', () => {
    afterEach(function () {
      jest.resetAllMocks();
      undoMocks();
    });
    beforeEach(function () {
      jest.resetAllMocks();
      undoMocks();
    });
    it(`Should respond to messages than come from master node informing with the errors`, done => {
      const registry = new WorkerRegistry();
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { subject: 'mySubject', date: new Date(10) },
      });
      registry.push(ownError);
      expect(registry.size).toEqual(1);
      expect(registry.errors).toEqual([ownError.toJSON()]);
      const mockSend = (message: RegisterMessage): boolean => {
        console.log(message);
        expect(message.requestId).toEqual(1);
        expect(message.type).toEqual(RegisterMessageType.RES);
        expect(message.errors).toEqual([ownError.toJSON()]);
        process.send = undefined;
        done();
        return true;
      };
      jest.spyOn(process, 'send').mockImplementation(mockSend);
      process.emit(
        'message',
        {
          type: RegisterMessageType.REQ,
          requestId: 1,
        },
        {}
      );
    }, 300);
    it(`Should clean the register when receive the order`, () => {
      const registry = new WorkerRegistry();
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { subject: 'mySubject', date: new Date(10) },
      });
      registry.push(ownError);
      expect(registry.size).toEqual(1);
      process.emit(
        'message',
        {
          type: RegisterMessageType.CLR_REQ,
        },
        {}
      );
      expect(registry.size).toEqual(0);
    }, 300);
    it(`Should create a valid instance of a master registry`, () => {
      const registry = new WorkerRegistry();
      expect(registry).toBeDefined();
      expect(registry.lastUpdate).toBeDefined();
      expect(registry.errors).toEqual([]);
      expect(registry.size).toEqual(0);
      expect(registry.clear.bind(registry)).not.toThrow();
    }, 300);
    it(`Should create a valid instance of a master registry with different options`, () => {
      const registry = new WorkerRegistry(-1);
      for (let index = 0; index < 101; index++) {
        registry.push(new Crash('test'));
      }
      registry.start();
      registry.stop();
      expect(registry.size).toEqual(100);
      registry.clear();
      expect(registry.size).toEqual(0);
    }, 300);
  });
});
// #endregion
