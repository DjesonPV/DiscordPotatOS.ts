import EventEmitter from "node:events";
import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';
import { fetchTrackInfo, TrackInfo, placeholderInfo, fetchFailedInfo } from "./fetchTrackInfo";
import { createAudioFileResource, createAudioTrackResource } from "./createAudioResource";

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
    id: DiscordJs.Snowflake;
    url: string | null;
    query: string;
    isLive: boolean | undefined;
    volume: number | undefined;
    type: TrackType;
    failed = false;

    constructor(
        id:DiscordJs.Snowflake,
        query: string,
        url: string | null,
        type: TrackType,
        volume?: number
    ) {
        super();

        this.id = id;
        this.url = url;
        this.query = query;
        this.type = type;

        this.isLive = type != TrackType.File && type != TrackType.Track ? 
            true :
            type == TrackType.Track? undefined:false
        ;

        this.volume = volume;

        this.data = placeholderInfo(this);

        fetchTrackInfo(this).then( (info) => {
            this.data = info;
            this.isDataReady = true;
            this.emit(TrackStatus.DataReady);

        });

    }

    async createAudioResource() {
        if (this.type === TrackType.File) {
            createAudioFileResource(this.query).then( audio => {
                this.emit(TrackStatus.AudioReady, audio);
            }, (_)=> {
                this.data = fetchFailedInfo(this.data);
                this.failed = true;
                this.emit(TrackStatus.DataReady);
            });
        } else if (this.url !== null){
            createAudioTrackResource(this.url).then( audio => {
                this.emit(TrackStatus.AudioReady, audio);
            }, (_)=> {
                this.data = fetchFailedInfo(this.data);
                this.failed = true;
                this.emit(TrackStatus.DataReady);
            })
        } else {
            this.data = fetchFailedInfo(this.data);
            this.failed = true;
            this.emit(TrackStatus.DataReady);
        }
    }
}

