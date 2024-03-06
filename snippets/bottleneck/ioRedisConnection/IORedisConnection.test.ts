/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Redis } from 'ioredis';
import { IORedisConnection } from '.';
describe('#Puller #IORedisConnection', () => {
  class MockRedis extends Redis {
    constructor() {
      super();
    }
  }
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create an instance of IORedisConnection`, () => {
      const redisClient = new MockRedis();
      const options = {
        client: redisClient,
      };
      const connection = new IORedisConnection(options);
      expect(connection).toBeDefined();
      expect(connection['_client']).toBeDefined();
      expect(connection['_client']).toBeInstanceOf(Redis);
      expect(connection['_subscriber']).toBeDefined();
      expect(connection['_subscriber']).toBeInstanceOf(Redis);
    }, 300);
  });
});
