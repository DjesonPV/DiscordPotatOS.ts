import * as DiscordJs from 'discord.js';
import { TrackInfo } from "./fetchTrackInfo.js";
import Lang from '../Lang.js';

import { display } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/display.js';
import { playpause } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/playpause.js';
import { next } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/next.js';
import { stop } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/stop.js';
import { playlist } from '../userInteractiveComponents/dropdownList/MusicDisplayer/playlist.js';
import { volumeUp } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/volumeUp.js';
import { volumeDown } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/volumeDown.js';
import { volumeShow } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/volumeShow.js';
import botPersonality from '../modules/botPersonality.js';
import isStringAnURL from '../modules/isStringAnURL.js';
import { Tracklist } from './Tracklist.js';

import Messages from '../messageAPI/Messages.js';

export class MusicDisplayer {

    //private guildName:string;
    private deleted = false;
    private tracklistRow: DiscordJs.ActionRowBuilder<DiscordJs.StringSelectMenuBuilder> | null = null;
    private buttonRow: DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>;// = this.updateButtons(false, true, false, true);
    private volumeRow: DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>;
    private embed: DiscordJs.EmbedBuilder;
    message: DiscordJs.Message | null = null;
    //private textChannel: DiscordJs.TextBasedChannel;
    //private channelName: string;
    private messageLock: boolean = false;

    private timeout: NodeJS.Timeout | null = null;

    private displayFailAudioMessage: boolean = false;

    constructor(
        private guildName: string,
        private channelName: string,
        firstTrackInfo: TrackInfo,
        private textChannel: DiscordJs.TextBasedChannel
    ) {
        this.embed = this.updateEmbed(firstTrackInfo, channelName);
        this.buttonRow = this.updateButtons(true, true, false, true, false);
        this.volumeRow = this.updateVolume(true);
    }

    private async updateMessage() {
        if (this.textChannel === undefined) return;

        let embeds = [this.embed];
        let components : DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder|DiscordJs.StringSelectMenuBuilder>[] = [this.buttonRow, this.volumeRow];
        if (this.tracklistRow !== null) components?.unshift(this.tracklistRow);
        if (this.displayFailAudioMessage) embeds?.push(errorEmbed);
        
        if (this.message == null) {
            if (this.messageLock == false) {
                const payload: DiscordJs.MessageCreateOptions = {
                    embeds: embeds,
                    components: components,
                    flags:DiscordJs.MessageFlags.SuppressNotifications
                }
                this.messageLock = true;
                this.message = await Messages.print(this.textChannel, payload);
                this.messageLock = false;
            }
        } else {          
            const payload: DiscordJs.MessageEditOptions = {
                embeds: embeds,
                components: components
            }     
            this.message = await Messages.edit(this.message, payload);
        }
        this.timeout = null;
    }

    private pushUpdate() {
        if (this.timeout !== null) clearTimeout(this.timeout);
        this.timeout = setTimeout(async () => { if (!this.deleted) await this.updateMessage(); }, 100);
    }

    updateButtons(isLive: boolean | undefined, isPaused: boolean, hasQueue: boolean, disableAll: boolean = false, isAudioReady:boolean = false) {
        this.buttonRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>()
            .addComponents(
                display.button(false),
                playpause.button(isPaused, isLive, disableAll, isAudioReady, this.displayFailAudioMessage),
                next.button(disableAll, !hasQueue, this.displayFailAudioMessage),
                stop.button(!hasQueue)
            );
        this.pushUpdate();
        return this.buttonRow;
    }

    updateVolume(disableAll: boolean = false, volume: number | undefined = undefined) {
        this.volumeRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>()
        .addComponents(
            volumeShow.button(volume),
            volumeDown.button(disableAll),
            volumeUp.button(disableAll)
        );
        this.pushUpdate();
        return this.volumeRow;
    }

    updateEmbed(trackInfo: TrackInfo, channelName: string | null) {
        this.displayFailAudioMessage = trackInfo.audioFailed === true;

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
        this.deleted = true;
        if (this.message !== null) {
            Messages.delete(this.message);
            this.message = null;
        }
    }
}

const errorEmbed = new DiscordJs.EmbedBuilder()
    .setColor(botPersonality.errorColor as DiscordJs.ColorResolvable)
    .setAuthor({
        iconURL: "https://cdn.discordapp.com/attachments/329613279204999170/970413892792623204/Error_icon.png",
        name: Lang.get("MP_GUI_audioFetchFailed").substring(0, 256)
    })
    .setDescription(Lang.get("MP_GUI_audioFetchFailedAutonext").substring(0, 256));
