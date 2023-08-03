import { AgentCallback } from '../agent/Agent.interfaces';
import { Version3 } from '../constants';
import { Listener } from '../listener';
import { Session } from '../session';
import { AGENT_DEFAULT_PORT, AGENT_DEFAULT_TRANSPORT } from './Forwarder.constants';
import { ForwarderProxy, ForwarderProxyComplete } from './Forwarder.interfaces';

export class Forwarder {
  proxies: { [proxyName: string]: ForwarderProxyComplete };
  listener: Listener;
  callback: AgentCallback;

  constructor(listener: Listener, callback: AgentCallback) {
    this.proxies = {};
    this.listener = listener;
    this.callback = callback;
  }

  addProxy(proxy: ForwarderProxy): void {
    // TODO: Done. Set default values. Because prop with def vals should
    // not be undefined when trying to access from outside (e.g. Agent.onProxyRequest)
    const options = {
      version: Version3,
      port: proxy.port || AGENT_DEFAULT_PORT,
      transport: proxy.transport || AGENT_DEFAULT_TRANSPORT,
    };

    const proxyComplete: ForwarderProxyComplete = {
      port: AGENT_DEFAULT_PORT,
      transport: AGENT_DEFAULT_TRANSPORT,
      ...proxy,
      session: Session.createV3(proxy.target, proxy.user, options),
    };

    proxyComplete.session.proxy = proxyComplete;
    proxyComplete.session.proxy.listener = this.listener;
    this.proxies[proxyComplete.context] = proxyComplete;
    proxyComplete.session.sendV3Discovery(null, null, this.callback);
  }

  deleteProxy(proxyName: string): void {
    const proxy = this.proxies[proxyName];

    if (proxy && proxy.session) {
      proxy.session.close();
    }
    delete this.proxies[proxyName];
  }

  getProxy(proxyName: string): ForwarderProxyComplete | undefined {
    return this.proxies[proxyName];
  }

  getProxies(): { [proxyName: string]: ForwarderProxyComplete } {
    return this.proxies;
  }

  dumpProxies(): void {
    const dump = {};
    for (const proxy of Object.values(this.proxies)) {
      dump[proxy.context] = {
        context: proxy.context,
        target: proxy.target,
        user: proxy.user,
        port: proxy.port,
      };
    }
    console.log(JSON.stringify(dump, null, 2));
  }
}
