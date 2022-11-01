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
import { Redis } from '@mdf/redis-provider';
import { SourceRepository } from './SourceRepository';

const XREAD_RESPONSE_OKEY: [string, [string, string[]][]][] = [
  ['myStream', [['1526984818136-0', ['myType', '{"hi":3}']]]],
];
const XREAD_RESPONSE_WRONG_ENTRY: [string, [string, string[]][]][] = [
  //@ts-ignore - Test environment
  ['myStream', [['1526984818136-0']]],
];
const XREAD_RESPONSE_WRONG_STREAM_ID: [string, [string, string[]][]][] = [
  ['otherStream', [['1526984818136-0', ['myType', '{"hi":3}']]]],
];
const XREAD_RESPONSE_WRONG_JOB_ID: [string, [string, string[]][]][] = [
  //@ts-ignore - We are testing the wrong job id
  ['myStream', [[3, ['wrongType', '{"hi":3}']]]],
];
const XREAD_RESPONSE_WRONG_JSON: [string, [string, string[]][]][] = [
  ['myStream', [['1526984818136-0', ['myType', '{hi:3']]]],
];

describe('#SourceRepository', () => {
  describe('#Happy path', () => {
    it(`Should create an instance of a source repository properly`, () => {
      const provider = Redis.Factory.create();
      const sourceRepository = new SourceRepository(provider);
      expect(sourceRepository).toBeDefined();
    });
    it(`Should be possible to read a job from a stream`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).resolves.toEqual([
        {
          data: { hi: 3 },
          jobId: '1526984818136-0',
          type: 'myType',
        },
      ]);
    });
    it(`Should resolve properly if the xdel command resolve a number > 0`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xdel').mockResolvedValue(1);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.deleteJob('myStream', '1526984818136-0')).resolves.toEqual(
        '1526984818136-0'
      );
    });
    it(`Should resolve properly if the xdel command resolve a number <= 0`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xdel').mockResolvedValue(0);
      const sourceRepository = new SourceRepository(provider);
      await expect(
        sourceRepository.deleteJob('myStream', '1526984818136-0')
      ).resolves.toBeUndefined();
    });
  });
  describe('#Sad path', () => {
    it(`Should reject if the xdel command rejects`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xdel').mockRejectedValue(new Error('myError'));
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.deleteJob('myStream', '1526984818136-0')).rejects.toThrowError(
        'Error deleting job: myError'
      );
    });
    it(`Should rejects if the xread commands rejects`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockRejectedValue(new Error('myError'));
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).rejects.toThrowError(
        'Error reading new entries from stream: myError'
      );
    });
    it(`Should rejects if the result of xread has not a valid streamId`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_WRONG_STREAM_ID);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).rejects.toThrowError(
        'Received data from stream otherStream instead of myStream'
      );
    });
    it(`Should rejects if the result of xread has not a valid json`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_WRONG_JSON);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).rejects.toThrowError(
        'Received an invalid entry from stream, the data field is not a valid JSON'
      );
    });
    it(`Should rejects if the result of xread has not a JobId`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_WRONG_JOB_ID);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).rejects.toThrowError(
        'Received an invalid entry from stream, the id is not a string'
      );
    });
    it(`Should rejects if the result of xread is no valid due to the number of fields`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_WRONG_ENTRY);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).rejects.toThrowError(
        'Received an invalid entry from stream, the entry does not contain the required fields'
      );
    });
    it(`Should rejects if the result of xread is null`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(null);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).rejects.toThrowError(
        'No data found in stream, XREAD command return a null value'
      );
    });
    it(`Should rejects if the result of xread is empty`, async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue([]);
      const sourceRepository = new SourceRepository(provider);
      await expect(sourceRepository.getJobs('myStream', '*')).rejects.toThrowError(
        'No data found in stream, XREAD command return an empty array'
      );
    });
  });
});
