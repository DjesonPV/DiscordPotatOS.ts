import * as DiscordJsVoice from '@discordjs/voice';
import * as RadioGarden from "../modules/RadioGarden.js";

import * as fs from 'fs';
import internal from 'stream';

import youtubeDl from 'youtube-dl-exec';
import { YouTubeLiveStream } from 'ytls';
import * as ChildProcess from 'child_process';

export async function createAudioTrackResource(url: string): Promise<DiscordJsVoice.AudioResource<null>> {
 /*   return new Promise(async function (resolve, reject) {
        fetchFileURL(url).then(fileURL => {
            if (fileURL.startsWith('https://manifest.googlevideo.com/api/manifest/hls_playlist/'))
                resolve(probeAndCreate(new YouTubeLiveStream(() => { return fileURL; })).then(result => result));

            const process = ChildProcess.spawn('ffmpeg', buildFFmpegArgs(url, fileURL), { windowsHide: true, shell: false });

            process.once('spawn', async () => { resolve(await probeAndCreate(process.stdout)); });
        }).catch((error) => reject(error));
    });*/

        return fetchFileURL(url).then(fileURL => {
            if (fileURL.startsWith('https://manifest.googlevideo.com/api/manifest/hls_playlist/'))
                return (probeAndCreate(new YouTubeLiveStream(() => { return fileURL; })));

            const process = ChildProcess.spawn('ffmpeg', buildFFmpegArgs(url, fileURL), { windowsHide: true, shell: false });

            return new Promise( resolve => { 
                process.once('spawn', async () => { 
                    resolve ( probeAndCreate(process.stdout)); 
                })
                ;
            });
        })
}

export async function createAudioFileResource(fileLocation: string) {
    return await probeAndCreate(fs.createReadStream(fileLocation));
}

async function probeAndCreate(readableStream: internal.Readable) {
    const probe = await DiscordJsVoice.demuxProbe(readableStream)

    const audioResource = DiscordJsVoice.createAudioResource(
        probe.stream,
        {
            inputType: probe.type,
            inlineVolume: true,
        }
    );

    return audioResource;
}

async function fetchFileURL(query: string) {
    const radio = RadioGarden.getIdFromRadioURL(query);
    if (radio !== null) return RadioGarden.getRadioFluxURL(radio);

    let ytdlURL = (await youtubeDl.exec(
        query,
        {
            format: 'bestaudio.1/bestaudio*.2/best.2',
            print: 'urls',
            simulate: true,
        } as any
    ).catch(_ => { throw new Error('YTDLP shat himself')}))?.stdout;

    if (ytdlURL === undefined) throw new Error('YTDLP returned no URL');

    return ytdlURL;
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
        '-loglevel', '0',
        '-ar', '48000',
        '-ac', '2',
        '-f', 'opus',
        '-acodec', "libopus",
        'pipe:1'
    ]);
}
