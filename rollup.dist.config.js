// import babel from 'rollup-plugin-babel';
import buble from 'rollup-plugin-buble';
import alias from 'rollup-plugin-alias';

const path = require('path');

export default {
    entry: path.join(__dirname, 'html5_rtsp_player.js'),
    moduleName: 'RTSP',
    targets: [
        {dest: path.join(__dirname, 'dist/html5_rtsp_player.js'), format: 'iife'}
    ],
    sourceMap: true,
    plugins: [
        //buble({
            //exclude: 'node_modules/**'
        //}),
        alias({
            bp_logger: path.join(__dirname,'node_modules/bp_logger/logger.js'),
            bp_event: path.join(__dirname,'node_modules/bp_event/event.js'),
            bp_statemachine: path.join(__dirname,'node_modules/bp_statemachine/statemachine.js'),
            jsencrypt: path.join(__dirname,'node_modules/jsencrypt/src/jsencrypt.js'),
            rtsp: path.join(__dirname,'node_modules/html5_rtsp_player/src'),
            // src: path.join(__dirname,'src')
        })
    ]

}