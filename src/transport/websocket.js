import {getTagged} from 'bp_logger';
import {BaseTransport} from "../core/base_transport";
import {CPU_CORES} from "../core/util/browser";
import {JSEncrypt} from 'jsencrypt';

const LOG_TAG = "transport:ws";
const Log = getTagged(LOG_TAG);
const WORKER_COUNT = CPU_CORES;

export class WebsocketTransport extends BaseTransport {
    constructor(wsurl) {
        super();
        this.proxies = [];
        this.currentProxy = 0;
        this.workers = 1;
        this.socket_url = wsurl;
        this.ready = this.connect();
    }

    connect() {
        return this.disconnect().then(()=>{
            let promises = [];
            // TODO: get mirror list
            for (let i=0; i<this.workers; ++i) {
                let proxy = new WebSocketProxy(this.socket_url);

                proxy.set_disconnect_handler((e)=> {
                    this.eventSource.dispatchEvent('disconnected', {code: e.code, reason: e.reason});
                    // TODO: only reconnect on demand
                    if ([1000, 1006, 1013, 1011].includes(e.code)) {
                        setTimeout(()=> {
                            if (this.ready && this.ready.reject) {
                                this.ready.reject();
                            }
                            this.ready = this.connect();
                        }, 3000);
                    }
                });

                proxy.set_control_handler((ctrl)=> {
                    this.ctrlQueue.push(ctrl);
                    this.eventSource.dispatchEvent('control');
                });

                proxy.set_data_handler((data)=> {
                    this.dataQueue.push(new Uint8Array(data));
                    this.eventSource.dispatchEvent('data');
                });

                promises.push(proxy.connect().then(()=> {
                    this.eventSource.dispatchEvent('connected');
                }).catch((e)=> {
                    this.eventSource.dispatchEvent('error');
                    throw new Error(e);
                }));
                this.proxies.push(proxy);
            }
            return Promise.all(promises);
        });
    }

    disconnect() {
        let promises = [];
        for (let i=0; i<this.proxies.length; ++i) {
            this.proxies[i].close();
        }
        this.proxies= [];
        if (this.proxies.length) {
            return Promise.all(promises);
        } else {
            return Promise.resolve();
        }
    }

    socket() {
        return this.proxies[(this.currentProxy++)%this.proxies.length];
    }

    send(_data, fn) {
        this.socket().send(_data);
    }
}

class WebSocketProxy {
    constructor(wsurl) {
        this.url = wsurl;
        this.ctrl_handler = ()=>{};
        this.data_handler = ()=>{};
        this.disconnect_handler = ()=>{};
        this.awaitingPromises = [];
    }

    set_control_handler(handler) {
        this.ctrl_handler = handler;
    }

    set_data_handler(handler) {
        this.data_handler = handler;
    }

    set_disconnect_handler(handler) {
        this.disconnect_handler = handler;
    }

    close() {
        Log.log('closing connection');
        return new Promise((resolve)=>{
            this.ws.onclose = ()=> {
                resolve();
            };
            this.ws.close();
        });
    }

    onDisconnect(){
        this.ws.onclose = null;
        this.ws.close();
        if (this.dataChannel) {
            this.dataChannel.onclose = null;
            this.dataChannel.close();
        }
        this.disconnect_handler(this);
    }

    connect() {
        return new Promise((resolve, reject)=> {
            this.ws = new WebSocket(this.url);
            this.ws.binaryType = 'arraybuffer';

            this.connected = false;

            this.ws.onopen = ()=> {
                resolve();
                // let headers = {
                //     proto: this.stream_type
                // };
                // if (this.endpoint.socket) {
                //     headers.socket = this.endpoint.socket;
                // } else {
                //     Object.assign(headers, {
                //         host:  this.endpoint.host,
                //         port:  this.endpoint.port
                //     })
                // }
                // let msg = this.builder.build(WSPProtocol.CMD_INIT, headers);
                // Log.debug(msg);
                // this.ws.send(this.endpoint);
            };

            let old = false;
            let used = false;
            this.ws.onmessage = (ev)=> {
                if (typeof ev.data === typeof '') {
                    Log.debug(`[text] ${ev.data}`);
                    const p = this.awaitingPromises.shift();
                    if (p) p.resolve(); // ???
                    if (this.ctrl_handler) {
                        this.ctrl_handler(JSON.parse(ev.data));
                    }
                } else {
                    // console.info(ev.timeStamp, window.performance.now());
                    if (!used && ev.timeStamp + 5000 < window.performance.now()) {
                        old = true;
                        Log.debug('[rtp block] ignored old');
                        return;
                    }
                    if (old) {
                        used = true;
                    }
                    Log.debug('[rtp block] ', ev.data.byteLength);
                    if (this.data_handler) {
                        this.data_handler(ev.data);
                    }
                }
            };

            this.ws.onerror = (e)=>{
                Log.error(`[ctrl] ${e.type}`);
                this.ws.close();
            };
            this.ws.onclose = (e)=>{
                Log.error(`[ctrl] ${e.type}. code: ${e.code} ${e.reason || 'unknown reason'}`);
                this.onDisconnect(e);
            };
        });
    }

    send(data) {
        if (this.ws.readyState != WebSocket.OPEN) {
            this.close();
            // .then(this.connect.bind(this));
            // return;
            throw new Error('disconnected');
        }
        Log.debug(data);
        if (typeof data !== typeof '') {
            data = JSON.stringify(data);
        }
        return new Promise((resolve, reject)=> {
            this.awaitingPromises.push({resolve, reject});
            this.ws.send(data);
        });
    }
}