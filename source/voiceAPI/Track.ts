import EventEmitter from "node:events";
import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';
import { fetchTrackInfo, TrackInfo, placeholderInfo } from "./fetchTrackInfo.js";
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
    AudioReady = "audioReady",
    AudioFailed = "audioFailed"
}

export class Track extends EventEmitter {
    data: TrackInfo;
    isDataReady = false;
    isLive: boolean | undefined;
    isAudioReady = false;
    failed = false;
    audio: DiscordJsVoice.AudioResource<null> | undefined;

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
        this.fetchData();            
    }

    async fetchData(){
        try{
            let data = await fetchTrackInfo(this);
            if (data.dataFailed != true) this.data = data;
        } catch (error) {
            console.warn(error);
        } finally {
            this.updateFailStatus(this.failed);
            this.isDataReady = true;
            this.emit(TrackStatus.DataReady);
        }
    }

    async createAudioResource(isNew:boolean = false) {
        this.updateFailStatus(false);
        try {
            if (this.url == null) {
                throw new Error("Track url is null")
            } else {
                const audio = this.type === TrackType.File
                    ? await createAudioFileResource(`./resources/mp3sounds/${this.url}`)
                    : await createAudioTrackResource(this.url)
                this.isAudioReady = true;
                this.audio = audio;
                this.emit(TrackStatus.AudioReady, this.audio, isNew);         
            }
        } catch (error) {
            console.warn(`• • • Track\n • createAudioResource\n ${error}\n • • •\n`);
            this.updateFailStatus(true);
            this.emit(TrackStatus.AudioFailed);
        }
    }

    updateFailStatus(hasFail: boolean) {
        this.failed = hasFail;
        this.data.audioFailed = hasFail;
    }
}
