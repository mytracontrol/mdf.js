/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { logLevel } from 'kafkajs';
import { Producer } from './Producer';
describe('#Client', () => {
  describe('#Happy path', () => {
    it('Should execute `eventLogging` properly', () => {
      const client = new Producer({ clientId: 'test', brokers: ['localhost:9092'] });
      let debug;
      let silly;
      //@ts-ignore - testing private method
      jest.spyOn(client.logger, 'debug').mockImplementation((...args) => {
        debug = args;
      });
      //@ts-ignore - testing private method
      jest.spyOn(client.logger, 'silly').mockImplementation((...args) => {
        silly = args;
      });
      //@ts-ignore - testing private method
      client.eventLogging({ id: 'myId', type: 'myType', timestamp: 0, payload: 'myPayload' });
      expect(debug).toEqual(['[myType] event in client with [myId] at [1970-01-01T00:00:00.000Z]']);
      expect(silly).toEqual(["'myPayload'"]);
    });
    it('Should execute `onFailure` function emit an error', async () => {
      const client = new Producer({ clientId: 'test', brokers: ['localhost:9092'] });
      let errorEmitted;
      client.on('error', error => {
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toEqual('myError');
        errorEmitted = true;
      });
      //@ts-ignore - testing private method
      const result = await client.onFailure(new Error('myError'));
      expect(result).toBeTruthy();
      expect(errorEmitted).toBeTruthy();
    });
    it('Should execute `defaultLogCreator` properly', () => {
      const client = new Producer({ clientId: 'test', brokers: ['localhost:9092'] });
      let debug;
      let silly;
      //@ts-ignore - testing private method
      jest.spyOn(client.logger, 'debug').mockImplementation((...args) => {
        debug = args;
      });
      //@ts-ignore - testing private method
      jest.spyOn(client.logger, 'silly').mockImplementation((...args) => {
        silly = args;
      });
      //@ts-ignore - testing private method
      client.defaultLogCreator(logLevel.INFO)({
        namespace: 'myNamespace',
        level: logLevel.INFO,
        label: 'label',
        log: { timestamp: 'timestamp', message: 'myMessage', logger: 'myLogger' },
      });
      expect(debug).toEqual(['myLogger - label - myNamespace - myMessage']);
      expect(silly).toEqual(["{ timestamp: 'timestamp' }"]);
    });
  });
  describe('#Sad path', () => {});
});
