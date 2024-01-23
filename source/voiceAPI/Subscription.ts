import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';

import { VoiceConnection, VoiceConnectionState } from './VoiceConnection.js';
import { AudioPlayer, AudioPlayerEvent } from './AudioPlayer.js';
import { Tracklist, TracklistState } from './Tracklist.js';
import { Track, TrackStatus } from './Track.js';
import { MusicDisplayer } from './MusicDisplayer.js';

export class Subscription {

    // Each Subscription is mapped to its Discord Guild as one client can only be connected to one Discord voiceChannel
    // To get or create this object we can only use these function get and create called through the class and not as new
    // that way we can keep track of all alive Subscriptions

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

        if ((subscription === null) && ((member as DiscordJs.GuildMember).voice?.channel?.id !== undefined)) {
            new Subscription(interaction, firstTrack);
        };
        // else it either already exist or the conditions are not met to create a Subscription successfully
        // so we do nothing : whatever called this function should deal with it
    }

    voiceConnection: VoiceConnection;
    audioPlayer: AudioPlayer;
    tracklist: Tracklist;
    musicDisplayer: MusicDisplayer;
    voiceChannelName: string = '...';
    private autonextTimeout: NodeJS.Timeout | undefined;

    private constructor(interaction: DiscordJs.ChatInputCommandInteraction, firstTrack: Track) {

        const guildId = interaction.guild?.id;
        if (guildId == undefined) throw new Error("Subscription received an interraction without a guildId");
        if (interaction.channel === null) throw new Error("Subscription got an interaction without text channel");
        
        this.tracklist = new Tracklist(firstTrack);
        this.audioPlayer = new AudioPlayer();
        this.voiceConnection = new VoiceConnection(interaction, this.audioPlayer.voice);
        
        const guildName = interaction.guild?.name ?? "...";
        const voiceChannel = (interaction.client.channels.cache.find(cachedChannel => cachedChannel.id === this.voiceConnection.joinConfig.channelId));
        if (voiceChannel?.isVoiceBased()) this.voiceChannelName = voiceChannel.name;
        
        this.musicDisplayer = new MusicDisplayer(guildName, this.voiceChannelName, firstTrack.data, interaction.channel)
        
        Subscription.guildSubscriptions.set(guildId, this);

        this.audioPlayerListeners();
        this.tracklistListeners();
        this.voiceConnectionListeners();        
    }

    /// Commands \\\
    
    skip() {
        if (!this.audioPlayer.paused) this.audioPlayer.pause(true);
        this.next();
    }
    
    next() {
        this.clearAutonextTimeout();
        this.tracklist.next();
    }

    pause() {
        this.audioPlayer.pause(this.tracklist.now.isLive);
    }
    
    resume() {
        const doNeedToReCreateAudioResource = this.tracklist.now.isLive || this.tracklist.now.failed;
        
        if (doNeedToReCreateAudioResource) { // show loading
            this.tracklist.now.failed = false;
            this.tracklist.now.isAudioReady = false;
            this.updateMusicDisplayerButton();
        }
        
        this.play(doNeedToReCreateAudioResource);
    }
    
    playThisTrackNow(track: Track) {
        this.audioPlayer.pause(true);
        this.tracklist.setNow(track);
        this.musicDisplayerFullUpdate();
        this.play(true);
    }
    
    private play(isNew:boolean = true, isAudioPlayerRetry: boolean = false) {
        this.audioPlayer.unpause(isNew, isAudioPlayerRetry);
        this.currentTrackListeners(isNew);
    }

    /// MusicDisplayer liaison \\\

    private updateMusicDisplayerButton() {
        const isLive = this.tracklist.now.isLive;
        const isPaused = this.audioPlayer.paused;
        const hasQueue = this.tracklist.hasQueue;
        const isReady = this.tracklist.now.isAudioReady;
        this.musicDisplayer.updateButtons(isLive, isPaused, hasQueue, undefined, isReady);
    }

    private updateMusicDiplayerEmbed() {
        this.musicDisplayer.updateEmbed(this.tracklist.now.data, this.voiceChannelName);
    }
    
    musicDisplayerFullUpdate() {
        this.updateMusicDiplayerEmbed();
        this.updateMusicDisplayerButton();
        this.musicDisplayer.updatePlaylist(this.tracklist);
    }
    
    /// Tests \\\

    isMemberConnected(member: DiscordJs.GuildMember | DiscordJs.APIInteractionGuildMember | null) {
        const guildMember: DiscordJs.GuildMember = member as DiscordJs.GuildMember;
        
        return (guildMember?.guild?.id === this.voiceConnection.joinConfig.guildId)
        && (guildMember?.voice?.channel?.id === this.voiceConnection.joinConfig.channelId);
    }
    
    /// Ubsub \\\

    unsubscribe() {
        const guildId = this.voiceConnection.joinConfig.guildId;
        this.audioPlayer.destroy();
        if (!this.voiceConnection.isDestroyed) this.voiceConnection.destroy();
        this.tracklist.destroy();
        this.musicDisplayer.delete();
        Subscription.guildSubscriptions.delete(guildId);
    }
    
    /// LISTENERS \\\

    // audioPlayer \\
    private audioPlayerListeners() {
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
            this.autonext();
        });

        this.audioPlayer.on(AudioPlayerEvent.Retry, () => {
            this.play(true, true);
        });

        this.audioPlayer.on(AudioPlayerEvent.Failed, () => {
            this.autonext();
        });
    }

    // tracklist \\
    private tracklistListeners() {
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
    }

    // voiceConnection \\
    private voiceConnectionListeners() {
        this.voiceConnection.once(VoiceConnectionState.Destroyed, () => {
            this.unsubscribe();
        });
        
        this.voiceConnection.once(VoiceConnectionState.Ready, () => {
            this.play(true);
        });
        
        this.voiceConnection.on(VoiceConnectionState.Moved, async () => {
            this.voiceChannelName = await this.voiceConnection.getChannelName();
            this.musicDisplayerFullUpdate();
        });
    }

    // current Track (now) \\
    private currentTrackListeners(isNew: boolean) {
        if (this.tracklist.now.isDataReady) {
            this.musicDisplayerFullUpdate();
        } else {
            this.tracklist.now.once(TrackStatus.DataReady, () => {
                this.musicDisplayer.updateEmbed(this.tracklist.now.data, this.voiceChannelName);
            });
        }

        if (isNew) {
            this.tracklist.now.once(TrackStatus.AudioReady, (audio: DiscordJsVoice.AudioResource<any>, audioplayerRetry:boolean) => {
                audio.volume?.setVolume(this.tracklist.now.volume ?? 0.3);
                this.audioPlayer.play(audio, audioplayerRetry);
                this.updateMusicDisplayerButton();
            });
    
            this.tracklist.now.once(TrackStatus.AudioFailed, () => {
                this.autonext();
            });            
        }
    }

    private autonext() {
        this.tracklist.now.updateFailStatus(true);
        this.autonextTimeout = setTimeout(()=> {this.next();}, 10000);
        this.musicDisplayerFullUpdate();
    }

    private clearAutonextTimeout() {
        if (this.autonextTimeout) {
            clearTimeout(this.autonextTimeout);
            this.autonextTimeout = undefined;
        }
    }
}
