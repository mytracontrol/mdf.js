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
// ************************************************************************************************
// #region Component imports
import { Crash } from '@mdf/crash';
import { mockProperty, undoMocks } from '@mdf/utils';
import cluster from 'cluster';
import { MasterRegistry } from '.';
import { RegisterMessageType } from '../types';
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Registry #Master', () => {
  describe('#Happy path', () => {
    afterEach(function () {
      undoMocks();
    });
    it(`Should create a valid instance of a master registry`, () => {
      const registry = new MasterRegistry();
      expect(registry).toBeDefined();
      expect(registry.lastUpdate).toBeDefined();
      expect(registry.errors).toEqual([]);
      expect(registry.size).toEqual(0);
      expect(registry.clear.bind(registry)).not.toThrow();
    }, 300);
    it(`Should create a valid instance of a master registry with different options`, () => {
      const registry = new MasterRegistry(-1);
      for (let index = 0; index < 101; index++) {
        registry.push(new Crash('test'));
      }
      expect(registry.size).toEqual(100);
    }, 300);
    it(`Should send CLR_REQ message top workers in order to clean the records`, done => {
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
            expect(registry.size).toEqual(0);
            done();
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const registry = new MasterRegistry();
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { subject: 'mySubject', date: new Date(10) },
      });
      registry.push(ownError);
      expect(registry.size).toEqual(1);
      registry.clear();
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
      const registry = new MasterRegistry(undefined, 200);
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { subject: 'mySubject', date: new Date(10) },
      });
      registry.push(ownError);
      registry.start();
      setTimeout(() => {
        registry.stop();
        const errors = registry.errors;
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
          {
            name: 'myError',
            message: 'myMessage',
            uuid: UUID_FAKE,
            timestamp: ownError.date.toISOString(),
            subject: 'mySubject',
            trace: ['myError: myMessage', 'caused by CrashError: other error'],
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
      const registry = new MasterRegistry(undefined, 200);
      registry.start();
      setTimeout(() => {
        registry.stop();
        const errors = registry.errors;
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
      const registry = new MasterRegistry(undefined, 200);
      registry.start();
      setTimeout(() => {
        registry.stop();
        const errors = registry.errors;
        expect(errors).toEqual([]);
        done();
      }, 200);
    }, 300);
  });
});
// #endregion
