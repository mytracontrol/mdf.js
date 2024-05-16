/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { SASLFrame } from './SASLFrame.i';

/**
 * A SASL init frame
 * @see https://docs.oasis-open.org/amqp/core/v1.0/os/amqp-core-security-v1.0-os.html#type-sasl-init
 */
export interface Init extends SASLFrame {
  /**
   * The name of the SASL mechanism used for the SASL exchange. If the selected mechanism is not
   * supported by the receiving peer, it MUST close the connection with the authentication-failure
   * close-code. Each peer MUST authenticate using the highest-level security profile it can handle
   * from the list provided by the partner.
   */
  mechanism: string;
  /**
   * A block of opaque data passed to the security mechanism. The contents of this data are defined
   * by the SASL security mechanism
   */
  initialResponse?: Buffer;
  /**
   * The DNS name of the host (either fully qualified or relative) to which the sending peer is
   * connecting. It is not mandatory to provide the hostname. If no hostname is provided the
   * receiving peer SHOULD select a default based on its own configuration.
   * This field can be used by AMQP proxies to determine the correct back-end service to connect the
   * client to, and to determine the domain to validate the client’s credentials against.
   * This field might already have been specified by the server name indication extension as
   * described in RFC-4366 [RFC4366], if a TLS layer is used, in which case this field SHOULD either
   * be null or contain the same value. It is undefined what a different value to those already
   * specified means.
   */
  hostname?: string;
}
