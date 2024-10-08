/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { PlugWrapper } from './PlugWrapper';

describe('#Sink #PlugWrapper', () => {
  describe('#Happy path', () => {
    it('Should wrap a single/multi start/stop operation', async () => {
      //@ts-ignore - Test environment
      const wrapper = new PlugWrapper({
        name: 'test',
        componentId: 'test',
        //@ts-ignore - Test environment
        single: () => {
          return Promise.resolve();
        },
        //@ts-ignore - Test environment
        multi: () => {
          return Promise.resolve();
        },
        start: () => {
          return Promise.resolve();
        },
        stop: () => {
          return Promise.resolve();
        },
      });
      expect(wrapper).toBeDefined();
      expect(wrapper.name).toBe('test');
      expect(wrapper.componentId).toBe('test');
      //@ts-ignore - Test environment
      expect(wrapper.single('hi')).resolves.toEqual(undefined);
      //@ts-ignore - Test environment
      expect(wrapper.multi([['hi']])).resolves.toEqual(undefined);
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
    it('Should throw an error if the plug does not implement the single method', () => {
      try {
        //@ts-ignore - Test environment
        new PlugWrapper({});
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Plug undefined does not implement the single method'
        );
      }
    });
    it('Should throw an error if the plug does not implement the single method properly', () => {
      try {
        //@ts-ignore - Test environment
        new PlugWrapper({ single: 3 });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Plug undefined does not implement the single method properly'
        );
      }
    });
    it('Should throw an error if the plug does not implement the multi method properly', () => {
      try {
        //@ts-ignore - Test environment
        new PlugWrapper({ single: () => {}, multi: 3 });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Plug undefined not implement the multi method properly'
        );
      }
    });
    it('Should throw an error if the plug does not implement the start method properly', () => {
      try {
        new PlugWrapper({
          name: 'myPlug',
          single: () => Promise.resolve(),
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
          single: () => Promise.resolve(),
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
    it('Should throw an error if try to call multi method and this not exist', async () => {
      //@ts-ignore - Test environment
      const wrapper = new PlugWrapper({
        name: 'myPlug',
        single: () => Promise.resolve(),
        start: () => {
          return Promise.resolve();
        },
        stop: () => {
          return Promise.resolve();
        },
      });
      //@ts-ignore - Test environment
      await expect(wrapper.multi()).rejects.toThrow(
        'Plug myPlug does not implement the multi method'
      );
    });
  });
});
