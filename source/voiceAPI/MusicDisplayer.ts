import * as DiscordJs from 'discord.js';
import { TrackInfo } from "./fetchTrackInfo.js";
import Lang from '../Lang.js';

import { display } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/display.js';
import { playpause } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/playpause.js';
import { next } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/next.js';
import { stop } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/stop.js';
import { playlist } from '../userInteractiveComponents/dropdownList/MusicDisplayer/playlist.js';
import botPersonality from '../modules/botPersonality.js';
import isStringAnURL from '../modules/isStringAnURL.js';
import { Tracklist } from './Tracklist.js';

import Messages from '../messageAPI/Messages.js';

export class MusicDisplayer {

    //private guildName:string;

    private tracklistRow: DiscordJs.ActionRowBuilder<DiscordJs.StringSelectMenuBuilder> | null = null;
    private buttonRow: DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder> = this.updateButtons(false, true, false, true);
    private embed: DiscordJs.EmbedBuilder;
    private message: DiscordJs.Message | null = null;
    //private textChannel: DiscordJs.TextBasedChannel;
    //private channelName: string;
    private messageLock: boolean = false;

    private timeout: NodeJS.Timeout | null = null;

    constructor(
        private guildName: string,
        private channelName: string,
        firstTrackInfo: TrackInfo,
        private textChannel: DiscordJs.TextBasedChannel
    ) {
        this.embed = this.updateEmbed(firstTrackInfo, channelName);
        this.buttonRow = this.updateButtons(true, true, false, true);
    }

    private async updateMessage() {
        if (this.textChannel === undefined) return;

        if (this.message == null) {
            if (this.messageLock == false) {
                this.messageLock = true;
                this.message = await Messages.print(this.textChannel, { embeds: [this.embed], components: [this.buttonRow] })
                    .then((message) => { this.messageLock = false; return message });
            }
        } else {
            const components: (DiscordJs.ActionRowBuilder<DiscordJs.StringSelectMenuBuilder | DiscordJs.ButtonBuilder>)[] = [this.buttonRow];
            if (this.tracklistRow !== null) components.unshift(this.tracklistRow);
            this.message = await Messages.edit(this.message, { embeds: [this.embed], components: components });
        }
        this.timeout = null;
    }

    private pushUpdate() {
        if (this.timeout !== null) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => { this.updateMessage(); }, 100);
    }

    updateButtons(isLive: boolean | undefined, isPaused: boolean, hasQueue: boolean, disableAll: boolean = false) {
        this.buttonRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>()
            .addComponents(
                display.button(false),
                playpause.button(isPaused, isLive, disableAll),
                next.button(!hasQueue || disableAll),
                stop.button(false)
            );
        this.pushUpdate();
        return this.buttonRow;
    }

    updateEmbed(trackInfo: TrackInfo, channelName: string | null) {
        this.embed = new DiscordJs.EmbedBuilder()
            .setAuthor(trackInfo.author)
            .setColor(trackInfo.color)
            .setDescription(trackInfo.description)
            .setTitle(trackInfo.title)
            .setURL(isStringAnURL(trackInfo.url) ? trackInfo.url : null)
            .setThumbnail(trackInfo.thumbnail)
            .setFooter({ text: Lang.get("MP_footer$3", [botPersonality.nickname, this.guildName, channelName !== null ? channelName : this.channelName]).substring(0, 2048) })
            ;
        this.pushUpdate();
        return this.embed;
    }

    updatePlaylist(tracklist: Tracklist) {
        if (tracklist.hasQueue) {
            this.tracklistRow = new DiscordJs.ActionRowBuilder<DiscordJs.StringSelectMenuBuilder>()
                .addComponents(playlist.dropdownList(tracklist));
        } else this.tracklistRow = null;
        this.pushUpdate();
    }

    delete() {
        if (this.message !== null) {
            Messages.delete(this.message);
            this.message = null;
        }
    }
}
