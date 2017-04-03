
const videoEl = document.getElementById('test_video');
const wsurl = 'ws://0.0.0.0:1680/rtsp/';
const p = new RTSP.Player(videoEl, wsurl);

const urls = [
  'rtsp://192.168.11.141:8554/h264ESVideoTest',
  '',
  'rtsp://192.168.11.141:8554/h264ESVideoTest',
];

setTimeout(function() {
  function nextUrl() {
    const url = urls.shift();
    console.log('++++++++++++nextUrl', url);
    urls.push(url);
    p.setSource(url);
  }
  setInterval(nextUrl, 30 * 1000);
  nextUrl();
}, 1000);
