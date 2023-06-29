/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { getAllKeys, getTemplateKeys, getTemplatePayload } from '.';
import lua from './lua.json';
describe('#Puller #Scripts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should return all the keys for the given id`, () => {
      const expectedResult = [
        'b_myId_settings',
        'b_myId_job_weights',
        'b_myId_job_expirations',
        'b_myId_job_clients',
        'b_myId_client_running',
        'b_myId_client_num_queued',
        'b_myId_client_last_registered',
        'b_myId_client_last_seen',
      ];

      const result = getAllKeys('myId');
      expect(result).toEqual(expectedResult);
    });

    it(`Should return the keys for the given template name and id`, () => {
      const expectedResult = [
        'b_myId_settings',
        'b_myId_job_weights',
        'b_myId_job_expirations',
        'b_myId_job_clients',
        'b_myId_client_running',
        'b_myId_client_num_queued',
        'b_myId_client_last_registered',
        'b_myId_client_last_seen',
      ];

      const result = getTemplateKeys('init', 'myId');
      expect(result).toEqual(expectedResult);
    });

    it(`Should return the payload for the given template name when its refresh_expiration is true`, () => {
      let expectedResult = lua['refs.lua'] + '\n';
      expectedResult += lua['validate_keys.lua'] + '\n';
      expectedResult += lua['validate_client.lua'] + '\n';
      expectedResult += lua['process_tick.lua'] + '\n';
      expectedResult += lua['refresh_expiration.lua'] + '\n';
      expectedResult += lua['update_settings.lua'];

      const result = getTemplatePayload('update_settings');
      expect(result).toEqual(expectedResult);
    });

    it(`Should return the payload for the given template name when its refresh_expiration is false`, () => {
      let expectedResult = lua['refs.lua'] + '\n';
      expectedResult += '\n';
      expectedResult += lua['group_check.lua'];

      const result = getTemplatePayload('group_check');
      expect(result).toEqual(expectedResult);
    });
  });
});
