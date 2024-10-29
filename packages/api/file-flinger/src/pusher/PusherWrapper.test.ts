/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { PusherWrapper } from './PusherWrapper';

describe('#Sink #PlugWrapper', () => {
  describe('#Happy path', () => {
    it('Should wrap push/start/stop operations in the Pusher', async () => {
      //@ts-expect-error - Test environment
      const wrapper = new PusherWrapper({
        name: 'test',
        componentId: 'test',
        push: () => Promise.resolve(),
        start: () => Promise.resolve(),
        stop: () => Promise.resolve(),
        close: () => Promise.resolve(),
      });
      expect(wrapper).toBeDefined();
      expect(wrapper.name).toBe('test');
      expect(wrapper.componentId).toBe('test');
      expect(wrapper.push('', 'hi')).resolves.toEqual(undefined);
      expect(wrapper.start()).resolves.toEqual(undefined);
      expect(wrapper.stop()).resolves.toEqual(undefined);
      expect(wrapper.close()).resolves.toEqual(undefined);
      expect(wrapper.status).toBe('pass');
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should throw an error if a pusher is not passed', () => {
      try {
        //@ts-expect-error - Test environment
        new PusherWrapper();
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('PusherWrapper requires a pusher instance');
      }
    }, 300);
    it('Should throw an error if the pusher does not implement the push method', () => {
      try {
        //@ts-expect-error - Test environment
        new PusherWrapper({});
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Pusher undefined does not implement the push method'
        );
      }
    }, 300);
    it('Should throw an error if the pusher does not implement the push method properly', () => {
      try {
        //@ts-expect-error - Test environment
        new PusherWrapper({ push: 3 });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Pusher undefined does not implement the push method properly'
        );
      }
    }, 300);
    it('Should throw an error if the plug does not implement the start method properly', () => {
      try {
        new PusherWrapper({
          name: 'myPusher',
          push: () => Promise.resolve(),
          //@ts-expect-error - Test environment
          start: 3,
          stop: () => Promise.resolve(),
          close: () => Promise.resolve(),
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Pusher myPusher not implement the start method properly'
        );
      }
    }, 300);
    it('Should throw an error if the plug does not implement the stop method properly', () => {
      try {
        new PusherWrapper({
          name: 'myPusher',
          push: () => Promise.resolve(),
          //@ts-expect-error - Test environment
          stop: 3,
          start: () => Promise.resolve(),
          close: () => Promise.resolve(),
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Pusher myPusher not implement the stop method properly'
        );
      }
    }, 300);
    it('Should throw an error if the plug does not implement the close method properly', () => {
      try {
        new PusherWrapper({
          name: 'myPusher',
          push: () => Promise.resolve(),
          stop: () => Promise.resolve(),
          start: () => Promise.resolve(),
          //@ts-expect-error - Test environment
          close: 3,
        });
        throw new Error(`Should throw an error`);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Pusher myPusher not implement the close method properly'
        );
      }
    }, 300);
    it(`Should reject the push operation if the pusher's push method fails`, done => {
      //@ts-expect-error - Test environment
      const wrapper = new PusherWrapper({
        name: 'test',
        componentId: v4(),
        push: () => Promise.reject(new Error('Test error')),
        start: () => Promise.resolve(),
        stop: () => Promise.resolve(),
        close: () => Promise.resolve(),
      });
      wrapper.on('error', error => {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toEqual('Test error');
        done();
      });
      wrapper.push('dasd', 'hi').catch(() => {});
    }, 300);
  });
});
