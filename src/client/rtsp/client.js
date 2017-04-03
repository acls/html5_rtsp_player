import {StateMachine} from 'bp_statemachine';
import {SDPParser} from '../../core/parsers/sdp';
import {NALU} from '../../core/elementary/NALU';
// import {RTSPStream} from './stream_joy4';
// import {RTP} from './rtp/rtp';
import RTPFactory from './rtp/factory';
import {MessageBuilder} from './message';
import {RTPPayloadParser} from './rtp/payload/parser';
import {BaseClient} from '../../core/base_client';
import {getTagged} from 'bp_logger';
import {PayloadType} from '../../core/defs';
import {base64ToArrayBuffer, hexToByteArray} from '../../core/util/binary';
import {AACParser} from '../../core/parsers/aac';

const LOG_TAG = "client:rtsp";
const Log = getTagged(LOG_TAG);

export class RTPError {
    constructor(message, file, line) {
        //super(message, file, line);
    }
}

export class RTSPClient extends BaseClient {
    constructor(transport, options={flush: 200}) {
        super(transport, options);
        this.clientSM = new RTSPClientSM(this, transport);
        this.clientSM.ontracks = (tracks)=> {
            this.eventSource.dispatchEvent('tracks', tracks);
            this.startStreamFlush();
        };
        this.clientSM.untracks = ()=> {
            this.stopStreamFlush();
        };
        this.sampleQueues = {};
    }

    static streamType() {
        return 'rtsp';
    }

    setSource(url) {
        super.setSource(url);
        this.clientSM.setSource(url);
    }

    destroy() {
        this.clientSM.destroy();
        return super.destroy();
    }

    start() {
        // if (!this.url) return;
        super.start();
        this.transport.ready.then(()=> {
            this.clientSM.start();
        });
    }

    onControl(ctrl) {
        this.clientSM.onControl(ctrl);
    }

    onData(data) {
        this.clientSM.onData(data);
    }

    onConnected() {
        this.clientSM.onConnected();
        super.onConnected();
    }

    onDisconnected() {
        super.onDisconnected();
        this.clientSM.onDisconnected();
    }
}

export class RTSPClientSM extends StateMachine {
    static get STATE_INITIAL() {return  1 << 0;}
    static get STATE_START() {return  1 << 1;}
    static get STATE_OPEN() {return  1 << 2;}
    static get STATE_TEARDOWN() {return  1 << 3;}

    constructor(parent, transport) {
        super();

        this.parent = parent;
        this.transport = transport;
        this.payParser = new RTPPayloadParser();
        this.rtp_channels = new Set();
        this.ontracks = null;
        this.untracks = null;

        this.reset();

        this.addState(RTSPClientSM.STATE_INITIAL, {
        }).addState(RTSPClientSM.STATE_START, {
            activate: this.sendStart,
            finishTransition: ()=> {
                return this.transitionTo(RTSPClientSM.STATE_OPEN)
            },
        }).addState(RTSPClientSM.STATE_OPEN, {
        }).addState(RTSPClientSM.STATE_TEARDOWN, {
            activate: ()=>{
                this.started = false;
            },
            finishTransition: ()=>{
                return this.transitionTo(RTSPClientSM.STATE_INITIAL)
            }
        }).addTransition(RTSPClientSM.STATE_INITIAL, RTSPClientSM.STATE_START)
            .addTransition(RTSPClientSM.STATE_START, RTSPClientSM.STATE_OPEN)
            .addTransition(RTSPClientSM.STATE_OPEN, RTSPClientSM.STATE_START)
            .addTransition(RTSPClientSM.STATE_OPEN, RTSPClientSM.STATE_TEARDOWN)
            .addTransition(RTSPClientSM.STATE_START, RTSPClientSM.STATE_TEARDOWN)
            .addTransition(RTSPClientSM.STATE_INITIAL, RTSPClientSM.STATE_TEARDOWN)
            .addTransition(RTSPClientSM.STATE_TEARDOWN, RTSPClientSM.STATE_INITIAL);

        this.transitionTo(RTSPClientSM.STATE_INITIAL);

        this.shouldReconnect = false;

        // TODO: remove listeners
        // this.connection.eventSource.addEventListener('connected', ()=>{
        //     if (this.shouldReconnect) {
        //         this.reconnect();
        //     }
        // });
        // this.connection.eventSource.addEventListener('disconnected', ()=>{
        //     if (this.started) {
        //         this.shouldReconnect = true;
        //     }
        // });
        // this.connection.eventSource.addEventListener('data', (data)=>{
        //     let channel = new DataView(data).getUint8(1);
        //     if (this.rtp_channels.has(channel)) {
        //         this.onRTP({packet: new Uint8Array(data, 4), type: channel});
        //     }
        //
        // });
    }

    destroy() {
        this.parent = null;
    }

    onConnected() {
        this.rtpFactory = null;
        if (this.shouldReconnect) {
            this.reconnect();
        }
    }
    onDisconnected() {
        this.reset();
        this.shouldReconnect = true;
        return this.transitionTo(RTSPClientSM.STATE_TEARDOWN);
    }

    setSource(url) {
        this.url = url;
        this.reconnect();
    }
    start() {
        // this.reconnect();
    }
    stop() {
        this.shouldReconnect = false;
        // this.mse = null;
    }

    sendStart() {
        this.send(this.url);
        return Promise.resolve();
    }


    onControl(resp) {
        switch (resp.id) {
        case 'rtsp':
            this.handleCtrl(resp.result);
            break;
        case 'stopped':
        case 'error':
            this.transitionTo(RTSPClientSM.STATE_TEARDOWN);
            break;
        }
    }

    onData(data) {
        if (!this.ready) return;
        let channel = data[1];
        this.onRTP({packet: data.subarray(4), type: channel});
    }

    reset() {
        this.ready = false;
        if (this.untracks) {
            this.untracks();
        }
        this.parent.eventSource.dispatchEvent('clear');
        this.methods = [];
        this.track = null;
        this.sdp = null;
        this.session = null;
        this.timeOffset = {};
    }

    reconnect() {
        this.state = RTSPClientSM.STATE_INITIAL;
        // this.reset();
        if (this.currentState && this.currentState.name != RTSPClientSM.STATE_INITIAL) {
            this.transitionTo(RTSPClientSM.STATE_TEARDOWN).then(()=> {
                this.transitionTo(RTSPClientSM.STATE_START);
            });
        } else {
            this.transitionTo(RTSPClientSM.STATE_START);
        }
    }

    supports(method) {
        return this.methods.includes(method)
    }

    parse(payload) {
        Log.debug(payload);
        let d = payload.split('\r\n\r\n');
        let parsed =  MessageBuilder.parse(d[0]);
        let len = Number(parsed.headers['content-length']);
        if (len) {
            // let d = payload.split('\r\n\r\n');
            parsed.body = d[1];
        } else {
            parsed.body="";
        }
        return parsed
    }

    send(_data) {
        this.transport.ready.then(()=> {
            Log.debug(_data);
            this.transport.send(_data);
        });
    }

    // handleOptions(data) {
    //     this.reset();
    //     this.started = true;
    //     this.cSeq = 0;
    //     this.methods = data.headers['public'].split(',').map((e)=>e.trim());
    // }

    handleCtrl(resps) {
        this.reset();
        // DESCRIBE
        this.handleDescribe(this.parse(resps.DESCRIBE));
        // SETUP
        // this.handleSetup(this.parse(resps.SETUP));
        // PLAY
        this.handlePlay(this.parse(resps.PLAY));
    }
    handleDescribe(data) {
        this.sdp = new SDPParser();
        if (!this.sdp.parse(data.body)) {
            throw new Error("Failed to parse SDP");
        }
        this.tracks = this.sdp.getMediaBlockList();
        if (!this.tracks.length) {
            throw new Error("No video track in SDP");
        }
        this.rtpFactory = new RTPFactory(this.sdp);
    }
    handlePlay(data) {
        // let streams=[];
        let tracks = [];

        // TODO: select first video and first audio tracks
        for (let track_type of this.tracks) {
            Log.log("setup track: "+track_type);
            // if (track_type=='audio') continue;
            // if (track_type=='video') continue;
            let track = this.sdp.getMediaBlock(track_type);
            if (!PayloadType.string_map[track.rtpmap[track.fmt[0]].name]) continue;

            // this.streams[track_type] = new RTSPStream(this, track);
            // let playPromise = this.streams[track_type].start();
            this.parent.sampleQueues[PayloadType.string_map[track.rtpmap[track.fmt[0]].name]]=[];
            let timeOffset = 0;
            try {
                let rtp_info = data.headers["rtp-info"].split(';');
                this.timeOffset[track.fmt[0]] = Number(rtp_info[rtp_info.length - 1].split("=")[1]) ;
            } catch (e) {
                this.timeOffset[track.fmt[0]] = new Date().getTime();
            }

            let params = {
                timescale: 0,
                scaleFactor: 0
            };
            if (track.fmtp['sprop-parameter-sets']) {
                let sps_pps = track.fmtp['sprop-parameter-sets'].split(',');
                params = {
                    sps:base64ToArrayBuffer(sps_pps[0]),
                    pps:base64ToArrayBuffer(sps_pps[1])
                };
            } else if (track.fmtp['config']) {
                let config = track.fmtp['config'];
                this.has_config = track.fmtp['cpresent']!='0';
                let generic = track.rtpmap[track.fmt[0]].name == 'MPEG4-GENERIC';
                if (generic) {
                    params={config:
                        AACParser.parseAudioSpecificConfig(hexToByteArray(config))
                    };
                    this.payParser.aacparser.setConfig(params.config);
                } else if (config) {
                    // todo: parse audio specific config for mpeg4-generic
                    params={config:
                        AACParser.parseStreamMuxConfig(hexToByteArray(config))
                    };
                    this.payParser.aacparser.setConfig(params.config);
                }
            }
            params.duration = this.sdp.sessionBlock.range?this.sdp.sessionBlock.range[1]-this.sdp.sessionBlock.range[0]:1;
            this.parent.seekable = (params.duration > 1);
            tracks.push({
                track: track,
                offset: timeOffset,
                type: PayloadType.string_map[track.rtpmap[track.fmt[0]].name],
                params: params,
                duration: params.duration
            });
        }
        this.ready = true;
        if (this.ontracks) {
            this.ontracks(tracks);
        }
    }

    onRTP(_data) {
        if (!this.rtpFactory) return;

        let rtp = this.rtpFactory.build(_data.packet, this.sdp);
        rtp.timestamp -= this.timeOffset[rtp.pt];
        // Log.debug(rtp);
        if (rtp.media) {
            let pay = this.payParser.parse(rtp);
            if (pay) {
                // if (pay.nftype !== 5) {
                //     console.log('+++++++++++++++not idr frame, skipping');
                //     return;
                // }
                // console.log('+++++++++++++++adding idr frame');
                this.parent.sampleQueues[rtp.type].push([pay]);
            }
        }

        // this.remuxer.feedRTP();
    }
}