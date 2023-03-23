import * as DiscordJs from 'discord.js';
import { TrackInfo } from "./fetchTrackInfo";
import Lang from '../Lang';

import { display }   from '../userInteractiveComponents/buttonCommands/MusicDisplayer/display';
import { playpause } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/playpause';
import { next }      from '../userInteractiveComponents/buttonCommands/MusicDisplayer/next';
import { stop }      from '../userInteractiveComponents/buttonCommands/MusicDisplayer/stop';
import { playlist } from '../userInteractiveComponents/dropdownList/MusicDisplayer/playlist';
import botPersonality from '../modules/botPersonality';
import isStringAnURL from '../modules/isStringAnURL';
import { Tracklist } from './Tracklist';

import Messages from '../messageAPI/Messages';

export class MusicDisplayer {  
    
    private guildName:string;

    private tracklistRow: DiscordJs.ActionRowBuilder<DiscordJs.StringSelectMenuBuilder> | null = null;
    private buttonRow: DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder> = this.updateButtons(false, true, false, true);
    private embed: DiscordJs.EmbedBuilder;
    private message:DiscordJs.Message | null = null;
    private textChannel: DiscordJs.TextBasedChannel;
    private channelName: string;

    private timeout:NodeJS.Timeout | null = null;

    constructor(
        guildName:string,
        channelName: string, 
        firstTrackInfo: TrackInfo, textChannel:DiscordJs.TextBasedChannel
    ) {
        this.channelName = channelName;
        this.embed = this.updateEmbed(firstTrackInfo, channelName);
        this.textChannel = textChannel;
        this.guildName= guildName
    }

    private async updateMessage() {
        if (this.message == null)
        this.message = await Messages.print(this.textChannel, {embeds: [this.embed], components:[this.buttonRow]})
        else {
            const components:(DiscordJs.ActionRowBuilder<DiscordJs.StringSelectMenuBuilder | DiscordJs.ButtonBuilder>)[] = [this.buttonRow];
            if (this.tracklistRow !== null) components.push(this.tracklistRow);
            this.message = await Messages.edit(this.message, {embeds: [this.embed], components: components});
        }
        this.timeout = null;
    }

    private async pushUpdate() {
        if (this.timeout !== null) clearTimeout(this.timeout);
        this.timeout = setTimeout(this.updateMessage, 100);
    }

    updateButtons(isLive: boolean | undefined, isPaused: boolean, hasQueue: boolean, disableAll:boolean = false) {
        this.buttonRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>()
        .addComponents(
            display.button(false), 
            playpause.button(isPaused, isLive, disableAll),
            next.button(!hasQueue || disableAll),
            stop.button(false)    
        );
        this.pushUpdate()
        return this.buttonRow;
    }

    updateEmbed(trackInfo:TrackInfo, channelName: string | null) {
        this.embed = new DiscordJs.EmbedBuilder()
        .setAuthor(trackInfo.author)
        .setColor(trackInfo.color)
        .setDescription(trackInfo.description)
        .setTitle(trackInfo.title)
        .setURL(isStringAnURL(trackInfo.url)?trackInfo.url:null)
        .setThumbnail(trackInfo.thumbnail)
        .setFooter({text: Lang.get("MP_footer$3", [botPersonality.nickname, this.guildName, channelName!==null?channelName:this.channelName]).substring(0, 2048)})
        ;
        this.pushUpdate()
        return this.embed;
    }

    updatePlaylist(tracklist:Tracklist) {
        if (tracklist.hasQueue) return playlist.dropdownList(tracklist);
        this.pushUpdate();
        return null;
    }
}
