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

import { Health } from '@mdf/core';
import { Crash } from '@mdf/crash';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { HealthWrapper } from '.';

class MyHealthComponent extends EventEmitter implements Health.Component {
  componentId = v4();
  name = 'MyHealth';
  public get checks(): Health.API.Checks {
    return {};
  }
  emitError(error: Crash): void {
    this.emit('error', error);
  }
  emitStatus(status: Health.API.Status): void {
    this.emit('status', status);
  }
}

describe('#HealthWrapper', () => {
  describe('#Happy path', () => {
    it('Should create a HealthWrapper instance', () => {
      const wrapper = new HealthWrapper('test', [new MyHealthComponent()]);
      expect(wrapper).toBeInstanceOf(HealthWrapper);
      expect(wrapper.name).toBe('test');
      //@ts-ignore - Test environment
      expect(wrapper.components).toHaveLength(1);
    }, 300);
    it('Should add a new component', done => {
      const wrapper = new HealthWrapper('test', [new MyHealthComponent()]);
      wrapper.on('status', status => {
        //@ts-ignore - Test environment
        expect(wrapper.components).toHaveLength(2);
        expect(status).toEqual('pass');
        done();
      });
      wrapper.add(new MyHealthComponent());
    }, 300);
    it('Should emit a status event', done => {
      const component = new MyHealthComponent();
      const wrapper = new HealthWrapper('test', [component]);
      wrapper.on('status', status => {
        expect(status).toEqual('pass');
        done();
      });
      component.emitStatus('pass');
    }, 300);
    it('Should emit an error event', done => {
      const component = new MyHealthComponent();
      const wrapper = new HealthWrapper('test', [component]);
      const see = wrapper.listeners('error');
      wrapper.on('error', error => {
        expect(error).toBeInstanceOf(Crash);
        done();
      });
      component.emitError(new Crash('test'));
    }, 300);
  });
});
