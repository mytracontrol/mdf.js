import { RemoteInfo, Socket, SocketType, createSocket } from 'dgram';
import { ListenerFormattedCallbackData, ListenerOptions } from '.';
import { Agent, AgentCallback } from '../agent';
import { Authorizer } from '../authorizer';
import { SecurityLevel, Version3 } from '../constants';
import { RequestFailedError } from '../errors';
import { Message } from '../message';
import { Pdu } from '../pdu/pduUtils';
import { Receiver } from '../receiver';
import { User } from '../user.interface';

export class Listener {
  private _receiver: Agent | Receiver;
  private _callback: (buffer: Buffer, rinfo: RemoteInfo) => void;
  private _family: SocketType;
  private _port: number;
  private _address: string | null;
  private _disableAuthorization: boolean;
  private _dgram: Socket;

  constructor(options: ListenerOptions, receiver: Agent | Receiver) {
    this._receiver = receiver;
    // TODO: Added bind
    this._callback = receiver.onMsg.bind(receiver);
    // TODO: Check. Default already set from Agent
    this._family = options.transport || 'udp4';
    this._port = options.port || 161;
    this._address = options.address;
    this._disableAuthorization = options.disableAuthorization || false;
  }

  public startListening() {
    this._dgram = createSocket(this._family);
    this._dgram.on('error', this._receiver.callback);
    // TODO: Check added bc address default is null (doc)
    if (this._address == null) {
      this._dgram.bind(this._port);
    } else {
      this._dgram.bind(this._port, this._address);
    }
    this._dgram.on('message', this._callback.bind(this._receiver));
  }

  public send(message: Message, rinfo: RemoteInfo) {
    const buffer = message.toBuffer();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sendCallback = (error: Error | null, _bytes: number) => {
      if (error) {
        console.error(`Error sending: ${error.message}`);
      } else {
        // debug ("Listener sent response message");
      }
    };

    this._dgram.send(buffer, 0, buffer.length, rinfo.port, rinfo.address, sendCallback);
  }

  public static formatCallbackData(pdu: Pdu, rinfo: RemoteInfo): ListenerFormattedCallbackData {
    if (pdu.contextEngineID) {
      pdu.contextEngineID = pdu.contextEngineID.toString('hex');
    }
    // TODO: Check if delete is ok when pdu is an instance of ...Pdu (optional)
    delete pdu.nonRepeaters;
    delete pdu.maxRepetitions;
    return {
      pdu: pdu,
      rinfo: rinfo,
    };
  }

  public static processIncoming(
    buffer: Buffer,
    authorizer: Authorizer,
    callback: AgentCallback
  ): Message | void {
    const message = Message.createFromBuffer(buffer);
    let community: string;

    // Authorization
    if (message.version == Version3) {
      message.user = authorizer.users.filter(
        (localUser: User) => localUser.name == message.msgSecurityParameters.msgUserName
      )[0];
      message.disableAuthentication = authorizer.disableAuthorization;
      if (!message.user) {
        if (message.msgSecurityParameters.msgUserName != '' && !authorizer.disableAuthorization) {
          callback(
            new RequestFailedError(
              'Local user not found for message with user ' +
                message.msgSecurityParameters.msgUserName
            )
          );
        } else if (message.hasAuthentication()) {
          callback(
            new RequestFailedError(
              'Local user not found and message requires authentication with user ' +
                message.msgSecurityParameters.msgUserName
            )
          );
        } else {
          message.user = {
            name: '',
            level: SecurityLevel.noAuthNoPriv,
          };
        }
      }
      if (
        (message.user.level == SecurityLevel.authNoPriv ||
          message.user.level == SecurityLevel.authPriv) &&
        !message.hasAuthentication()
      ) {
        callback(
          new RequestFailedError(
            `Local user '${message.msgSecurityParameters.msgUserName}' requires authentication but message does not provide it`
          )
        );
        return;
      }
      if (message.user.level == SecurityLevel.authPriv && !message.hasPrivacy()) {
        callback(
          new RequestFailedError(
            `Local user '${message.msgSecurityParameters.msgUserName}' requires privacy but message does not provide it`
          )
        );
        return;
      }
      if (!message.processIncomingSecurity(message.user, callback)) {
        return;
      }
    } else {
      community = authorizer.communities.filter(
        (localCommunity: string) => localCommunity == message.community
      )[0];
      if (!community && !authorizer.disableAuthorization) {
        callback(
          new RequestFailedError(
            `Local community not found for message with community '${message.community}`
          )
        );
        return;
      }
    }

    return message;
  }

  public close(): void {
    if (this._dgram) {
      this._dgram.close();
    }
  }
}
