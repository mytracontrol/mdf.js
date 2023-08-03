import { RemoteInfo, SocketType } from 'dgram';
import { Authorizer, AuthorizerOptions } from '../authorizer';
import { PduType, Version3 } from '../constants';
import { Engine } from '../engine';
import { ProcessingError, RequestInvalidError } from '../errors';
import { Listener, ListenerFormattedCallbackData } from '../listener';
import { Message } from '../message';
import {
  RECEIVER_DEFAULT_CONTEXT,
  RECEIVER_DEFAULT_DISABLE_AUTHORIZATION,
  RECEIVER_DEFAULT_ENGINE_BOOTS,
  RECEIVER_DEFAULT_ENGINE_TIME,
  RECEIVER_DEFAULT_INCLUDE_AUTHENTICATION,
  RECEIVER_DEFAULT_PORT,
  RECEIVER_DEFAULT_TRANSPORT,
} from './Receiver.constants';
import { ReceiverCallback, ReceiverOptions } from './Receiver.interfaces';

export class Receiver {
  private listener: Listener;
  private authorizer: Authorizer;
  private engine: Engine;

  // TODO: Not used, nor passed to Engine constructor
  private engineBoots: number;
  private engineTime: number;
  private disableAuthorization: boolean;

  private _callback: ReceiverCallback;
  private family: SocketType;
  private port: number;
  private includeAuthentication: boolean;
  private context: string;

  constructor(options: ReceiverOptions, callback: ReceiverCallback) {
    // TODO: Added default as per doc.
    const authorizerOptions: AuthorizerOptions = {
      disableAuthorization: options.disableAuthorization || RECEIVER_DEFAULT_DISABLE_AUTHORIZATION,
      accessControlModelType: options.accessControlModelType,
    };
    this.authorizer = new Authorizer(authorizerOptions);

    // TODO: Check. If undefined engineID, default assigned on Engine constructor
    this.engine = new Engine(options.engineID);

    this.engineBoots = RECEIVER_DEFAULT_ENGINE_BOOTS;
    this.engineTime = RECEIVER_DEFAULT_ENGINE_TIME;
    // TODO: Delete. Reassigned below
    // this.disableAuthorization = RECEIVER_DEFAULT_DISABLE_AUTHORIZATION;

    this._callback = callback;
    this.family = options.transport || RECEIVER_DEFAULT_TRANSPORT;
    this.port = options.port || RECEIVER_DEFAULT_PORT;
    options.port = this.port;
    this.disableAuthorization =
      options.disableAuthorization || RECEIVER_DEFAULT_DISABLE_AUTHORIZATION;
    this.includeAuthentication =
      options.includeAuthentication || RECEIVER_DEFAULT_INCLUDE_AUTHENTICATION;
    this.context = options && options.context ? options.context : RECEIVER_DEFAULT_CONTEXT;

    const listenerOptions = {
      transport: options.transport || RECEIVER_DEFAULT_TRANSPORT,
      port: options.port || RECEIVER_DEFAULT_PORT,
      address: options.address || null,
      disableAuthorization: options.disableAuthorization || RECEIVER_DEFAULT_DISABLE_AUTHORIZATION,
    };
    this.listener = new Listener(listenerOptions, this);
  }

  public get callback(): ReceiverCallback {
    return this._callback;
  }

  public getAuthorizer(): Authorizer {
    return this.authorizer;
  }

  public onMsg(buffer: Buffer, rinfo: RemoteInfo): void {
    try {
      const message = Listener.processIncoming(buffer, this.authorizer, this._callback);
      // TODO: Added !message.pdu
      if (!message || !message.pdu) {
        return;
      }

      // The only GetRequest PDUs supported are those used for SNMPv3 discovery
      if (message.pdu.type == PduType.GetRequest) {
        if (message.version != Version3) {
          this._callback(
            new RequestInvalidError(`Only SNMPv3 discovery GetRequests are supported`)
          );
          return;
        } else if (message.hasAuthentication()) {
          this._callback(
            new RequestInvalidError(
              `Only discovery (noAuthNoPriv) GetRequests are supported but this message has authentication`
            )
          );
          return;
        } else if (!message.isReportable()) {
          this._callback(
            new RequestInvalidError(
              `Only discovery GetRequests are supported and this message does not have the reportable flag set`
            )
          );
          return;
        }
        const reportMessage = message.createReportResponseMessage(this.engine, this.context);
        this.listener.send(reportMessage, rinfo);
        return;
      }

      // Inform/trap processing
      if (message.pdu.type == PduType.Trap || message.pdu.type == PduType.TrapV2) {
        this._callback(null, this.formatCallbackData(message, rinfo));
      } else if (message.pdu.type == PduType.InformRequest) {
        message.pdu.type = PduType.GetResponse;
        message.buffer = null;
        message.setReportable(false);
        this.listener.send(message, rinfo);
        message.pdu.type = PduType.InformRequest;
        this._callback(null, this.formatCallbackData(message, rinfo));
      } else {
        this._callback(
          new RequestInvalidError(
            `Unexpected PDU type ${message.pdu.type} (${PduType[message.pdu.type]})`
          )
        );
      }
    } catch (error) {
      this._callback(
        new ProcessingError(`Failure to process incoming message`, error, rinfo, buffer)
      );
    }
  }

  public formatCallbackData(message: Message, rinfo: RemoteInfo): ListenerFormattedCallbackData {
    // TODO: Added, check
    if (!message.pdu) {
      throw new Error(`Error at formatCallbackData(): PDU in message is null`);
    }

    if (message.pdu.contextEngineID) {
      message.pdu.contextEngineID = message.pdu?.contextEngineID.toString('hex');
    }
    delete message.pdu.nonRepeaters;
    delete message.pdu.maxRepetitions;
    const formattedData = {
      pdu: message.pdu,
      rinfo: rinfo,
    };
    if (this.includeAuthentication) {
      if (message.community) {
        formattedData.pdu.community = message.community;
      } else if (message.user) {
        formattedData.pdu.user = message.user.name;
      }
    }

    return formattedData;
  }

  public close(): void {
    this.listener.close();
  }

  // TODO: Doc: createReceiver()
  public static create(
    options: ReceiverOptions,
    callback: (error: Error | null, data?: ListenerFormattedCallbackData) => void
  ): Receiver {
    const receiver = new Receiver(options, callback);
    receiver.listener.startListening();
    return receiver;
  }
}
