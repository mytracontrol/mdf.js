/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { PlugWrapper } from './PlugWrapper';

describe('#Source #PlugWrapper', () => {
  describe('#Happy path', () => {
    it('Should wrap a postConsume/ingestData start/stop operation', async () => {
      //@ts-ignore - Test environment
      const wrapper = new PlugWrapper({
        //@ts-ignore - Test environment
        postConsume: () => {
          return Promise.resolve();
        },
        //@ts-ignore - Test environment
        ingestData: () => {
          return Promise.resolve();
        },
        start: () => {
          return Promise.resolve();
        },
        stop: () => {
          return Promise.resolve();
        },
      });
      //@ts-ignore - Test environment
      expect(wrapper.postConsume()).resolves.toEqual(undefined);
      //@ts-ignore - Test environment
      expect(wrapper.ingestData()).resolves.toEqual(undefined);
      //@ts-ignore - Test environment
      expect(wrapper.start()).resolves.toEqual(undefined);
      //@ts-ignore - Test environment
      expect(wrapper.stop()).resolves.toEqual(undefined);
    });
  });
  describe('#Sad path', () => {
    it('Should throw an error if a plug is not passed', () => {
      try {
        //@ts-ignore - Test environment
        new PlugWrapper();
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('PlugWrapper requires a plug instance');
      }
    });
    it('Should throw an error if the plug does not implement the postConsume method', () => {
      try {
        //@ts-ignore - Test environment
        new PlugWrapper({});
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Plug undefined does not implement the postConsume method'
        );
      }
    });
    it('Should throw an error if the plug does not implement the postConsume method properly', () => {
      try {
        //@ts-ignore - Test environment
        new PlugWrapper({ postConsume: 4 });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Plug undefined does not implement the postConsume method properly'
        );
      }
    });
    it('Should throw an error if the plug does not implement the ingestData method properly', () => {
      try {
        //@ts-ignore - Test environment
        new PlugWrapper({ postConsume: () => {}, ingestData: 3 });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Plug undefined does not implement the ingestData method properly'
        );
      }
    });
    it('Should throw an error if the plug does not implement the start method properly', () => {
      try {
        new PlugWrapper({
          name: 'myPlug',
          //@ts-ignore - Test environment
          postConsume: () => {
            return Promise.resolve();
          },
          //@ts-ignore - Test environment
          ingestData: () => {
            return Promise.resolve();
          },
          //@ts-ignore - Test environment
          start: 3,
          stop: () => {
            return Promise.resolve();
          },
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Plug myPlug not implement the start method properly'
        );
      }
    });
    it('Should throw an error if the plug does not implement the stop method properly', () => {
      try {
        new PlugWrapper({
          name: 'myPlug',
          //@ts-ignore - Test environment
          postConsume: () => {
            return Promise.resolve();
          },
          //@ts-ignore - Test environment
          ingestData: () => {
            return Promise.resolve();
          },
          //@ts-ignore - Test environment
          stop: 3,
          start: () => {
            return Promise.resolve();
          },
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('Plug myPlug not implement the stop method properly');
      }
    });
    it('Should throw an error if try to call ingestData method and this not exist', async () => {
      const wrapper = new PlugWrapper({
        name: 'myPlug',
        //@ts-ignore - Test environment
        postConsume: () => Promise.resolve(),
        start: () => Promise.resolve(),
        stop: () => Promise.resolve(),
      });
      //@ts-ignore - Test environment
      await expect(wrapper.ingestData()).rejects.toThrow(
        'Plug myPlug does not implement the ingestData method'
      );
    });
  });
});
