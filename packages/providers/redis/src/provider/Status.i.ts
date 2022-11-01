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

export type ProcessesSupervised = 'upstart' | 'systemd' | 'unknown' | 'no';
export interface ServerStats {
  /** Error parsing message */
  errorParsing?: string;
  /** Version of the Redis server */
  redis_version: string;
  /** Git SHA1 */
  redis_git_sha1: string;
  /** Git dirty flag */
  redis_git_dirty: string;
  /** The build id */
  redis_build_id: string;
  /** The server's mode ("standalone", "sentinel" or "cluster") */
  redis_mode: 'standalone' | 'sentinel' | 'cluster';
  /** Operating system hosting the Redis server */
  os: string;
  /** Architecture (32 or 64 bits) */
  arch_bits: number;
  /** Event loop mechanism used by Redis */
  multiplexing_api: string;
  /** Atomicvar API used by Redis */
  atomicvar_api: string;
  /** Version of the GCC compiler used to compile the Redis server */
  gcc_version: string;
  /** PID of the server process */
  process_id: string;
  /** Supervised system ("upstart", "systemd", "unknown" or "no") */
  process_supervised: ProcessesSupervised;
  /** Random value identifying the Redis server (to be used by Sentinel and Cluster) */
  run_id: string;
  /** TCP/IP listen port */
  tcp_port: string;
  /** Epoch-based system time with microsecond precision */
  server_time_usec: string;
  /** Number of seconds since Redis server start */
  uptime_in_seconds: string;
  /** Same value expressed in days */
  uptime_in_days: string;
  /** The server's current frequency setting */
  hz: string;
  /** The server's configured frequency setting */
  configured_hz: string;
  /** Clock incrementing every minute, for LRU management */
  lru_clock: string;
  /** The path to the server's executable */
  executable: string;
  /** The path to the config file */
  config_file: string;
  /** Flag indicating if I/O threads are active */
  io_threads_active: string;
  /**
   * The maximum time remaining for replicas to catch up the replication before completing the
   * shutdown sequence. This field is only present during shutdown
   */
  shutdown_in_milliseconds: string;
}
export interface MemoryStats {
  /** Error parsing message */
  errorParsing?: string;
  /**
   * Total number of bytes allocated by Redis using its allocator (either standard libc, jemalloc,
   * or an alternative allocator such as tcmalloc)
   */
  used_memory: string;
  /** Human readable representation of previous value */
  used_memory_human: string;
  /**
   * Number of bytes that Redis allocated as seen by the operating system (a.k.a resident set
   * size). This is the number reported by tools such as top(1) and ps(1)
   */
  used_memory_rss: string;
  /** Human readable representation of previous value */
  used_memory_rss_human: string;
  /** Peak memory consumed by Redis (in bytes) */
  used_memory_peak: string;
  /** Human readable representation of previous value */
  used_memory_peak_human: string;
  /** The percentage of used_memory_peak out of used_memory */
  used_memory_peak_perc: string;
  /**
   * The sum in bytes of all overheads that the server allocated for managing its internal data
   * structures
   */
  used_memory_overhead: string;
  /** Initial amount of memory consumed by Redis at startup in bytes */
  used_memory_startup: string;
  /** The size in bytes of the dataset (used_memory_overhead subtracted from used_memory) */
  used_memory_dataset: string;
  /**
   * The percentage of used_memory_dataset out of the net memory usage (used_memory minus
   * used_memory_startup)
   */
  used_memory_dataset_perc: string;
  /** The total amount of memory that the Redis host has */
  total_system_memory: string;
  /** Human readable representation of previous value */
  total_system_memory_human: string;
  /** Number of bytes used by the Lua engine */
  used_memory_lua: string;
  /** Human readable representation of previous value */
  used_memory_lua_human: string;
  /** Number of bytes used by cached Lua scripts */
  used_memory_scripts: string;
  /** Human readable representation of previous value */
  used_memory_scripts_human: string;
  /** The value of the maxmemory configuration directive */
  maxmemory: string;
  /** Human readable representation of previous value */
  maxmemory_human: string;
  /** The value of the maxmemory-policy configuration directive */
  maxmemory_policy: string;
  /**
   * Ratio between used_memory_rss and used_memory. Note that this doesn't only includes
   * fragmentation, but also other process overheads (see the allocator_* metrics), and also
   * overheads like code, shared libraries, stack, etc.
   */
  mem_fragmentation_ratio: string;
  /**
   * Delta between used_memory_rss and used_memory. Note that when the total fragmentation bytes
   * is low (few megabytes), a high ratio (e.g. 1.5 and above) is not an indication of an issue
   */
  mem_fragmentation_bytes: string;
  /**
   * Ratio between allocator_active and allocator_allocated. This is the true (external)
   * fragmentation metric (not mem_fragmentation_ratio).
   */
  allocator_frag_ratio: string;
  /**
   * Delta between allocator_active and allocator_allocated. See note about
   * mem_fragmentation_bytes.
   */
  allocator_frag_bytes: string;
  /**
   * Ratio between allocator_resident and allocator_active. This usually indicates pages that the
   * allocator can and probably will soon release back to the OS
   */
  allocator_rss_ratio: string;
  /** Delta between allocator_resident and allocator_active */
  allocator_rss_bytes: string;
  /**
   * Ratio between used_memory_rss (the process RSS) and allocator_resident. This includes RSS
   * overheads that are not allocator or heap related
   */
  rss_overhead_ratio: string;
  /** Delta between used_memory_rss (the process RSS) and allocator_resident */
  rss_overhead_bytes: string;
  /**
   * Total bytes allocated form the allocator, including internal-fragmentation. Normally the same
   * as used_memory
   */
  allocator_allocated: string;
  /** Total bytes in the allocator active pages, this includes external-fragmentation. */
  allocator_active: string;
  /**
   * Total bytes resident (RSS) in the allocator, this includes pages that can be released to the
   * OS (by MEMORY PURGE, or just waiting)
   */
  allocator_resident: string;
  /**
   * Used memory that's not counted for key eviction. This is basically transient replica and AOF
   * buffers
   */
  mem_not_counted_for_evict: string;
  /**
   * Memory used by replica clients - Starting Redis 7.0, replica buffers share memory with the
   * replication backlog, so this field can show 0 when replicas don't trigger an increase of
   * memory usage
   */
  mem_clients_slaves: string;
  /** Memory used by normal clients */
  mem_clients_normal: string;
  /** Memory used by links to peers on the cluster bus when cluster mode is enabled. */
  mem_cluster_links: string;
  /** Transient memory used for AOF and AOF rewrite buffers */
  mem_aof_buffer: string;
  /** Memory used by replication backlog */
  mem_replication_backlog: string;
  /** Total memory consumed for replication buffers - Added in Redis 7.0. */
  mem_total_replication_buffers: string;
  /** Memory allocator, chosen at compile time. */
  mem_allocator: string;
  /**
   * When activedefrag is enabled, this indicates whether defragmentation is currently active, and
   * the CPU percentage it intends to utilize
   */
  active_defrag_running: string;
  /**
   * The number of objects waiting to be freed (as a result of calling UNLINK, or FLUSHDB and
   * FLUSHALL with the ASYNC option)
   */
  lazyfree_pending_objects: string;
  /** The number of objects that have been lazy freed. */
  lazyfreed_objects: string;
}
export interface Status {
  /** Redis server information section */
  server: ServerStats;
  /** Redis memory information section */
  memory: MemoryStats;
}
