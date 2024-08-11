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
import { Aggregator } from './Aggregator';
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const logger = new DebugLogger(`test`);
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Port #Aggregator', () => {
  describe('#Happy path', () => {
    it(`Should create a valid instance of a aggregator`, done => {
      const aggregator = new Aggregator(logger);
      expect(aggregator).toBeDefined();
      expect(aggregator.size).toEqual(0);
      expect(aggregator.errors).toEqual([]);
      const lastUpdate = aggregator.lastUpdate;
      expect(aggregator.lastUpdate).toBeDefined();
      aggregator.on('error', error => {
        expect(error).toBeDefined();
        expect(aggregator.size).toEqual(1);
        expect(aggregator.errors).toEqual([
          {
            name: 'CrashError',
            message: 'test',
            info: undefined,
            uuid: expect.any(String),
            subject: 'common',
            timestamp: expect.any(String),
            trace: expect.any(Array),
          },
        ]);
        expect(aggregator.lastUpdate).not.toEqual(lastUpdate);
        expect(aggregator.clear()).toBeUndefined();
        expect(aggregator.size).toEqual(0);
        done();
      });
      expect(aggregator.push(new Crash('test'))).toBeUndefined();
    }, 300);
    it(`Should create a valid instance of a master registry with different options`, () => {
      const aggregator = new Aggregator(logger, -1);
      for (let index = 0; index < 101; index++) {
        aggregator.push(new Crash('test'));
      }
      expect(aggregator.size).toEqual(100);
    }, 300);
  });
});
// #endregion
