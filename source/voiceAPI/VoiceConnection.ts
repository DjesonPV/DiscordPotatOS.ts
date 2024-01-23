import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';
import { EventEmitter } from 'node:events';

export enum VoiceConnectionState {
    Destroyed = "destroyed",
    Ready = "ready",
    Moved = "moved"
}

export class VoiceConnection extends EventEmitter {
    private voiceConnection: DiscordJsVoice.VoiceConnection;
    private guildChannels;
    private readyLock = false;

    constructor(interaction: DiscordJs.ChatInputCommandInteraction, audioPlayer: DiscordJsVoice.AudioPlayer) {
        super();
        const member = (interaction.member as DiscordJs.GuildMember);
        const guild = (interaction.guild as DiscordJs.Guild);

        if (member.voice.channel === null) throw new Error("You must be connected in a VoiceChannel");

        const channelID = member.voice.channel.id;
        const guildID = member.guild.id;
        this.guildChannels = member.guild.channels;

        this.voiceConnection = DiscordJsVoice.joinVoiceChannel({
            channelId: channelID,
            guildId: guildID,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true,
        });

        this.voiceConnection.on('stateChange', async (oldState, newState) => { await this.onStateChange(oldState, newState) });
        this.voiceConnection.subscribe(audioPlayer);
    }

    selfMute(muted: boolean): boolean {
        return this.voiceConnection.rejoin({
            ...this.voiceConnection.joinConfig,
            selfMute: muted,
        });
    }

    get joinConfig() {
        return this.voiceConnection.joinConfig;
    }

    destroy(adapterAvailable?: boolean | undefined) {
        this.voiceConnection.destroy(adapterAvailable);
    }

    get isDestroyed() {
        return this.voiceConnection.state.status === DiscordJsVoice.VoiceConnectionStatus.Destroyed;
    }

    private async onStateChange(oldState: DiscordJsVoice.VoiceConnectionState, newState: DiscordJsVoice.VoiceConnectionState) {
        try {
            switch (getStatusFromStates(oldState, newState, this.readyLock)) {
            case VoiceConnectionStatus.Disconnect:
                if (this.voiceConnection.rejoinAttempts < 10) {
                    await waitForMs((this.voiceConnection.rejoinAttempts + 1) * 5000);
                    this.voiceConnection.rejoin();
                } else {
                    throw new Error("Too many attempts to rejoin");
                } break;
            case VoiceConnectionStatus.LostConnection:
                await DiscordJsVoice.entersState(this.voiceConnection, DiscordJsVoice.VoiceConnectionStatus.Connecting, 2000);
                await waitForMs(100); // rompiche API
                this.emit(VoiceConnectionState.Moved);
                break;
            case VoiceConnectionStatus.Destroyed:
                this.emit(VoiceConnectionState.Destroyed);
                break;
            case VoiceConnectionStatus.Connecting:
                this.readyLock = true;
                await DiscordJsVoice.entersState(this.voiceConnection, DiscordJsVoice.VoiceConnectionStatus.Ready, 2000);
                await waitForMs(100); // rompiche API
                this.readyLock = false;
                break;
            case VoiceConnectionStatus.Ready:
                this.emit(VoiceConnectionState.Ready);
                break;
            default: // ignore
            }
        } catch (error) {
            console.warn(`• • • • VoiceConnection\n • error: ${error}\n• • • •\n`);
            this.voiceConnection.destroy();
            // if it doesnt work : so long a voiceConnection
        }
    }

    async getChannelName() {
        let channelName: string | null = null;
        try {
            const channelId = this.voiceConnection.joinConfig.channelId;
            if (channelId !== null) {
                const channel = await this.guildChannels.fetch(channelId);
                if (channel !== null && channel.isVoiceBased() === true) {
                    channelName = channel.name;
                };
            }
        } catch (_) {
            // muting an error is bad pratice but here OSEF (pour le moment)
        } finally {
            return channelName ?? '...';
        }
    }
}

enum VoiceConnectionStatus {
    Disconnect = 0,
    LostConnection = 1,
    Destroyed = 2,
    Connecting = 3,
    Ready = 4,
}

function getStatusFromStates(oldState: DiscordJsVoice.VoiceConnectionState, newState: DiscordJsVoice.VoiceConnectionState, readyLock: boolean) {
    switch (newState.status) {
    case DiscordJsVoice.VoiceConnectionStatus.Disconnected:
        if (newState.reason === DiscordJsVoice.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014)
        return VoiceConnectionStatus.LostConnection;
        return VoiceConnectionStatus.Disconnect;
    case DiscordJsVoice.VoiceConnectionStatus.Destroyed:
        return VoiceConnectionStatus.Destroyed;
    case DiscordJsVoice.VoiceConnectionStatus.Connecting:
    case DiscordJsVoice.VoiceConnectionStatus.Ready:
        return VoiceConnectionStatus.Ready;
    case DiscordJsVoice.VoiceConnectionStatus.Signalling:
        if (!readyLock) return VoiceConnectionStatus.Connecting;
    default: 
        return null;
    }
}

function waitForMs(ms: number) {
    return new Promise ((resolve, _) => {
        const timeout = setTimeout(() => {resolve(true); clearTimeout(timeout)}, ms);
    });
}
