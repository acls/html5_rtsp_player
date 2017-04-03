// ERROR=0, WARN=1, LOG=2, DEBUG=3
const LogLevel = {
    Error: 0,
    Warn: 1,
    Log: 2,
    Debug: 3
};

let DEFAULT_LOG_LEVEL = LogLevel.Debug;

function setDefaultLogLevel(level) {
    DEFAULT_LOG_LEVEL = level;
}
class Logger {
    constructor(level = DEFAULT_LOG_LEVEL, tag) {
        this.tag = tag;
        this.setLevel(level);
    }
    
    setLevel(level) {
        this.level = level;
    }
    
    static get level_map() { return {
        [LogLevel.Debug]:'log',
        [LogLevel.Log]:'log',
        [LogLevel.Warn]:'warn',
        [LogLevel.Error]:'error'
    }};

    _log(lvl, args) {
        args = Array.prototype.slice.call(args);
        if (this.tag) {
            args.unshift(`[${this.tag}]`);
        }
        if (this.level>=lvl) console[Logger.level_map[lvl]].apply(console, args);
    }
    log(){
        this._log(LogLevel.Log, arguments)
    }
    debug(){
        this._log(LogLevel.Debug, arguments)
    }
    error(){
        this._log(LogLevel.Error, arguments)
    }
    warn(){
        this._log(LogLevel.Warn, arguments)
    }
}

const taggedLoggers = new Map();
function getTagged(tag) {
    if (!taggedLoggers.has(tag)) {
        taggedLoggers.set(tag, new Logger(DEFAULT_LOG_LEVEL, tag));
    }
    return taggedLoggers.get(tag);
}
const Log = new Logger();

/**
 * Generate MP4 Box
 * got from: https://github.com/dailymotion/hls.js
 */

class MP4 {
    static init() {
        MP4.types = {
            avc1: [], // codingname
            avcC: [],
            btrt: [],
            dinf: [],
            dref: [],
            esds: [],
            ftyp: [],
            hdlr: [],
            mdat: [],
            mdhd: [],
            mdia: [],
            mfhd: [],
            minf: [],
            moof: [],
            moov: [],
            mp4a: [],
            mvex: [],
            mvhd: [],
            sdtp: [],
            stbl: [],
            stco: [],
            stsc: [],
            stsd: [],
            stsz: [],
            stts: [],
            tfdt: [],
            tfhd: [],
            traf: [],
            trak: [],
            trun: [],
            trex: [],
            tkhd: [],
            vmhd: [],
            smhd: []
        };

        var i;
        for (i in MP4.types) {
            if (MP4.types.hasOwnProperty(i)) {
                MP4.types[i] = [
                    i.charCodeAt(0),
                    i.charCodeAt(1),
                    i.charCodeAt(2),
                    i.charCodeAt(3)
                ];
            }
        }

        var videoHdlr = new Uint8Array([
            0x00, // version 0
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, 0x00, 0x00, // pre_defined
            0x76, 0x69, 0x64, 0x65, // handler_type: 'vide'
            0x00, 0x00, 0x00, 0x00, // reserved
            0x00, 0x00, 0x00, 0x00, // reserved
            0x00, 0x00, 0x00, 0x00, // reserved
            0x56, 0x69, 0x64, 0x65,
            0x6f, 0x48, 0x61, 0x6e,
            0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'VideoHandler'
        ]);

        var audioHdlr = new Uint8Array([
            0x00, // version 0
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, 0x00, 0x00, // pre_defined
            0x73, 0x6f, 0x75, 0x6e, // handler_type: 'soun'
            0x00, 0x00, 0x00, 0x00, // reserved
            0x00, 0x00, 0x00, 0x00, // reserved
            0x00, 0x00, 0x00, 0x00, // reserved
            0x53, 0x6f, 0x75, 0x6e,
            0x64, 0x48, 0x61, 0x6e,
            0x64, 0x6c, 0x65, 0x72, 0x00 // name: 'SoundHandler'
        ]);

        MP4.HDLR_TYPES = {
            'video': videoHdlr,
            'audio': audioHdlr
        };

        var dref = new Uint8Array([
            0x00, // version 0
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, 0x00, 0x01, // entry_count
            0x00, 0x00, 0x00, 0x0c, // entry_size
            0x75, 0x72, 0x6c, 0x20, // 'url' type
            0x00, // version 0
            0x00, 0x00, 0x01 // entry_flags
        ]);

        var stco = new Uint8Array([
            0x00, // version
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, 0x00, 0x00 // entry_count
        ]);

        MP4.STTS = MP4.STSC = MP4.STCO = stco;

        MP4.STSZ = new Uint8Array([
            0x00, // version
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, 0x00, 0x00, // sample_size
            0x00, 0x00, 0x00, 0x00, // sample_count
        ]);
        MP4.VMHD = new Uint8Array([
            0x00, // version
            0x00, 0x00, 0x01, // flags
            0x00, 0x00, // graphicsmode
            0x00, 0x00,
            0x00, 0x00,
            0x00, 0x00 // opcolor
        ]);
        MP4.SMHD = new Uint8Array([
            0x00, // version
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, // balance
            0x00, 0x00 // reserved
        ]);

        MP4.STSD = new Uint8Array([
            0x00, // version 0
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, 0x00, 0x01]);// entry_count

        var majorBrand = new Uint8Array([105,115,111,109]); // isom
        var avc1Brand = new Uint8Array([97,118,99,49]); // avc1
        var minorVersion = new Uint8Array([0, 0, 0, 1]);

        MP4.FTYP = MP4.box(MP4.types.ftyp, majorBrand, minorVersion, majorBrand, avc1Brand);
        MP4.DINF = MP4.box(MP4.types.dinf, MP4.box(MP4.types.dref, dref));
    }

    static box(type, ...payload) {
        var size = 8,
            i = payload.length,
            len = i,
            result;
        // calculate the total size we need to allocate
        while (i--) {
            size += payload[i].byteLength;
        }
        result = new Uint8Array(size);
        result[0] = (size >> 24) & 0xff;
        result[1] = (size >> 16) & 0xff;
        result[2] = (size >> 8) & 0xff;
        result[3] = size  & 0xff;
        result.set(type, 4);
        // copy the payload into the result
        for (i = 0, size = 8; i < len; ++i) {
            // copy payload[i] array @ offset size
            result.set(payload[i], size);
            size += payload[i].byteLength;
        }
        return result;
    }

    static hdlr(type) {
        return MP4.box(MP4.types.hdlr, MP4.HDLR_TYPES[type]);
    }

    static mdat(data) {
        return MP4.box(MP4.types.mdat, data);
    }

    static mdhd(timescale, duration) {
        return MP4.box(MP4.types.mdhd, new Uint8Array([
            0x00, // version 0
            0x00, 0x00, 0x00, // flags
            0x00, 0x00, 0x00, 0x02, // creation_time
            0x00, 0x00, 0x00, 0x03, // modification_time
            (timescale >> 24) & 0xFF,
            (timescale >> 16) & 0xFF,
            (timescale >>  8) & 0xFF,
            timescale & 0xFF, // timescale
            (duration >> 24),
            (duration >> 16) & 0xFF,
            (duration >>  8) & 0xFF,
            duration & 0xFF, // duration
            0x55, 0xc4, // 'und' language (undetermined)
            0x00, 0x00
        ]));
    }

    static mdia(track) {
        return MP4.box(MP4.types.mdia, MP4.mdhd(track.timescale, track.duration), MP4.hdlr(track.type), MP4.minf(track));
    }

    static mfhd(sequenceNumber) {
        return MP4.box(MP4.types.mfhd, new Uint8Array([
            0x00,
            0x00, 0x00, 0x00, // flags
            (sequenceNumber >> 24),
            (sequenceNumber >> 16) & 0xFF,
            (sequenceNumber >>  8) & 0xFF,
            sequenceNumber & 0xFF, // sequence_number
        ]));
    }

    static minf(track) {
        if (track.type === 'audio') {
            return MP4.box(MP4.types.minf, MP4.box(MP4.types.smhd, MP4.SMHD), MP4.DINF, MP4.stbl(track));
        } else {
            return MP4.box(MP4.types.minf, MP4.box(MP4.types.vmhd, MP4.VMHD), MP4.DINF, MP4.stbl(track));
        }
    }

    static moof(sn, baseMediaDecodeTime, track) {
        return MP4.box(MP4.types.moof, MP4.mfhd(sn), MP4.traf(track,baseMediaDecodeTime));
    }
    /**
     * @param tracks... (optional) {array} the tracks associated with this movie
     */
    static moov(tracks, duration, timescale) {
        var
            i = tracks.length,
            boxes = [];

        while (i--) {
            boxes[i] = MP4.trak(tracks[i]);
        }

        return MP4.box.apply(null, [MP4.types.moov, MP4.mvhd(timescale, duration)].concat(boxes).concat(MP4.mvex(tracks)));
    }

    static mvex(tracks) {
        var
            i = tracks.length,
            boxes = [];

        while (i--) {
            boxes[i] = MP4.trex(tracks[i]);
        }
        return MP4.box.apply(null, [MP4.types.mvex].concat(boxes));
    }

    static mvhd(timescale,duration) {
        var
            bytes = new Uint8Array([
                0x00, // version 0
                0x00, 0x00, 0x00, // flags
                0x00, 0x00, 0x00, 0x01, // creation_time
                0x00, 0x00, 0x00, 0x02, // modification_time
                (timescale >> 24) & 0xFF,
                (timescale >> 16) & 0xFF,
                (timescale >>  8) & 0xFF,
                timescale & 0xFF, // timescale
                (duration >> 24) & 0xFF,
                (duration >> 16) & 0xFF,
                (duration >>  8) & 0xFF,
                duration & 0xFF, // duration
                0x00, 0x01, 0x00, 0x00, // 1.0 rate
                0x01, 0x00, // 1.0 volume
                0x00, 0x00, // reserved
                0x00, 0x00, 0x00, 0x00, // reserved
                0x00, 0x00, 0x00, 0x00, // reserved
                0x00, 0x01, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x01, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x40, 0x00, 0x00, 0x00, // transformation: unity matrix
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, // pre_defined
                0xff, 0xff, 0xff, 0xff // next_track_ID
            ]);
        return MP4.box(MP4.types.mvhd, bytes);
    }

    static sdtp(track) {
        var
            samples = track.samples || [],
            bytes = new Uint8Array(4 + samples.length),
            flags,
            i;
        // leave the full box header (4 bytes) all zero
        // write the sample table
        for (i = 0; i < samples.length; i++) {
            flags = samples[i].flags;
            bytes[i + 4] = (flags.dependsOn << 4) |
                (flags.isDependedOn << 2) |
                (flags.hasRedundancy);
        }

        return MP4.box(MP4.types.sdtp, bytes);
    }

    static stbl(track) {
        return MP4.box(MP4.types.stbl, MP4.stsd(track), MP4.box(MP4.types.stts, MP4.STTS), MP4.box(MP4.types.stsc, MP4.STSC), MP4.box(MP4.types.stsz, MP4.STSZ), MP4.box(MP4.types.stco, MP4.STCO));
    }

    static avc1(track) {
        var sps = [], pps = [], i, data, len;
        // assemble the SPSs

        for (i = 0; i < track.sps.length; i++) {
            data = track.sps[i];
            len = data.byteLength;
            sps.push((len >>> 8) & 0xFF);
            sps.push((len & 0xFF));
            sps = sps.concat(Array.prototype.slice.call(data)); // SPS
        }

        // assemble the PPSs
        for (i = 0; i < track.pps.length; i++) {
            data = track.pps[i];
            len = data.byteLength;
            pps.push((len >>> 8) & 0xFF);
            pps.push((len & 0xFF));
            pps = pps.concat(Array.prototype.slice.call(data));
        }

        var avcc = MP4.box(MP4.types.avcC, new Uint8Array([
                0x01,   // version
                sps[3], // profile
                sps[4], // profile compat
                sps[5], // level
                0xfc | 3, // lengthSizeMinusOne, hard-coded to 4 bytes
                0xE0 | track.sps.length // 3bit reserved (111) + numOfSequenceParameterSets
            ].concat(sps).concat([
                track.pps.length // numOfPictureParameterSets
            ]).concat(pps))), // "PPS"
            width = track.width,
            height = track.height;
        //console.log('avcc:' + Hex.hexDump(avcc));
        return MP4.box(MP4.types.avc1, new Uint8Array([
                0x00, 0x00, 0x00, // reserved
                0x00, 0x00, 0x00, // reserved
                0x00, 0x01, // data_reference_index
                0x00, 0x00, // pre_defined
                0x00, 0x00, // reserved
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, // pre_defined
                (width >> 8) & 0xFF,
                width & 0xff, // width
                (height >> 8) & 0xFF,
                height & 0xff, // height
                0x00, 0x48, 0x00, 0x00, // horizresolution
                0x00, 0x48, 0x00, 0x00, // vertresolution
                0x00, 0x00, 0x00, 0x00, // reserved
                0x00, 0x01, // frame_count
                0x12,
                0x62, 0x69, 0x6E, 0x65, //binelpro.ru
                0x6C, 0x70, 0x72, 0x6F,
                0x2E, 0x72, 0x75, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, // compressorname
                0x00, 0x18,   // depth = 24
                0x11, 0x11]), // pre_defined = -1
            avcc,
            MP4.box(MP4.types.btrt, new Uint8Array([
                0x00, 0x1c, 0x9c, 0x80, // bufferSizeDB
                0x00, 0x2d, 0xc6, 0xc0, // maxBitrate
                0x00, 0x2d, 0xc6, 0xc0])) // avgBitrate
        );
    }

    static esds(track) {
        var configlen = track.config.byteLength;
        let data = new Uint8Array(26+configlen+3);
        data.set([
            0x00, // version 0
            0x00, 0x00, 0x00, // flags

            0x03, // descriptor_type
            0x17+configlen, // length
            0x00, 0x01, //es_id
            0x00, // stream_priority

            0x04, // descriptor_type
            0x0f+configlen, // length
            0x40, //codec : mpeg4_audio
            0x15, // stream_type
            0x00, 0x00, 0x00, // buffer_size
            0x00, 0x00, 0x00, 0x00, // maxBitrate
            0x00, 0x00, 0x00, 0x00, // avgBitrate

            0x05, // descriptor_type
            configlen
        ]);
        data.set(track.config, 26);
        data.set([0x06, 0x01, 0x02], 26+configlen);
        // return new Uint8Array([
        //     0x00, // version 0
        //     0x00, 0x00, 0x00, // flags
        //
        //     0x03, // descriptor_type
        //     0x17+configlen, // length
        //     0x00, 0x01, //es_id
        //     0x00, // stream_priority
        //
        //     0x04, // descriptor_type
        //     0x0f+configlen, // length
        //     0x40, //codec : mpeg4_audio
        //     0x15, // stream_type
        //     0x00, 0x00, 0x00, // buffer_size
        //     0x00, 0x00, 0x00, 0x00, // maxBitrate
        //     0x00, 0x00, 0x00, 0x00, // avgBitrate
        //
        //     0x05 // descriptor_type
        // ].concat([configlen]).concat(track.config).concat([0x06, 0x01, 0x02])); // GASpecificConfig)); // length + audio config descriptor
        return data;
    }

    static mp4a(track) {
        var audiosamplerate = track.audiosamplerate;
        return MP4.box(MP4.types.mp4a, new Uint8Array([
                0x00, 0x00, 0x00, // reserved
                0x00, 0x00, 0x00, // reserved
                0x00, 0x01, // data_reference_index
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, // reserved
                0x00, track.channelCount, // channelcount
                0x00, 0x10, // sampleSize:16bits
                0x00, 0x00, // pre_defined
                0x00, 0x00, // reserved2
                (audiosamplerate >> 8) & 0xFF,
                audiosamplerate & 0xff, //
                0x00, 0x00]),
            MP4.box(MP4.types.esds, MP4.esds(track)));
    }

    static stsd(track) {
        if (track.type === 'audio') {
            return MP4.box(MP4.types.stsd, MP4.STSD, MP4.mp4a(track));
        } else {
            return MP4.box(MP4.types.stsd, MP4.STSD, MP4.avc1(track));
        }
    }

    static tkhd(track) {
        var id = track.id,
            duration = track.duration,
            width = track.width,
            height = track.height,
            volume = track.volume;
        return MP4.box(MP4.types.tkhd, new Uint8Array([
            0x00, // version 0
            0x00, 0x00, 0x07, // flags
            0x00, 0x00, 0x00, 0x00, // creation_time
            0x00, 0x00, 0x00, 0x00, // modification_time
            (id >> 24) & 0xFF,
            (id >> 16) & 0xFF,
            (id >> 8) & 0xFF,
            id & 0xFF, // track_ID
            0x00, 0x00, 0x00, 0x00, // reserved
            (duration >> 24),
            (duration >> 16) & 0xFF,
            (duration >>  8) & 0xFF,
            duration & 0xFF, // duration
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, // reserved
            0x00, 0x00, // layer
            0x00, 0x00, // alternate_group
            (volume>>0)&0xff, (((volume%1)*10)>>0)&0xff, // track volume // FIXME
            0x00, 0x00, // reserved
            0x00, 0x01, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x01, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            0x40, 0x00, 0x00, 0x00, // transformation: unity matrix
            (width >> 8) & 0xFF,
            width & 0xFF,
            0x00, 0x00, // width
            (height >> 8) & 0xFF,
            height & 0xFF,
            0x00, 0x00 // height
        ]));
    }

    static traf(track,baseMediaDecodeTime) {
        var sampleDependencyTable = MP4.sdtp(track),
            id = track.id;
        return MP4.box(MP4.types.traf,
            MP4.box(MP4.types.tfhd, new Uint8Array([
                0x00, // version 0
                0x00, 0x00, 0x00, // flags
                (id >> 24),
                (id >> 16) & 0XFF,
                (id >> 8) & 0XFF,
                (id & 0xFF) // track_ID
            ])),
            MP4.box(MP4.types.tfdt, new Uint8Array([
                0x00, // version 0
                0x00, 0x00, 0x00, // flags
                (baseMediaDecodeTime >>24),
                (baseMediaDecodeTime >> 16) & 0XFF,
                (baseMediaDecodeTime >> 8) & 0XFF,
                (baseMediaDecodeTime & 0xFF) // baseMediaDecodeTime
            ])),
            MP4.trun(track,
                sampleDependencyTable.length +
                16 + // tfhd
                16 + // tfdt
                8 +  // traf header
                16 + // mfhd
                8 +  // moof header
                8),  // mdat header
            sampleDependencyTable);
    }

    /**
     * Generate a track box.
     * @param track {object} a track definition
     * @return {Uint8Array} the track box
     */
    static trak(track) {
        track.duration = track.duration || 0xffffffff;
        return MP4.box(MP4.types.trak, MP4.tkhd(track), MP4.mdia(track));
    }

    static trex(track) {
        var id = track.id;
        return MP4.box(MP4.types.trex, new Uint8Array([
            0x00, // version 0
            0x00, 0x00, 0x00, // flags
            (id >> 24),
            (id >> 16) & 0XFF,
            (id >> 8) & 0XFF,
            (id & 0xFF), // track_ID
            0x00, 0x00, 0x00, 0x01, // default_sample_description_index
            0x00, 0x00, 0x00, 0x00, // default_sample_duration
            0x00, 0x00, 0x00, 0x00, // default_sample_size
            0x00, 0x01, 0x00, 0x01 // default_sample_flags
        ]));
    }

    static trun(track, offset) {
        var samples= track.samples || [],
            len = samples.length,
            arraylen = 12 + (16 * len),
            array = new Uint8Array(arraylen),
            i,sample,duration,size,flags,cts;
        offset += 8 + arraylen;
        array.set([
            0x00, // version 0
            0x00, 0x0f, 0x01, // flags
            (len >>> 24) & 0xFF,
            (len >>> 16) & 0xFF,
            (len >>> 8) & 0xFF,
            len & 0xFF, // sample_count
            (offset >>> 24) & 0xFF,
            (offset >>> 16) & 0xFF,
            (offset >>> 8) & 0xFF,
            offset & 0xFF // data_offset
        ],0);
        for (i = 0; i < len; i++) {
            sample = samples[i];
            duration = sample.duration;
            size = sample.size;
            flags = sample.flags;
            cts = sample.cts;
            array.set([
                (duration >>> 24) & 0xFF,
                (duration >>> 16) & 0xFF,
                (duration >>> 8) & 0xFF,
                duration & 0xFF, // sample_duration
                (size >>> 24) & 0xFF,
                (size >>> 16) & 0xFF,
                (size >>> 8) & 0xFF,
                size & 0xFF, // sample_size
                (flags.isLeading << 2) | flags.dependsOn,
                (flags.isDependedOn << 6) |
                (flags.hasRedundancy << 4) |
                (flags.paddingValue << 1) |
                flags.isNonSync,
                flags.degradPrio & 0xF0 << 8,
                flags.degradPrio & 0x0F, // sample_flags
                (cts >>> 24) & 0xFF,
                (cts >>> 16) & 0xFF,
                (cts >>> 8) & 0xFF,
                cts & 0xFF // sample_composition_time_offset
            ],12+16*i);
        }
        return MP4.box(MP4.types.trun, array);
    }

    static initSegment(tracks, duration, timescale) {
        if (!MP4.types) {
            MP4.init();
        }
        var movie = MP4.moov(tracks, duration, timescale), result;
        result = new Uint8Array(MP4.FTYP.byteLength + movie.byteLength);
        result.set(MP4.FTYP);
        result.set(movie, MP4.FTYP.byteLength);
        return result;
    }
}

class AACFrame {

    constructor(data, dts, pts) {
        this.dts = dts;
        this.pts = pts ? pts : this.dts;

        this.data=data;//.subarray(offset);
    }

    getData() {
        return this.data;
    }

    getSize() {
        return this.data.byteLength;
    }
}

// TODO: asm.js

function appendByteArray(buffer1, buffer2) {
    let tmp = new Uint8Array((buffer1.byteLength|0) + (buffer2.byteLength|0));
    tmp.set(buffer1, 0);
    tmp.set(buffer2, buffer1.byteLength|0);
    return tmp;
}

function base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function hexToByteArray(hex) {
    let len = hex.length >> 1;
    var bufView = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bufView[i] = parseInt(hex.substr(i<<1,2),16);
    }
    return bufView;
}

function bitSlice(bytearray, start=0, end=bytearray.byteLength*8) {
    let byteLen = Math.ceil((end-start)/8);
    let res = new Uint8Array(byteLen);
    let startByte = start >>> 3;   // /8
    let endByte = (end>>>3) - 1;    // /8
    let bitOffset = start & 0x7;     // %8
    let nBitOffset = 8 - bitOffset;
    let endOffset = 8 - end & 0x7;   // %8
    for (let i=0; i<byteLen; ++i) {
        let tail = 0;
        if (i<endByte) {
            tail = bytearray[startByte+i+1] >> nBitOffset;
            if (i == endByte-1 && endOffset < 8) {
                tail >>= endOffset;
                tail <<= endOffset;
            }
        }
        res[i]=(bytearray[startByte+i]<<bitOffset) | tail;
    }
    return res;
}

class BitArray {

    constructor(src) {
        this.src    = new DataView(src.buffer, src.byteOffset, src.byteLength);
        this.bitpos = 0;
        this.byte   = this.src.getUint8(0); /* This should really be undefined, uint wont allow it though */
        this.bytepos = 0;
    }

    readBits(length) {
        if (32 < (length|0) || 0 === (length|0)) {
            /* To big for an uint */
            throw new Error("too big");
        }

        let result = 0;
        for (let i = length; i > 0; --i) {

            /* Shift result one left to make room for another bit,
             then add the next bit on the stream. */
            result = ((result|0) << 1) | (((this.byte|0) >> (8 - (++this.bitpos))) & 0x01);
            if ((this.bitpos|0)>=8) {
                this.byte = this.src.getUint8(++this.bytepos);
                this.bitpos &= 0x7;
            }
        }

        return result;
    }
    skipBits(length) {
        this.bitpos += (length|0) & 0x7; // %8
        this.bytepos += (length|0) >>> 3;  // *8
        if (this.bitpos > 7) {
            this.bitpos &= 0x7;
            ++this.bytepos;
        }

        if (!this.finished()) {
            this.byte = this.src.getUint8(this.bytepos);
            return 0;
        } else {
            return this.bytepos-this.src.byteLength-this.src.bitpos;
        }
    }
    
    finished() {
        return this.bytepos >= this.src.byteLength;
    }
}

class AACParser {
    static get SampleRates() {return  [
        96000, 88200,
        64000, 48000,
        44100, 32000,
        24000, 22050,
        16000, 12000,
        11025, 8000,
        7350];}

    // static Profile = [
    //     0: Null
    //     1: AAC Main
    //     2: AAC LC (Low Complexity)
    //     3: AAC SSR (Scalable Sample Rate)
    //     4: AAC LTP (Long Term Prediction)
    //     5: SBR (Spectral Band Replication)
    //     6: AAC Scalable
    // ]

    static parseAudioSpecificConfig(bytesOrBits) {
        let config;
        if (bytesOrBits.byteLength) { // is byteArray
            config = new BitArray(bytesOrBits);
        } else {
            config = bytesOrBits;
        }

        let bitpos = config.bitpos+(config.src.byteOffset+config.bytepos)*8;
        let prof = config.readBits(5);
        this.codec = `mp4a.40.${prof}`;
        let sfi = config.readBits(4);
        if (sfi == 0xf) config.skipBits(24);
        let channels = config.readBits(4);

        return {
            config: bitSlice(new Uint8Array(config.src.buffer), bitpos, bitpos+16),
            codec: `mp4a.40.${prof}`,
            samplerate: AACParser.SampleRates[sfi],
            channels: channels
        }
    }

    static parseStreamMuxConfig(bytes) {
        // ISO_IEC_14496-3 Part 3 Audio. StreamMuxConfig
        let config = new BitArray(bytes);

        if (!config.readBits(1)) {
            config.skipBits(14);
            return AACParser.parseAudioSpecificConfig(config);
        }
    }
}

// TODO: asm.js
class AACAsm {
    constructor() {
        this.config = null;
    }

    onAACFragment(pkt) {
        let rawData = pkt.getPayload();
        if (!pkt.media) {
            return null;
        }
        let data = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);

        let sizeLength = Number(pkt.media.fmtp['sizelength'] || 0);
        let indexLength = Number(pkt.media.fmtp['indexlength'] || 0);
        let indexDeltaLength = Number(pkt.media.fmtp['indexdeltalength'] || 0);
        let CTSDeltaLength = Number(pkt.media.fmtp['ctsdeltalength'] || 0);
        let DTSDeltaLength = Number(pkt.media.fmtp['dtsdeltalength'] || 0);
        let RandomAccessIndication = Number(pkt.media.fmtp['randomaccessindication'] || 0);
        let StreamStateIndication = Number(pkt.media.fmtp['streamstateindication'] || 0);
        let AuxiliaryDataSizeLength = Number(pkt.media.fmtp['auxiliarydatasizelength'] || 0);

        let configHeaderLength =
            sizeLength + Math.max(indexLength, indexDeltaLength) + CTSDeltaLength + DTSDeltaLength +
            RandomAccessIndication + StreamStateIndication + AuxiliaryDataSizeLength;


        let auHeadersLengthPadded = 0;
        if (0 !== configHeaderLength) {
            /* The AU header section is not empty, read it from payload */
            let auHeadersLengthInBits = data.getUint16(0); // Always 2 octets, without padding
            auHeadersLengthPadded = 2 + ((auHeadersLengthInBits + (auHeadersLengthInBits & 0x7)) >>> 3); // Add padding

            //this.config = AACParser.parseAudioSpecificConfig(new Uint8Array(rawData, 0 , auHeadersLengthPadded));
            // TODO: parse config
        }

        let aacData = rawData.subarray(auHeadersLengthPadded);
        let offset = 0;
        while (true) {
            if (aacData[offset] !=255) break;
            ++offset;
        }

        ++offset;
        let ts = (Math.round(pkt.getTimestampMS()/1024) << 10) * 90000 / this.config.samplerate;
        return new AACFrame(rawData.subarray(auHeadersLengthPadded+offset), ts);
    }
}

const listener = Symbol("event_listener");
const listeners = Symbol("event_listeners");

class DestructibleEventListener {
    constructor(eventListener) {
        this[listener] = eventListener;
        this[listeners] = new Map();
    }

    destroy() {
        this[listeners].forEach((listener_set, event)=>{
            listener_set.forEach((fn)=>{
                this[listener].removeEventListener(event, fn);
            });
            listener_set = null;
        });
        this[listeners] = null;
    }

    addEventListener(event, fn) {
        if (!this[listeners].has(event)) {
            this[listeners].set(event, new Set());
        }
        this[listeners].get(event).add(fn);
        this[listener].addEventListener(event, fn, false);
    }

    removeEventListener(event, fn) {
        this[listener].removeEventListener(event, fn, false);
        if (this[listeners].has(event)) {
            this[listeners].set(event, new Set());
            let ev = this[listeners].get(event);
            ev.delete(fn);
            if (!ev.size) {
                this[listeners].delete(event);
            }
        }
    }

    dispatchEvent(event) {
        this[listener].dispatchEvent(event);
    }
}

class EventEmitter {
    constructor() {
        this[listener] = new DestructibleEventListener(document.createElement('div'));
    }

    destroy() {
        this[listener].destroy();
        this[listener] = null;
    }

    addEventListener(event, fn) {
        this[listener].addEventListener(event, fn, false);
    }

    removeEventListener(event, fn) {
        this[listener].removeEventListener(event, fn, false);
    }

    dispatchEvent(event, data) {
        this[listener].dispatchEvent(new CustomEvent(event, {detail: data}))
    }
}

var DataView$1 = window.DataView;
var parseType = function(buffer) {
    var result = '';
    result += String.fromCharCode(buffer[0]);
    result += String.fromCharCode(buffer[1]);
    result += String.fromCharCode(buffer[2]);
    result += String.fromCharCode(buffer[3]);
    return result;
  };
var parseMp4Date = function(seconds) {
    return new Date(seconds * 1000 - 2082844800000);
  };
var parseSampleFlags = function(flags) {
    return {
      isLeading: (flags[0] & 0x0c) >>> 2,
      dependsOn: flags[0] & 0x03,
      isDependedOn: (flags[1] & 0xc0) >>> 6,
      hasRedundancy: (flags[1] & 0x30) >>> 4,
      paddingValue: (flags[1] & 0x0e) >>> 1,
      isNonSyncSample: flags[1] & 0x01,
      degradationPriority: (flags[2] << 8) | flags[3]
    };
  };
var nalParse = function(avcStream) {
    var
      avcView = new DataView$1(avcStream.buffer, avcStream.byteOffset, avcStream.byteLength),
      result = [],
      i,
      length;
    for (i = 0; i < avcStream.length; i += length) {
      length = avcView.getUint32(i);
      i += 4;
      switch(avcStream[i] & 0x1F) {
      case 0x01:
        result.push('NDR');
        break;
      case 0x05:
        result.push('IDR');
        break;
      case 0x06:
        result.push('SEI');
        break;
      case 0x07:
        result.push('SPS');
        break;
      case 0x08:
        result.push('PPS');
        break;
      case 0x09:
        result.push('AUD');
        break;
      default:
        result.push(avcStream[i] & 0x1F);
        break;
      }
    }
    return result;
  };
var parse = {
    // codingname, not a first-class box type. stsd entries share the
    // same format as real boxes so the parsing infrastructure can be
    // shared
    mp4a: function(data) {
      var view = new DataView$1(data.buffer, data.byteOffset, data.byteLength);
      return {
        channel_count: view.getUint16(16),
        sample_size: view.getUint16(18),
        samplerate: view.getUint16(24),
        esds: mp4toJSON(data.subarray(28, data.byteLength))
      };
    },
    esds: function(data) {
      var view = new DataView$1(data.buffer, data.byteOffset, data.byteLength);
      let codecs={
        64: 'MPEG4 audio',
        32: 'MPEG4 video',
        33: 'MPEG4 AVC SPS',
        34: 'MPEG4 AVC PPS'
      };
      let stream_types={
        5: 'audio'
      };
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        es_id: view.getUint16(6),
        stream_priority: view.getUint8(8),
        codec: codecs[view.getUint8(11)],
        stream_type: stream_types[view.getUint8(12)>>2],
        upstream: (view.getUint8(12) & 0x02)>>1,
        config: new Uint8Array(data.subarray(26, 26+view.getUint8(25)))
      };
    },
    avc1: function(data) {
      var view = new DataView$1(data.buffer, data.byteOffset, data.byteLength);
      return {
        dataReferenceIndex: view.getUint16(6),
        width:  view.getUint16(24),
        height: view.getUint16(26),
        horizresolution: view.getUint16(28) + (view.getUint16(30) / 16),
        vertresolution: view.getUint16(32) + (view.getUint16(34) / 16),
        frameCount: view.getUint16(40),
        depth: view.getUint16(74),
        config: mp4toJSON(data.subarray(78, data.byteLength))
      };
    },
    avcC: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        result = {
          configurationVersion: data[0],
          avcProfileIndication: data[1],
          profileCompatibility: data[2],
          avcLevelIndication: data[3],
          lengthSizeMinusOne: data[4] & 0x03,
          sps: [],
          pps: []
        },
        numOfSequenceParameterSets = data[5] & 0x1f,
        numOfPictureParameterSets,
        nalSize,
        offset,
        i;

      // iterate past any SPSs
      offset = 6;
      for (i = 0; i < numOfSequenceParameterSets; i++) {
        nalSize = view.getUint16(offset);
        offset += 2;
        result.sps.push(new Uint8Array(data.subarray(offset, offset + nalSize)));
        offset += nalSize;
      }
      // iterate past any PPSs
      numOfPictureParameterSets = data[offset];
      offset++;
      for (i = 0; i < numOfPictureParameterSets; i++) {
        nalSize = view.getUint16(offset);
        offset += 2;
        result.pps.push(new Uint8Array(data.subarray(offset, offset + nalSize)));
        offset += nalSize;
      }
      return result;
    },
    btrt: function(data) {
      var view = new DataView$1(data.buffer, data.byteOffset, data.byteLength);
      return {
        bufferSizeDB: view.getUint32(0),
        maxBitrate: view.getUint32(4),
        avgBitrate: view.getUint32(8)
      };
    },
    ftyp: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        result = {
          majorBrand: parseType(data.subarray(0, 4)),
          minorVersion: view.getUint32(4),
          compatibleBrands: []
        },
        i = 8;
      while (i < data.byteLength) {
        result.compatibleBrands.push(parseType(data.subarray(i, i + 4)));
        i += 4;
      }
      return result;
    },
    dinf: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    dref: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        dataReferences: mp4toJSON(data.subarray(8))
      };
    },
    hdlr: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4)),
          handlerType: parseType(data.subarray(8, 12)),
          name: ''
        },
        i = 8;

      // parse out the name field
      for (i = 24; i < data.byteLength; i++) {
        if (data[i] === 0x00) {
          // the name field is null-terminated
          i++;
          break;
        }
        result.name += String.fromCharCode(data[i]);
      }
      // decode UTF-8 to javascript's internal representation
      // see http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
      result.name = window.decodeURIComponent(window.escape(result.name));

      return result;
    },
    mdat: function(data) {
      return {
        byteLength: data.byteLength,
        nals: nalParse(data)
      };
    },
    mdhd: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        i = 4,
        language,
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4)),
          language: ''
        };
      if (result.version === 1) {
        i += 4;
        result.creationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 8;
        result.modificationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 4;
        result.timescale = view.getUint32(i);
        i += 8;
        result.duration = view.getUint32(i); // truncating top 4 bytes
      } else {
        result.creationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.modificationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.timescale = view.getUint32(i);
        i += 4;
        result.duration = view.getUint32(i);
      }
      i += 4;
      // language is stored as an ISO-639-2/T code in an array of three 5-bit fields
      // each field is the packed difference between its ASCII value and 0x60
      language = view.getUint16(i);
      result.language += String.fromCharCode((language >> 10) + 0x60);
      result.language += String.fromCharCode(((language & 0x03c0) >> 5) + 0x60);
      result.language += String.fromCharCode((language & 0x1f) + 0x60);

      return result;
    },
    mdia: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    mfhd: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        sequenceNumber: (data[4] << 24) |
          (data[5] << 16) |
          (data[6] << 8) |
          (data[7])
      };
    },
    minf: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    moof: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    moov: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    mvex: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    mvhd: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        i = 4,
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4))
        };

      if (result.version === 1) {
        i += 4;
        result.creationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 8;
        result.modificationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 4;
        result.timescale = view.getUint32(i);
        i += 8;
        result.duration = view.getUint32(i); // truncating top 4 bytes
      } else {
        result.creationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.modificationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.timescale = view.getUint32(i);
        i += 4;
        result.duration = view.getUint32(i);
      }
      i += 4;

      // convert fixed-point, core 16 back to a number
      result.rate = view.getUint16(i) + (view.getUint16(i + 2) / 16);
      i += 4;
      result.volume = view.getUint8(i) + (view.getUint8(i + 1) / 8);
      i += 2;
      i += 2;
      i += 2 * 4;
      result.matrix = new Uint32Array(data.subarray(i, i + (9 * 4)));
      i += 9 * 4;
      i += 6 * 4;
      result.nextTrackId = view.getUint32(i);
      return result;
    },
    pdin: function(data) {
      var view = new DataView$1(data.buffer, data.byteOffset, data.byteLength);
      return {
        version: view.getUint8(0),
        flags: new Uint8Array(data.subarray(1, 4)),
        rate: view.getUint32(4),
        initialDelay: view.getUint32(8)
      };
    },
    sdtp: function(data) {
      var
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          samples: []
        }, i;

      for (i = 4; i < data.byteLength; i++) {
        result.samples.push({
          dependsOn: (data[i] & 0x30) >> 4,
          isDependedOn: (data[i] & 0x0c) >> 2,
          hasRedundancy: data[i] & 0x03
        });
      }
      return result;
    },
    sidx: function(data) {
      var view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
          result = {
            version: data[0],
            flags: new Uint8Array(data.subarray(1, 4)),
            references: [],
            referenceId: view.getUint32(4),
            timescale: view.getUint32(8),
            earliestPresentationTime: view.getUint32(12),
            firstOffset: view.getUint32(16)
          },
          referenceCount = view.getUint16(22),
          i;

      for (i = 24; referenceCount; i += 12, referenceCount-- ) {
        result.references.push({
          referenceType: (data[i] & 0x80) >>> 7,
          referencedSize: view.getUint32(i) & 0x7FFFFFFF,
          subsegmentDuration: view.getUint32(i + 4),
          startsWithSap: !!(data[i + 8] & 0x80),
          sapType: (data[i + 8] & 0x70) >>> 4,
          sapDeltaTime: view.getUint32(i + 8) & 0x0FFFFFFF
        });
      }

      return result;
    },
    stbl: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    stco: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          chunkOffsets: []
        },
        entryCount = view.getUint32(4),
        i;
      for (i = 8; entryCount; i += 4, entryCount--) {
        result.chunkOffsets.push(view.getUint32(i));
      }
      return result;
    },
    stsc: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        entryCount = view.getUint32(4),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          sampleToChunks: []
        },
        i;
      for (i = 8; entryCount; i += 12, entryCount--) {
        result.sampleToChunks.push({
          firstChunk: view.getUint32(i),
          samplesPerChunk: view.getUint32(i + 4),
          sampleDescriptionIndex: view.getUint32(i + 8)
        });
      }
      return result;
    },
    stsd: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        sampleDescriptions: mp4toJSON(data.subarray(8))
      };
    },
    stsz: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          sampleSize: view.getUint32(4),
          entries: []
        },
        i;
      for (i = 12; i < data.byteLength; i += 4) {
        result.entries.push(view.getUint32(i));
      }
      return result;
    },
    stts: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          timeToSamples: []
        },
        entryCount = view.getUint32(4),
        i;

      for (i = 8; entryCount; i += 8, entryCount--) {
        result.timeToSamples.push({
          sampleCount: view.getUint32(i),
          sampleDelta: view.getUint32(i + 4)
        });
      }
      return result;
    },
    styp: function(data) {
      return parse.ftyp(data);
    },
    tfdt: function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        baseMediaDecodeTime: data[4] << 24 | data[5] << 16 | data[6] << 8 | data[7]
      };
    },
    tfhd: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          trackId: view.getUint32(4)
        },
        baseDataOffsetPresent = result.flags[2] & 0x01,
        sampleDescriptionIndexPresent = result.flags[2] & 0x02,
        defaultSampleDurationPresent = result.flags[2] & 0x08,
        defaultSampleSizePresent = result.flags[2] & 0x10,
        defaultSampleFlagsPresent = result.flags[2] & 0x20,
        i;

      i = 8;
      if (baseDataOffsetPresent) {
        i += 4; // truncate top 4 bytes
        result.baseDataOffset = view.getUint32(12);
        i += 4;
      }
      if (sampleDescriptionIndexPresent) {
        result.sampleDescriptionIndex = view.getUint32(i);
        i += 4;
      }
      if (defaultSampleDurationPresent) {
        result.defaultSampleDuration = view.getUint32(i);
        i += 4;
      }
      if (defaultSampleSizePresent) {
        result.defaultSampleSize = view.getUint32(i);
        i += 4;
      }
      if (defaultSampleFlagsPresent) {
        result.defaultSampleFlags = view.getUint32(i);
      }
      return result;
    },
    tkhd: function(data) {
      var
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        i = 4,
        result = {
          version: view.getUint8(0),
          flags: new Uint8Array(data.subarray(1, 4)),
        };
      if (result.version === 1) {
        i += 4;
        result.creationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 8;
        result.modificationTime = parseMp4Date(view.getUint32(i)); // truncating top 4 bytes
        i += 4;
        result.trackId = view.getUint32(i);
        i += 4;
        i += 8;
        result.duration = view.getUint32(i); // truncating top 4 bytes
      } else {
        result.creationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.modificationTime = parseMp4Date(view.getUint32(i));
        i += 4;
        result.trackId = view.getUint32(i);
        i += 4;
        i += 4;
        result.duration = view.getUint32(i);
      }
      i += 4;
      i += 2 * 4;
      result.layer = view.getUint16(i);
      i += 2;
      result.alternateGroup = view.getUint16(i);
      i += 2;
      // convert fixed-point, core 16 back to a number
      result.volume = view.getUint8(i) + (view.getUint8(i + 1) / 8);
      i += 2;
      i += 2;
      result.matrix = new Uint32Array(data.subarray(i, i + (9 * 4)));
      i += 9 * 4;
      result.width = view.getUint16(i) + (view.getUint16(i + 2) / 16);
      i += 4;
      result.height = view.getUint16(i) + (view.getUint16(i + 2) / 16);
      return result;
    },
    traf: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    trak: function(data) {
      return {
        boxes: mp4toJSON(data)
      };
    },
    trex: function(data) {
      var view = new DataView$1(data.buffer, data.byteOffset, data.byteLength);
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        trackId: view.getUint32(4),
        defaultSampleDescriptionIndex: view.getUint32(8),
        defaultSampleDuration: view.getUint32(12),
        defaultSampleSize: view.getUint32(16),
        sampleDependsOn: data[20] & 0x03,
        sampleIsDependedOn: (data[21] & 0xc0) >> 6,
        sampleHasRedundancy: (data[21] & 0x30) >> 4,
        samplePaddingValue: (data[21] & 0x0e) >> 1,
        sampleIsDifferenceSample: !!(data[21] & 0x01),
        sampleDegradationPriority: view.getUint16(22)
      };
    },
    trun: function(data) {
      var
        result = {
          version: data[0],
          flags: new Uint8Array(data.subarray(1, 4)),
          samples: []
        },
        view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
        dataOffsetPresent = result.flags[2] & 0x01,
        firstSampleFlagsPresent = result.flags[2] & 0x04,
        sampleDurationPresent = result.flags[1] & 0x01,
        sampleSizePresent = result.flags[1] & 0x02,
        sampleFlagsPresent = result.flags[1] & 0x04,
        sampleCompositionTimeOffsetPresent = result.flags[1] & 0x08,
        sampleCount = view.getUint32(4),
        offset = 8,
        sample;

      if (dataOffsetPresent) {
        result.dataOffset = view.getUint32(offset);
        offset += 4;
      }
      if (firstSampleFlagsPresent && sampleCount) {
        sample = {
          flags: parseSampleFlags(data.subarray(offset, offset + 4))
        };
        offset += 4;
        if (sampleDurationPresent) {
          sample.duration = view.getUint32(offset);
          offset += 4;
        }
        if (sampleSizePresent) {
          sample.size = view.getUint32(offset);
          offset += 4;
        }
        if (sampleCompositionTimeOffsetPresent) {
          sample.compositionTimeOffset = view.getUint32(offset);
          offset += 4;
        }
        result.samples.push(sample);
        sampleCount--;
      }
      while (sampleCount--) {
        sample = {};
        if (sampleDurationPresent) {
          sample.duration = view.getUint32(offset);
          offset += 4;
        }
        if (sampleSizePresent) {
          sample.size = view.getUint32(offset);
          offset += 4;
        }
        if (sampleFlagsPresent) {
          sample.flags = parseSampleFlags(data.subarray(offset, offset + 4));
          offset += 4;
        }
        if (sampleCompositionTimeOffsetPresent) {
          sample.compositionTimeOffset = view.getUint32(offset);
          offset += 4;
        }
        result.samples.push(sample);
      }
      return result;
    },
    'url ': function(data) {
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4))
      };
    },
    vmhd: function(data) {
      //var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return {
        version: data[0],
        flags: new Uint8Array(data.subarray(1, 4)),
        //graphicsmode: view.getUint16(4),
        //opcolor: new Uint16Array([view.getUint16(6),
        //                          view.getUint16(8),
        //                          view.getUint16(10)])
      };
    }
  };
/**
 * Return a javascript array of box objects parsed from an ISO core
 * media file.
 * @param data {Uint8Array} the binary data of the media to be inspected
 * @return {array} a javascript array of potentially nested box objects
 */
var mp4toJSON = function(data) {
  var
    i = 0,
    result = [],
    view = new DataView$1(data.buffer, data.byteOffset, data.byteLength),
    size,
    type,
    end,
    box;

  while (i < data.byteLength) {
    // parse box data
    size = view.getUint32(i),
    type =  parseType(data.subarray(i + 4, i + 8));
    end = size > 1 ? i + size : data.byteLength;

    // parse type-specific data
    box = (parse[type] || function(data) {
      return {
        data: data
      };
    })(data.subarray(i + 8, end));
    box.size = size;
    box.type = type;

    // store this box and move to the next
    result.push(box);
    i = end;
  }
  return result;
};


let MP4Inspect = {
  mp4toJSON: mp4toJSON
};

const LOG_TAG$1 = "mse";
const Log$3 = getTagged(LOG_TAG$1);

class Buffer {
    constructor(parent, codec) {
        this.mediaSource = parent.mediaSource;
        this.players = parent.players;
        this.cleaning = false;
        this.parent = parent;
        this.queue = [];
        this.cleanResolvers = [];
        this.codec = codec;
        this.cleanRanges = [];

        Log$3.debug(`Use codec: ${codec}`);

        this.sourceBuffer = this.mediaSource.addSourceBuffer(codec);

        this.sourceBuffer.addEventListener('updatestart', (e)=> {
            // this.updating = true;
            // Log.debug('update start');
            if (this.cleaning) {
                Log$3.debug(`${this.codec} cleaning start`);
            // } else {
            //     if (this.players[0].duration > 10) {
            //         this.initCleanup();
            //     }
            }
        });

        this.sourceBuffer.addEventListener('update', (e)=> {
            // this.updating = true;
            if (this.cleaning) {
                Log$3.debug(`${this.codec} cleaning update`);
            }
        });

        this.sourceBuffer.addEventListener('updateend', (e)=> {
            // Log.debug('update end');
            // this.updating = false;
            if (this.cleaning) {
                Log$3.debug(`${this.codec} cleaning end`);

                try {
                    if (this.sourceBuffer.buffered.length && this.players[0].currentTime < this.sourceBuffer.buffered.start(0)) {
                        this.players[0].currentTime = this.sourceBuffer.buffered.start(0);
                    }
                } catch (e) {
                    // TODO: do something?
                }
                while (this.cleanResolvers.length) {
                    let resolver = this.cleanResolvers.shift();
                    resolver();
                }
                this.cleaning = false;

                if (this.cleanRanges.length) {
                    this.doCleanup();
                    return;
                }
            } else {
                // Log.debug(`buffered: ${this.sourceBuffer.buffered.end(0)}, current ${this.players[0].currentTime}`);
            }
            this.feedNext();
        });

        this.sourceBuffer.addEventListener('error', (e)=> {
            Log$3.debug(`Source buffer error: ${this.mediaSource.readyState}`);
            if (this.mediaSource.sourceBuffers.length) {
                this.mediaSource.removeSourceBuffer(this.sourceBuffer);
            }
            this.parent.eventSource.dispatchEvent('error');
        });

        this.sourceBuffer.addEventListener('abort', (e)=> {
            Log$3.debug(`Source buffer aborted: ${this.mediaSource.readyState}`);
            if (this.mediaSource.sourceBuffers.length) {
                this.mediaSource.removeSourceBuffer(this.sourceBuffer);
            }
            this.parent.eventSource.dispatchEvent('error');
        });

        if (!this.sourceBuffer.updating) {
            this.feedNext();
        }
        // TODO: cleanup every hour for live streams
    }

    destroy() {
        this.clear();
        this.queue = [];
        this.mediaSource.removeSourceBuffer(this.sourceBuffer);
    }

    clear() {
        this.queue = [];
        let promises = [];
        for (let i=0; i< this.sourceBuffer.buffered.length; ++i) {
            // TODO: await remove
            this.cleaning = true;
            promises.push(new Promise((resolve, reject)=>{
                this.cleanResolvers.push(resolve);
                this.sourceBuffer.remove(this.sourceBuffer.buffered.start(i), this.sourceBuffer.buffered.end(i));
                resolve();
            }));
        }
        return Promise.all(promises);
    }

    setLive(is_live) {
        this.is_live = is_live;
    }

    feedNext() {
        // Log.debug("feed next ", this.sourceBuffer.updating);
        if (!this.sourceBuffer.updating && !this.cleaning && this.queue.length) {
            this.doAppend(this.queue.shift());
            // TODO: if is live and current position > 1hr => clean all and restart
        }
    }

    doCleanup() {
        if (!this.cleanRanges.length) {
            this.cleaning = false;
            this.feedNext();
            return;
        }
        let range = this.cleanRanges.shift();
        Log$3.debug(`${this.codec} remove range [${range[0]} - ${range[1]}).
                    \nUpdating: ${this.sourceBuffer.updating}
                    `);
        this.cleaning = true;
        this.sourceBuffer.remove(range[0], range[1]);
    }

    initCleanup() {
        if (this.sourceBuffer.buffered.length && !this.sourceBuffer.updating && !this.cleaning) {
            Log$3.debug(`${this.codec} cleanup`);
            let removeBound = this.sourceBuffer.buffered.end(this.sourceBuffer.buffered.length-1) - 2;

            for (let i=0; i< this.sourceBuffer.buffered.length; ++i) {
                let removeStart = this.sourceBuffer.buffered.start(i);
                let removeEnd = this.sourceBuffer.buffered.end(i);
                if ((this.players[0].currentTime <= removeStart) || (removeBound <= removeStart)) continue;

                if ((removeBound <= removeEnd) && (removeBound >= removeStart)) {
                    Log$3.debug(`Clear [${removeStart}, ${removeBound}), leave [${removeBound}, ${removeEnd}]`);
                    removeEnd = removeBound;
                    if (removeEnd!=removeStart) {
                        this.cleanRanges.push([removeStart, removeEnd]);
                    }
                    continue; // Do not cleanup buffered range after current position
                }
                this.cleanRanges.push([removeStart, removeEnd]);
            }

            this.doCleanup();

            // let bufferStart = this.sourceBuffer.buffered.start(0);
            // let removeEnd = this.sourceBuffer.buffered.start(0) + (this.sourceBuffer.buffered.end(0) - this.sourceBuffer.buffered.start(0))/2;
            // if (this.players[0].currentTime < removeEnd) {
            //     this.players[0].currentTime = removeEnd;
            // }
            // let removeEnd = Math.max(this.players[0].currentTime - 3, this.sourceBuffer.buffered.end(0) - 3);
            //
            // if (removeEnd < bufferStart) {
            //     removeEnd = this.sourceBuffer.buffered.start(0) + (this.sourceBuffer.buffered.end(0) - this.sourceBuffer.buffered.start(0))/2;
            //     if (this.players[0].currentTime < removeEnd) {
            //         this.players[0].currentTime = removeEnd;
            //     }
            // }

            // if (removeEnd > bufferStart && (removeEnd - bufferStart > 0.5 )) {
            //     // try {
            //         Log.debug(`${this.codec} remove range [${bufferStart} - ${removeEnd}).
            //         \nBuffered end: ${this.sourceBuffer.buffered.end(0)}
            //         \nUpdating: ${this.sourceBuffer.updating}
            //         `);
            //         this.cleaning = true;
            //         this.sourceBuffer.remove(bufferStart, removeEnd);
            //     // } catch (e) {
            //     //     // TODO: implement
            //     //     Log.error(e);
            //     // }
            // } else {
            //     this.feedNext();
            // }
        } else {
            this.feedNext();
        }
    }

    doAppend(data) {
        console.log(MP4Inspect.mp4toJSON(data));
        let err = this.players[0].error;
        if (err) {
            Log$3.error(`Error occured: ${MSE.ErrorNotes[err.code]}`);
            try {
                this.players.forEach((video)=>{video.stop();});
                this.mediaSource.endOfStream();
            } catch (e){

            }
            this.parent.eventSource.dispatchEvent('error');
        } else {
            try {
                this.sourceBuffer.appendBuffer(data);
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    Log$3.debug(`${this.codec} quota fail`);
                    this.queue.unshift(data);
                    this.initCleanup();
                    return;
                }

                // reconnect on fail
                Log$3.error(`Error occured while appending buffer. ${e.name}: ${e.message}`);
                this.parent.eventSource.dispatchEvent('error');
            }
        }

    }

    feed(data) {
        this.queue = this.queue.concat(data);
        // Log.debug(this.sourceBuffer.updating, this.updating, this.queue.length);
        if (this.sourceBuffer && !this.sourceBuffer.updating && !this.cleaning) {
            // Log.debug('enq feed');
            this.feedNext();
        }
    }
}

class MSE {
    // static CODEC_AVC_BASELINE = "avc1.42E01E";
    // static CODEC_AVC_MAIN = "avc1.4D401E";
    // static CODEC_AVC_HIGH = "avc1.64001E";
    // static CODEC_VP8 = "vp8";
    // static CODEC_AAC = "mp4a.40.2";
    // static CODEC_VORBIS = "vorbis";
    // static CODEC_THEORA = "theora";

    static get ErrorNotes() {return  {
        [MediaError.MEDIA_ERR_ABORTED]: 'fetching process aborted by user',
        [MediaError.MEDIA_ERR_NETWORK]: 'error occurred when downloading',
        [MediaError.MEDIA_ERR_DECODE]: 'error occurred when decoding',
        [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: 'audio/video not supported'
    }};

    static isSupported(codecs) {
        return (window.MediaSource && window.MediaSource.isTypeSupported(`video/mp4; codecs="${codecs.join(',')}"`));
    }

    constructor (players) {
        this.players = players;
        const playing = this.players.map((video, idx) => {
            video.onplaying = function() {
                playing[idx] = true;
            };
            video.onpause = function() {
                playing[idx] = false;
            };
            return !video.paused;
        });
        this.playing = playing;
        this.eventSource = new EventEmitter();
        this.mediaSource = new MediaSource();
        this.reset();
    }

    destroy() {
        this.clear();
        this.eventSource.destroy();
    }

    play() {
        this.players.forEach((video, idx)=>{
            if (video.paused && !this.playing[idx]) {
                video.play();
            }
        });
    }

    setLive(is_live) {
        for (let idx in this.buffers) {
            this.buffers[idx].setLive(is_live);
        }
        this.is_live = is_live;
    }

    resetBuffers() {
        this.players.forEach((video)=>{
            if (!video.paused && this.playing[idx]) {
                video.pause();
            }
            video.currentTime = 0;
        });

        let promises = [];
        for (let buffer of this.buffers.values()) {
            promises.push(buffer.clear());
        }
        return Promise.all(promises).then(()=>{
            this.mediaSource.endOfStream();
            this.mediaSource.duration = 0;
            this.mediaSource.clearLiveSeekableRange();
            this.play();
        });
    }

    clear() {
        for (let track in this.buffers) {
            this.buffers[track].destroy();
            delete this.buffers[track];
        }
        if (this.mediaSource.readyState === 'open') {
            this.mediaSource.duration = 0;
            this.mediaSource.endOfStream();
        }
        this.players.forEach((video)=>{video.src = URL.createObjectURL(this.mediaSource)});

        return this.setupEvents();
    }

    setupEvents() {
        if (this._sourceOpen) this.mediaSource.removeEventListener('sourceopen', this._sourceOpen);
        if (this._sourceEnded) this.mediaSource.removeEventListener('sourceended', this._sourceEnded);
        if (this._sourceClose) this.mediaSource.removeEventListener('sourceclose', this._sourceClose);
        this.resolved = false;
        this.mediaReady = new Promise((resolve, reject)=> {
            this._sourceOpen = ()=> {
                Log$3.debug(`Media source opened: ${this.mediaSource.readyState}`);
                if (!this.resolved) {
                    this.resolved = true;
                    resolve();
                }
            };
            this._sourceEnded = ()=>{
                Log$3.debug(`Media source ended: ${this.mediaSource.readyState}`);
            };
            this._sourceClose = ()=>{
                Log$3.debug(`Media source closed: ${this.mediaSource.readyState}`);
                if (this.resolved) {
                    this.eventSource.dispatchEvent('sourceclose');
                }
            };
            this.mediaSource.addEventListener('sourceopen', this._sourceOpen);
            this.mediaSource.addEventListener('sourceended', this._sourceEnded);
            this.mediaSource.addEventListener('sourceclose', this._sourceClose);
        });
        return this.mediaReady;
    }

    reset() {
        this.updating = false;
        this.resolved = false;
        this.buffers = {};
        // this.players.forEach((video)=>{video.src = URL.createObjectURL(this.mediaSource)});
        // TODO: remove event listeners for existing media source
        // this.setupEvents();
        // this.clear();
    }

    setCodec(track, mimeCodec) {
        return this.mediaReady.then(()=>{
            this.buffers[track] = new Buffer(this, mimeCodec);
            this.buffers[track].setLive(this.is_live);
        });
    }

    feed(track, data) {
        if (this.buffers[track]) {
            this.buffers[track].feed(data);
        }
    }
}

const Log$4 = getTagged('remuxer:base');
let track_id = 1;
class BaseRemuxer {

    static get MP4_TIMESCALE() { return 90000;}

    // TODO: move to ts parser
    // static PTSNormalize(value, reference) {
    //
    //     let offset;
    //     if (reference === undefined) {
    //         return value;
    //     }
    //     if (reference < value) {
    //         // - 2^33
    //         offset = -8589934592;
    //     } else {
    //         // + 2^33
    //         offset = 8589934592;
    //     }
    //     /* PTS is 33bit (from 0 to 2^33 -1)
    //      if diff between value and reference is bigger than half of the amplitude (2^32) then it means that
    //      PTS looping occured. fill the gap */
    //     while (Math.abs(value - reference) > 4294967296) {
    //         value += offset;
    //     }
    //     return value;
    // }

    static getTrackID() {
        return track_id++;
    }

    constructor(timescale, scaleFactor, params) {
        this.timeOffset = 0;
        this.timescale = timescale;
        this.scaleFactor = scaleFactor;
        this.readyToDecode = false;
        this.samples = [];
        this.seq = 1;
        this.tsAlign = 1;
    }

    shifted(timestamp) {
        return timestamp - this.timeOffset;
    }

    scaled(timestamp) {
        return timestamp / this.scaleFactor;
    }

    unscaled(timestamp) {
        return timestamp * this.scaleFactor;
    }

    remux(unit) {
        if (unit && this.timeOffset >= 0) {
            this.samples.push({
                unit: unit,
                pts: this.shifted(unit.pts),
                dts: this.shifted(unit.dts)
            });
            return true;
        }
        return false;
    }

    static toMS(timestamp) {
        return timestamp/90;
    }
    
    setConfig(config) {
        
    }

    insertDscontinuity() {
        this.samples.push(null);
    }

    init(initPTS, initDTS, shouldInitialize=true) {
        this.initPTS = Math.min(initPTS, this.samples[0].dts - this.unscaled(this.timeOffset));
        this.initDTS = Math.min(initDTS, this.samples[0].dts - this.unscaled(this.timeOffset));
        Log$4.debug(`Initial pts=${this.initPTS} dts=${this.initDTS}`);
        this.initialized = shouldInitialize;
    }

    flush() {
        this.seq++;
        this.mp4track.len = 0;
        this.mp4track.samples = [];
    }

    getPayloadBase(sampleFunction, setupSample) {
        if (!this.readyToDecode || !this.initialized || !this.samples.length) return null;
        this.samples.sort(function(a, b) {
            return (a.dts-b.dts);
        });
        return true;

        let payload = new Uint8Array(this.mp4track.len);
        let offset = 0;
        let samples=this.mp4track.samples;
        let mp4Sample, lastDTS, pts, dts;

        while (this.samples.length) {
            let sample = this.samples.shift();
            if (sample === null) {
                // discontinuity
                this.nextDts = undefined;
                break;
            }

            let unit = sample.unit;

            pts = Math.round((sample.pts - this.initDTS)/this.tsAlign)*this.tsAlign;
            dts = Math.round((sample.dts - this.initDTS)/this.tsAlign)*this.tsAlign;
            // ensure DTS is not bigger than PTS
            dts = Math.min(pts, dts);

            // sampleFunction(pts, dts);   // TODO:

            // mp4Sample = setupSample(unit, pts, dts);    // TODO:

            payload.set(unit.getData(), offset);
            offset += unit.getSize();

            samples.push(mp4Sample);
            lastDTS = dts;
        }
        if (!samples.length) return null;

        // samplesPostFunction(samples); // TODO:

        return new Uint8Array(payload.buffer, 0, this.mp4track.len);
    }
}

const Log$2 = getTagged("remuxer:aac");
// TODO: asm.js
class AACRemuxer extends BaseRemuxer {

    constructor(timescale, scaleFactor = 1, params={}) {
        super(timescale, scaleFactor);

        this.codecstring=MSE.CODEC_AAC;
        this.units = [];
        this.initDTS = undefined;
        this.nextAacPts = undefined;
        this.lastPts = 0;
        this.firstDTS = 0;
        this.firstPTS = 0;
        this.duration = params.duration || 1;
        this.initialized = false;

        this.mp4track={
            id:BaseRemuxer.getTrackID(),
            type: 'audio',
            fragmented:true,
            channelCount:0,
            audiosamplerate: this.timescale,
            duration: 0,
            timescale: this.timescale,
            volume: 1,
            samples: [],
            config: '',
            len: 0
        };
        if (params.config) {
            this.setConfig(params.config);
        }
    }

    setConfig(config) {
        this.mp4track.channelCount = config.channels;
        this.mp4track.audiosamplerate = config.samplerate;
        if (!this.mp4track.duration) {
            this.mp4track.duration = (this.duration?this.duration:1)*config.samplerate;
        }
        this.mp4track.timescale = config.samplerate;
        this.mp4track.config = config.config;
        this.mp4track.codec = config.codec;
        this.timescale = config.samplerate;
        this.scaleFactor = BaseRemuxer.MP4_TIMESCALE / config.samplerate;
        this.expectedSampleDuration = 1024 * this.scaleFactor;
        this.readyToDecode = true;
    }

    remux(aac) {
        if (super.remux.call(this, aac)) {
            this.mp4track.len += aac.getSize();
        }
    }
    
    getPayload() {
        if (!this.readyToDecode || !this.samples.length) return null;
        this.samples.sort(function(a, b) {
            return (a.dts-b.dts);
        });

        let payload = new Uint8Array(this.mp4track.len);
        let offset = 0;
        let samples=this.mp4track.samples;
        let mp4Sample, lastDTS, pts, dts;

        while (this.samples.length) {
            let sample = this.samples.shift();
            if (sample === null) {
                // discontinuity
                this.nextDts = undefined;
                break;
            }
            let unit = sample.unit;
            pts = sample.pts - this.initDTS;
            dts = sample.dts - this.initDTS;

            if (lastDTS === undefined) {
                if (this.nextDts) {
                    let delta = Math.round(this.scaled(pts - this.nextAacPts));
                    // if fragment are contiguous, or delta less than 600ms, ensure there is no overlap/hole between fragments
                    if (/*contiguous || */Math.abs(delta) < 600) {
                        // log delta
                        if (delta) {
                            if (delta > 0) {
                                Log$2.log(`${delta} ms hole between AAC samples detected,filling it`);
                                // if we have frame overlap, overlapping for more than half a frame duraion
                            } else if (delta < -12) {
                                // drop overlapping audio frames... browser will deal with it
                                Log$2.log(`${(-delta)} ms overlapping between AAC samples detected, drop frame`);
                                this.mp4track.len -= unit.getSize();
                                continue;
                            }
                            // set DTS to next DTS
                            pts = dts = this.nextAacPts;
                        }
                    }
                }
                // remember first PTS of our aacSamples, ensure value is positive
                this.firstDTS = Math.max(0, dts);
            }

            mp4Sample = {
                size: unit.getSize(),
                cts: 0,
                duration:1024,
                flags: {
                    isLeading: 0,
                    isDependedOn: 0,
                    hasRedundancy: 0,
                    degradPrio: 0,
                    dependsOn: 1
                }
            };

            payload.set(unit.getData(), offset);
            offset += unit.getSize();
            samples.push(mp4Sample);
            lastDTS = dts;
        }
        if (!samples.length) return null;
        this.nextDts =pts+this.expectedSampleDuration;
        return new Uint8Array(payload.buffer, 0, this.mp4track.len);
    }
}
//test.bundle.js:42 [remuxer:h264] skip frame from the past at DTS=18397972271140676 with expected DTS=18397998040950484

class NALU {

    static get NDR() {return 1;}
    static get IDR() {return 5;}
    static get SEI() {return 6;}
    static get SPS() {return 7;}
    static get PPS() {return 8;}

    static get TYPES() {return {
        [NALU.IDR]: 'IDR',
        [NALU.SEI]: 'SEI',
        [NALU.SPS]: 'SPS',
        [NALU.PPS]: 'PPS',
        [NALU.NDR]: 'NDR'
    }};

    static type(nalu) {
        if (nalu.ntype in NALU.TYPES) {
            return NALU.TYPES[nalu.ntype];
        } else {
            return 'UNKNOWN';
        }
    }

    constructor(ntype, nri, data, dts, pts) {

        this.data = data;
        this.ntype = ntype;
        this.nri = nri;
        this.dts = dts;
        this.pts = pts ? pts : this.dts;

    }

    appendData(idata) {
        this.data = appendByteArray(this.data, idata);
    }

    type() {
        return this.ntype;
    }

    isKeyframe() {
        return this.ntype == NALU.IDR;
    }

    getSize() {
        return 4 + 1 + this.data.byteLength;
    }

    getData() {
        let header = new Uint8Array(5 + this.data.byteLength);
        let view = new DataView(header.buffer);
        view.setUint32(0, this.data.byteLength + 1);
        view.setUint8(4, (0x0 & 0x80) | (this.nri & 0x60) | (this.ntype & 0x1F));
        header.set(this.data, 5);
        return header;
    }
}

// TODO: asm.js
class NALUAsm {
    static get NALTYPE_FU_A() {return 28;}
    static get NALTYPE_FU_B() {return 29;}

    constructor() {
        this.nalu = null;
    }

    onNALUFragment(rawData, dts, pts) {

        var data = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);

        var nalhdr = data.getUint8(0);

        var nri = nalhdr & 0x60;
        var naltype = nalhdr & 0x1F;
        var nal_start_idx = 1;

        if (27 >= naltype && 0 < naltype) {
            /* This RTP package is a single NALU, dispatch and forget, 0 is undefined */
            return new NALU(naltype, nri, rawData.subarray(nal_start_idx), dts, pts);
            //return;
        }

        if (NALUAsm.NALTYPE_FU_A !== naltype && NALUAsm.NALTYPE_FU_B !== naltype) {
            /* 30 - 31 is undefined, ignore those (RFC3984). */
            Log.log('Undefined NAL unit, type: ' + naltype);
            return null;
        }
        nal_start_idx++;

        var nalfrag = data.getUint8(1);
        var nfstart = (nalfrag & 0x80) >>> 7;
        var nfend = (nalfrag & 0x40) >>> 6;
        var nftype = nalfrag & 0x1F;

        var nfdon = 0;
        if (NALUAsm.NALTYPE_FU_B === naltype) {
            nfdon = data.getUint16(2);
            nal_start_idx+=2;
        }

        if (null === this.nalu || nfstart) {
            if (!nfstart) {
                console.log('broken chunk (continuation of lost frame)');
                return null;
            }  // Ignore broken chunks

            /* Create a new NAL unit from multiple fragmented NAL units */
            this.nalu = new NALU(nftype, nri, rawData.subarray(nal_start_idx), dts, pts);
        } else {
            if (this.nalu.dts != dts) {
                // debugger;
                // Frames lost
                console.log('broken chunk (continuation of frame with other timestamp)');
                this.nalu = null;
                return null;
            }
            /* We've already created the NAL unit, append current data */
            this.nalu.appendData(rawData.subarray(nal_start_idx));
        }

        if (1 === nfend) {
            let ret = this.nalu;
            this.nalu = null;
            return ret;
        }
    }
}

class ExpGolomb {

  constructor(data) {
    this.data = data;
    // the number of bytes left to examine in this.data
    this.bytesAvailable = this.data.byteLength;
    // the current word being examined
    this.word = 0; // :uint
    // the number of bits left to examine in the current word
    this.bitsAvailable = 0; // :uint
  }

  // ():void
  loadWord() {
    var
      position = this.data.byteLength - this.bytesAvailable,
      workingBytes = new Uint8Array(4),
      availableBytes = Math.min(4, this.bytesAvailable);
    if (availableBytes === 0) {
      throw new Error('no bytes available');
    }
    workingBytes.set(this.data.subarray(position, position + availableBytes));
    this.word = new DataView(workingBytes.buffer, workingBytes.byteOffset, workingBytes.byteLength).getUint32(0);
    // track the amount of this.data that has been processed
    this.bitsAvailable = availableBytes * 8;
    this.bytesAvailable -= availableBytes;
  }

  // (count:int):void
  skipBits(count) {
    var skipBytes; // :int
    if (this.bitsAvailable > count) {
      this.word <<= count;
      this.bitsAvailable -= count;
    } else {
      count -= this.bitsAvailable;
      skipBytes = count >> 3;
      count -= (skipBytes >> 3);
      this.bytesAvailable -= skipBytes;
      this.loadWord();
      this.word <<= count;
      this.bitsAvailable -= count;
    }
  }

  // (size:int):uint
  readBits(size) {
    var
      bits = Math.min(this.bitsAvailable, size), // :uint
      valu = this.word >>> (32 - bits); // :uint
    if (size > 32) {
      Log.error('Cannot read more than 32 bits at a time');
    }
    this.bitsAvailable -= bits;
    if (this.bitsAvailable > 0) {
      this.word <<= bits;
    } else if (this.bytesAvailable > 0) {
      this.loadWord();
    }
    bits = size - bits;
    if (bits > 0) {
      return valu << bits | this.readBits(bits);
    } else {
      return valu;
    }
  }

  // ():uint
  skipLZ() {
    var leadingZeroCount; // :uint
    for (leadingZeroCount = 0; leadingZeroCount < this.bitsAvailable; ++leadingZeroCount) {
      if (0 !== (this.word & (0x80000000 >>> leadingZeroCount))) {
        // the first bit of working word is 1
        this.word <<= leadingZeroCount;
        this.bitsAvailable -= leadingZeroCount;
        return leadingZeroCount;
      }
    }
    // we exhausted word and still have not found a 1
    this.loadWord();
    return leadingZeroCount + this.skipLZ();
  }

  // ():void
  skipUEG() {
    this.skipBits(1 + this.skipLZ());
  }

  // ():void
  skipEG() {
    this.skipBits(1 + this.skipLZ());
  }

  // ():uint
  readUEG() {
    var clz = this.skipLZ(); // :uint
    return this.readBits(clz + 1) - 1;
  }

  // ():int
  readEG() {
    var valu = this.readUEG(); // :int
    if (0x01 & valu) {
      // the number is odd if the low order bit is set
      return (1 + valu) >>> 1; // add 1 to make it even, and divide by 2
    } else {
      return -1 * (valu >>> 1); // divide by two then make it negative
    }
  }

  // Some convenience functions
  // :Boolean
  readBoolean() {
    return 1 === this.readBits(1);
  }

  // ():int
  readUByte() {
    return this.readBits(8);
  }

  // ():int
  readUShort() {
    return this.readBits(16);
  }
    // ():int
  readUInt() {
    return this.readBits(32);
  }  
}

class H264Parser {

    constructor(remuxer) {
        this.remuxer = remuxer;
        this.track = remuxer.mp4track;
    }

    msToScaled(timestamp) {
        return (timestamp - this.remuxer.timeOffset) * this.remuxer.scaleFactor;
    }

    parseSPS(sps) {
        var config = H264Parser.readSPS(new Uint8Array(sps));

        this.track.width = config.width;
        this.track.height = config.height;
        this.track.sps = [new Uint8Array(sps)];
        // this.track.timescale = this.remuxer.timescale;
        // this.track.duration = this.remuxer.timescale; // TODO: extract duration for non-live client
        this.track.codec = 'avc1.';

        let codecarray = new DataView(sps.buffer, sps.byteOffset+1, 4);
        for (let i = 0; i < 3; ++i) {
            var h = codecarray.getUint8(i).toString(16);
            if (h.length < 2) {
                h = '0' + h;
            }
            this.track.codec  += h;
        }
    }

    parsePPS(pps) {
        this.track.pps = [new Uint8Array(pps)];
    }

    parseNAL(unit) {
        if (!unit) return false;
        
        let push = false;
        switch (unit.type()) {
            case NALU.NDR:
                push = true;
                break;
            case NALU.IDR:
                push = true;
                break;
            case NALU.PPS:
                if (!this.track.pps) {
                    this.parsePPS(unit.getData().subarray(4));
                    if (!this.remuxer.readyToDecode && this.track.pps && this.track.sps) {
                        this.remuxer.readyToDecode = true;
                    }
                }
                break;
            case NALU.SPS:
                if(!this.track.sps) {
                    this.parseSPS(unit.getData().subarray(4));
                    if (!this.remuxer.readyToDecode && this.track.pps && this.track.sps) {
                        this.remuxer.readyToDecode = true;
                    }
                }
                break;
            case NALU.SEI:
                // console.log('SEI');
                break;
            default:
        }
        return push;
    }

    /**
     * Advance the ExpGolomb decoder past a scaling list. The scaling
     * list is optionally transmitted as part of a sequence parameter
     * set and is not relevant to transmuxing.
     * @param decoder {ExpGolomb} exp golomb decoder
     * @param count {number} the number of entries in this scaling list
     * @see Recommendation ITU-T H.264, Section 7.3.2.1.1.1
     */
    static skipScalingList(decoder, count) {
        let lastScale = 8,
            nextScale = 8,
            deltaScale;
        for (let j = 0; j < count; j++) {
            if (nextScale !== 0) {
                deltaScale = decoder.readEG();
                nextScale = (lastScale + deltaScale + 256) % 256;
            }
            lastScale = (nextScale === 0) ? lastScale : nextScale;
        }
    }

    /**
     * Read a sequence parameter set and return some interesting video
     * properties. A sequence parameter set is the H264 metadata that
     * describes the properties of upcoming video frames.
     * @param data {Uint8Array} the bytes of a sequence parameter set
     * @return {object} an object with configuration parsed from the
     * sequence parameter set, including the dimensions of the
     * associated video frames.
     */
    static readSPS(data) {
        let decoder = new ExpGolomb(data);
        let frameCropLeftOffset = 0,
            frameCropRightOffset = 0,
            frameCropTopOffset = 0,
            frameCropBottomOffset = 0,
            sarScale = 1,
            profileIdc,profileCompat,levelIdc,
            numRefFramesInPicOrderCntCycle, picWidthInMbsMinus1,
            picHeightInMapUnitsMinus1,
            frameMbsOnlyFlag,
            scalingListCount;
        decoder.readUByte();
        profileIdc = decoder.readUByte(); // profile_idc
        profileCompat = decoder.readBits(5); // constraint_set[0-4]_flag, u(5)
        decoder.skipBits(3); // reserved_zero_3bits u(3),
        levelIdc = decoder.readUByte(); //level_idc u(8)
        decoder.skipUEG(); // seq_parameter_set_id
        // some profiles have more optional data we don't need
        if (profileIdc === 100 ||
            profileIdc === 110 ||
            profileIdc === 122 ||
            profileIdc === 244 ||
            profileIdc === 44  ||
            profileIdc === 83  ||
            profileIdc === 86  ||
            profileIdc === 118 ||
            profileIdc === 128) {
            var chromaFormatIdc = decoder.readUEG();
            if (chromaFormatIdc === 3) {
                decoder.skipBits(1); // separate_colour_plane_flag
            }
            decoder.skipUEG(); // bit_depth_luma_minus8
            decoder.skipUEG(); // bit_depth_chroma_minus8
            decoder.skipBits(1); // qpprime_y_zero_transform_bypass_flag
            if (decoder.readBoolean()) { // seq_scaling_matrix_present_flag
                scalingListCount = (chromaFormatIdc !== 3) ? 8 : 12;
                for (let i = 0; i < scalingListCount; ++i) {
                    if (decoder.readBoolean()) { // seq_scaling_list_present_flag[ i ]
                        if (i < 6) {
                            H264Parser.skipScalingList(decoder, 16);
                        } else {
                            H264Parser.skipScalingList(decoder, 64);
                        }
                    }
                }
            }
        }
        decoder.skipUEG(); // log2_max_frame_num_minus4
        var picOrderCntType = decoder.readUEG();
        if (picOrderCntType === 0) {
            decoder.readUEG(); //log2_max_pic_order_cnt_lsb_minus4
        } else if (picOrderCntType === 1) {
            decoder.skipBits(1); // delta_pic_order_always_zero_flag
            decoder.skipEG(); // offset_for_non_ref_pic
            decoder.skipEG(); // offset_for_top_to_bottom_field
            numRefFramesInPicOrderCntCycle = decoder.readUEG();
            for(let i = 0; i < numRefFramesInPicOrderCntCycle; ++i) {
                decoder.skipEG(); // offset_for_ref_frame[ i ]
            }
        }
        decoder.skipUEG(); // max_num_ref_frames
        decoder.skipBits(1); // gaps_in_frame_num_value_allowed_flag
        picWidthInMbsMinus1 = decoder.readUEG();
        picHeightInMapUnitsMinus1 = decoder.readUEG();
        frameMbsOnlyFlag = decoder.readBits(1);
        if (frameMbsOnlyFlag === 0) {
            decoder.skipBits(1); // mb_adaptive_frame_field_flag
        }
        decoder.skipBits(1); // direct_8x8_inference_flag
        if (decoder.readBoolean()) { // frame_cropping_flag
            frameCropLeftOffset = decoder.readUEG();
            frameCropRightOffset = decoder.readUEG();
            frameCropTopOffset = decoder.readUEG();
            frameCropBottomOffset = decoder.readUEG();
        }
        if (decoder.readBoolean()) {
            // vui_parameters_present_flag
            if (decoder.readBoolean()) {
                // aspect_ratio_info_present_flag
                let sarRatio;
                const aspectRatioIdc = decoder.readUByte();
                switch (aspectRatioIdc) {
                    case 1: sarRatio = [1,1]; break;
                    case 2: sarRatio = [12,11]; break;
                    case 3: sarRatio = [10,11]; break;
                    case 4: sarRatio = [16,11]; break;
                    case 5: sarRatio = [40,33]; break;
                    case 6: sarRatio = [24,11]; break;
                    case 7: sarRatio = [20,11]; break;
                    case 8: sarRatio = [32,11]; break;
                    case 9: sarRatio = [80,33]; break;
                    case 10: sarRatio = [18,11]; break;
                    case 11: sarRatio = [15,11]; break;
                    case 12: sarRatio = [64,33]; break;
                    case 13: sarRatio = [160,99]; break;
                    case 14: sarRatio = [4,3]; break;
                    case 15: sarRatio = [3,2]; break;
                    case 16: sarRatio = [2,1]; break;
                    case 255: {
                        sarRatio = [decoder.readUByte() << 8 | decoder.readUByte(), decoder.readUByte() << 8 | decoder.readUByte()];
                        break;
                    }
                }
                if (sarRatio) {
                    sarScale = sarRatio[0] / sarRatio[1];
                }
            }
            if (decoder.readBoolean()) {decoder.skipBits(1);}

            if (decoder.readBoolean()) {
                decoder.skipBits(4);
                if (decoder.readBoolean()) {
                    decoder.skipBits(24);
                }
            }
            if (decoder.readBoolean()) {
                decoder.skipUEG();
                decoder.skipUEG();
            }
            if (decoder.readBoolean()) {
                let unitsInTick = decoder.readUInt();
                let timeScale = decoder.readUInt();
                let fixedFrameRate = decoder.readBoolean();
                let frameDuration = timeScale/(2*unitsInTick);
                console.log(`timescale: ${timeScale}; unitsInTick: ${unitsInTick}; fixedFramerate: ${fixedFrameRate}; avgFrameDuration: ${frameDuration}`);
            }
        }
        return {
            width: Math.ceil((((picWidthInMbsMinus1 + 1) * 16) - frameCropLeftOffset * 2 - frameCropRightOffset * 2) * sarScale),
            height: ((2 - frameMbsOnlyFlag) * (picHeightInMapUnitsMinus1 + 1) * 16) - ((frameMbsOnlyFlag? 2 : 4) * (frameCropTopOffset + frameCropBottomOffset))
        };
    }

    static readSliceType(decoder) {
        // skip NALu type
        decoder.readUByte();
        // discard first_mb_in_slice
        decoder.readUEG();
        // return slice_type
        return decoder.readUEG();
    }
}

const Log$5 = getTagged("remuxer:h264"); 
// TODO: asm.js
class H264Remuxer extends BaseRemuxer {

    constructor(timescale, scaleFactor=1, params={}) {
        super(timescale, scaleFactor);

        this.nextDts = undefined;
        this.readyToDecode = false;
        this.initialized = false;

        this.firstDTS=0;
        this.firstPTS=0;
        this.lastDTS=undefined;
        this.lastSampleDuration = 0;
        this.lastDurations = [];
        // this.timescale = 90000;
        this.tsAlign = Math.round(this.timescale/60);

        this.mp4track={
            id:BaseRemuxer.getTrackID(),
            type: 'video',
            len:0,
            fragmented:true,
            sps:'',
            pps:'',
            width:0,
            height:0,
            timescale: timescale,
            duration: timescale,
            samples: []
        };
        this.samples = [];

        this.h264 = new H264Parser(this);

        if (params.sps) {
            this.setSPS(new Uint8Array(params.sps));
        }
        if (params.pps) {
            this.setPPS(new Uint8Array(params.pps));
        }

        if (this.mp4track.pps && this.mp4track.sps) {
            this.readyToDecode = true;
        }
    }

    _scaled(timestamp) {
        return timestamp >>> this.scaleFactor;
    }

    _unscaled(timestamp) {
        return timestamp << this.scaleFactor;
    }

    setSPS(sps) {
        this.h264.parseSPS(sps);
    }

    setPPS(pps) {
        this.h264.parsePPS(pps);
    }

    remux(nalu) {
        if (this.h264.parseNAL(nalu) && super.remux.call(this, nalu)) {
            this.mp4track.len += nalu.getSize();
        }
    }

    getPayload() {
        if (!this.getPayloadBase()) {
            return null;
        }

        let payload = new Uint8Array(this.mp4track.len);
        let offset = 0;
        let samples=this.mp4track.samples;
        let mp4Sample, lastDTS, pts, dts;


        // Log.debug(this.samples.map((e)=>{
        //     return Math.round((e.dts - this.initDTS));
        // }));

        // let minDuration = Number.MAX_SAFE_INTEGER;
        while (this.samples.length) {
            let sample = this.samples.shift();
            if (sample === null) {
                // discontinuity
                this.nextDts = undefined;
                break;
            }

            let unit = sample.unit;
            
            pts = /*Math.round(*/(sample.pts - this.initDTS)/*/this.tsAlign)*this.tsAlign*/;
            dts = /*Math.round(*/(sample.dts - this.initDTS)/*/this.tsAlign)*this.tsAlign*/;
            // ensure DTS is not bigger than PTS
            dts = Math.min(pts,dts);

            // if not first AVC sample of video track, normalize PTS/DTS with previous sample value
            // and ensure that sample duration is positive
            if (lastDTS !== undefined) {
                let sampleDuration = this.scaled(dts - lastDTS);
                // Log.debug(`Sample duration: ${sampleDuration}`);
                if (sampleDuration <= 0) {
                    Log$5.log(`invalid AVC sample duration at PTS/DTS: ${pts}/${dts}|lastDTS: ${lastDTS}:${sampleDuration}`);
                    this.mp4track.len -= unit.getSize();
                    continue;
                }
                // minDuration = Math.min(sampleDuration, minDuration);
                this.lastDurations.push(sampleDuration);
                if (this.lastDurations.length > 100) {
                    this.lastDurations.shift();
                }
                mp4Sample.duration = sampleDuration;
            } else {
                if (this.nextDts) {
                    let delta = dts - this.nextDts;
                    // if fragment are contiguous, or delta less than 600ms, ensure there is no overlap/hole between fragments
                    if (/*contiguous ||*/ Math.abs(Math.round(BaseRemuxer.toMS(delta))) < 600) {

                        if (delta) {
                            // set DTS to next DTS
                            // Log.debug(`Video/PTS/DTS adjusted: ${pts}->${Math.max(pts - delta, this.nextDts)}/${dts}->${this.nextDts},delta:${delta}`);
                            dts = this.nextDts;
                            // offset PTS as well, ensure that PTS is smaller or equal than new DTS
                            pts = Math.max(pts - delta, dts);
                        }
                    } else {
                        if (delta < 0) {
                            Log$5.log(`skip frame from the past at DTS=${dts} with expected DTS=${this.nextDts}`);
                            this.mp4track.len -= unit.getSize();
                            continue;
                        }
                    }
                }
                // remember first DTS of our avcSamples, ensure value is positive
                this.firstDTS = Math.max(0, dts);
            }

            mp4Sample = {
                size: unit.getSize(),
                duration: 0,
                cts: this.scaled(pts - dts),
                flags: {
                    isLeading: 0,
                    isDependedOn: 0,
                    hasRedundancy: 0,
                    degradPrio: 0
                }
            };
            let flags = mp4Sample.flags;
            if (sample.unit.isKeyframe() === true) {
                // the current sample is a key frame
                flags.dependsOn = 2;
                flags.isNonSync = 0;
            } else {
                flags.dependsOn = 1;
                flags.isNonSync = 1;
            }

            payload.set(unit.getData(), offset);
            offset += unit.getSize();

            samples.push(mp4Sample);
            lastDTS = dts;
        }

        if (!samples.length) return null;

        let avgDuration = this.lastDurations.reduce(function(a, b) { return (a|0) + (b|0); }, 0) / (this.lastDurations.length||1)|0;
        if (samples.length >= 2) {
            this.lastSampleDuration = avgDuration;
            mp4Sample.duration = avgDuration;
        } else {
            mp4Sample.duration = this.lastSampleDuration;
        }

        if(samples.length && (!this.nextDts /*|| navigator.userAgent.toLowerCase().indexOf('chrome') > -1*/)) {
            let flags = samples[0].flags;
            // chrome workaround, mark first sample as being a Random Access Point to avoid sourcebuffer append issue
            // https://code.google.com/p/chromium/issues/detail?id=229412
            flags.dependsOn = 2;
            flags.isNonSync = 0;
        }

        // next AVC sample DTS should be equal to last sample DTS + last sample duration
        this.nextDts = dts + this.unscaled(this.lastSampleDuration);
        // Log.debug(`next dts: ${this.nextDts}, last duration: ${this.lastSampleDuration}, last dts: ${dts}`);

        return new Uint8Array(payload.buffer, 0, this.mp4track.len);
    }
}

class PayloadType {
    static get H264() {return 1;}
    static get AAC() {return 2;}

    static get map() {return {
        [PayloadType.H264]: 'video',
        [PayloadType.AAC]: 'audio'
    }};

    static get string_map() {return  {
        H264: PayloadType.H264,
        AAC: PayloadType.AAC,
        'MP4A-LATM': PayloadType.AAC,
        'MPEG4-GENERIC': PayloadType.AAC
    }}
}

const LOG_TAG = "remuxer";
const Log$1 = getTagged(LOG_TAG);

class Remuxer {
    static get TrackConverters() {return {
        [PayloadType.H264]: H264Remuxer,
        [PayloadType.AAC]:  AACRemuxer
    }};

    static get TrackScaleFactor() {return {
        [PayloadType.H264]: 1,//4,
        [PayloadType.AAC]:  0
    }};

    static get TrackTimescale() {return {
        [PayloadType.H264]: 90000,//22500,
        [PayloadType.AAC]:  0
    }};

    constructor(mediaElement) {
        this.mse = new MSE([mediaElement]);
        this.eventSource = new EventEmitter();
        this.mse_ready = true;

        this.reset();

        this.errorListener = this.mseClose.bind(this);
        this.closeListener = this.mseClose.bind(this);
        this.samplesListener = this.onSamples.bind(this);
        this.audioConfigListener = this.onAudioConfig.bind(this);

        this.mse.eventSource.addEventListener('error', this.errorListener);
        this.mse.eventSource.addEventListener('sourceclose', this.closeListener);
        
        this.eventSource.addEventListener('ready', this.init.bind(this));
    }

    reset() {
        this.tracks = {};
        this.initialized = false;
        this.initSegments = {};
        this.codecs = [];
        this.streams = {};
        this.enabled = false;
    }

    destroy() {
        this.mse.destroy();
        this.mse = null;

        this.detachClient();

        this.eventSource.destroy();
    }

    onTracks(tracks) {
        Log$1.debug(tracks.detail);
        // store available track types
        for (let track of tracks.detail) {
            this.tracks[track.type] = new Remuxer.TrackConverters[track.type](Remuxer.TrackTimescale[track.type], Remuxer.TrackScaleFactor[track.type], track.params);
            if (track.offset) {
                this.tracks[track.type].timeOffset = track.offset;
            }
            if (track.duration) {
                this.tracks[track.type].mp4track.duration = track.duration*(this.tracks[track.type].timescale || Remuxer.TrackTimescale[track.type]);
                this.tracks[track.type].duration = track.duration;
            } else {
                this.tracks[track.type].duration = 1;
            }

            // this.tracks[track.type].duration
        }
        this.mse.setLive(!this.client.seekable);
    }

    setTimeOffset(timeOffset, track) {
        if (this.tracks[track.type]) {
            this.tracks[track.type].timeOffset = timeOffset;///this.tracks[track.type].scaleFactor;
        }
    }

    init() {
        let tracks = [];
        this.codecs = [];
        let initmse = [];
        let initPts = Infinity;
        let initDts = Infinity;
        for (let track_type in this.tracks) {
            let track = this.tracks[track_type];
            if (!MSE.isSupported([track.mp4track.codec])) {
                throw new Error(`${track.mp4track.type} codec ${track.mp4track.codec} is not supported`);
            }
            tracks.push(track.mp4track);
            this.codecs.push(track.mp4track.codec);
            track.init(initPts, initDts/*, false*/);
            // initPts = Math.min(track.initPTS, initPts);
            // initDts = Math.min(track.initDTS, initDts);
        }

        for (let track_type in this.tracks) {
            let track = this.tracks[track_type];
            //track.init(initPts, initDts);
            this.initSegments[track_type] = MP4.initSegment([track.mp4track], track.duration*track.timescale, track.timescale);
            initmse.push(this.initMSE(track_type, track.mp4track.codec));
        }
        this.initialized = true;
        Promise.all(initmse).then(()=>{
            this.mse.play();
            this.enabled = true;
        });
        
    }

    initMSE(track_type, codec) {
        if (MSE.isSupported(this.codecs)) {
            return this.mse.setCodec(track_type, `${PayloadType.map[track_type]}/mp4; codecs="${codec}"`).then(()=>{
                this.mse.feed(track_type, this.initSegments[track_type]);
                // this.mse.play();
                // this.enabled = true;
            });
        } else {
            throw new Error('Codecs are not supported');
        }
    }

    mseClose() {
        // this.mse.clear();
        this.eventSource.dispatchEvent('stopped');
    }

    flush() {
        this.onSamples();
        if (!this.initialized) {
            if (Object.keys(this.tracks).length) {
                for (let track_type in this.tracks) {
                    if (!this.tracks[track_type].readyToDecode || !this.tracks[track_type].samples.length) return;
                }
                this.eventSource.dispatchEvent('ready');
            }
        } else {
            for (let track_type in this.tracks) {
                let track = this.tracks[track_type];
                let pay = track.getPayload();
                if (pay && pay.byteLength) {
                    this.mse.feed(track_type, [MP4.moof(track.seq, track.scaled(track.firstDTS), track.mp4track), MP4.mdat(pay)]);
                    track.flush();
                }
            }
        }
    }

    onSamples(ev) {
        // TODO: check format
        // let data = ev.detail;
        // if (this.tracks[data.pay] && this.client.sampleQueues[data.pay].length) {
            // console.log(`video ${data.units[0].dts}`);
        for (let qidx in this.client.sampleQueues) {
            let queue = this.client.sampleQueues[qidx];
            while (queue.length) {
                let units = queue.shift();
                for (let chunk of units) {
                    this.tracks[qidx].remux(chunk);
                }
            }
        }
        // }
    }

    onAudioConfig(ev) {
        if (this.tracks[ev.detail.pay]) {
            this.tracks[ev.detail.pay].setConfig(ev.detail.config);
        }
    }

    attachClient(client) {
        this.detachClient();
        this.client = client;
        this.client.eventSource.addEventListener('samples', this.samplesListener);
        this.client.eventSource.addEventListener('audio_config', this.audioConfigListener);
        this.client.eventSource.addEventListener('tracks', this.onTracks.bind(this));
        this.client.eventSource.addEventListener('flush', this.flush.bind(this));
        this.client.eventSource.addEventListener('clear', ()=>{
            this.reset();
            this.mse.clear().then(()=>{
                this.mse.play();
            });
        });
    }

    detachClient() {
        if (this.client) {
            this.client.eventSource.removeEventListener('samples', this.samplesListener);
            this.client.eventSource.removeEventListener('audio_config', this.audioConfigListener);
            // TODO: clear other listeners
            // this.client.eventSource.removeEventListener('clear');
            this.client = null;
        }
    }
}

class State {
    constructor(name, stateMachine) {
        this.stateMachine = stateMachine;
        this.transitions = new Set();
        this.name = name;
    }


    activate() {
        return Promise.resolve(null);
    }

    finishTransition() {}

    deactivate() {
        return Promise.resolve(null);
    }
}

class StateMachine {
    constructor() {
        this.storage = {};
        this.currentState = null;
        this.states = new Map();
    }

    addState(name, {activate, finishTransition, deactivate}) {
        let state = new State(name, this);
        if (activate) state.activate = activate;
        if (finishTransition) state.finishTransition = finishTransition;
        if (deactivate) state.deactivate = deactivate;
        this.states.set(name, state);
        return this;
    }

    addTransition(fromName, toName){
        if (!this.states.has(fromName)) {
            throw ReferenceError(`No such state: ${fromName} while connecting to ${toName}`);
        }
        if (!this.states.has(toName)) {
            throw ReferenceError(`No such state: ${toName} while connecting from ${fromName}`);
        }
        this.states.get(fromName).transitions.add(toName);
        return this;
    }

    _promisify(res) {
        let promise;
        try {
            promise = res;
            if (!promise.then) {
                promise = Promise.resolve(promise);
            }
        } catch (e) {
            promise = Promise.reject(e);
        }
        return promise;
    }

    transitionTo(stateName) {
        if (this.currentState == null) {
            let state = this.states.get(stateName);
            return this._promisify(state.activate.call(this))
                .then((data)=> {
                    this.currentState = state;
                    return data;
                }).then(state.finishTransition.bind(this));
        }
        if (this.currentState.name == stateName) return Promise.resolve();
        if (this.currentState.transitions.has(stateName)) {
            let state = this.states.get(stateName);
            return this._promisify(state.deactivate.call(this))
                .then(state.activate.bind(this)).then((data)=> {
                    this.currentState = state;
                    return data;
                }).then(state.finishTransition.bind(this));
        } else {
            return Promise.reject(`No such transition: ${this.currentState.name} to ${stateName}`);
        }
    }

}

const Log$7 = getTagged("parser:sdp");

class SDPParser {
    constructor(){
        this.version = -1;
        this.origin = null;
        this.sessionName = null;
        this.timing = null;
        this.sessionBlock = {};
        this.media = {};
        this.tracks = {};
        this.mediaMap = {};
    }

    parse(content) {
        Log$7.debug(content);
        // return new Promise((resolve, reject)=>{
            var dataString = content;
            var success = true;
            var currentMediaBlock = this.sessionBlock;

            // TODO: multiple audio/video tracks

            for (let line of dataString.split("\n")) {
                line = line.replace(/\r/, '');
                if (0 === line.length) {
                    /* Empty row (last row perhaps?), skip to next */
                    continue;
                }

                switch (line.charAt(0)) {
                    case 'v':
                        if (-1 !== this.version) {
                            Log$7.log('Version present multiple times in SDP');
                            // reject();
                            return false;
                        }
                        success = success && this._parseVersion(line);
                        break;

                    case 'o':
                        if (null !== this.origin) {
                            Log$7.log('Origin present multiple times in SDP');
                            // reject();
                            return false;
                        }
                        success = success && this._parseOrigin(line);
                        break;

                    case 's':
                        if (null !== this.sessionName) {
                            Log$7.log('Session Name present multiple times in SDP');
                            // reject();
                            return false;
                        }
                        success = success && this._parseSessionName(line);
                        break;

                    case 't':
                        if (null !== this.timing) {
                            Log$7.log('Timing present multiple times in SDP');
                            // reject();
                            return false;
                        }
                        success = success && this._parseTiming(line);
                        break;

                    case 'm':
                        if (null !== currentMediaBlock && this.sessionBlock !== currentMediaBlock) {
                            /* Complete previous block and store it */
                            this.media[currentMediaBlock.type] = currentMediaBlock;
                        }

                        /* A wild media block appears */
                        currentMediaBlock = {};
                        currentMediaBlock.rtpmap = {};
                        this._parseMediaDescription(line, currentMediaBlock);
                        break;

                    case 'a':
                        SDPParser._parseAttribute(line, currentMediaBlock);
                        break;

                    default:
                        Log$7.log('Ignored unknown SDP directive: ' + line);
                        break;
                }

                if (!success) {
                    // reject();
                    return false;
                }
            }

            this.media[currentMediaBlock.type] = currentMediaBlock;

        //     success?resolve():reject();
        // });
        return success;
    }

    _parseVersion(line) {
        var matches = line.match(/^v=([0-9]+)$/);
        if (0 === matches.length) {
            Log$7.log('\'v=\' (Version) formatted incorrectly: ' + line);
            return false;
        }

        this.version = matches[1];
        if (0 != this.version) {
            Log$7.log('Unsupported SDP version:' + this.version);
            return false;
        }

        return true;
    }

    _parseOrigin(line) {
        var matches = line.match(/^o=([^ ]+) ([0-9]+) ([0-9]+) (IN) (IP4|IP6) ([^ ]+)$/);
        if (0 === matches.length) {
            Log$7.log('\'o=\' (Origin) formatted incorrectly: ' + line);
            return false;
        }

        this.origin = {};
        this.origin.username       = matches[1];
        this.origin.sessionid      = matches[2];
        this.origin.sessionversion = matches[3];
        this.origin.nettype        = matches[4];
        this.origin.addresstype    = matches[5];
        this.origin.unicastaddress = matches[6];

        return true;
    }

    _parseSessionName(line) {
        var matches = line.match(/^s=([^\r\n]+)$/);
        if (0 === matches.length) {
            Log$7.log('\'s=\' (Session Name) formatted incorrectly: ' + line);
            return false;
        }

        this.sessionName = matches[1];

        return true;
    }

    _parseTiming(line) {
        var matches = line.match(/^t=([0-9]+) ([0-9]+)$/);
        if (0 === matches.length) {
            Log$7.log('\'t=\' (Timing) formatted incorrectly: ' + line);
            return false;
        }

        this.timing = {};
        this.timing.start = matches[1];
        this.timing.stop  = matches[2];

        return true;
    }

    _parseMediaDescription(line, media) {
        var matches = line.match(/^m=([^ ]+) ([^ ]+) ([^ ]+)[ ]/);
        if (0 === matches.length) {
            Log$7.log('\'m=\' (Media) formatted incorrectly: ' + line);
            return false;
        }

        media.type  = matches[1];
        media.port  = matches[2];
        media.proto = matches[3];
        media.fmt   = line.substr(matches[0].length).split(' ').map(function(fmt, index, array) {
            return parseInt(fmt);
        });

        for (let fmt of media.fmt) {
            this.mediaMap[fmt] = media;
        }

        return true;
    }

    static _parseAttribute(line, media) {
        if (null === media) {
            /* Not in a media block, can't be bothered parsing attributes for session */
            return true;
        }

        var matches; /* Used for some cases of below switch-case */
        var separator = line.indexOf(':');
        var attribute = line.substr(0, (-1 === separator) ? 0x7FFFFFFF : separator); /* 0x7FF.. is default */

        switch (attribute) {
            case 'a=recvonly':
            case 'a=sendrecv':
            case 'a=sendonly':
            case 'a=inactive':
                media.mode = line.substr('a='.length);
                break;
case 'a=range':
                matches = line.match(/^a=range:\s*([a-zA-Z-]+)=([0-9.]+|now)\s*-\s*([0-9.]*)$/);
                media.range= [Number(matches[2]=="now"?-1:matches[2]), Number(matches[3]), matches[1]];
                break;
            case 'a=control':
                media.control = line.substr('a=control:'.length);
                break;

            case 'a=rtpmap':
                matches = line.match(/^a=rtpmap:(\d+) (.*)$/);
                if (null === matches) {
                    Log$7.log('Could not parse \'rtpmap\' of \'a=\'');
                    return false;
                }

                var payload = parseInt(matches[1]);
                media.rtpmap[payload] = {};

                var attrs = matches[2].split('/');
                media.rtpmap[payload].name  = attrs[0].toUpperCase();
                media.rtpmap[payload].clock = attrs[1];
                if (undefined !== attrs[2]) {
                    media.rtpmap[payload].encparams = attrs[2];
                }
                media.ptype = PayloadType.string_map[attrs[0].toUpperCase()];

                break;

            case 'a=fmtp':
                matches = line.match(/^a=fmtp:(\d+) (.*)$/);
                if (0 === matches.length) {
                    Log$7.log('Could not parse \'fmtp\'  of \'a=\'');
                    return false;
                }

                media.fmtp = {};
                for (var param of matches[2].split(';')) {
                    var idx = param.indexOf('=');
                    media.fmtp[param.substr(0, idx).toLowerCase().trim()] = param.substr(idx + 1).trim();
                }
                break;
        }

        return true;
    }

    getSessionBlock() {
        return this.sessionBlock;
    }

    hasMedia(mediaType) {
        return this.media[mediaType] != undefined;
    }

    getMediaBlock(mediaType) {
        return this.media[mediaType];
    }

    getMediaBlockByPayloadType(pt) {
        // for (var m in this.media) {
        //     if (-1 !== this.media[m].fmt.indexOf(pt)) {
        //         return this.media[m];
        //     }
        // }
        return this.mediaMap[pt] || null;

        //ErrorManager.dispatchError(826, [pt], true);
        // Log.error(`failed to find media with payload type ${pt}`);
        //
        // return null;
    }

    getMediaBlockList() {
        var res = [];
        for (var m in this.media) {
            res.push(m);
        }

        return res;
    }
}

class RTP {
    constructor(pkt/*uint8array*/, sdp) {
        let bytes = new DataView(pkt.buffer, pkt.byteOffset, pkt.byteLength);

        this.version   = bytes.getUint8(0) >>> 6;
        this.padding   = bytes.getUint8(0) & 0x20 >>> 5;
        this.has_extension = bytes.getUint8(0) & 0x10 >>> 4;
        this.csrc      = bytes.getUint8(0) & 0x0F;
        this.marker    = bytes.getUint8(1) >>> 7;
        this.pt        = bytes.getUint8(1) & 0x7F;
        this.sequence  = bytes.getUint16(2) ;
        this.timestamp = bytes.getUint32(4);
        this.ssrc      = bytes.getUint32(8);
        this.csrcs     = [];

        let pktIndex=12;
        if (this.csrc>0) {
            this.csrcs.push(bytes.getUint32(pktIndex));
            pktIndex+=4;
        }
        if (this.has_extension==1) {
            this.extension = bytes.getUint16(pktIndex);
            this.ehl = bytes.getUint16(pktIndex+2);
            pktIndex+=4;
            this.header_data = pkt.slice(pktIndex, this.ehl);
            pktIndex += this.ehl;
        }

        this.headerLength = pktIndex;
        let padLength = 0;
        if (this.padding) {
            padLength = bytes.getUint8(pkt.byteLength-1);
        }

        // this.bodyLength   = pkt.byteLength-this.headerLength-padLength;

        this.media = sdp.getMediaBlockByPayloadType(this.pt);
        if (null === this.media) {
            Log.log(`Media description for payload type: ${this.pt} not provided.`);
        }
        this.type = this.media.ptype;//PayloadType.string_map[this.media.rtpmap[this.media.fmt[0]].name];

        this.data = pkt.subarray(pktIndex);
        // this.timestamp = 1000 * (this.timestamp / this.media.rtpmap[this.pt].clock);
        // console.log(this);
    }
    getPayload() {
        return this.data;
    }

    getTimestampMS() {
        return this.timestamp; //1000 * (this.timestamp / this.media.rtpmap[this.pt].clock);
    }

    toString() {
        return "RTP(" +
            "version:"   + this.version   + ", " +
            "padding:"   + this.padding   + ", " +
            "has_extension:" + this.has_extension + ", " +
            "csrc:"      + this.csrc      + ", " +
            "marker:"    + this.marker    + ", " +
            "pt:"        + this.pt        + ", " +
            "sequence:"  + this.sequence  + ", " +
            "timestamp:" + this.timestamp + ", " +
            "ssrc:"      + this.ssrc      + ")";
    }

    isVideo(){return this.media.type == 'video';}
    isAudio(){return this.media.type == 'audio';}

    
}

class RTPFactory {
    constructor(sdp) {
        this.tsOffsets={};
        for (let pay in sdp.media) {
            for (let pt of sdp.media[pay].fmt) {
                this.tsOffsets[pt] = {last: 0, overflow: 0};
            }
        }
    }

    build(pkt/*uint8array*/, sdp) {
        let rtp = new RTP(pkt, sdp);

        let tsOffset = this.tsOffsets[rtp.pt];
        if (tsOffset) {
            rtp.timestamp += tsOffset.overflow;
            if (tsOffset.last && Math.abs(rtp.timestamp - tsOffset.last) > 0x7fffffff) {
                console.log(`\nlast ts: ${tsOffset.last}\n
                            new ts: ${rtp.timestamp}\n
                            new ts adjusted: ${rtp.timestamp+0xffffffff}\n
                            last overflow: ${tsOffset.overflow}\n
                            new overflow: ${tsOffset.overflow+0xffffffff}\n
                            `);
                tsOffset.overflow += 0xffffffff;
                rtp.timestamp += 0xffffffff;
            }
            /*if (rtp.timestamp>0xffffffff) {
                console.log(`ts: ${rtp.timestamp}, seq: ${rtp.sequence}`);
            }*/
            tsOffset.last = rtp.timestamp;
        }

        return rtp;
    }
}

class RTSPMessage {
    static get RTSP_1_0() {return  "RTSP/1.0";}

    constructor(_rtsp_version) {
        this.version = _rtsp_version;
    }

    build(_cmd, _host, _params={}, _payload=null) {
        let requestString = `${_cmd} ${_host} ${this.version}\r\n`;
        for (let param in _params) {
            requestString+=`${param}: ${_params[param]}\r\n`
        }
        // TODO: binary payload
        if (_payload) {
            requestString+=`Content-Length: ${_payload.length}\r\n`
        }
        requestString+='\r\n';
        if (_payload) {
            requestString+=_payload;
        }
        return requestString;
    }

    parse(_data) {
        let lines = _data.split('\r\n');
        let parsed = {
            headers:{},
            body:null,
            code: 0,
            statusLine: ''
        };

        let match;
        [match, parsed.code, parsed.statusLine] = lines[0].match(new RegExp(`${this.version}[ ]+([0-9]{3})[ ]+(.*)`));
        parsed.code = Number(parsed.code);
        let lineIdx = 1;

        while (lines[lineIdx]) {
            let [k,v] = lines[lineIdx].split(/:(.+)/);
            parsed.headers[k.toLowerCase()] = v.trim();
            lineIdx++;
        }

        parsed.body = lines.slice(lineIdx).join('\n\r');

        return parsed;
    }

}

const MessageBuilder = new RTSPMessage(RTSPMessage.RTSP_1_0);

class RTPPayloadParser {

    constructor() {
        this.h264parser = new RTPH264Parser();
        this.aacparser = new RTPAACParser();
    }

    parse(rtp) {
        if (rtp.media.type=='video') {
            return this.h264parser.parse(rtp);
        } else if (rtp.media.type == 'audio') {
            return this.aacparser.parse(rtp);
        }
        return null;
    }
}

class RTPH264Parser {
    constructor() {
        this.naluasm = new NALUAsm();
    }

    parse(rtp) {
        return this.naluasm.onNALUFragment(rtp.getPayload(), rtp.getTimestampMS());
    }
}

class RTPAACParser {

    constructor() {
        this.scale = 1;
        this.asm = new AACAsm();
    }

    setConfig(conf) {
        this.asm.config = conf;
    }

    parse(rtp) {
        return this.asm.onAACFragment(rtp);
    }
}

class BaseClient {
    constructor(transport, options={flush: 100}) {
        this.options = options;
        this.eventSource = new EventEmitter();

        Object.defineProperties(this, {
            url: {value: null, writable: true},
            paused: {value: true, writable: true},
            seekable: {value: false, writable: true},
            connected: {value: false, writable: true}
        });

        this._onControl = ()=> {
            this.connected = true;
            while (this.transport.ctrlQueue.length) {
                this.onControl(this.transport.ctrlQueue.pop());
            }
        };
        this._onData = ()=>{
            if (this.connected) {
                while (this.transport.dataQueue.length) {
                    this.onData(this.transport.dataQueue.pop());
                }
            }
        };
        this._onConnect = this.onConnected.bind(this);
        this._onDisconnect = this.onDisconnected.bind(this);
        this.attachTransport(transport);
    }

    static streamType() {
        return null;
    }

    destroy() {
        this.detachTransport();
    }

    attachTransport(transport) {
        this.detachTransport();
        this.transport = transport;
        this.transport.eventSource.addEventListener('control', this._onControl);
        this.transport.eventSource.addEventListener('data', this._onData);
        this.transport.eventSource.addEventListener('connected', this._onConnect);
        this.transport.eventSource.addEventListener('disconnected', this._onDisconnect);
    }

    detachTransport() {
        if (this.transport) {
            this.transport.eventSource.removeEventListener('control', this._onControl);
            this.transport.eventSource.removeEventListener('data', this._onData);
            this.transport.eventSource.removeEventListener('connected', this._onConnect);
            this.transport.eventSource.removeEventListener('disconnected', this._onDisconnect);
        }
    }

    start() {
        Log.log('Client started');
        this.paused = false;
        // this.startStreamFlush();
    }

    stop() {
        Log.log('Client paused');
        this.paused = true;
        // this.stopStreamFlush();
    }

    seek(timeOffset) {

    }

    setSource(url) {
        // this.stop();
        this.url = url;
    }

    startStreamFlush() {
        this.flushInterval = setInterval(()=>{
            if (!this.paused) {
                this.eventSource.dispatchEvent('flush');
            }
        }, this.options.flush);
    }

    stopStreamFlush() {
        clearInterval(this.flushInterval);
    }

    onControl(ctrl) {

    }

    onData(data) {

    }

    onConnected() {
        if (!this.seekable) {
            this.transport.dataQueue = [];
            this.eventSource.dispatchEvent('clear');
        }
        this.connected = true;
    }

    onDisconnected() {
        this.connected = false;
    }
}

const LOG_TAG$2 = "client:rtsp";
const Log$6 = getTagged(LOG_TAG$2);

class RTSPClient extends BaseClient {
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

class RTSPClientSM extends StateMachine {
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
        Log$6.debug(payload);
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
            Log$6.debug(_data);
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
            Log$6.log("setup track: "+track_type);
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

class BaseTransport {
    constructor() {
        this.eventSource = new EventEmitter();
        this.ctrlQueue = [];
        this.dataQueue = [];
    }

    static streamTypes() {
        return [];
    }

    destroy() {
        this.eventSource.destroy();
    }

    connect() {
        // TO be impemented
    }

    disconnect() {
        // TO be impemented
    }

    reconnect() {
        return this.disconnect().then(()=>{
            return this.connect();
        });
    }

    setEndpoint(endpoint) {
        this.endpoint = endpoint;
        return this.reconnect();
    }

    send(data) {
        // TO be impemented
        // return this.prepare(data).send();
    }

    prepare(data) {
        // TO be impemented
        // return new Request(data);
    }

    // onData(type, data) {
    //     this.eventSource.dispatchEvent(type, data);
    // }
}

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// ASN.1 JavaScript decoder
// Copyright (c) 2008-2013 Lapo Luchini <lapo@lapo.it>

// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
// 
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

/*jshint browser: true, strict: true, immed: true, latedef: true, undef: true, regexdash: false */
/*global oids */

// Pool size must be a multiple of 4 and greater than 32.
// An array of bytes the size of the pool will be passed to init()
var rng_psize = 256;

var rng_pool;
var rng_pptr;

// Initialize the pool with junk if needed.
if(rng_pool == null) {
  rng_pool = new Array();
  rng_pptr = 0;
  var t;
  if(window.crypto && window.crypto.getRandomValues) {
    // Extract entropy (2048 bits) from RNG if available
    var z = new Uint32Array(256);
    window.crypto.getRandomValues(z);
    for (t = 0; t < z.length; ++t)
      rng_pool[rng_pptr++] = z[t] & 255;
  }

  // Use mouse events for entropy, if we do not have enough entropy by the time
  // we need it, entropy will be generated by Math.random.
  var onMouseMoveListener = function(ev) {
    this.count = this.count || 0;
    if (this.count >= 256 || rng_pptr >= rng_psize) {
      if (window.removeEventListener)
        window.removeEventListener("mousemove", onMouseMoveListener, false);
      else if (window.detachEvent)
        window.detachEvent("onmousemove", onMouseMoveListener);
      return;
    }
    try {
      var mouseCoordinates = ev.x + ev.y;
      rng_pool[rng_pptr++] = mouseCoordinates & 255;
      this.count += 1;
    } catch (e) {
      // Sometimes Firefox will deny permission to access event properties for some reason. Ignore.
    }
  };
  if (window.addEventListener)
    window.addEventListener("mousemove", onMouseMoveListener, false);
  else if (window.attachEvent)
    window.attachEvent("onmousemove", onMouseMoveListener);

}

// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
class BigInteger {
  constructor(a,b,c) {
    if (a != null)
      if ("number" == typeof a) this.fromNumber(a, b, c);
      else if (b == null && "string" != typeof a) this.fromString(a, 256);
      else this.fromString(a, b);
  }
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = [];
var rr;
var vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+this.DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this[this.t++] = x;
    else if(sh+k > this.DB) {
      this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this[this.t++] = (x>>(this.DB-sh));
    }
    else
      this[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this[i]&((1<<p)-1))<<(k-p);
        d |= this[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r[i+ds+1] = (this[i]>>cbs)|c;
    c = (this[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = this[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r[i-ds-1] |= (this[i]&bm)<<cbs;
    r[i-ds] = this[i]>>bs;
  }
  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]-a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = this.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
class Classic{
  constructor(m){
    this.m = m;
  }
}
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
class Montgomery {
  constructor(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 0x7fff;
    this.mph = this.mp >> 15;
    this.um = (1 << (m.DB - 15)) - 1;
    this.mt2 = 2 * m.t;
  }
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

// (public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

// (public) return value as integer
function bnIntValue() {
  if(this.s < 0) {
    if(this.t == 1) return this[0]-this.DV;
    else if(this.t == 0) return -1;
  }
  else if(this.t == 1) return this[0];
  else if(this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
}

// (public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

// (public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  if(this.s < 0) return -1;
  else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
  else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if(b == null) b = 10;
  if(this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b,cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d,y,z);
  while(y.signum() > 0) {
    r = (a+z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d,y,z);
  }
  return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s,b) {
  this.fromInt(0);
  if(b == null) b = 10;
  var cs = this.chunkSize(b);
  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
  for(var i = 0; i < s.length; ++i) {
    var x = intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
      continue;
    }
    w = b*w+x;
    if(++j >= cs) {
      this.dMultiply(d);
      this.dAddOffset(w,0);
      j = 0;
      w = 0;
    }
  }
  if(j > 0) {
    this.dMultiply(Math.pow(b,j));
    this.dAddOffset(w,0);
  }
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) alternate constructor
function bnpFromNumber(a,b,c) {
  if("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if(a < 2) this.fromInt(1);
    else {
      this.fromNumber(a,c);
      if(!this.testBit(a-1))	// force MSB set
        this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
      if(this.isEven()) this.dAddOffset(1,0); // force odd
      while(!this.isProbablePrime(b)) {
        this.dAddOffset(2,0);
        if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
      }
    }
  }
  else {
    // new BigInteger(int,RNG)
    var x = [], t = a&7;
    x.length = (a>>3)+1;
    b.nextBytes(x);
    if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
    this.fromString(x,256);
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var i = this.t, r = [];
  r[0] = this.s;
  var p = this.DB-(i*this.DB)%8, d, k = 0;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
      r[k++] = d|(this.s<<(this.DB-p));
    while(i >= 0) {
      if(p < 8) {
        d = (this[i]&((1<<p)-1))<<(8-p);
        d |= this[--i]>>(p+=this.DB-8);
      }
      else {
        d = (this[i]>>(p-=8))&0xff;
        if(p <= 0) { p += this.DB; --i; }
      }
      if((d&0x80) != 0) d |= -256;
      if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
      if(k > 0 || d != this.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
  var i, f, m = Math.min(a.t,this.t);
  for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
  if(a.t < this.t) {
    f = a.s&this.DM;
    for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
    r.t = this.t;
  }
  else {
    f = this.s&this.DM;
    for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
    r.t = a.t;
  }
  r.s = op(this.s,a.s);
  r.clamp();
}

// (public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

// (public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

// (public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

// (public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

// (public) ~this
function bnNot() {
  var r = nbi();
  for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}

// (public) this << n
function bnShiftLeft(n) {
  var r = nbi();
  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
  return r;
}

// (public) this >> n
function bnShiftRight(n) {
  var r = nbi();
  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
  return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if(x == 0) return -1;
  var r = 0;
  if((x&0xffff) == 0) { x >>= 16; r += 16; }
  if((x&0xff) == 0) { x >>= 8; r += 8; }
  if((x&0xf) == 0) { x >>= 4; r += 4; }
  if((x&3) == 0) { x >>= 2; r += 2; }
  if((x&1) == 0) ++r;
  return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  for(var i = 0; i < this.t; ++i)
    if(this[i] != 0) return i*this.DB+lbit(this[i]);
  if(this.s < 0) return this.t*this.DB;
  return -1;
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0;
  while(x != 0) { x &= x-1; ++r; }
  return r;
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0, x = this.s&this.DM;
  for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
  return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var j = Math.floor(n/this.DB);
  if(j >= this.t) return(this.s!=0);
  return((this[j]&(1<<(n%this.DB)))!=0);
}

// (protected) this op (1<<n)
function bnpChangeBit(n,op) {
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r,op,r);
  return r;
}

// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

// (protected) r = this + a
function bnpAddTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]+a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c += a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c += a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += a.s;
  }
  r.s = (c<0)?-1:0;
  if(c > 0) r[i++] = c;
  else if(c < -1) r[i++] = this.DV+c;
  r.t = i;
  r.clamp();
}

// (public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

// (public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

// (public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

// (public) this^2
function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

// (public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

// (public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = nbi(), r = nbi();
  this.divRemTo(a,q,r);
  return new Array(q,r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  this[this.t] = this.am(0,n-1,this,0,0,this.t);
  ++this.t;
  this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
  if(n == 0) return;
  while(this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while(this[w] >= this.DV) {
    this[w] -= this.DV;
    if(++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
}

// A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
  var i = Math.min(this.t+a.t,n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while(i > 0) r[--i] = 0;
  var j;
  for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
  r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
  --n;
  var i = r.t = this.t+a.t-n;
  r.s = 0; // assumes a,this >= 0
  while(--i >= 0) r[i] = 0;
  for(i = Math.max(n-this.t,0); i < a.t; ++i)
    r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
  r.clamp();
  r.drShiftTo(1,r);
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x) {
  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
  else if(x.compareTo(this.m) < 0) return x;
  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  x.drShiftTo(this.m.t-1,this.r2);
  if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
  this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
  this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
  while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
  x.subTo(this.r2,x);
  while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
  var i = e.bitLength(), k, r = nbv(1), z;
  if(i <= 0) return r;
  else if(i < 18) k = 1;
  else if(i < 48) k = 3;
  else if(i < 144) k = 4;
  else if(i < 768) k = 5;
  else k = 6;
  if(i < 8)
    z = new Classic(m);
  else if(m.isEven())
    z = new Barrett(m);
  else
    z = new Montgomery(m);

  // precomputation
  var g = [], n = 3, k1 = k-1, km = (1<<k)-1;
  g[1] = z.convert(this);
  if(k > 1) {
    var g2 = nbi();
    z.sqrTo(g[1],g2);
    while(n <= km) {
      g[n] = nbi();
      z.mulTo(g2,g[n-2],g[n]);
      n += 2;
    }
  }

  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
  i = nbits(e[j])-1;
  while(j >= 0) {
    if(i >= k1) w = (e[j]>>(i-k1))&km;
    else {
      w = (e[j]&((1<<(i+1))-1))<<(k1-i);
      if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
    }

    n = k;
    while((w&1) == 0) { w >>= 1; --n; }
    if((i -= n) < 0) { i += this.DB; --j; }
    if(is1) {	// ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    }
    else {
      while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
      if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
      z.mulTo(r2,g[w],r);
    }

    while(j >= 0 && (e[j]&(1<<i)) == 0) {
      z.sqrTo(r,r2); t = r; r = r2; r2 = t;
      if(--i < 0) { i = this.DB-1; --j; }
    }
  }
  return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s<0)?this.negate():this.clone();
  var y = (a.s<0)?a.negate():a.clone();
  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
  if(g < 0) return x;
  if(i < g) g = i;
  if(g > 0) {
    x.rShiftTo(g,x);
    y.rShiftTo(g,y);
  }
  while(x.signum() > 0) {
    if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
    if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
    if(x.compareTo(y) >= 0) {
      x.subTo(y,x);
      x.rShiftTo(1,x);
    }
    else {
      y.subTo(x,y);
      y.rShiftTo(1,y);
    }
  }
  if(g > 0) y.lShiftTo(g,y);
  return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  if(n <= 0) return 0;
  var d = this.DV%n, r = (this.s<0)?n-1:0;
  if(this.t > 0)
    if(d == 0) r = this[0]%n;
    else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
  return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven();
  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(), v = this.clone();
  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
  while(u.signum() != 0) {
    while(u.isEven()) {
      u.rShiftTo(1,u);
      if(ac) {
        if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
        a.rShiftTo(1,a);
      }
      else if(!b.isEven()) b.subTo(m,b);
      b.rShiftTo(1,b);
    }
    while(v.isEven()) {
      v.rShiftTo(1,v);
      if(ac) {
        if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
        c.rShiftTo(1,c);
      }
      else if(!d.isEven()) d.subTo(m,d);
      d.rShiftTo(1,d);
    }
    if(u.compareTo(v) >= 0) {
      u.subTo(v,u);
      if(ac) a.subTo(c,a);
      b.subTo(d,b);
    }
    else {
      v.subTo(u,v);
      if(ac) c.subTo(a,c);
      d.subTo(b,d);
    }
  }
  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if(d.compareTo(m) >= 0) return d.subtract(m);
  if(d.signum() < 0) d.addTo(m,d); else return d;
  if(d.signum() < 0) return d.add(m); else return d;
}

var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
var lplim = (1<<26)/lowprimes[lowprimes.length-1];

// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
  var i, x = this.abs();
  if(x.t == 1 && x[0] <= lowprimes[lowprimes.length-1]) {
    for(i = 0; i < lowprimes.length; ++i)
      if(x[0] == lowprimes[i]) return true;
    return false;
  }
  if(x.isEven()) return false;
  i = 1;
  while(i < lowprimes.length) {
    var m = lowprimes[i], j = i+1;
    while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
    m = x.modInt(m);
    while(i < j) if(m%lowprimes[i++] == 0) return false;
  }
  return x.millerRabin(t);
}

// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
  var n1 = this.subtract(BigInteger.ONE);
  var k = n1.getLowestSetBit();
  if(k <= 0) return false;
  var r = n1.shiftRight(k);
  t = (t+1)>>1;
  if(t > lowprimes.length) t = lowprimes.length;
  var a = nbi();
  for(var i = 0; i < t; ++i) {
    //Pick bases at random, instead of starting at 2
    a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
    var y = a.modPow(r,this);
    if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
      var j = 1;
      while(j++ < k && y.compareTo(n1) != 0) {
        y = y.modPowInt(2,this);
        if(y.compareTo(BigInteger.ONE) == 0) return false;
      }
      if(y.compareTo(n1) != 0) return false;
    }
  }
  return true;
}

// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;

// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

// JSBN-specific extension
BigInteger.prototype.square = bnSquare;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)

/*! asn1-1.0.2.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */

const JSX = /*window.JSX || */{};
JSX.env = JSX.env || {};

var L = JSX;
var OP = Object.prototype;
var FUNCTION_TOSTRING = '[object Function]';
var ADD = ["toString", "valueOf"];
JSX.env.parseUA = function(agent) {

    var numberify = function(s) {
        var c = 0;
        return parseFloat(s.replace(/\./g, function() {
            return (c++ == 1) ? '' : '.';
        }));
    },

    nav = navigator,
    o = {
        ie: 0,
        opera: 0,
        gecko: 0,
        webkit: 0,
        chrome: 0,
        mobile: null,
        air: 0,
        ipad: 0,
        iphone: 0,
        ipod: 0,
        ios: null,
        android: 0,
        webos: 0,
        caja: nav && nav.cajaVersion,
        secure: false,
        os: null

    },

    ua = agent || (navigator && navigator.userAgent),
    loc = window && window.location,
    href = loc && loc.href,
    m;

    o.secure = href && (href.toLowerCase().indexOf("https") === 0);

    if (ua) {

        if ((/windows|win32/i).test(ua)) {
            o.os = 'windows';
        } else if ((/macintosh/i).test(ua)) {
            o.os = 'macintosh';
        } else if ((/rhino/i).test(ua)) {
            o.os = 'rhino';
        }
        if ((/KHTML/).test(ua)) {
            o.webkit = 1;
        }
        m = ua.match(/AppleWebKit\/([^\s]*)/);
        if (m && m[1]) {
            o.webkit = numberify(m[1]);
            if (/ Mobile\//.test(ua)) {
                o.mobile = 'Apple'; // iPhone or iPod Touch
                m = ua.match(/OS ([^\s]*)/);
                if (m && m[1]) {
                    m = numberify(m[1].replace('_', '.'));
                }
                o.ios = m;
                o.ipad = o.ipod = o.iphone = 0;
                m = ua.match(/iPad|iPod|iPhone/);
                if (m && m[0]) {
                    o[m[0].toLowerCase()] = o.ios;
                }
            } else {
                m = ua.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/);
                if (m) {
                    o.mobile = m[0];
                }
                if (/webOS/.test(ua)) {
                    o.mobile = 'WebOS';
                    m = ua.match(/webOS\/([^\s]*);/);
                    if (m && m[1]) {
                        o.webos = numberify(m[1]);
                    }
                }
                if (/ Android/.test(ua)) {
                    o.mobile = 'Android';
                    m = ua.match(/Android ([^\s]*);/);
                    if (m && m[1]) {
                        o.android = numberify(m[1]);
                    }
                }
            }
            m = ua.match(/Chrome\/([^\s]*)/);
            if (m && m[1]) {
                o.chrome = numberify(m[1]); // Chrome
            } else {
                m = ua.match(/AdobeAIR\/([^\s]*)/);
                if (m) {
                    o.air = m[0]; // Adobe AIR 1.0 or better
                }
            }
        }
        if (!o.webkit) {
            m = ua.match(/Opera[\s\/]([^\s]*)/);
            if (m && m[1]) {
                o.opera = numberify(m[1]);
                m = ua.match(/Version\/([^\s]*)/);
                if (m && m[1]) {
                    o.opera = numberify(m[1]); // opera 10+
                }
                m = ua.match(/Opera Mini[^;]*/);
                if (m) {
                    o.mobile = m[0]; // ex: Opera Mini/2.0.4509/1316
                }
            } else { // not opera or webkit
                m = ua.match(/MSIE\s([^;]*)/);
                if (m && m[1]) {
                    o.ie = numberify(m[1]);
                } else { // not opera, webkit, or ie
                    m = ua.match(/Gecko\/([^\s]*)/);
                    if (m) {
                        o.gecko = 1; // Gecko detected, look for revision
                        m = ua.match(/rv:([^\s\)]*)/);
                        if (m && m[1]) {
                            o.gecko = numberify(m[1]);
                        }
                    }
                }
            }
        }
    }
    return o;
};

JSX.env.ua = JSX.env.parseUA();

JSX.isFunction = function(o) {
    return (typeof o === 'function') || OP.toString.apply(o) === FUNCTION_TOSTRING;
};

JSX._IEEnumFix = (JSX.env.ua.ie) ? function(r, s) {
    var i, fname, f;
    for (i=0;i<ADD.length;i=i+1) {

        fname = ADD[i];
        f = s[fname];

        if (L.isFunction(f) && f!=OP[fname]) {
            r[fname]=f;
        }
    }
} : function(){};

JSX.extend = function(subc, superc, overrides) {
    if (!superc||!subc) {
        throw new Error("extend failed, please check that " +
                        "all dependencies are included.");
    }
    var F = function() {}, i;
    F.prototype=superc.prototype;
    subc.prototype=new F();
    subc.prototype.constructor=subc;
    subc.superclass=superc.prototype;
    if (superc.prototype.constructor == OP.constructor) {
        superc.prototype.constructor=superc;
    }

    if (overrides) {
        for (i in overrides) {
            if (L.hasOwnProperty(overrides, i)) {
                subc.prototype[i]=overrides[i];
            }
        }

        L._IEEnumFix(subc.prototype, overrides);
    }
};

/*
 * asn1.js - ASN.1 DER encoder classes
 *
 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name asn1-1.0.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 1.0.2 (2013-May-30)
 * @since 2.1
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/** 
 * kjur's class library name space
 * <p>
 * This name space provides following name spaces:
 * <ul>
 * <li>{@link KJUR.asn1} - ASN.1 primitive hexadecimal encoder</li>
 * <li>{@link KJUR.asn1.x509} - ASN.1 structure for X.509 certificate and CRL</li>
 * <li>{@link KJUR.crypto} - Java Cryptographic Extension(JCE) style MessageDigest/Signature 
 * class and utilities</li>
 * </ul>
 * </p> 
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
  * @name KJUR
 * @namespace kjur's class library name space
 */
// if (typeof KJUR == "undefined" || !KJUR)
const KJUR = {};

/**
 * kjur's ASN.1 class library name space
 * <p>
 * This is ITU-T X.690 ASN.1 DER encoder class library and
 * class structure and methods is very similar to 
 * org.bouncycastle.asn1 package of 
 * well known BouncyCaslte Cryptography Library.
 *
 * <h4>PROVIDING ASN.1 PRIMITIVES</h4>
 * Here are ASN.1 DER primitive classes.
 * <ul>
 * <li>{@link KJUR.asn1.DERBoolean}</li>
 * <li>{@link KJUR.asn1.DERInteger}</li>
 * <li>{@link KJUR.asn1.DERBitString}</li>
 * <li>{@link KJUR.asn1.DEROctetString}</li>
 * <li>{@link KJUR.asn1.DERNull}</li>
 * <li>{@link KJUR.asn1.DERObjectIdentifier}</li>
 * <li>{@link KJUR.asn1.DERUTF8String}</li>
 * <li>{@link KJUR.asn1.DERNumericString}</li>
 * <li>{@link KJUR.asn1.DERPrintableString}</li>
 * <li>{@link KJUR.asn1.DERTeletexString}</li>
 * <li>{@link KJUR.asn1.DERIA5String}</li>
 * <li>{@link KJUR.asn1.DERUTCTime}</li>
 * <li>{@link KJUR.asn1.DERGeneralizedTime}</li>
 * <li>{@link KJUR.asn1.DERSequence}</li>
 * <li>{@link KJUR.asn1.DERSet}</li>
 * </ul>
 *
 * <h4>OTHER ASN.1 CLASSES</h4>
 * <ul>
 * <li>{@link KJUR.asn1.ASN1Object}</li>
 * <li>{@link KJUR.asn1.DERAbstractString}</li>
 * <li>{@link KJUR.asn1.DERAbstractTime}</li>
 * <li>{@link KJUR.asn1.DERAbstractStructured}</li>
 * <li>{@link KJUR.asn1.DERTaggedObject}</li>
 * </ul>
 * </p>
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
 * @name KJUR.asn1
 * @namespace
 */
if (typeof KJUR.asn1 == "undefined" || !KJUR.asn1) KJUR.asn1 = {};

/**
 * ASN1 utilities class
 * @name KJUR.asn1.ASN1Util
 * @classs ASN1 utilities class
 * @since asn1 1.0.2
 */
KJUR.asn1.ASN1Util = new function() {
    this.integerToByteHex = function(i) {
	var h = i.toString(16);
	if ((h.length % 2) == 1) h = '0' + h;
	return h;
    };
    this.bigIntToMinTwosComplementsHex = function(bigIntegerValue) {
	var h = bigIntegerValue.toString(16);
	if (h.substr(0, 1) != '-') {
	    if (h.length % 2 == 1) {
		h = '0' + h;
	    } else {
		if (! h.match(/^[0-7]/)) {
		    h = '00' + h;
		}
	    }
	} else {
	    var hPos = h.substr(1);
	    var xorLen = hPos.length;
	    if (xorLen % 2 == 1) {
		xorLen += 1;
	    } else {
		if (! h.match(/^[0-7]/)) {
		    xorLen += 2;
		}
	    }
	    var hMask = '';
	    for (var i = 0; i < xorLen; i++) {
		hMask += 'f';
	    }
	    var biMask = new BigInteger(hMask, 16);
	    var biNeg = biMask.xor(bigIntegerValue).add(BigInteger.ONE);
	    h = biNeg.toString(16).replace(/^-/, '');
	}
	return h;
    };
    /**
     * get PEM string from hexadecimal data and header string
     * @name getPEMStringFromHex
     * @memberOf KJUR.asn1.ASN1Util
     * @function
     * @param {String} dataHex hexadecimal string of PEM body
     * @param {String} pemHeader PEM header string (ex. 'RSA PRIVATE KEY')
     * @return {String} PEM formatted string of input data
     * @description
     * @example
     * var pem  = KJUR.asn1.ASN1Util.getPEMStringFromHex('616161', 'RSA PRIVATE KEY');
     * // value of pem will be:
     * -----BEGIN PRIVATE KEY-----
     * YWFh
     * -----END PRIVATE KEY-----
     */
    this.getPEMStringFromHex = function(dataHex, pemHeader) {
	var dataWA = CryptoJS.enc.Hex.parse(dataHex);
	var dataB64 = CryptoJS.enc.Base64.stringify(dataWA);
	var pemBody = dataB64.replace(/(.{64})/g, "$1\r\n");
        pemBody = pemBody.replace(/\r\n$/, '');
	return "-----BEGIN " + pemHeader + "-----\r\n" + 
               pemBody + 
               "\r\n-----END " + pemHeader + "-----\r\n";
    };
};

// ********************************************************************
//  Abstract ASN.1 Classes
// ********************************************************************

// ********************************************************************

/**
 * base class for ASN.1 DER encoder object
 * @name KJUR.asn1.ASN1Object
 * @class base class for ASN.1 DER encoder object
 * @property {Boolean} isModified flag whether internal data was changed
 * @property {String} hTLV hexadecimal string of ASN.1 TLV
 * @property {String} hT hexadecimal string of ASN.1 TLV tag(T)
 * @property {String} hL hexadecimal string of ASN.1 TLV length(L)
 * @property {String} hV hexadecimal string of ASN.1 TLV value(V)
 * @description
 */
KJUR.asn1.ASN1Object = function() {
    var isModified = true;
    var hTLV = null;
    var hT = '00'
    var hL = '00';
    var hV = '';

    /**
     * get hexadecimal ASN.1 TLV length(L) bytes from TLV value(V)
     * @name getLengthHexFromValue
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV length(L)
     */
    this.getLengthHexFromValue = function() {
	if (typeof this.hV == "undefined" || this.hV == null) {
	    throw "this.hV is null or undefined.";
	}
	if (this.hV.length % 2 == 1) {
	    throw "value hex must be even length: n=" + hV.length + ",v=" + this.hV;
	}
	var n = this.hV.length / 2;
	var hN = n.toString(16);
	if (hN.length % 2 == 1) {
	    hN = "0" + hN;
	}
	if (n < 128) {
	    return hN;
	} else {
	    var hNlen = hN.length / 2;
	    if (hNlen > 15) {
		throw "ASN.1 length too long to represent by 8x: n = " + n.toString(16);
	    }
	    var head = 128 + hNlen;
	    return head.toString(16) + hN;
	}
    };

    /**
     * get hexadecimal string of ASN.1 TLV bytes
     * @name getEncodedHex
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV
     */
    this.getEncodedHex = function() {
	if (this.hTLV == null || this.isModified) {
	    this.hV = this.getFreshValueHex();
	    this.hL = this.getLengthHexFromValue();
	    this.hTLV = this.hT + this.hL + this.hV;
	    this.isModified = false;
	    //console.error("first time: " + this.hTLV);
	}
	return this.hTLV;
    };

    /**
     * get hexadecimal string of ASN.1 TLV value(V) bytes
     * @name getValueHex
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV value(V) bytes
     */
    this.getValueHex = function() {
	this.getEncodedHex();
	return this.hV;
    }

    this.getFreshValueHex = function() {
	return '';
    };
};

// == BEGIN DERAbstractString ================================================
/**
 * base class for ASN.1 DER string classes
 * @name KJUR.asn1.DERAbstractString
 * @class base class for ASN.1 DER string classes
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @property {String} s internal string of value
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERAbstractString = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    var s = null;
    var hV = null;

    /**
     * get string value of this string object
     * @name getString
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @return {String} string value of this string object
     */
    this.getString = function() {
	return this.s;
    };

    /**
     * set value by a string
     * @name setString
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @param {String} newS value by a string to set
     */
    this.setString = function(newS) {
	this.hTLV = null;
	this.isModified = true;
	this.s = newS;
	this.hV = stohex(this.s);
    };

    /**
     * set value by a hexadecimal string
     * @name setStringHex
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @param {String} newHexString value by a hexadecimal string to set
     */
    this.setStringHex = function(newHexString) {
	this.hTLV = null;
	this.isModified = true;
	this.s = null;
	this.hV = newHexString;
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.setString(params['str']);
	} else if (typeof params['hex'] != "undefined") {
	    this.setStringHex(params['hex']);
	}
    }
};
JSX.extend(KJUR.asn1.DERAbstractString, KJUR.asn1.ASN1Object);
// == END   DERAbstractString ================================================

// == BEGIN DERAbstractTime ==================================================
/**
 * base class for ASN.1 DER Generalized/UTCTime class
 * @name KJUR.asn1.DERAbstractTime
 * @class base class for ASN.1 DER Generalized/UTCTime class
 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERAbstractTime = function(params) {
    KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);
    var s = null;
    var date = null;

    // --- PRIVATE METHODS --------------------
    this.localDateToUTC = function(d) {
	utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	var utcDate = new Date(utc);
	return utcDate;
    };

    this.formatDate = function(dateObject, type) {
	var pad = this.zeroPadding;
	var d = this.localDateToUTC(dateObject);
	var year = String(d.getFullYear());
	if (type == 'utc') year = year.substr(2, 2);
	var month = pad(String(d.getMonth() + 1), 2);
	var day = pad(String(d.getDate()), 2);
	var hour = pad(String(d.getHours()), 2);
	var min = pad(String(d.getMinutes()), 2);
	var sec = pad(String(d.getSeconds()), 2);
	return year + month + day + hour + min + sec + 'Z';
    };

    this.zeroPadding = function(s, len) {
	if (s.length >= len) return s;
	return new Array(len - s.length + 1).join('0') + s;
    };

    // --- PUBLIC METHODS --------------------
    /**
     * get string value of this string object
     * @name getString
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @return {String} string value of this time object
     */
    this.getString = function() {
	return this.s;
    };

    /**
     * set value by a string
     * @name setString
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @param {String} newS value by a string to set such like "130430235959Z"
     */
    this.setString = function(newS) {
	this.hTLV = null;
	this.isModified = true;
	this.s = newS;
	this.hV = stohex(this.s);
    };

    /**
     * set value by a Date object
     * @name setByDateValue
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @param {Integer} year year of date (ex. 2013)
     * @param {Integer} month month of date between 1 and 12 (ex. 12)
     * @param {Integer} day day of month
     * @param {Integer} hour hours of date
     * @param {Integer} min minutes of date
     * @param {Integer} sec seconds of date
     */
    this.setByDateValue = function(year, month, day, hour, min, sec) {
	var dateObject = new Date(Date.UTC(year, month - 1, day, hour, min, sec, 0));
	this.setByDate(dateObject);
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };
};
JSX.extend(KJUR.asn1.DERAbstractTime, KJUR.asn1.ASN1Object);
// == END   DERAbstractTime ==================================================

// == BEGIN DERAbstractStructured ============================================
/**
 * base class for ASN.1 DER structured class
 * @name KJUR.asn1.DERAbstractStructured
 * @class base class for ASN.1 DER structured class
 * @property {Array} asn1Array internal array of ASN1Object
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERAbstractStructured = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    var asn1Array = null;

    /**
     * set value by array of ASN1Object
     * @name setByASN1ObjectArray
     * @memberOf KJUR.asn1.DERAbstractStructured
     * @function
     * @param {array} asn1ObjectArray array of ASN1Object to set
     */
    this.setByASN1ObjectArray = function(asn1ObjectArray) {
	this.hTLV = null;
	this.isModified = true;
	this.asn1Array = asn1ObjectArray;
    };

    /**
     * append an ASN1Object to internal array
     * @name appendASN1Object
     * @memberOf KJUR.asn1.DERAbstractStructured
     * @function
     * @param {ASN1Object} asn1Object to add
     */
    this.appendASN1Object = function(asn1Object) {
	this.hTLV = null;
	this.isModified = true;
	this.asn1Array.push(asn1Object);
    };

    this.asn1Array = new Array();
    if (typeof params != "undefined") {
	if (typeof params['array'] != "undefined") {
	    this.asn1Array = params['array'];
	}
    }
};
JSX.extend(KJUR.asn1.DERAbstractStructured, KJUR.asn1.ASN1Object);


// ********************************************************************
//  ASN.1 Object Classes
// ********************************************************************

// ********************************************************************
/**
 * class for ASN.1 DER Boolean
 * @name KJUR.asn1.DERBoolean
 * @class class for ASN.1 DER Boolean
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERBoolean = function() {
    KJUR.asn1.DERBoolean.superclass.constructor.call(this);
    this.hT = "01";
    this.hTLV = "0101ff";
};
JSX.extend(KJUR.asn1.DERBoolean, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER Integer
 * @name KJUR.asn1.DERInteger
 * @class class for ASN.1 DER Integer
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>int - specify initial ASN.1 value(V) by integer value</li>
 * <li>bigint - specify initial ASN.1 value(V) by BigInteger object</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERInteger = function(params) {
    KJUR.asn1.DERInteger.superclass.constructor.call(this);
    this.hT = "02";

    /**
     * set value by Tom Wu's BigInteger object
     * @name setByBigInteger
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {BigInteger} bigIntegerValue to set
     */
    this.setByBigInteger = function(bigIntegerValue) {
	this.hTLV = null;
	this.isModified = true;
	this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
    };

    /**
     * set value by integer value
     * @name setByInteger
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {Integer} integer value to set
     */
    this.setByInteger = function(intValue) {
	var bi = new BigInteger(String(intValue), 10);
	this.setByBigInteger(bi);
    };

    /**
     * set value by integer value
     * @name setValueHex
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {String} hexadecimal string of integer value
     * @description
     * <br/>
     * NOTE: Value shall be represented by minimum octet length of
     * two's complement representation.
     */
    this.setValueHex = function(newHexString) {
	this.hV = newHexString;
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params['bigint'] != "undefined") {
	    this.setByBigInteger(params['bigint']);
	} else if (typeof params['int'] != "undefined") {
	    this.setByInteger(params['int']);
	} else if (typeof params['hex'] != "undefined") {
	    this.setValueHex(params['hex']);
	}
    }
};
JSX.extend(KJUR.asn1.DERInteger, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER encoded BitString primitive
 * @name KJUR.asn1.DERBitString
 * @class class for ASN.1 DER encoded BitString primitive
 * @extends KJUR.asn1.ASN1Object
 * @description 
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>bin - specify binary string (ex. '10111')</li>
 * <li>array - specify array of boolean (ex. [true,false,true,true])</li>
 * <li>hex - specify hexadecimal string of ASN.1 value(V) including unused bits</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERBitString = function(params) {
    KJUR.asn1.DERBitString.superclass.constructor.call(this);
    this.hT = "03";

    /**
     * set ASN.1 value(V) by a hexadecimal string including unused bits
     * @name setHexValueIncludingUnusedBits
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {String} newHexStringIncludingUnusedBits
     */
    this.setHexValueIncludingUnusedBits = function(newHexStringIncludingUnusedBits) {
	this.hTLV = null;
	this.isModified = true;
	this.hV = newHexStringIncludingUnusedBits;
    };

    /**
     * set ASN.1 value(V) by unused bit and hexadecimal string of value
     * @name setUnusedBitsAndHexValue
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {Integer} unusedBits
     * @param {String} hValue
     */
    this.setUnusedBitsAndHexValue = function(unusedBits, hValue) {
	if (unusedBits < 0 || 7 < unusedBits) {
	    throw "unused bits shall be from 0 to 7: u = " + unusedBits;
	}
	var hUnusedBits = "0" + unusedBits;
	this.hTLV = null;
	this.isModified = true;
	this.hV = hUnusedBits + hValue;
    };

    /**
     * set ASN.1 DER BitString by binary string
     * @name setByBinaryString
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {String} binaryString binary value string (i.e. '10111')
     * @description
     * Its unused bits will be calculated automatically by length of 
     * 'binaryValue'. <br/>
     * NOTE: Trailing zeros '0' will be ignored.
     */
    this.setByBinaryString = function(binaryString) {
	binaryString = binaryString.replace(/0+$/, '');
	var unusedBits = 8 - binaryString.length % 8;
	if (unusedBits == 8) unusedBits = 0;
	for (var i = 0; i <= unusedBits; i++) {
	    binaryString += '0';
	}
	var h = '';
	for (var i = 0; i < binaryString.length - 1; i += 8) {
	    var b = binaryString.substr(i, 8);
	    var x = parseInt(b, 2).toString(16);
	    if (x.length == 1) x = '0' + x;
	    h += x;  
	}
	this.hTLV = null;
	this.isModified = true;
	this.hV = '0' + unusedBits + h;
    };

    /**
     * set ASN.1 TLV value(V) by an array of boolean
     * @name setByBooleanArray
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {array} booleanArray array of boolean (ex. [true, false, true])
     * @description
     * NOTE: Trailing falses will be ignored.
     */
    this.setByBooleanArray = function(booleanArray) {
	var s = '';
	for (var i = 0; i < booleanArray.length; i++) {
	    if (booleanArray[i] == true) {
		s += '1';
	    } else {
		s += '0';
	    }
	}
	this.setByBinaryString(s);
    };

    /**
     * generate an array of false with specified length
     * @name newFalseArray
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {Integer} nLength length of array to generate
     * @return {array} array of boolean faluse
     * @description
     * This static method may be useful to initialize boolean array.
     */
    this.newFalseArray = function(nLength) {
	var a = new Array(nLength);
	for (var i = 0; i < nLength; i++) {
	    a[i] = false;
	}
	return a;
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params['hex'] != "undefined") {
	    this.setHexValueIncludingUnusedBits(params['hex']);
	} else if (typeof params['bin'] != "undefined") {
	    this.setByBinaryString(params['bin']);
	} else if (typeof params['array'] != "undefined") {
	    this.setByBooleanArray(params['array']);
	}
    }
};
JSX.extend(KJUR.asn1.DERBitString, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER OctetString
 * @name KJUR.asn1.DEROctetString
 * @class class for ASN.1 DER OctetString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DEROctetString = function(params) {
    KJUR.asn1.DEROctetString.superclass.constructor.call(this, params);
    this.hT = "04";
};
JSX.extend(KJUR.asn1.DEROctetString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER Null
 * @name KJUR.asn1.DERNull
 * @class class for ASN.1 DER Null
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERNull = function() {
    KJUR.asn1.DERNull.superclass.constructor.call(this);
    this.hT = "05";
    this.hTLV = "0500";
};
JSX.extend(KJUR.asn1.DERNull, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER ObjectIdentifier
 * @name KJUR.asn1.DERObjectIdentifier
 * @class class for ASN.1 DER ObjectIdentifier
 * @param {Array} params associative array of parameters (ex. {'oid': '2.5.4.5'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>oid - specify initial ASN.1 value(V) by a oid string (ex. 2.5.4.13)</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERObjectIdentifier = function(params) {
    var itox = function(i) {
	var h = i.toString(16);
	if (h.length == 1) h = '0' + h;
	return h;
    };
    var roidtox = function(roid) {
	var h = '';
	var bi = new BigInteger(roid, 10);
	var b = bi.toString(2);
	var padLen = 7 - b.length % 7;
	if (padLen == 7) padLen = 0;
	var bPad = '';
	for (var i = 0; i < padLen; i++) bPad += '0';
	b = bPad + b;
	for (var i = 0; i < b.length - 1; i += 7) {
	    var b8 = b.substr(i, 7);
	    if (i != b.length - 7) b8 = '1' + b8;
	    h += itox(parseInt(b8, 2));
	}
	return h;
    }

    KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);
    this.hT = "06";

    /**
     * set value by a hexadecimal string
     * @name setValueHex
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} newHexString hexadecimal value of OID bytes
     */
    this.setValueHex = function(newHexString) {
	this.hTLV = null;
	this.isModified = true;
	this.s = null;
	this.hV = newHexString;
    };

    /**
     * set value by a OID string
     * @name setValueOidString
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} oidString OID string (ex. 2.5.4.13)
     */
    this.setValueOidString = function(oidString) {
	if (! oidString.match(/^[0-9.]+$/)) {
	    throw "malformed oid string: " + oidString;
	}
	var h = '';
	var a = oidString.split('.');
	var i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
	h += itox(i0);
	a.splice(0, 2);
	for (var i = 0; i < a.length; i++) {
	    h += roidtox(a[i]);
	}
	this.hTLV = null;
	this.isModified = true;
	this.s = null;
	this.hV = h;
    };

    /**
     * set value by a OID name
     * @name setValueName
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} oidName OID name (ex. 'serverAuth')
     * @since 1.0.1
     * @description
     * OID name shall be defined in 'KJUR.asn1.x509.OID.name2oidList'.
     * Otherwise raise error.
     */
    this.setValueName = function(oidName) {
	if (typeof KJUR.asn1.x509.OID.name2oidList[oidName] != "undefined") {
	    var oid = KJUR.asn1.x509.OID.name2oidList[oidName];
	    this.setValueOidString(oid);
	} else {
	    throw "DERObjectIdentifier oidName undefined: " + oidName;
	}
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params['oid'] != "undefined") {
	    this.setValueOidString(params['oid']);
	} else if (typeof params['hex'] != "undefined") {
	    this.setValueHex(params['hex']);
	} else if (typeof params['name'] != "undefined") {
	    this.setValueName(params['name']);
	}
    }
};
JSX.extend(KJUR.asn1.DERObjectIdentifier, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER UTF8String
 * @name KJUR.asn1.DERUTF8String
 * @class class for ASN.1 DER UTF8String
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERUTF8String = function(params) {
    KJUR.asn1.DERUTF8String.superclass.constructor.call(this, params);
    this.hT = "0c";
};
JSX.extend(KJUR.asn1.DERUTF8String, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER NumericString
 * @name KJUR.asn1.DERNumericString
 * @class class for ASN.1 DER NumericString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERNumericString = function(params) {
    KJUR.asn1.DERNumericString.superclass.constructor.call(this, params);
    this.hT = "12";
};
JSX.extend(KJUR.asn1.DERNumericString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER PrintableString
 * @name KJUR.asn1.DERPrintableString
 * @class class for ASN.1 DER PrintableString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERPrintableString = function(params) {
    KJUR.asn1.DERPrintableString.superclass.constructor.call(this, params);
    this.hT = "13";
};
JSX.extend(KJUR.asn1.DERPrintableString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER TeletexString
 * @name KJUR.asn1.DERTeletexString
 * @class class for ASN.1 DER TeletexString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERTeletexString = function(params) {
    KJUR.asn1.DERTeletexString.superclass.constructor.call(this, params);
    this.hT = "14";
};
JSX.extend(KJUR.asn1.DERTeletexString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER IA5String
 * @name KJUR.asn1.DERIA5String
 * @class class for ASN.1 DER IA5String
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERIA5String = function(params) {
    KJUR.asn1.DERIA5String.superclass.constructor.call(this, params);
    this.hT = "16";
};
JSX.extend(KJUR.asn1.DERIA5String, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER UTCTime
 * @name KJUR.asn1.DERUTCTime
 * @class class for ASN.1 DER UTCTime
 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
 * @extends KJUR.asn1.DERAbstractTime
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string (ex.'130430235959Z')</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * <li>date - specify Date object.</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 * <h4>EXAMPLES</h4>
 * @example
 * var d1 = new KJUR.asn1.DERUTCTime();
 * d1.setString('130430125959Z');
 *
 * var d2 = new KJUR.asn1.DERUTCTime({'str': '130430125959Z'});
 *
 * var d3 = new KJUR.asn1.DERUTCTime({'date': new Date(Date.UTC(2015, 0, 31, 0, 0, 0, 0))});
 */
KJUR.asn1.DERUTCTime = function(params) {
    KJUR.asn1.DERUTCTime.superclass.constructor.call(this, params);
    this.hT = "17";

    /**
     * set value by a Date object
     * @name setByDate
     * @memberOf KJUR.asn1.DERUTCTime
     * @function
     * @param {Date} dateObject Date object to set ASN.1 value(V)
     */
    this.setByDate = function(dateObject) {
	this.hTLV = null;
	this.isModified = true;
	this.date = dateObject;
	this.s = this.formatDate(this.date, 'utc');
	this.hV = stohex(this.s);
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.setString(params['str']);
	} else if (typeof params['hex'] != "undefined") {
	    this.setStringHex(params['hex']);
	} else if (typeof params['date'] != "undefined") {
	    this.setByDate(params['date']);
	}
    }
};
JSX.extend(KJUR.asn1.DERUTCTime, KJUR.asn1.DERAbstractTime);

// ********************************************************************
/**
 * class for ASN.1 DER GeneralizedTime
 * @name KJUR.asn1.DERGeneralizedTime
 * @class class for ASN.1 DER GeneralizedTime
 * @param {Array} params associative array of parameters (ex. {'str': '20130430235959Z'})
 * @extends KJUR.asn1.DERAbstractTime
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string (ex.'20130430235959Z')</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * <li>date - specify Date object.</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERGeneralizedTime = function(params) {
    KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this, params);
    this.hT = "18";

    /**
     * set value by a Date object
     * @name setByDate
     * @memberOf KJUR.asn1.DERGeneralizedTime
     * @function
     * @param {Date} dateObject Date object to set ASN.1 value(V)
     * @example
     * When you specify UTC time, use 'Date.UTC' method like this:<br/>
     * var o = new DERUTCTime();
     * var date = new Date(Date.UTC(2015, 0, 31, 23, 59, 59, 0)); #2015JAN31 23:59:59
     * o.setByDate(date);
     */
    this.setByDate = function(dateObject) {
	this.hTLV = null;
	this.isModified = true;
	this.date = dateObject;
	this.s = this.formatDate(this.date, 'gen');
	this.hV = stohex(this.s);
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.setString(params['str']);
	} else if (typeof params['hex'] != "undefined") {
	    this.setStringHex(params['hex']);
	} else if (typeof params['date'] != "undefined") {
	    this.setByDate(params['date']);
	}
    }
};
JSX.extend(KJUR.asn1.DERGeneralizedTime, KJUR.asn1.DERAbstractTime);

// ********************************************************************
/**
 * class for ASN.1 DER Sequence
 * @name KJUR.asn1.DERSequence
 * @class class for ASN.1 DER Sequence
 * @extends KJUR.asn1.DERAbstractStructured
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>array - specify array of ASN1Object to set elements of content</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERSequence = function(params) {
    KJUR.asn1.DERSequence.superclass.constructor.call(this, params);
    this.hT = "30";
    this.getFreshValueHex = function() {
	var h = '';
	for (var i = 0; i < this.asn1Array.length; i++) {
	    var asn1Obj = this.asn1Array[i];
	    h += asn1Obj.getEncodedHex();
	}
	this.hV = h;
	return this.hV;
    };
};
JSX.extend(KJUR.asn1.DERSequence, KJUR.asn1.DERAbstractStructured);

// ********************************************************************
/**
 * class for ASN.1 DER Set
 * @name KJUR.asn1.DERSet
 * @class class for ASN.1 DER Set
 * @extends KJUR.asn1.DERAbstractStructured
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>array - specify array of ASN1Object to set elements of content</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERSet = function(params) {
    KJUR.asn1.DERSet.superclass.constructor.call(this, params);
    this.hT = "31";
    this.getFreshValueHex = function() {
	var a = new Array();
	for (var i = 0; i < this.asn1Array.length; i++) {
	    var asn1Obj = this.asn1Array[i];
	    a.push(asn1Obj.getEncodedHex());
	}
	a.sort();
	this.hV = a.join('');
	return this.hV;
    };
};
JSX.extend(KJUR.asn1.DERSet, KJUR.asn1.DERAbstractStructured);

// ********************************************************************
/**
 * class for ASN.1 DER TaggedObject
 * @name KJUR.asn1.DERTaggedObject
 * @class class for ASN.1 DER TaggedObject
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * Parameter 'tagNoNex' is ASN.1 tag(T) value for this object.
 * For example, if you find '[1]' tag in a ASN.1 dump, 
 * 'tagNoHex' will be 'a1'.
 * <br/>
 * As for optional argument 'params' for constructor, you can specify *ANY* of
 * following properties:
 * <ul>
 * <li>explicit - specify true if this is explicit tag otherwise false 
 *     (default is 'true').</li>
 * <li>tag - specify tag (default is 'a0' which means [0])</li>
 * <li>obj - specify ASN1Object which is tagged</li>
 * </ul>
 * @example
 * d1 = new KJUR.asn1.DERUTF8String({'str':'a'});
 * d2 = new KJUR.asn1.DERTaggedObject({'obj': d1});
 * hex = d2.getEncodedHex();
 */
KJUR.asn1.DERTaggedObject = function(params) {
    KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);
    this.hT = "a0";
    this.hV = '';
    this.isExplicit = true;
    this.asn1Object = null;

    /**
     * set value by an ASN1Object
     * @name setString
     * @memberOf KJUR.asn1.DERTaggedObject
     * @function
     * @param {Boolean} isExplicitFlag flag for explicit/implicit tag
     * @param {Integer} tagNoHex hexadecimal string of ASN.1 tag
     * @param {ASN1Object} asn1Object ASN.1 to encapsulate
     */
    this.setASN1Object = function(isExplicitFlag, tagNoHex, asn1Object) {
	this.hT = tagNoHex;
	this.isExplicit = isExplicitFlag;
	this.asn1Object = asn1Object;
	if (this.isExplicit) {
	    this.hV = this.asn1Object.getEncodedHex();
	    this.hTLV = null;
	    this.isModified = true;
	} else {
	    this.hV = null;
	    this.hTLV = asn1Object.getEncodedHex();
	    this.hTLV = this.hTLV.replace(/^../, tagNoHex);
	    this.isModified = false;
	}
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params['tag'] != "undefined") {
	    this.hT = params['tag'];
	}
	if (typeof params['explicit'] != "undefined") {
	    this.isExplicit = params['explicit'];
	}
	if (typeof params['obj'] != "undefined") {
	    this.asn1Object = params['obj'];
	    this.setASN1Object(this.isExplicit, this.hT, this.asn1Object);
	}
    }
};
JSX.extend(KJUR.asn1.DERTaggedObject, KJUR.asn1.ASN1Object);

const LOG_TAG$3 = "transport:ws";
const Log$8 = getTagged(LOG_TAG$3);
class WebsocketTransport extends BaseTransport {
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
        Log$8.log('closing connection');
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
                    Log$8.debug(`[text] ${ev.data}`);
                    const p = this.awaitingPromises.shift();
                    if (p) p.resolve(); // ???
                    if (this.ctrl_handler) {
                        this.ctrl_handler(JSON.parse(ev.data));
                    }
                } else {
                    // console.info(ev.timeStamp, window.performance.now());
                    if (!used && ev.timeStamp + 5000 < window.performance.now()) {
                        old = true;
                        Log$8.debug('[rtp block] ignored old');
                        return;
                    }
                    if (old) {
                        used = true;
                    }
                    Log$8.debug('[rtp block] ', ev.data.byteLength);
                    if (this.data_handler) {
                        this.data_handler(ev.data);
                    }
                }
            };

            this.ws.onerror = (e)=>{
                Log$8.error(`[ctrl] ${e.type}`);
                this.ws.close();
            };
            this.ws.onclose = (e)=>{
                Log$8.error(`[ctrl] ${e.type}. code: ${e.code} ${e.reason || 'unknown reason'}`);
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
        Log$8.debug(data);
        if (typeof data !== typeof '') {
            data = JSON.stringify(data);
        }
        return new Promise((resolve, reject)=> {
            this.awaitingPromises.push({resolve, reject});
            this.ws.send(data);
        });
    }
}

class Player {
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

        let first = true;
        this.player.addEventListener('durationchange', ()=> {
            const {duration, currentTime} = this.player;
            console.log('duration changed', duration, currentTime);
            if (currentTime + 1 < duration) {
                this.player.currentTime = duration;
            }

            // if (duration > 20) {
            //     this.remuxer.mse.initCleanup();
            // }
        }, false);

        this.player.addEventListener('play', ()=> {
            if (!this.isPlaying()) {
                this.start();
            }
        }, false);
        this.player.addEventListener('pause', ()=> {
            this.stop();
        }, false);

        setInterval(()=> {
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
}

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
//# sourceMappingURL=streamedian.js.map