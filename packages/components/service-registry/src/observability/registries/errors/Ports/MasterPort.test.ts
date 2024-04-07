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
import { mockProperty, undoMocks } from '@mdf.js/utils';
import cluster from 'cluster';
import { MasterPort } from '.';
import { Aggregator } from '../Aggregator';
import { RegisterMessageType } from '../types';
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const logger = new DebugLogger(`test`);
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Port #Master', () => {
  describe('#Happy path', () => {
    afterEach(function () {
      undoMocks();
    });
    it(`Should create a valid instance of a master registry`, () => {
      const aggregator = new Aggregator(logger);
      const port = new MasterPort(aggregator, logger);
      expect(port).toBeDefined();
      expect(port.clear.bind(port)).not.toThrow();
    }, 300);
    it(`Should send CLR_REQ message to workers in order to clean the records`, done => {
      const workerBase = {
        kill: () => {
          return;
        },
        isConnected: () => true,
      };
      const createWorker = (id: number) => {
        return {
          process: { pid: id },
          id,
          ...workerBase,
          send: (message: any) => {
            expect(message.type).toEqual(RegisterMessageType.CLR_REQ);
            done();
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator(logger);
      const port = new MasterPort(aggregator, logger);
      port.clear();
    }, 300);
    it(`Should include errors from workers nodes in the final registry`, done => {
      const workerBase = {
        kill: () => {
          return;
        },
        isConnected: () => true,
      };
      const createMessage = (id: number) => {
        return {
          type: RegisterMessageType.RES,
          requestId: 1,
          errors: [
            {
              name: 'myError',
              message: 'myMessage',
              uuid: UUID_FAKE,
              timestamp: 10,
              subject: 'mySubject',
              trace: ['myError: myMessage', 'caused by CrashError: other error'],
              workerId: id,
              workerPid: id,
            },
          ],
        };
      };
      const createWorker = (id: number) => {
        return {
          process: { pid: id },
          id,
          ...workerBase,
          send: () => {
            cluster.emit('message', { process: { pid: id }, id }, createMessage(id));
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
        worker2: createWorker(2),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator(logger);
      const port = new MasterPort(aggregator, logger, 200);
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { subject: 'mySubject', date: new Date(10) },
      });
      aggregator.push(ownError);
      port.start();
      setTimeout(() => {
        port.stop();
        const errors = aggregator.errors;
        expect(errors).toEqual([
          {
            name: 'myError',
            message: 'myMessage',
            uuid: UUID_FAKE,
            timestamp: ownError.date.toISOString(),
            subject: 'mySubject',
            trace: ['myError: myMessage', 'caused by CrashError: other error'],
          },
          {
            name: 'myError',
            message: 'myMessage',
            uuid: UUID_FAKE,
            timestamp: 10,
            subject: 'mySubject',
            trace: ['myError: myMessage', 'caused by CrashError: other error'],
            workerId: 1,
            workerPid: 1,
          },
          {
            name: 'myError',
            message: 'myMessage',
            uuid: UUID_FAKE,
            timestamp: 10,
            subject: 'mySubject',
            trace: ['myError: myMessage', 'caused by CrashError: other error'],
            workerId: 2,
            workerPid: 2,
          },
        ]);
        done();
      }, 185);
    }, 300);
    it(`Should not include messages from workers nodes with different requestId`, done => {
      const workerBase = {
        kill: () => {
          return;
        },
        isConnected: () => true,
      };
      const createMessage = (id: number) => {
        return {
          type: RegisterMessageType.RES,
          requestId: id,
          errors: [
            {
              name: 'myError',
              message: 'myMessage',
              uuid: UUID_FAKE,
              timestamp: 10,
              subject: 'mySubject',
              trace: ['myError: myMessage', 'caused by CrashError: other error'],
              workerId: id,
              workerPid: id,
            },
          ],
        };
      };
      const createWorker = (id: number) => {
        return {
          process: { pid: id },
          id,
          ...workerBase,
          send: () => {
            cluster.emit('message', { process: { pid: id }, id }, createMessage(id));
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
        worker2: createWorker(2),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator(logger);
      const port = new MasterPort(aggregator, logger, 200);
      port.start();
      setTimeout(() => {
        port.stop();
        const errors = aggregator.errors;
        expect(errors).toEqual([
          {
            name: 'myError',
            message: 'myMessage',
            uuid: UUID_FAKE,
            timestamp: 10,
            subject: 'mySubject',
            trace: ['myError: myMessage', 'caused by CrashError: other error'],
            workerId: 1,
            workerPid: 1,
          },
        ]);
        done();
      }, 185);
    }, 300);
    it(`Should not include messages from workers nodes with incorrect message type`, done => {
      const workerBase = {
        kill: () => {
          return;
        },
        isConnected: () => true,
      };
      const createMessage = (id: number) => {
        return {
          type: 'another',
          requestId: 1,
          errors: [
            {
              name: 'myError',
              message: 'myMessage',
              uuid: UUID_FAKE,
              timestamp: 10,
              subject: 'mySubject',
              trace: ['myError: myMessage', 'caused by CrashError: other error'],
              workerId: id,
              workerPid: id,
            },
          ],
        };
      };
      const createWorker = (id: number) => {
        return {
          process: { pid: id },
          id,
          ...workerBase,
          send: () => {
            cluster.emit('message', { process: { pid: id }, id }, createMessage(id));
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
        worker2: createWorker(2),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator(logger);
      const port = new MasterPort(aggregator, logger, 200);
      port.start();
      setTimeout(() => {
        port.stop();
        const errors = aggregator.errors;
        expect(errors).toEqual([]);
        done();
      }, 200);
    }, 300);
  });
});
// #endregion
