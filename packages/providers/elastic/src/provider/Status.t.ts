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
