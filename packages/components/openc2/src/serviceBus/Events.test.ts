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
