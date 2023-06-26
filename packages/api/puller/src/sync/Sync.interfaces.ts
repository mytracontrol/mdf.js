/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Task item to be scheduled by Sync */
export interface TaskItem {
  task: (...args: any[]) => any;
  args: any[];
  resolve: ((value: any) => void) | null;
  reject: ((reason: any) => void) | null;
}
