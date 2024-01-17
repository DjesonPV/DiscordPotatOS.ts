import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';

import { VoiceConnection, VoiceConnectionState } from './VoiceConnection.js';
import { AudioPlayer, AudioPlayerEvent } from './AudioPlayer.js';
import { Tracklist, TracklistState } from './Tracklist.js';
import { Track, TrackStatus } from './Track.js';
import { MusicDisplayer } from './MusicDisplayer.js';

export class Subscription {

    private static guildSubscriptions: Map<DiscordJs.Snowflake, Subscription> = new Map();

    static get(guildId: DiscordJs.Snowflake | null) {
        return guildId === null ? null : this.guildSubscriptions.get(guildId) ?? null;
    }

    static create(interaction: DiscordJs.ChatInputCommandInteraction, firstTrack: Track) {

        const id = interaction.guild?.id;
        if (id === undefined) throw new Error("ChatInputCommand without a guild id");

        const subscription = Subscription.get(id);

        const member = interaction.member;
        if (member == null) throw new Error("ChatInputCommand without a member")

        if (subscription !== null && subscription.isMemberConnected(member as DiscordJs.GuildMember)) {
            // member connected in the same voiceChannel and there already exist a subscription
            return { subscription: subscription, isNew: false };

        } else if ((subscription === null) && ((member as DiscordJs.GuildMember).voice?.channel?.id !== undefined)) {
            // member is connected to a voiceChannel but there is no subscription
            return { subscription: new Subscription(interaction, firstTrack), isNew: true };

        } else {
            return { subscription: null, isNew: false };
        }
    }

    voiceConnection: VoiceConnection;
    audioPlayer: AudioPlayer;
    tracklist: Tracklist;
    musicDisplayer: MusicDisplayer;
    channelName: string = '...';

    private constructor(interaction: DiscordJs.ChatInputCommandInteraction, firstTrack: Track) {

        const guildId = interaction.guild?.id;
        if (guildId == undefined) throw new Error("Subscription received an interraction without a guildId");

        this.voiceConnection = new VoiceConnection(interaction);
        this.audioPlayer = new AudioPlayer();
        this.tracklist = new Tracklist(firstTrack);

        const guildName = interaction.guild?.name ?? "...";

        let channel = (interaction.client.channels.cache.find(channel => channel.id === this.voiceConnection.joinConfig.channelId));
        if (channel?.isVoiceBased()) this.channelName = channel.name;

        if (interaction.channel === null) throw new Error("Subscription got an interaction without text channel");

        this.musicDisplayer = new MusicDisplayer(guildName, this.channelName, firstTrack.data, interaction.channel)

        this.voiceConnection.subscribe(this.audioPlayer.subscription);

        //--------------
        // ASYNC LIAISON

        // - - -
        // Audio Player

        this.audioPlayer.on(AudioPlayerEvent.Mute, () => {
            this.voiceConnection.selfMute(true);
            this.updateMusicDisplayerButton();
        });

        this.audioPlayer.on(AudioPlayerEvent.Unmute, () => {
            this.voiceConnection.selfMute(false);
            this.updateMusicDisplayerButton();
        });

        this.audioPlayer.on(AudioPlayerEvent.PleasePlay, (isAudioPlayerRetry:boolean) => {
            this.tracklist.now.createAudioResource(isAudioPlayerRetry);
        });
        
        this.audioPlayer.on(AudioPlayerEvent.Next, () => {
            this.next();
        });
        
        this.audioPlayer.on(AudioPlayerEvent.Error, () => {
            this.audioPlayer.emit(AudioPlayerEvent.Next);
        });

        this.audioPlayer.on(AudioPlayerEvent.Retry, () => {
            this.play(true, true);
        });

        this.audioPlayer.on(AudioPlayerEvent.Failed, () => {
            this.audioPlayer.emit(AudioPlayerEvent.Next);
        });
        
        // - - - 
        // TrackList
        this.tracklist.on(TracklistState.Changed, () => {
            this.musicDisplayer.updatePlaylist(this.tracklist);
            this.updateMusicDisplayerButton();
        });
        
        this.tracklist.on(TracklistState.Empty, () => {
            this.unsubscribe();
        });
        
        this.tracklist.on(TracklistState.Next, () => {
            this.play(true);
        });
        
        // - - -
        // Voice Connection

        this.voiceConnection.once(VoiceConnectionState.Destroyed, () => { this.unsubscribe() });

        this.voiceConnection.on(VoiceConnectionState.Moved, async () => {
            this.channelName = await this.voiceConnection.getChannelName();
            this.musicDisplayerFullUpdate();
        })

        this.voiceConnection.once(VoiceConnectionState.Ready, () => {
            this.play(true);
        })

        // ASYNC LIAISON
        //--------------

        Subscription.guildSubscriptions.set(guildId, this);
    }

    skip() {
        if (!this.audioPlayer.paused) this.audioPlayer.pause(true);
        this.next();
    }

    next() {
        this.tracklist.next();
    }

    pause() {
        this.audioPlayer.pause(this.tracklist.now.isLive);
    }

    resume() {
        if (this.tracklist.now.isLive || this.tracklist.now.failed) {
            this.tracklist.now.isAudioReady = false;
            this.tracklist.now.failed = false;
            this.updateMusicDisplayerButton();
        }
        this.play(this.tracklist.now.isLive || this.tracklist.now.failed);
    }

    playTrackNow(track: Track) {
        this.audioPlayer.pause(true);
        this.tracklist.setNow(track);
        this.musicDisplayerFullUpdate();
        this.play(true);
    }

    updateMusicDisplayerButton(hasAudioFailed: boolean = false) {
        const isLive = this.tracklist.now.isLive;
        const isPaused = this.audioPlayer.paused;
        const hasQueue = this.tracklist.hasQueue;
        const isReady = this.tracklist.now.isAudioReady;
        this.musicDisplayer.updateButtons(isLive, isPaused, hasQueue, undefined, isReady, hasAudioFailed);
    }

    musicDisplayerFullUpdate(hasAudioFailed:boolean = false) {
        this.updateMusicDisplayerButton(hasAudioFailed);
        this.musicDisplayer.updateEmbed(this.tracklist.now.data, this.channelName);
        this.musicDisplayer.updatePlaylist(this.tracklist);
    }

    isMemberConnected(member: DiscordJs.GuildMember | DiscordJs.APIInteractionGuildMember | null) {
        const guildMember: DiscordJs.GuildMember = member as DiscordJs.GuildMember;

        return (guildMember?.guild?.id === this.voiceConnection.joinConfig.guildId)
            && (guildMember?.voice?.channel?.id === this.voiceConnection.joinConfig.channelId);
    }

    unsubscribe() {
        const guildId = this.voiceConnection.joinConfig.guildId;
        this.audioPlayer.destroy();
        if (!this.voiceConnection.destroyed) this.voiceConnection.destroy();
        this.tracklist.destroy();
        this.musicDisplayer.delete();
        Subscription.guildSubscriptions.delete(guildId);
    }

    private play(isNew:boolean = true, isAudioPlayerRetry: boolean = false) {
        this.audioPlayer.unpause(isNew, isAudioPlayerRetry);
        
        if (this.tracklist.now.isDataReady) {
            this.musicDisplayerFullUpdate();
        } else {
            this.tracklist.now.once(TrackStatus.DataReady, () => {
                this.musicDisplayer.updateEmbed(this.tracklist.now.data, this.channelName);
            });
        }

        if (isNew) {
            this.tracklist.now.once(TrackStatus.AudioReady, (audio: DiscordJsVoice.AudioResource<any>, audioplayerRetry:boolean) => {
                audio.volume?.setVolume(this.tracklist.now.volume ?? 0.3);
                this.audioPlayer.play(audio, audioplayerRetry);
                this.updateMusicDisplayerButton();
            });
    
    
            this.tracklist.now.once(TrackStatus.AudioFailed, () => {
                this.musicDisplayerFullUpdate(true);
            });            
        }
    }
}
