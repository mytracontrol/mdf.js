/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { HealthWrapper } from '.';

class MyHealthComponent extends EventEmitter implements Health.Component {
  componentId = v4();
  name = 'MyHealth';
  public get checks(): Health.Checks {
    return {};
  }
  emitError(error: Crash): void {
    this.emit('error', error);
  }
  emitStatus(status: Health.Status): void {
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
