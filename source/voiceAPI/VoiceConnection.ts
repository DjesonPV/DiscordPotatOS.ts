import * as DiscordJs from 'discord.js';
import * as DiscordJsVoice from '@discordjs/voice';
import { EventEmitter } from 'node:events';
import { promisify } from 'node:util';

export enum VoiceConnectionState {
    Destroyed = "destroyed",
    Ready = "ready",
    Moved = "moved"
}

export class VoiceConnection extends EventEmitter {
    private voiceConnection: DiscordJsVoice.VoiceConnection;
    private guildChannels;
    private readyLock = false;

    constructor(interaction: DiscordJs.ChatInputCommandInteraction) {
        super();
        const member = (interaction.member as DiscordJs.GuildMember);
        const guild = (interaction.guild as DiscordJs.Guild);

        if (member.voice.channel === null) throw "You must be connected in a VoiceChannel";

        const channelID = member.voice.channel.id;
        const guildID = member.guild.id;
        this.guildChannels = member.guild.channels;

        this.voiceConnection = DiscordJsVoice.joinVoiceChannel(
            {
                channelId: channelID,
                guildId: guildID,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: true,
            });

        this.voiceConnection.on('stateChange', async (oldState, newState) => { await this.onStateChange(oldState, newState) });
    }

    subscribe(audioPlayer: DiscordJsVoice.AudioPlayer) {
        this.voiceConnection.subscribe(audioPlayer);
    }

    selfMute(muted: boolean): boolean {
        return this.voiceConnection.rejoin(
            {
                ...this.voiceConnection.joinConfig,
                selfMute: muted,
            }
        );
    }

    get joinConfig() {
        return this.voiceConnection.joinConfig
    }

    destroy(adapterAvailable?: boolean | undefined) {
        this.voiceConnection.destroy(adapterAvailable);
    }

    get destroyed() {
        return this.voiceConnection.state.status === DiscordJsVoice.VoiceConnectionStatus.Destroyed;
    }

    private async onStateChange(oldState: DiscordJsVoice.VoiceConnectionState, newState: DiscordJsVoice.VoiceConnectionState) {
        switch (getStatusFromStates(oldState, newState, this.readyLock)) {
            case Status.Disconnect:
                if (this.voiceConnection.rejoinAttempts < 10) {
                    promisify(setTimeout)((this.voiceConnection.rejoinAttempts + 1) * 5000).then(() => {
                        // await before trying to rejoin()
                        this.voiceConnection.rejoin();
                    });
                }
                break;
            case Status.LostConnection:
                try // Might have been move in other VoiceChannel by an admin, let's try to reconnect
                {
                    await DiscordJsVoice.entersState(this.voiceConnection, DiscordJsVoice.VoiceConnectionStatus.Connecting, 5000);
                    this.emit(VoiceConnectionState.Moved)
                }
                catch (error) // It must have been disconnected from VoiceChannel by an admin, or finished
                {
                    this.voiceConnection.destroy();
                }
                break;
            case Status.Destroyed:
                this.emit(VoiceConnectionState.Destroyed);
                break;
            case Status.Connecting:
                this.readyLock = true;
                try // Try to get Ready
                {
                    await DiscordJsVoice.entersState(this.voiceConnection, DiscordJsVoice.VoiceConnectionStatus.Ready, 20000).then(() => {
                        this.readyLock = false;
                    });
                }
                catch (error) // Didn't manage to setup, destroy everything
                {

                }
                break;
            case Status.Ready:
                this.emit(VoiceConnectionState.Ready);
                break;
            default: // ignore
        };
    }

    async getChannelName() {
        const channelId = this.voiceConnection.joinConfig.channelId;
        if (channelId === null) return '...';
        const channel = await this.guildChannels.fetch(channelId);
        if (channel === null || channel.isVoiceBased() === false) return '...';

        return channel.name ?? '...';
    }
}

enum Status {
    Disconnect = 0,
    LostConnection = 1,
    Destroyed = 2,
    Connecting = 3,
    Ready = 4,
}

function getStatusFromStates(oldState: DiscordJsVoice.VoiceConnectionState, newState: DiscordJsVoice.VoiceConnectionState, readyLock: boolean) {
    if (newState.status === DiscordJsVoice.VoiceConnectionStatus.Disconnected) {
        if (newState.reason === DiscordJsVoice.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014)
            return Status.LostConnection;
        return Status.Disconnect;
    }

    if (newState.status === DiscordJsVoice.VoiceConnectionStatus.Destroyed) return Status.Destroyed;

    if (!readyLock && (newState.status === DiscordJsVoice.VoiceConnectionStatus.Connecting ||
        newState.status === DiscordJsVoice.VoiceConnectionStatus.Signalling))
        return Status.Connecting;

    if (newState.status === DiscordJsVoice.VoiceConnectionStatus.Ready)
        return Status.Ready;
}
