import EventEmitter from "node:events";
import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';
import { fetchTrackInfo, TrackInfo, placeholderInfo, fetchFailedInfo } from "./fetchTrackInfo.js";
import { createAudioFileResource, createAudioTrackResource } from "./createAudioResource.js";

export enum TrackType {
    File = 0,
    Track = 1,
    Radio = 2,
    LocalRadio = 3,
    Unknown = 4
}

export enum TrackStatus {
    DataReady = "dataReady",
    AudioReady = "audioReady"
}

export class Track extends EventEmitter {
    data: TrackInfo;
    isDataReady = false;
    //id: DiscordJs.Snowflake;
    //url: string | null;
    //query: string;
    isLive: boolean | undefined;
    //volume: number | undefined;
    //type: TrackType;
    isAudioReady = false;
    failed = false;

    constructor(
        public id: DiscordJs.Snowflake,
        public query: string,
        public url: string | null,
        public type: TrackType,
        public volume?: number
    ) {
        super();

        this.isLive = type === TrackType.File ? false : (type === TrackType.Track ? undefined : true);

        this.data = placeholderInfo(this);

        fetchTrackInfo(this).then((info) => {
            this.data = info;
            this.isDataReady = true;
            this.emit(TrackStatus.DataReady);
        });
    }

    async createAudioResource() {
        if (this.url !== null) {
            ( this.type === TrackType.File
                ? createAudioFileResource(`./resources/mp3sounds/${this.url}`)
                : createAudioTrackResource(this.url)
            ).then(audio => {
                this.isAudioReady = true;
                this.emit(TrackStatus.AudioReady, audio);
            }).catch( (_) => {
                this.data = fetchFailedInfo(this.data);
                this.failed = true;
                this.emit(TrackStatus.DataReady);
            });
        } else {
            this.data = fetchFailedInfo(this.data);
            this.failed = true;
            this.emit(TrackStatus.DataReady);
        }
    }
}

