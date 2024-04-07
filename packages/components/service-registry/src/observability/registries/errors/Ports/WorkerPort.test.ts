/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Crash } from '@mdf.js/crash';
import { DebugLogger } from '@mdf.js/logger';
import { undoMocks } from '@mdf.js/utils';
import { WorkerPort } from '.';
import { Aggregator } from '../Aggregator';
import { RegisterMessage, RegisterMessageType } from '../types';
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const logger = new DebugLogger(`test`);
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Port #Worker', () => {
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
      const aggregator = new Aggregator(logger);
      const port = new WorkerPort(aggregator, logger);
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { subject: 'mySubject', date: new Date(10) },
      });
      aggregator.push(ownError);
      expect(aggregator.size).toEqual(1);
      expect(aggregator.errors).toEqual([ownError.toJSON()]);
      const mockSend = (message: RegisterMessage): boolean => {
        console.log(message);
        expect(message.requestId).toEqual(1);
        expect(message.type).toEqual(RegisterMessageType.RES);
        expect(message.errors).toEqual([ownError.toJSON()]);
        process.send = undefined;
        port.stop();
        done();
        return true;
      };
      jest.spyOn(process, 'send').mockImplementation(mockSend);
      port.start();
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
      const aggregator = new Aggregator(logger);
      const port = new WorkerPort(aggregator, logger);
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { subject: 'mySubject', date: new Date(10) },
      });
      aggregator.push(ownError);
      expect(aggregator.size).toEqual(1);
      port.start();
      process.emit(
        'message',
        {
          type: RegisterMessageType.CLR_REQ,
        },
        {}
      );
      expect(aggregator.size).toEqual(0);
      port.stop();
    }, 300);
  });
});
// #endregion
