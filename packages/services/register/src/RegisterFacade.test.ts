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
import { Service } from '.';
import { MasterRegistry, StandaloneRegistry, WorkerRegistry } from './Registries';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Service', () => {
  describe('#Happy path', () => {
    it(`Should return a correct registry service in stand alone mode`, async () => {
      const service = Service.create();
      //@ts-ignore - Test environment
      expect(service.registry).toBeInstanceOf(StandaloneRegistry);
      expect(service.router).toBeDefined();
      expect(service.name).toEqual('register');
      expect(service.links).toEqual({
        registers: '/registers',
      });
      expect(service.lastUpdate).toBeDefined();
      expect(service.size).toEqual(0);
      for (let index = 0; index < 101; index++) {
        service.push(new Crash('test'));
      }
      expect(service.size).toEqual(100);
      service.clear();
      expect(service.size).toEqual(0);
      service.start();
      service.stop();
    }, 300);
    it(`Should return a correct registry service in cluster mode`, async () => {
      const service = Service.create(100, true);
      //@ts-ignore - Test environment
      expect(service.registry).toBeInstanceOf(MasterRegistry);
      expect(service.router).toBeDefined();
      expect(service.lastUpdate).toBeDefined();
      expect(service.size).toEqual(0);
      for (let index = 0; index < 101; index++) {
        service.push(new Crash('test'));
      }
      expect(service.size).toEqual(100);
      service.clear();
      expect(service.size).toEqual(0);
      service.start();
      service.stop();
    }, 300);
    it(`Should return a correct registry service in worker mode`, async () => {
      //@ts-ignore Test environment
      mockProperty(cluster, 'isPrimary', false);
      const service = Service.create(100, true);
      //@ts-ignore - Test environment
      expect(service.registry).toBeInstanceOf(WorkerRegistry);
      expect(service.router).toBeDefined();
      expect(service.lastUpdate).toBeDefined();
      expect(service.size).toEqual(0);
      for (let index = 0; index < 101; index++) {
        service.push(new Crash('test'));
      }
      expect(service.size).toEqual(100);
      service.clear();
      expect(service.size).toEqual(0);
      service.start();
      service.stop();
      undoMocks();
    }, 300);
  });
});
// #endregion
