import * as DiscordJs from 'discord.js';
import { Track, TrackType } from './Track';
import EventEmitter from "node:events";

enum TracklistState {
    Changed = "changed"
}

export class Tracklist extends EventEmitter{

    list:Track[] = [];

    get now() {
        return this.list[0];
    }

    private set now(track:Track) {
        this.list[0] = track;
    }

    constructor(track:Track) {
        super();
        this.add(track);
    }

    add(track:Track) {
        this.list.push(track);
        this.emit(TracklistState.Changed);
    };

    setNow(track:Track) {
        this.now = track;
        this.emit(TracklistState.Changed);
    }

    remove(id:DiscordJs.Snowflake) {
        const index = this.list.findIndex(track => track.id === id);

        if (index > 0) { // We don't remove the playing track
            this.list.splice(index, 1);
            this.emit(TracklistState.Changed)
        }
    }

    skipQueueing(id:DiscordJs.Snowflake) {
        const index = this.list.findIndex(track => track.id === id);

        if (index > 1) { // We don't move the playing track nor the next
            this.list.splice(1, 0, ...this.list.splice(index, 1));
            this.emit(TracklistState.Changed);
        }
    }

    next() {
        this.list.shift();
        this.emit(TracklistState.Changed);
    }

    get isEmpty () {
        return this.list.length == 0;
    }

    get hasQueue () {
        return this.list.length > 1;
    }

    destroy(){
        this.list = [];
    }
}
