/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export type Status = 'none' | 'once' | 'many';

export interface Listener {
  cb: any;
  status: Status;
}

export interface EventsListeners {
  [event: string]: Listener[];
}
