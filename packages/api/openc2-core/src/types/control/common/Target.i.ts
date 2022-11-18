/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import {
  Artifact,
  Device,
  Features,
  File,
  IPv4Connection,
  IPv6Connection,
  Process,
} from './targets';

/** The target field in a Command MUST contain exactly one type of Target (e.g., ipv4_net) */
export interface Target {
  /** An array of bytes representing a file-like object or a link to that object */
  artifact?: Artifact;
  /** A reference to a previously issued Command */
  command?: string;
  /** The properties of a hardware device */
  device?: Device;
  /** A network domain name */
  domain_name?: string;
  /** A single email address */
  email_addr?: string;
  /**
   * A set of items used with the query Action to determine an Actuator's capabilities
   * An array of zero to ten names used to query an Actuator for its supported capabilities
   * A Producer MUST NOT send a list containing more than one instance of any Feature.
   * A Consumer receiving a list containing more than one instance of any Feature SHOULD behave as
   * if the duplicate(s) were not present.
   * A Producer MAY send a 'query' Command containing an empty list of features. A Producer could do
   * this to determine if a Consumer is responding to Commands (a heartbeat command) or to generate
   * idle traffic to keep a connection to a Consumer from being closed due to inactivity (a
   * keep-alive command). An active Consumer could return an empty response to this command,
   * minimizing the amount of traffic used to perform heartbeat / keep-alive functions.
   */
  features?: Features[];
  /** Properties of a file */
  file?: File;
  /** An internationalized domain name */
  idn_domain_name?: string;
  /** A single internationalized email address */
  idn_email_addr?: string;
  /** An IPv4 address range including CIDR prefix length */
  ipv4_connection?: IPv4Connection;
  /** An IPv6 address range including prefix length */
  ipv4_net?: string;
  /**
   * A 5-tuple of source and destination IPv4 address ranges, source and destination ports, and
   * protocol
   */
  ipv6_connection?: IPv6Connection;
  /** An IPv6 address range including prefix length */
  ipv6_net?: string;
  /** An internationalized resource identifier (IRI) */
  iri?: string;
  /** A Media Access Control (MAC) address - EUI-48 or EUI-64 as defined in [EUI] */
  mac_addr?: string;
  /** Common properties of an instance of a computer program as executed on an operating system */
  process?: Process;
  /** Data attribute associated with an Actuator */
  properties?: string[];
  /** A uniform resource identifier (URI) */
  uri?: string;
  /** Custom target formats */
  [custom: string]: any;
}
