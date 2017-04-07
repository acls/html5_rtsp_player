import {Remuxer} from './core/remuxer/remuxer';
import {RTSPClient} from './client/rtsp/client';
import {WebsocketTransport} from './transport/websocket';

export class Player {
    constructor(playerEl, wsurl) {//, url) {
        this.player = playerEl;
        this.transport = new WebsocketTransport(wsurl);
        this.client = new RTSPClient(this.transport);
        this.remuxer = new Remuxer(this.player);
        this.remuxer.attachClient(this.client);
        // this.setSource(url);
        // if (this.player.autoplay) {
        //     this.start();
        // }

        // this.player.addEventListener('durationchange', ()=> {
        //     const {duration, currentTime} = this.player;
        //     // console.log('duration changed', duration, currentTime);
        //     if (currentTime + 1 < duration) {
        //         this.player.currentTime = duration;
        //     }
        //
        //     // if (duration > 20) {
        //     //     this.remuxer.mse.initCleanup();
        //     // }
        // }, false);

        this.player.addEventListener('play', ()=> {
            if (!this.isPlaying()) {
                this.start();
            }
        }, false);
        this.player.addEventListener('pause', ()=> {
            this.stop();
        }, false);

        this.playTimer = setInterval(()=> {
            if (!this.isPlaying()) {
                this.player.play();
            }
        }, 5000);
    }

    isPlaying() {
        return !(this.player.paused || this.client.paused);
    }
    setSource(url) {
        this.client.setSource(url);
    }
    start() {
        this.client.start();
    }
    stop() {
        this.client.stop();
    }

    destroy() {
        clearTimeout(this.playTimer);
        this.client.destroy();
        return this.transport.disconnect();
    }
}