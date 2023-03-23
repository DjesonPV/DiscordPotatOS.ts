import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';

import VoiceConnection from './VoiceConnection';
import AudioPlayer from './AudioPlayer';
import { Tracklist } from './Tracklist';
import { Track, TrackStatus } from './Track';
import { MusicDisplayer } from './MusicDisplayer';
import { TrackInfo } from './fetchTrackInfo';

export class Subscription {

    private static guildSubscriptions:Map<DiscordJs.Snowflake,Subscription> = new Map(); 

    static get(guildId:DiscordJs.Snowflake){
        return this.guildSubscriptions.get(guildId);
    }

    static create(interaction:DiscordJs.ChatInputCommandInteraction, firstTrack:Track) {
        
        const id = interaction.guild?.id;
        if (id === undefined) throw new Error("ChatInputCommand without a guild id");
        
        const subscription = Subscription.get(id);

        const member = interaction.member;
        if (member == null) throw new Error ("ChatInputCommand without a member")

        if (subscription !== undefined && subscription.isMemberConnected(member as DiscordJs.GuildMember)) {
            // member connected in the same voiceChannel and there already exist a subscription
            return {subscription: subscription, isNew: false};

        } else if ((subscription === undefined) && ((member as DiscordJs.GuildMember).voice?.channel?.id !== undefined)) {
            // member is connected to a voiceChannel but there is no subscription
            return {subscription: new Subscription(interaction, firstTrack), isNew: true};

        } else {
            return {subscription: undefined, isNew: false};
        }
    }

    voiceConnection:VoiceConnection;
    audioPlayer:AudioPlayer;
    tracklist:Tracklist;
    musicDisplayer:MusicDisplayer;

    private constructor(interaction:DiscordJs.ChatInputCommandInteraction, firstTrack:Track) {

        const guildId = interaction.guild?.id;
        if (guildId == undefined) throw new Error("Subscription received an interraction without a guildId");

        this.voiceConnection = new VoiceConnection(interaction);
        this.audioPlayer = new AudioPlayer();
        this.tracklist = new Tracklist(firstTrack);

        let channelName: string;
        const guildName = interaction.guild?.name ?? "...";
        {
            const channel = (interaction.client.channels.cache.find(channel => channel.id === this.voiceConnection.joinConfig.channelId))
            if (channel?.isVoiceBased()) channelName = channel.name;
            else channelName = "...";
        }

        if (interaction.channel === null) throw new Error ("Subscription got an interaction without text channel");

        this.musicDisplayer = new MusicDisplayer( guildName, channelName, firstTrack.data, interaction.channel)

        this.voiceConnection.subscribe(this.audioPlayer.subscription);

        this.audioPlayer.on('mute', () => {
            this.voiceConnection.selfMute(true);
        });

        this.audioPlayer.on('unmute', () => {
            this.voiceConnection.selfMute(false);
        });

        this.tracklist.now.on(TrackStatus.AudioReady, (audio:DiscordJsVoice.AudioResource<null>) => {
            this.audioPlayer.play(audio);
        });

        this.audioPlayer.on('pleasePlay', ()=>{
            this.tracklist.now.createAudioResource();
        });

        this.voiceConnection.on('destroyed', ()=> {this.unsubscribe()})

        Subscription.guildSubscriptions.set(guildId, this);
    }

    skip() {
        this.audioPlayer.pause(true);
        this.tracklist.next();
        this.audioPlayer.unpause(true);
    }

    pause() {
        this.audioPlayer.pause(this.tracklist.now.isLive);
    }

    resume() {
        this.audioPlayer.unpause(this.tracklist.now.isLive);
    }

    playTrackNow(track:Track) {
        this.audioPlayer.pause(true);
        this.tracklist.setNow(track);
        this.audioPlayer.unpause(true);
    }


    async updateMusicdisplayerEmbed(trackData:TrackInfo) {
        this.musicDisplayer.updateEmbed(trackData, await this.voiceConnection.getChannelName())
    }

    updateMusicdisplayerButton() {
        const isLive = this.tracklist.now.isLive;
        const isPaused = this.audioPlayer.paused;
        const hasQueue = this.tracklist.hasQueue;
        this.musicDisplayer.updateButtons(isLive, isPaused, hasQueue);
    }

    isMemberConnected(member:DiscordJs.GuildMember | DiscordJs.APIInteractionGuildMember | null) {
        const guildMember:DiscordJs.GuildMember = member as DiscordJs.GuildMember;

        return (guildMember?.guild?.id === this.voiceConnection.joinConfig.guildId)
        && (guildMember?.voice?.channel?.id === this.voiceConnection.joinConfig.channelId);
    }

    unsubscribe(){
        const guildId = this.voiceConnection.joinConfig.guildId;
        this.audioPlayer.destroy();
        if (!this.voiceConnection.destroyed) this.voiceConnection.destroy();
        this.tracklist.destroy();
        Subscription.guildSubscriptions.delete(guildId);
    }
}
