/**
 * Copyright 2021 Netin Systems S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin Systems S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin Systems S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin Systems S.L.
 */

/**
 * Object with the key information of the requested resource in the REST API context
 * @category Boom
 * @public
 */
export interface APISource {
  /** Pointer to the associated resource in the request [e.g."data/job/title"] */
  pointer: string;
  /** A string indicating which URI query parameter caused the error */
  parameter: {
    [x: string]: any;
  };
}
