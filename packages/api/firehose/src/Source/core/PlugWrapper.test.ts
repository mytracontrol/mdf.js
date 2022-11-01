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

import { Crash } from '@mdf.js/crash';
import { PlugWrapper } from './PlugWrapper';

describe('#Source #PlugWrapper', () => {
  describe('#Happy path', () => {
    it('Should wrap a postConsume/ingestData operation', async () => {
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
      });
      //@ts-ignore - Test environment
      expect(wrapper.postConsume()).resolves.toEqual(undefined);
      //@ts-ignore - Test environment
      expect(wrapper.ingestData()).resolves.toEqual(undefined);
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
    it('Should throw an error if try to call ingestData method and this not exist', async () => {
      //@ts-ignore - Test environment
      const wrapper = new PlugWrapper({ name: 'myPlug', postConsume: () => Promise.resolve() });
      //@ts-ignore - Test environment
      await expect(wrapper.ingestData()).rejects.toThrow(
        'Plug myPlug does not implement the ingestData method'
      );
    });
  });
});
