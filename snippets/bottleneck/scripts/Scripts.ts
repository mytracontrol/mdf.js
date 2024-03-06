/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { readFileSync } from 'fs';
import { Headers, Template } from '.';
const lua = JSON.parse(readFileSync(`${__dirname}/lua.json`, 'utf8'));

/** The headers object containing Lua scripts */
export const headers: Headers = {
  refs: lua['refs.lua'],
  validate_keys: lua['validate_keys.lua'],
  validate_client: lua['validate_client.lua'],
  refresh_expiration: lua['refresh_expiration.lua'],
  process_tick: lua['process_tick.lua'],
  conditions_check: lua['conditions_check.lua'],
  get_time: lua['get_time.lua'],
};

/**
 * Retrieves all the keys associated with a specific limiter ID.
 * @param id - The ID of the limiter.
 * @returns An array of keys associated with the limiter.
 */
export const getAllKeys = function (id: string): string[] {
  return [
    /*
		HASH
		*/
    `b_${id}_settings`,
    /*
		HASH
		job index -> weight
		*/
    `b_${id}_job_weights`,
    /*
		ZSET
		job index -> expiration
		*/
    `b_${id}_job_expirations`,
    /*
		HASH
		job index -> client
		*/
    `b_${id}_job_clients`,
    /*
		ZSET
		client -> sum running
		*/
    `b_${id}_client_running`,
    /*
		HASH
		client -> num queued
		*/
    `b_${id}_client_num_queued`,
    /*
		ZSET
		client -> last job registered
		*/
    `b_${id}_client_last_registered`,
    /*
		ZSET
		client -> last seen
		*/
    `b_${id}_client_last_seen`,
  ];
};

/** The templates object containing Lua script templates */
export const templates: Record<string, Template> = {
  init: {
    keys: getAllKeys,
    headers: [headers.process_tick],
    refresh_expiration: true,
    code: lua['init.lua'],
  },
  group_check: {
    keys: getAllKeys,
    headers: [],
    refresh_expiration: false,
    code: lua['group_check.lua'],
  },
  register_client: {
    keys: getAllKeys,
    headers: ['validate_keys'],
    refresh_expiration: false,
    code: lua['register_client.lua'],
  },
  blacklist_client: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client'],
    refresh_expiration: false,
    code: lua['blacklist_client.lua'],
  },
  heartbeat: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick'],
    refresh_expiration: false,
    code: lua['heartbeat.lua'],
  },
  update_settings: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick'],
    refresh_expiration: true,
    code: lua['update_settings.lua'],
  },
  running: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick'],
    refresh_expiration: false,
    code: lua['running.lua'],
  },
  queued: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client'],
    refresh_expiration: false,
    code: lua['queued.lua'],
  },
  done: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick'],
    refresh_expiration: false,
    code: lua['done.lua'],
  },
  check: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick', 'conditions_check'],
    refresh_expiration: false,
    code: lua['check.lua'],
  },
  submit: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick', 'conditions_check'],
    refresh_expiration: true,
    code: lua['submit.lua'],
  },
  register: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick', 'conditions_check'],
    refresh_expiration: true,
    code: lua['register.lua'],
  },
  free: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick'],
    refresh_expiration: true,
    code: lua['free.lua'],
  },
  current_reservoir: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick'],
    refresh_expiration: false,
    code: lua['current_reservoir.lua'],
  },
  increment_reservoir: {
    keys: getAllKeys,
    headers: ['validate_keys', 'validate_client', 'process_tick'],
    refresh_expiration: true,
    code: lua['increment_reservoir.lua'],
  },
};

/** The names of all available templates */
export const names = Object.keys(templates);

/**
 * Retrieves the keys associated with a specific template and limiter ID.
 * @param name - The name of the template.
 * @param id - The ID of the limiter.
 * @returns An array of keys associated with the template and limiter.
 */
export const getTemplateKeys = function (name: string, id: string): string[] {
  return templates[name].keys(id);
};

/**
 * Retrieves the payload of a specific template.
 * @param name - The name of the template.
 * @returns The payload of the template.
 */
export const getTemplatePayload = function (name: string): string {
  const template = templates[name];
  return [
    headers.refs,
    ...template.headers.map((h: string) => headers[h as keyof Headers]),
    template.refresh_expiration ? headers.refresh_expiration : '',
    template.code,
  ].join('\n');
};
