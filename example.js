import {LogLevel, getTagged, setDefaultLogLevel} from 'bp_logger';
import {Player} from './src/player.js';

setDefaultLogLevel(LogLevel.Debug);
// getTagged("transport:ws").setLevel(LogLevel.Error);
// getTagged("client:rtsp").setLevel(LogLevel.Error);

const videoEl = document.getElementById('test_video');
const wsurl = 'ws://0.0.0.0:1680/rtsp/';
let p = new Player(videoEl, wsurl);

const urls = [
    'rtsp://192.168.11.141:8554/h264ESVideoTest',
    '',
    'rtsp://192.168.11.141:8554/h264ESVideoTest',
];

function nextUrl() {
    const url = urls.shift();
    urls.push(url);
    p.setSource(url);
}
setInterval(nextUrl, 10 * 1000);
nextUrl();
