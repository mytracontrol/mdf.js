/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Status */
export type Status = {
  /** Timestamp */
  epoch: number;
  /** Timestamp */
  timestamp: string;
  /** Health status */
  status: 'red' | 'yellow' | 'green';
  /** Cluster name */
  cluster: string;
  /** Total number of nodes */
  'node.total': number;
  /** Number of nodes than can store data */
  'node.data': number;
  /** Number of shards */
  shards: number;
  /** Number of primary shards */
  pri: number;
  /** Number of relocating nodes */
  relo: number;
  /** Number of initializing nodes */
  init: number;
  /** Number of unassigned shards */
  unassign: number;
  /** Number of pending tasks */
  pending_tasks: number;
  /** Wait time of longest task pending */
  max_task_wait_time: number;
  /** Active number of shards in percent */
  active_shards_percent: string;
}[];

