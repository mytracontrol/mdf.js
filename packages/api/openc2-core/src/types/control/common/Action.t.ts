/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** The task or activity to be performed (i.e., the 'verb') */
export enum Action {
  /** Permit access to or execution of a Target */
  Allow = 'allow',
  /** Invalidate a previously issued Action */
  Cancel = 'cancel',
  /** Isolate a file, process, or entity so that it cannot modify or access assets or processes */
  Contain = 'contain',
  /** Duplicate an object, file, data flow, or artifact */
  Copy = 'copy',
  /** Add a new entity of a known type (e.g., data, files, directories) */
  Create = 'create',
  /** Remove an entity (e.g., data, files, flows) */
  Delete = 'delete',
  /**
   * Prevent a certain event or action from completion, such as preventing a flow from reaching a
   * destination or preventing access
   */
  Deny = 'deny',
  /**
   * Execute and observe the behavior of a Target (e.g., file, hyperlink) in an isolated
   * environment
   */
  Detonate = 'detonate',
  /**
   * Task the recipient to aggregate and report information as it pertains to a security event or
   * incident
   */
  Investigate = 'investigate',
  /** Find an object physically, logically, functionally, or by organization */
  Locate = 'locate',
  /** Initiate a request for information */
  Query = 'query',
  /** Change the flow of traffic to a destination other than its original destination */
  Redirect = 'redirect',
  /** Task the recipient to eliminate a vulnerability or attack point */
  Remediate = 'remediate',
  /** Stop then start a system or an activity */
  Restart = 'restart',
  /** Return a system to a previously known state */
  Restore = 'restore',
  /** Systematic examination of some aspect of the entity or its environment */
  Scan = 'scan',
  /** Change a value, configuration, or state of a managed entity */
  Set = 'set',
  /** Initiate a process, application, system, or activity */
  Start = 'start',
  /** Halt a system or end an activity */
  Stop = 'stop',
  /**
   * Instruct a component to retrieve, install, process, and operate in accordance with a software
   * update, reconfiguration, or other update
   */
  Update = 'update',
}

export type ActionType = `${Action}`;
export const ACTION_TYPES: ActionType[] = Object.values(Action);
