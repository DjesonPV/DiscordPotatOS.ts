import EventEmitter from 'node:events';
import * as DiscordJs from 'discord.js';

export type Track =
    {
        audio: any | null,
        data: any | null,
        id: DiscordJs.Snowflake,
        url: string | null,
        query: string | null,
        isLive: boolean | null
    }

export default class Playlist extends EventEmitter {

    constructor() {
        super();

    }
}

