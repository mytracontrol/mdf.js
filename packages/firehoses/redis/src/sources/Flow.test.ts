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
import { Flow } from './Flow';

const XREAD_RESPONSE_OKEY: [string, [string, string[]][]][] = [
  ['myStream', [['1526984818136-0', ['myType', '{"hi":3}']]]],
];

describe('#Flow #Source', () => {
  describe('#Happy path', () => {
    it('Should create an instance of a flow source properly', () => {
      const provider = Redis.Factory.create();
      const plug = new Flow(provider, 'myStream');
      expect(plug).toBeDefined();
      expect(plug.componentId).toEqual(provider.componentId);
      expect(plug.name).toEqual(provider.name);
      expect(plug.checks).toEqual(provider.checks);
    });
    it('Should post consume data properly and return the id of the job', async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xdel').mockResolvedValue(1);
      const flow = new Flow(provider, 'myStream');
      await expect(flow.postConsume('myJobId')).resolves.toEqual('myJobId');
    });
    it('Should post consume data properly and return the undefined of the job', async () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xdel').mockResolvedValue(0);
      const flow = new Flow(provider, 'myStream');
      await expect(flow.postConsume('myJobId')).resolves.toBeUndefined();
    });
    it('Should create an instance of a flow source and NOT start to consume when init is called (even several times) is provider is not ready', () => {
      const provider = Redis.Factory.create();
      const myMock = jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      plug.init();
      plug.init();
      expect(myMock).toHaveBeenCalledTimes(0);
      plug.pause();
    });
    it('Should create an instance of a flow source and NOT start to consume when the provider is ready from the begging but init is not called', () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      const myMock = jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      expect(plug).toBeDefined();
      expect(myMock).toHaveBeenCalledTimes(0);
    });
    it('Should create an instance of a flow source and NOT start to consume when the provider is ready from the begging, init is called but there aren`t data listeners', () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      const myMock = jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      plug.init();
      plug.init();
      expect(myMock).toHaveBeenCalledTimes(0);
      plug.pause();
    });
    it('Should create an instance of a flow source and NOT start to consume when the provider is ready from the begging, there are data listeners, but init is not called', () => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      const myMock = jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = () => {
        throw new Error('Should not be called');
      };
      plug.on('data', myListener);
      expect(myMock).toHaveBeenCalledTimes(0);
      plug.off('data', myListener);
    });
    it('Should create an instance of a flow source and NOT start to consume when init is called, there are data listeners, but provider is not ready', () => {
      const provider = Redis.Factory.create();
      const myMock = jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = () => {
        throw new Error('Should not be called');
      };
      plug.on('data', myListener);
      plug.init();
      plug.init();
      expect(myMock).toHaveBeenCalledTimes(0);
      plug.off('data', myListener);
      plug.pause();
    });
    it('Should create an instance of a flow source and NOT start to consume there are data listeners, and provider becomes ready, but init has not been called', () => {
      const provider = Redis.Factory.create();
      const myMock = jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = () => {
        throw new Error('Should not be called');
      };
      plug.on('data', myListener);
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      provider.emit('status', 'pass');
      expect(myMock).toHaveBeenCalledTimes(0);
      plug.off('data', myListener);
    });
    it('Should create an instance of a flow source and NOT start to consume there are data listeners, and provider becomes ready, and before init is called it become not ready', () => {
      const provider = Redis.Factory.create();
      const myMock = jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = () => {
        throw new Error('Should not be called');
      };
      plug.on('data', myListener);
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      provider.emit('status', 'pass');
      provider.emit('status', 'fail');
      plug.init();
      expect(myMock).toHaveBeenCalledTimes(0);
      plug.off('data', myListener);
      plug.pause();
    });
    it('Should create an instance of a flow source and START to consume there are data listeners, and provider becomes ready, and init is called', done => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = () => {
        plug.pause();
        plug.off('data', myListener);
        done();
      };
      plug.on('data', myListener);
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      provider.emit('status', 'pass');
      plug.init();
    });
    it('Should create an instance of a flow source and START to consume there are data listeners, init is called, and provider becomes ready', done => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = () => {
        plug.pause();
        plug.off('data', myListener);
        done();
      };
      plug.on('data', myListener);
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      plug.init();
      provider.emit('status', 'pass');
    });
  });
  describe('#Sad path', () => {
    it('Should emit an error if the plug is not ready in the moment of emit a new data', done => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      jest.spyOn(provider.client, 'xread').mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = (error: Error) => {
        expect(error.message).toEqual(
          'The ingested data will not be emitted, the stream is not ready right now'
        );
        plug.off('data', myOtherListener);
        done();
      };
      const myOtherListener = () => {
        throw new Error('Should not be called');
      };
      plug.once('data', myOtherListener);
      plug.once('error', myListener);
      plug.init();
      plug.pause();
    });
    it('Should emit an error if the plug if the is a error ingesting data, and try it again', done => {
      const provider = Redis.Factory.create();
      jest.spyOn(provider, 'state', 'get').mockReturnValue('running');
      jest
        .spyOn(provider.client, 'xread')
        .mockRejectedValueOnce(new Error('myError'))
        .mockResolvedValue(XREAD_RESPONSE_OKEY);
      const plug = new Flow(provider, 'myStream');
      const myListener = (error: Error) => {
        expect(error.message).toEqual('Error reading new entries from stream: myError');
      };
      const myOtherListener = () => {
        plug.pause();
        plug.off('data', myOtherListener);
        done();
      };
      plug.once('data', myOtherListener);
      plug.once('error', myListener);
      plug.init();
    });
  });
});
