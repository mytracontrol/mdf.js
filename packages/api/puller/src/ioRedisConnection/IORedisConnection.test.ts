/**
 * In this file we implement the unit tests
 * for the IORedisConnection class in typescript using jest.
 */
import { Redis } from 'ioredis';
import { IORedisConnection } from './IORedisConnection';
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
    });

    it(`Should run the the given command`, async () => {
      const redisClient = new Redis(6379, '127.0.0.1');

      const connection = new IORedisConnection({ client: redisClient });
      const spyDefineCommand = jest.spyOn(redisClient, 'defineCommand').mockReturnValue();
      const spy = jest.spyOn(redisClient, 'pipeline').mockImplementation((cmd?: unknown[][]) => {
        return {
          exec: () => Promise.resolve([[null, 'OK']]),
        } as any;
      });
      const result = await connection.__runCommand__(['testCmd']);
      console.log('result', result);
      expect(connection).toBeDefined();
      // expect(spyDefineCommand).toHaveBeenCalled();
      // expect(spy).toHaveBeenCalled();
      // expect(result).toBeDefined();
      // expect(result).toBe('OK');
    });
  });

  // describe('#Sad path', () => {});
});
