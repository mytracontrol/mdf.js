/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { coerce, loadFile } from '@mdf.js/utils';
import { logger } from '../../Common';
import { Config } from '../types';
// *************************************************************************************************
// #region Environment variables

/**
 * User name for the AMQP connection
 * @defaultValue 'mdf-amqp'
 */
const CONFIG_AMQP_USER_NAME = process.env['CONFIG_AMQP_USER_NAME'];
/**
 * The secret key to be used while establishing the connection
 * @defaultValue undefined
 */
const CONFIG_AMQP_PASSWORD = process.env['CONFIG_AMQP_PASSWORD'];
/**
 * The hostname of the AMQP server
 * @defaultValue undefined
 */
const CONFIG_AMQP_HOST = process.env['CONFIG_AMQP_HOST'];
/**
 * The hostname presented in `open` frame, defaults to host.
 * @defaultValue 127.0.0.1
 */
const CONFIG_AMQP_HOSTNAME = process.env['CONFIG_AMQP_HOSTNAME'];
/**
 * The port of the AMQP server
 * @defaultValue 5672
 */
const CONFIG_AMQP_PORT = coerce<number>(process.env['CONFIG_AMQP_PORT']);
/**
 * The transport option. This is ignored if connection_details is set.
 * @defaultValue 'tcp'
 */
const CONFIG_AMQP_TRANSPORT = process.env['CONFIG_AMQP_TRANSPORT'];
/**
 * The id of the source container. If not provided then this will be the id (a guid string) of the
 * assocaited container object. When this property is provided, it will be used in the `open` frame
 * to let the peer know about the container id.
 * However, the associated container object would still be the same container object from which the
 * connection is being created.
 *
 * The `"container_id"` is how the peer will identify the 'container' the connection is being
 * established from. The container in AMQP terminology is roughly analogous to a process.
 *
 * Using a different container id on connections from the same process would cause the peer to
 * treat them as coming from distinct processes.
 * @defaultValue process.env['NODE_APP_INSTANCE'] || `mdf-amqp`
 */
const CONFIG_AMQP_CONTAINER_ID = process.env['CONFIG_AMQP_CONTAINER_ID'];
/**
 * A unique name for the connection. If not provided then this will be a string in the following
 * format: "connection-<counter>".
 * @defaultValue undefined
 */
const CONFIG_AMQP_ID = process.env['CONFIG_AMQP_ID'];
/**
 * If true (default), the library will automatically attempt to reconnect if disconnected.
 * If false, automatic reconnect will be disabled.
 * If it is a numeric value, it is interpreted as the delay between reconnect attempts
 * (in milliseconds).
 * @defaultValue 5000
 */
const CONFIG_AMQP_RECONNECT = coerce<number>(process.env['CONFIG_AMQP_RECONNECT']);
/**
 * Maximum number of reconnect attempts.
 * Applicable only when reconnect is true.
 * @defaultValue undefined
 */
const CONFIG_AMQP_RECONNECT_LIMIT = coerce<number>(process.env['CONFIG_AMQP_RECONNECT_LIMIT']);
/**
 * Time to wait in milliseconds before attempting to reconnect. Applicable only when reconnect is
 * true or a number is provided for reconnect.
 * @defaultValue 30000
 */
const CONFIG_AMQP_INITIAL_RECONNECT_DELAY = coerce<number>(
  process.env['CONFIG_AMQP_INITIAL_RECONNECT_DELAY']
);
/**
 * Maximum reconnect delay in milliseconds before attempting to reconnect. Applicable only when
 * reconnect is true.
 * @defaultValue 10000
 */
const CONFIG_AMQP_MAX_RECONNECT_DELAY = coerce<number>(
  process.env['CONFIG_AMQP_MAX_RECONNECT_DELAY']
);
/**
 * The largest frame size that the sending peer is able to accept on this connection.
 * @defaultValue 4294967295
 */
const CONFIG_AMQP_MAX_FRAME_SIZE = coerce<number>(process.env['CONFIG_AMQP_MAX_FRAME_SIZE']);
/**
 * An array of error conditions which if received on connection close from peer should not prevent
 * reconnect (by default this only includes `"amqp:connection:forced"`).
 * @defaultValue ['amqp:connection:forced']
 */
const CONFIG_AMQP_NON_FATAL_ERRORS = process.env['CONFIG_AMQP_NON_FATAL_ERRORS']
  ? process.env['CONFIG_AMQP_NON_FATAL_ERRORS'].split(',')
  : undefined;
/**
 * The path to the CA certificate file
 * @defaultValue undefined
 */
const CONFIG_AMQP_CA_PATH = process.env['CONFIG_AMQP_CA_PATH'];
const CA_CERT = loadFile(CONFIG_AMQP_CA_PATH, logger);
/**
 * The path to the client certificate file
 * @defaultValue undefined
 */
const CONFIG_AMQP_CLIENT_CERT_PATH = process.env['CONFIG_AMQP_CLIENT_CERT_PATH'];
const CLIENT_CERT = loadFile(CONFIG_AMQP_CLIENT_CERT_PATH, logger);
/**
 * The path to the client key file
 * @defaultValue undefined
 */
const CONFIG_AMQP_CLIENT_KEY_PATH = process.env['CONFIG_AMQP_CLIENT_KEY_PATH'];
const CLIENT_KEY = loadFile(CONFIG_AMQP_CLIENT_KEY_PATH, logger);
/**
 * If true the server will request a certificate from clients that connect and attempt to verify
 * that certificate. Defaults to false.
 * @defaultValue false
 */
const CONFIG_AMQP_REQUEST_CERT = coerce<boolean>(process.env['CONFIG_AMQP_REQUEST_CERT']);
/**
 * If true the server will reject any connection which is not authorized with the list of supplied
 * CAs. This option only has an effect if requestCert is true.
 * @defaultValue true
 */
const CONFIG_AMQP_REJECT_UNAUTHORIZED = coerce<boolean>(
  process.env['CONFIG_AMQP_REJECT_UNAUTHORIZED']
);
/**
 * The maximum period in milliseconds between activity (frames) on the connection that is desired
 * from the peer. The open frame carries the idle-time-out field for this purpose.
 * To avoid spurious timeouts, the value in idle_time_out is set to be half of the peer’s actual
 * timeout threshold.
 * @defaultValue 5000
 */
const CONFIG_AMQP_IDLE_TIME_OUT = coerce<number>(process.env['CONFIG_AMQP_IDLE_TIME_OUT']);
/**
 * If true the server will send a keep-alive packet to maintain the connection alive.
 * @defaultValue true
 */
const CONFIG_AMQP_KEEP_ALIVE = coerce<boolean>(process.env['CONFIG_AMQP_KEEP_ALIVE']);
/**
 * The initial delay in milliseconds for the keep-alive packet.
 * @defaultValue 2000
 */
const CONFIG_AMQP_KEEP_ALIVE_INITIAL_DELAY = coerce<number>(
  process.env['CONFIG_AMQP_KEEP_ALIVE_INITIAL_DELAY']
);
/**
 * The time in milliseconds to wait for the connection to be established.
 * @defaultValue 10000
 */
const CONFIG_AMQP_TIMEOUT = coerce<number>(process.env['CONFIG_AMQP_TIMEOUT']);
/**
 * Determines if rhea's auto-reconnect should attempt reconnection on all fatal errors
 * @defaultValue true
 */
const CONFIG_AMQP_ALL_ERRORS_NON_FATAL = coerce<boolean>(
  process.env['CONFIG_AMQP_ALL_ERRORS_NON_FATAL']
);

export const envBasedConfig: Config = {
  username: CONFIG_AMQP_USER_NAME,
  password: CONFIG_AMQP_PASSWORD,
  host: CONFIG_AMQP_HOST,
  hostname: CONFIG_AMQP_HOSTNAME,
  port: CONFIG_AMQP_PORT,
  //@ts-ignore - the configuration options has been changed in the latest version of rhea
  transport: CONFIG_AMQP_TRANSPORT,
  container_id: CONFIG_AMQP_CONTAINER_ID,
  id: CONFIG_AMQP_ID,
  reconnect: CONFIG_AMQP_RECONNECT,
  reconnect_limit: CONFIG_AMQP_RECONNECT_LIMIT,
  initial_reconnect_delay: CONFIG_AMQP_INITIAL_RECONNECT_DELAY,
  max_reconnect_delay: CONFIG_AMQP_MAX_RECONNECT_DELAY,
  max_frame_size: CONFIG_AMQP_MAX_FRAME_SIZE,
  non_fatal_errors: CONFIG_AMQP_NON_FATAL_ERRORS,
  key: CLIENT_KEY?.toString(),
  cert: CLIENT_CERT?.toString(),
  ca: CA_CERT?.toString(),
  requestCert: CONFIG_AMQP_REQUEST_CERT,
  rejectUnauthorized: CONFIG_AMQP_REJECT_UNAUTHORIZED,
  idle_time_out: CONFIG_AMQP_IDLE_TIME_OUT,
  keepAlive: CONFIG_AMQP_KEEP_ALIVE,
  keepAliveInitialDelay: CONFIG_AMQP_KEEP_ALIVE_INITIAL_DELAY,
  timeout: CONFIG_AMQP_TIMEOUT,
  all_errors_non_fatal: CONFIG_AMQP_ALL_ERRORS_NON_FATAL,
};
// #endregion

