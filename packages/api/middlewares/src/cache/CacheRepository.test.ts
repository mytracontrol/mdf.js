/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

// ************************************************************************************************
// #region Repository imports
import { Crash } from '@mdf.js/crash';
import { Redis } from '@mdf.js/redis-provider';
import { mockProperty, undoMocks } from '@mdf.js/utils';
import { CacheRepository } from './CacheRepository';
// #endregion
// *************************************************************************************************
// #region Our own repository for testing
const cache = Redis.Factory.create();
const repository = new CacheRepository(cache.client);
const FAKE_UUID = '213d630f-7517-4370-baae-d0a5862799f5';

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Repository #cache', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
    });
    it('Should return a valid result when the request is performed over an existing key', () => {
      //@ts-ignore - Test environment
      mockProperty(cache.client, 'status', 'ready');
      jest
        .spyOn(cache.client, 'get')
        .mockResolvedValue(
          '{"status":200,"type":"application/json; charset=utf-8","body":{"test":"test"}}'
        );
      return repository
        .getPath('anyPath', FAKE_UUID)
        .then(result => {
          expect(result).toEqual({
            status: 200,
            type: 'application/json; charset=utf-8',
            body: { test: 'test' },
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should return a null result when the request is performed over a NON existing key', () => {
      //@ts-ignore - Test environment
      mockProperty(cache.client, 'status', 'ready');
      jest.spyOn(cache.client, 'get').mockResolvedValue(null);
      return repository
        .getPath('anyPath', FAKE_UUID)
        .then(result => {
          expect(result).toEqual(null);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should return a null result when the request is performed but the redis cache is not ready', () => {
      return repository
        .getPath('anyPath', FAKE_UUID)
        .then(result => {
          expect(result).toEqual(null);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should resolve when a new value is stored in the cache properly', () => {
      //@ts-ignore - Test environment
      mockProperty(cache.client, 'status', 'ready');
      jest.spyOn(cache.client, 'setex').mockResolvedValue('OK');
      return repository
        .setPath(
          'anyPath',
          {
            headers: {},
            status: 200,
            body: { test: 'test' },
            date: new Date().getDate(),
            duration: 10,
          },
          FAKE_UUID
        )
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should resolve when try to store a new value but the redis cache is not ready', () => {
      return repository
        .setPath(
          'anyPath',
          {
            headers: {},
            status: 200,
            body: { test: 'test' },
            date: new Date().getDate(),
            duration: 10,
          },
          FAKE_UUID
        )
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should fail with an error if some problems appears performing a request to get a path', () => {
      //@ts-ignore - Test environment
      mockProperty(cache.client, 'status', 'ready');
      jest.spyOn(cache.client, 'get').mockRejectedValue(new Crash('myError', FAKE_UUID));
      return repository
        .getPath('anyPath', FAKE_UUID)
        .then(result => {
          throw new Error('Expected to rejects with a error, but success ...');
        })
        .catch(error => {
          expect(error.message).toEqual('Error retrieving the information from the cache');
          expect(error.name).toEqual('CrashError');
          expect((error as Crash).cause?.message).toEqual('myError');
        });
    }, 300);
    it('Should fail with an error if some problems appears performing a request to set a path', () => {
      //@ts-ignore - Test environment
      mockProperty(cache.client, 'status', 'ready');
      jest.spyOn(cache.client, 'setex').mockRejectedValue(new Crash('myError', FAKE_UUID));
      return repository
        .setPath(
          'anyPath',
          {
            headers: {},
            status: 200,
            body: { test: 'test' },
            date: new Date().getDate(),
            duration: 10,
          },
          FAKE_UUID
        )
        .then(result => {
          throw new Error('Expected to rejects with a error, but success ...');
        })
        .catch(error => {
          expect((error as Crash).cause?.message).toEqual('myError');
          expect(error.message).toEqual('Error retrieving the information from the cache');
          expect(error.name).toEqual('CrashError');
        });
    }, 300);
  });
});
// #endregion
