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
import { Boom, Crash, Multi } from '@mdf/crash';
import { LoggerInstance } from '../types';
import { SetContext } from './Wrapper';

class MyLogger implements LoggerInstance {
  value?: string;
  silly = (msg: string, uuid?: string, context?: string) => {
    this.value = msg + ': ' + uuid + ': ' + context;
  };
  debug = (msg: string, uuid?: string, context?: string) => {
    this.value = msg + ': ' + uuid + ': ' + context;
  };
  verbose = (msg: string, uuid?: string, context?: string) => {
    this.value = msg + ': ' + uuid + ': ' + context;
  };
  info = (msg: string, uuid?: string, context?: string) => {
    this.value = msg + ': ' + uuid + ': ' + context;
  };
  warn = (msg: string, uuid?: string, context?: string) => {
    this.value = msg + ': ' + uuid + ': ' + context;
  };
  error = (msg: string, uuid?: string, context?: string) => {
    this.value = msg + ': ' + uuid + ': ' + context;
  };
  crash = (raw: Crash | Boom | Multi, context?: string) => {
    this.value = raw.message + ': ' + context;
  };
}

describe('#Wrapper', () => {
  describe('#Happy path', () => {
    it('Should return the same message', () => {
      const msg = 'My message';
      const uuid = 'uuid';
      const context = 'context';
      const myLogger = new MyLogger();
      const wrapper = SetContext(myLogger, context, uuid);
      wrapper.silly(msg);
      expect(myLogger.value).toEqual(msg + ': ' + uuid + ': ' + context);
      wrapper.debug(msg);
      expect(myLogger.value).toEqual(msg + ': ' + uuid + ': ' + context);
      wrapper.verbose(msg);
      expect(myLogger.value).toEqual(msg + ': ' + uuid + ': ' + context);
      wrapper.info(msg);
      expect(myLogger.value).toEqual(msg + ': ' + uuid + ': ' + context);
      wrapper.warn(msg);
      expect(myLogger.value).toEqual(msg + ': ' + uuid + ': ' + context);
      wrapper.error(msg);
      expect(myLogger.value).toEqual(msg + ': ' + uuid + ': ' + context);
      wrapper.crash(new Crash(msg));
      expect(myLogger.value).toEqual(msg + ': ' + context);
    });
  });
});
