import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';

import VoiceConnection from './VoiceConnection';
import AudioPlayer from './AudioPlayer';
import { Tracklist } from './Tracklist';
import { TrackStatus } from './Track';

export class Subscription {

    private static guildSubscriptions:Map<DiscordJs.Snowflake,Subscription> = new Map(); 

    static get(id:DiscordJs.Snowflake){
        return this.guildSubscriptions.get(id);
    }

    static create(interaction:DiscordJs.ChatInputCommandInteraction) {
        
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
            return {subscription: new Subscription(interaction), isNew: true};

        } else {
            return {subscription: undefined, isNew: false};
        }
    }

    voiceConnection:VoiceConnection;
    audioPlayer:AudioPlayer;
    tracklist:Tracklist;

    private constructor(interaction:DiscordJs.ChatInputCommandInteraction) {

        const guildId = interaction.guild?.id;
        if (guildId == undefined) throw new Error("Subscription received an interraction without a guildId");

        this.voiceConnection = new VoiceConnection(interaction);
        this.audioPlayer = new AudioPlayer();
        this.tracklist = new Tracklist();

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

    isMemberConnected(member:DiscordJs.GuildMember) {
        return (member?.guild?.id === this.voiceConnection.guildId)
        && (member?.voice?.channel?.id === this.voiceConnection.channelId);
    }

    unsubscribe(){
        const guildId = this.voiceConnection.guildId;
        this.audioPlayer.destroy();
        if (!this.voiceConnection.destroyed) this.voiceConnection.destroy();
        this.tracklist.destroy();
        Subscription.guildSubscriptions.delete(guildId);
    }
}
