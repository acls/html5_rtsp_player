import {LogLevel, getTagged, setDefaultLogLevel} from 'bp_logger';
import {Player} from './src/player.js';

// setDefaultLogLevel(LogLevel.Debug);
setDefaultLogLevel(LogLevel.Error);
getTagged("transport:ws").setLevel(LogLevel.Error);
getTagged("client:rtsp").setLevel(LogLevel.Error);

export default {
  LogLevel,
  getTagged,
  setDefaultLogLevel,
  Player,
};