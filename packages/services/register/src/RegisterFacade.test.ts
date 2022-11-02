/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Crash } from '@mdf.js/crash';
import { mockProperty, undoMocks } from '@mdf.js/utils';
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
