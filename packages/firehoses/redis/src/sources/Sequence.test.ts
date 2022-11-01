/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */

import { Redis } from '@mdf.js/redis-provider';
import { Sequence } from './Sequence';

const XREAD_RESPONSE_OKEY: [string, [string, string[]][]][] = [
  ['myStream', [['1526984818136-0', ['myType', '{"hi":3}']]]],
];

describe('#Sequence #Source', () => {
  describe('#Happy path', () => {
    it('Should create an instance of a sequence source properly', () => {
      const provider = Redis.Factory.create();
      const plug = new Sequence(provider, 'myStream');
      expect(plug).toBeDefined();
      expect(plug.componentId).toEqual(provider.componentId);
      expect(plug.name).toEqual(provider.name);
      expect(plug.checks).toEqual(provider.checks);
    });
    it('Should ingest data properly', async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const flow = new Sequence(provider, 'myStream');
      const result = await flow.ingestData(1);
      expect(result).toEqual([
        {
          jobId: '1526984818136-0',
          type: 'myType',
          data: { hi: 3 },
        },
      ]);
    });
    it('Should post consume data properly and return the id of the job', async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xdel').mockResolvedValue(1);
      const flow = new Sequence(provider, 'myStream');
      await expect(flow.postConsume('myJobId')).resolves.toEqual('myJobId');
    });
    it('Should post consume data properly and return the undefined of the job', async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xdel').mockResolvedValue(0);
      const flow = new Sequence(provider, 'myStream');
      await expect(flow.postConsume('myJobId')).resolves.toBeUndefined();
    });
  });
});
