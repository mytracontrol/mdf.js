/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Events } from './Events';

describe('#Events', () => {
  describe('#Happy path', () => {
    it('Should check if is a valid general command event', () => {
      expect(Events.isGeneralCommandEvent('a')).toEqual(false);
      expect(Events.isGeneralCommandEvent('oc2.cmd.all')).toEqual(true);
    });
    it('Should check if is a valid general response event', () => {
      expect(Events.isGeneralResponseEvent('a')).toEqual(false);
      expect(Events.isGeneralResponseEvent('oc2.rsp')).toEqual(true);
    });
    it('Should check if is an actuator command event', () => {
      expect(Events.isActuatorCommandEvent('a')).toEqual(false);
      expect(Events.isActuatorCommandEvent('oc2.cmd.ap.a')).toEqual(true);
    });
    it('Should return the actuator from command event', () => {
      expect(Events.getActuatorFromCommandEvent('a')).toEqual('a');
      expect(Events.getActuatorFromCommandEvent('oc2.cmd.ap.a')).toEqual('a');
    });
    it('Should check if is a device command event', () => {
      expect(Events.isDeviceCommandEvent('a')).toEqual(false);
      expect(Events.isDeviceCommandEvent('oc2.cmd.device.a')).toEqual(true);
    });
    it('Should return the device from command event', () => {
      expect(Events.getDeviceFromCommandEvent('a')).toEqual('a');
      expect(Events.getDeviceFromCommandEvent('oc2.cmd.device.a')).toEqual('a');
    });
    it('Should check if is a producer command event', () => {
      expect(Events.isProducerResponseEvent('a')).toEqual(false);
      expect(Events.isProducerResponseEvent('oc2.rsp.a')).toEqual(true);
    });
    it('Should return the producer from command event', () => {
      expect(Events.getProducerFromResponseEvent('a')).toEqual('a');
      expect(Events.getProducerFromResponseEvent('oc2.rsp.a')).toEqual('a');
    });
  });
  describe('#Sad path', () => {});
});
