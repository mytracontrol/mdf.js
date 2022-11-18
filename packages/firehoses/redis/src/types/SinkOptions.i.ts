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

import { Routing } from './Routing.i';

export interface SinkOptions {
  /**
   * Routing configuration map, each entry in the map identify the property or properties that must
   * be pick from de data object to be sends to the sink.
   */
  dataMap?: { [type: string]: string | string[] };
  /**
   * Routing configuration map, each entry in the map identify a job type. The routing object define
   * the stream where the data will be written and the size of the stream
   */
  routingMap?: { [type: string]: Routing };
}
