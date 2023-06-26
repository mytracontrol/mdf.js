/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Events listener status */
export type Status = 'none' | 'once' | 'many';

/** Listener managed by Events class*/
export interface Listener {
  cb: any;
  status: Status;
}

/** Events listeners mapped by event name*/
export interface EventsListeners {
  [event: string]: Listener[];
}
