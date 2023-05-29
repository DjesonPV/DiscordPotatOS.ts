import * as DiscordJsVoice from '@discordjs/voice';
import EventEmitter from 'node:events';

export enum AudioPlayerEvent {
    Error = "error",
    Unmute = "unmute",
    Mute = "mute",
    PleasePlay = "pleasePlay",
    Next = "next",
    Retry = "retry",
    Failed = "failed"
}

export class AudioPlayer extends EventEmitter {
    private audioPlayer: DiscordJsVoice.AudioPlayer;

    private isPaused = false; // for "Paused" Livestream

    private playedEnough = false;
    private playedEnoughCount = 1;
    private successfulStreamVerificationNumber: NodeJS.Timeout | undefined;

    constructor() {
        super();
        this.audioPlayer = DiscordJsVoice.createAudioPlayer();

        this.audioPlayer.on('stateChange', (oldState, newState) => { this.onStateChange(oldState, newState) });

        this.audioPlayer.on('error', (error) => {
            this.emit(AudioPlayerEvent.Error, error);
        });

    }

    play(audioSong: DiscordJsVoice.AudioResource<any>)//<<< AudioTrack >>>
    {
        this.audioPlayer.play(audioSong);
        this.isPaused = false;
        this.emit('unmute');
    }

    pause(isLive: boolean = false) {
        let paused: boolean;
        if (isLive) paused = this.audioPlayer.stop();
        else paused = this.audioPlayer.pause();

        this.isPaused = paused;

        if (paused) this.emit(AudioPlayerEvent.Mute);
    }

    unpause(isLive: boolean = false) {
        if (isLive) {
            this.emit(AudioPlayerEvent.PleasePlay);
            return;
        }

        const unpaused = this.audioPlayer.unpause();
        this.isPaused = !unpaused;

        if (unpaused) this.emit(AudioPlayerEvent.Unmute);
    }

    get subscription() {
        return this.audioPlayer;
    }

    get paused() {
        return this.isPaused;
    }

    private onStateChange(oldState: DiscordJsVoice.AudioPlayerState, newState: DiscordJsVoice.AudioPlayerState) {
        switch (getStatusFromStates(oldState, newState, this.isPaused)) {
            case Status.Idle:
                if (this.playedEnough === true) {
                    this.emit(AudioPlayerEvent.Next);
                } else if (this.playedEnoughCount > 0) {
                    clearTimeout(this.successfulStreamVerificationNumber);
                    this.playedEnough = false;
                    this.playedEnoughCount--;
                    this.emit(AudioPlayerEvent.Retry);
                } else this.emit(AudioPlayerEvent.Failed);
                break;
            case Status.Playing:
                if (this.playedEnough === false) {
                    this.playedEnoughCount = 30;
                }

                // Will have playedEnough after 100 ms withtout idling
                this.successfulStreamVerificationNumber = setTimeout(() => {
                    this.playedEnough = true;
                }, 100);


                break;
            default: // ignore
        }
    }

    destroy() {
        this.audioPlayer.stop(false);
    }

}

enum Status {
    Idle = 0,
    Playing = 1,
}

function getStatusFromStates(oldState: DiscordJsVoice.AudioPlayerState, newState: DiscordJsVoice.AudioPlayerState, livestreamPaused: boolean) {
    if (newState.status === DiscordJsVoice.AudioPlayerStatus.Idle && !livestreamPaused)
        return Status.Idle;

    if (newState.status === DiscordJsVoice.AudioPlayerStatus.Playing)
        return Status.Playing;
}
