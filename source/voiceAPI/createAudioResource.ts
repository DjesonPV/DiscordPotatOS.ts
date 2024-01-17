import * as DiscordJsVoice from '@discordjs/voice';
import * as RadioGarden from "../modules/RadioGarden.js";

import * as fs from 'fs';
import internal from 'stream';

import youtubeDl from 'youtube-dl-exec';
import { YouTubeLiveStream } from 'ytls';
import * as ChildProcess from 'child_process';

export async function createAudioTrackResource(url: string) {
     try {
        const fileURL = await fetchFileURL(url);

        const audioResource = fileURL.startsWith('https://manifest.googlevideo.com/api/manifest/hls_playlist/')
            ? fetchYoutubeLivestreamReadable(fileURL)
            : await useFFMPEG(url, fileURL)
        ;
        return probeAndCreate(audioResource);
    } catch (err) {
        throw Error(`• createAudioTrackResource\n${err}`);
    } 
}

function fetchYoutubeLivestreamReadable(liveURL: string) {
    return new YouTubeLiveStream(() => { return liveURL; })
}

// use tricky promise because of child process and streamed output 
function useFFMPEG(queryURL: string, fileURL: string): Promise<internal.Readable> {
    return new Promise((resolve, reject) => {
        const process = ChildProcess.spawn('ffmpeg', buildFFmpegArgs(queryURL, fileURL), { windowsHide: true, shell: false });
        process.once('spawn', async () => { resolve(process.stdout); });
        process.once('error', err => {reject(err);});
    });
}

export function createAudioFileResource(fileLocation: string) {
    return probeAndCreate(fs.createReadStream(fileLocation));
}

async function probeAndCreate(readableStream: internal.Readable) {
    try {
        const probe = await DiscordJsVoice.demuxProbe(readableStream);
        return DiscordJsVoice.createAudioResource( probe.stream, {
            inputType: probe.type,
            inlineVolume: true,
        });
    } catch (error) {
        throw Error(`• probeAndCreate\n${error}`);
    }
}

async function fetchFileURL(query: string) {
    const radio = RadioGarden.getIdFromRadioURL(query);
    if (radio !== null) return RadioGarden.getRadioFluxURL(radio);

    try {
        const ytdlURL = (await youtubeDl.exec(query, {
            format: 'bestaudio.1/bestaudio*.2/best.2',
            print: 'urls',
            simulate: true,
        } as any ).then(out => out)) // because eh
        ?.stdout;

        if (ytdlURL == undefined) throw new Error(`YTDLP return no URL`);

        return `${ytdlURL}`;
    } catch (error) {
        throw new Error(`• fetchFileURL youtubeDL.exec\n • date: ${Date.now()}\n • \n • query: ${query}\n • error: ${error}\n`);
    }
}

function buildFFmpegArgs(queryURL: string, fileURL: string) {
    // Any http|https url with a query string either t or start in seconds
    const seekTime = parseInt(queryURL.match(/https?:\/\/.*?\/.*?(?:\?|\&)(?:t|start)=(\d+)s?/)?.[1] ?? '0');

    return [
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
    ].concat(seekTime > 0 ? [
        '-ss', `${seekTime}`
    ] : []).concat([
        '-i', fileURL,
        '-analyzeduration', '0',
        '-map', 'a',
        '-loglevel', '0',
        '-ar', '48000',
        '-ac', '2',
        '-f', 'opus',
        //'-codec:a', "libopus",
        '-vn', '-sn', '-dn',
        'pipe:1'
    ]);
}
