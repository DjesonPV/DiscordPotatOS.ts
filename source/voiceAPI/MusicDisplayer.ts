import * as DiscordJs from 'discord.js';
import { TrackInfo } from "./fetchTrackInfo";
import Lang from '../Lang';

import { display }   from '../userInteractiveComponents/buttonCommands/MusicDisplayer/display';
import { playpause } from '../userInteractiveComponents/buttonCommands/MusicDisplayer/playpause';
import { next }      from '../userInteractiveComponents/buttonCommands/MusicDisplayer/next';
import { stop }      from '../userInteractiveComponents/buttonCommands/MusicDisplayer/stop';
import botPersonality from '../modules/botPersonality';
import isStringAnURL from '../modules/isStringAnURL';

class MusicDisplayer {

    guildName: string;
    channelName: string;
    
    private tracklistRow: DiscordJs.ActionRowBuilder<DiscordJs.StringSelectMenuBuilder> | null = null;
    private buttonRow: DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder> = this.updateButtons(false, true, false, true);
    private embed: DiscordJs.EmbedBuilder;

    constructor( voiceNames:{
        guildName: string,
        channelName: string
    }, firstTrackInfo: TrackInfo) {
        this.guildName = voiceNames.guildName;
        this.channelName = voiceNames.channelName;
        this.embed = this.updateEmbed(firstTrackInfo);

    }

    updateButtons(isLive: boolean, isPaused: boolean, hasQueue: boolean, disableAll:boolean = false) {
        this.buttonRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>()
        .addComponents(
            display.button(false), 
            playpause.button(isPaused, isLive, disableAll),
            next.button(!hasQueue || disableAll),
            stop.button(false)    
        );
        return this.buttonRow;
    }

    updateEmbed(trackInfo:TrackInfo) {
        this.embed = new DiscordJs.EmbedBuilder()
        .setAuthor(trackInfo.author)
        .setColor(trackInfo.color)
        .setDescription(trackInfo.description)
        .setTitle(trackInfo.title)
        .setURL(isStringAnURL(trackInfo.url)?trackInfo.url:null)
        .setThumbnail(trackInfo.thumbnail)
        .setFooter({text: Lang.get("MP_footer$3", [botPersonality.nickname, this.guildName, this.channelName]).substring(0, 2048)})
        ;

        return this.embed;
    }

}




