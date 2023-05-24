/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { RequestHandler } from 'express';
import FeaturePolicy from 'feature-policy';
import Helmet from 'helmet';

// *************************************************************************************************
// #region Not all the policies are related with NS-Carbon or any other REST Api service. The most
// of them are related with web content, so must be configured in NGINX.
// The configuration done is secure by default with the most restrictive option possible
// All the commented policies are set by default in helmet
const helmet = Helmet();

const permittedCrossDomainPolicies = Helmet.permittedCrossDomainPolicies();
const referrerPolicy = Helmet.referrerPolicy();
const featurePolicy = FeaturePolicy({
  features: {
    accelerometer: ["'none'"],
    ambientLightSensor: ["'none'"],
    autoplay: ["'none'"],
    camera: ["'none'"],
    documentDomain: ["'none'"],
    documentWrite: ["'none'"],
    encryptedMedia: ["'none'"],
    fontDisplayLateSwap: ["'none'"],
    fullscreen: ["'self'"],
    geolocation: ["'none'"],
    gyroscope: ["'none'"],
    layoutAnimations: ["'none'"],
    legacyImageFormats: ["'none'"],
    loadingFrameDefaultEager: ["'none'"],
    magnetometer: ["'none'"],
    microphone: ["'none'"],
    midi: ["'none'"],
    oversizedImages: ["'self'"],
    payment: ["'none'"],
    pictureInPicture: ["'self'"],
    serial: ["'none'"],
    speaker: ["'self'"],
    syncScript: ["'self'"],
    syncXhr: ["'self'"],
    unoptimizedImages: ["'self'"],
    unoptimizedLosslessImages: ["'none'"],
    unoptimizedLossyImages: ["'none'"],
    unsizedMedia: ["'none'"],
    usb: ["'none'"],
    verticalScroll: ["'self'"],
    vibrate: ["'none'"],
    vr: ["'none'"],
    wakeLock: ["'none'"],
    xr: ["'none'"],
  },
});
const contentSecurityPolicy = Helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self"],
  },
});
const emptyMiddleware: RequestHandler = (req, res, next) => {
  next();
};
// #Helmet.xssFilter();
// #Helmet.dnsPrefetchControl();
// #Helmet.ieNoOpen()
// #Helmet.noSniff()
// #Helmet.frameguard({ action: 'deny' });
// #Helmet.hsts({
// #   maxAge: 5184000,
// #  includeSubDomains: false,
// #});
export class Security {
  /**
   * Return an array of security middlewares
   * @param enable - flag to enable or disable the security middleware
   * @returns
   */
  public static handler(enable = true): RequestHandler[] {
    return new Security().handler(enable);
  }
  /**
   * Return an array of security middlewares
   * @param enable - flag to enable or disable the security middleware
   * @returns
   */
  private handler(enable: boolean): RequestHandler[] {
    if (enable) {
      return [
        helmet,
        permittedCrossDomainPolicies,
        referrerPolicy,
        featurePolicy,
        contentSecurityPolicy,
      ];
    } else {
      return [emptyMiddleware];
    }
  }
}
