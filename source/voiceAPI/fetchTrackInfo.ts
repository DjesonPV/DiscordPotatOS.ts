import youtubeDl from "youtube-dl-exec";
import * as RadioGarden from "../modules/RadioGarden.js";
import favcolor from 'favcolor';

import * as DiscordJs from 'discord.js';
import {Track, TrackType} from "./Track.js";

import { promisify } from "node:util";
import Lang from "../Lang.js";
import botPersonality from "../modules/botPersonality.js";
import localRadio from "../modules/localRadio.js";
import importJSON from "../modules/importJSON.js";

const soundlist: { [key: string]: soundDescription | undefined } = importJSON("./resources/mp3sounds/soundlist.json");

type soundDescription = {
    file: string,
    title: string,
    description: string,
    volume: string,
    thumbnail: string | undefined
}

type InfoFormat = {
    author: DiscordJs.EmbedAuthorData,
    color: DiscordJs.ColorResolvable,
    description: string,
    title: string,
    thumbnail: string | null,
    url: string | null,
    playlistDescription: string,
    playlistTitle: string
}

export type TrackInfo = {
    author: DiscordJs.EmbedAuthorData,
    color: DiscordJs.ColorResolvable,
    description: string,
    title: string,
    thumbnail: string,
    url: string | null,
    playlistDescription: string,
    playlistTitle: string
}


export async function fetchTrackInfo (track:Track) {
    switch (track.type) {
        case TrackType.File:
            return curateInfo(fetchAudioFileInfo(track.query));
        case TrackType.LocalRadio:
            return curateInfo(fetchLocalRadioInfo(track.query));
        case TrackType.Radio:
            if (track.url === null) throw new Error("FetchAudioInfo:\n•no url Radio");
            return curateInfo(await fetchRadioGardenInfo(track.url, track.query));
        case TrackType.Track:
            if (track.url === null) throw new Error("FetchAudioInfo:\n• no track URL");
            const [data, isLive] = await fetchAudioTrackInfo(track.url, track.query);
            track.isLive = isLive;
            return curateInfo(data);
        case TrackType.Unknown:
        default:
            if (track.url === null) throw new Error("FetchAudioInfo:\n• no URL");
            return curateInfo(failedYTDLInfo(track.url));
    };
}

function curateInfo(info:InfoFormat):TrackInfo{
    return {
        author:{
            name: info.author.name.substring(0,256),
            iconURL: info.author.iconURL ?? botPersonality.icon,
            url: info.author.url
        },
        color: info.color,
        description: info.description.substring(0, 4096),
        title: info.title.substring(0,256),
        thumbnail: info.thumbnail ?? botPersonality.musicPlayerDefaultThumbnail,
        url: info.url,
        playlistDescription: info.playlistDescription.substring(0,100),
        playlistTitle: info.playlistTitle.substring(0,100)
    };
}

/// - - -
///> Placeholder that display an acknowledge command

export function placeholderInfo(track:Track) {

    let command:string;

    switch (track.type) {
        case TrackType.File:
            command = Lang.get("SC_playsound_commandName");
          break;
        case TrackType.LocalRadio:
            command = Lang.get("SC_localRadio_commandName");
          break;
        case TrackType.Radio:
            command = Lang.get("SC_radio_commandName");
          break;
        case TrackType.Track:
        case TrackType.Unknown:
        default:
            command = Lang.get("SC_playtrack_commandName");
    };

    return curateInfo({
        author: {
            name: Lang.get("MP_Placeholder_command$2", [command, track.query]),
            iconURL: botPersonality.icon
        }, 
        color: botPersonality.color as DiscordJs.ColorResolvable,
        description: Lang.get("MP_Placeholder_loading"),
        title: Lang.get("MP_Placeholder_searching$1", [botPersonality.nickname]),
        thumbnail: null,
        url: null,
        playlistDescription: Lang.get("MP_Placeholder_loading"),
        playlistTitle: Lang.get("MP_Placeholder_command$2", [command, track.query]),
    });

}

/// - - -
///> Fetch Audio Failed modifier

export function fetchFailedInfo(info:TrackInfo):TrackInfo {

    const errorMessage = Lang.get("MP_GUI_audioFetchFailed");

    return {
        author: {
            name: info.author.name,
            iconURL: botPersonality.errorIcon,
            url: info.author.url
        },
        color: botPersonality.errorColor as DiscordJs.ColorResolvable,
        description: info.description.substring(0, 4096-errorMessage.length).concat(errorMessage),
        title: info.title,
        thumbnail: info.thumbnail,
        url: info.url,
        playlistDescription: info.playlistDescription,
        playlistTitle: info.playlistTitle
    }
}


/// - - -
///> fecthInfo

function fetchAudioFileInfo(key: string): InfoFormat {    
    const file = soundlist[key];
    if (file === undefined) throw new Error("FetchAudioInfo:\n• file wrong key");

    return {
        author: {
            name: Lang.get("MP_GIU_soundCalled$1", [key]),
            iconURL: botPersonality.icon
        },
        color: botPersonality.color as DiscordJs.ColorResolvable,
        description: file.description,
        title: file.title,
        thumbnail: file.thumbnail ?? null,
        url: null,
        playlistDescription: Lang.get("MP_GUI_throughCommand"),
        playlistTitle: key,
    };
}

async function fetchAudioTrackInfo(url: string , query: string): Promise<[InfoFormat, boolean]> {   
    return await Promise.race([
        promisify(setTimeout)(5000, "").then( () => {return Promise.reject("Timed out")}),

        new Promise(function (resolve, reject) {
            youtubeDl.exec(
                url,
                {
                    embedMetadata: true,
                    noEmbedChapters: true,
                    noEmbedInfoJson: true,
                    simulate: true,
                    dumpSingleJson: true,
                } as any
            ).then(function (data) {
                const metadata = JSON.parse(data.stdout);

                if (metadata.extractor === 'generic') reject('FetchAudioInfo:\n• Generic extracor, will use custom Info');
                else resolve(metadata);
            })
        })

    ]).then(async function (metadata: any) {
        const authorName = `${metadata.webpage_url_domain} • ${metadata.channel ?? metadata.artist ?? metadata.uploader ?? metadata.creator}`;
        const authorURL = metadata.uploader_url ?? metadata.channel_url ?? metadata.webpage_url;
        const duration = metadata.duration;
        const iconURL = `https://s2.googleusercontent.com/s2/favicons?domain_url=${metadata.webpage_url_domain}&sz=48`;
        const isLive = metadata.is_live;
        const title = metadata.fulltitle || metadata.title;
        const thumbnail = metadata.thumbnail ?? "";//LANG.musicdisplayerDefaultThumbnail;
        const uploadDate = metadata.upload_date;
        const url = metadata.webpage_url;
        const viewCount = metadata.view_count;

        const info: InfoFormat = {
            author: {
                name: authorName,
                iconURL: iconURL,
                url: authorURL,
            },
            color: await getColorFromSiteUrl(url),
            description: `${isLive ? `🔴 LIVE` : durationToString(duration)} • ${viewsToString(viewCount)} • ${YYYYMMDDToString(uploadDate)}`,
            title: title,
            thumbnail: thumbnail,
            url: url,

            playlistDescription: `${authorName} • ${isLive ? `⬤ LIVE` : durationToString(duration)} • ${viewsToString(viewCount)} • ${YYYYMMDDToString(uploadDate)}`,
            playlistTitle: title,
        }

        return [info, isLive];
    },
        function (reason) {
            return [failedYoutubeInfo(url, query), true];
        }
    )
}

async function fetchRadioGardenInfo(url: string, query: string): Promise<InfoFormat> {
    return await RadioGarden.getRadioData(url).then(data => {
        return {
            author: {
                name: "Radio Garden",
                url: `https://radio.garden${data.url}`,
                iconURL: botPersonality.radioIcon
            },
            color: botPersonality.radioColor as DiscordJs.ColorResolvable,
            description: `${data.place.title}, ${data.country.title}`,
            title: data.title,
            thumbnail: botPersonality.radioThumbnail,
            url: data.website,
            playlistDescription: `Radio Garden • ${data.place.title}, ${data.country.title}`,
            playlistTitle: `🟢 ${data.title}`
        };
    }, () => {
        return failedRadioGardenInfo(url, query);
    });
}

function fetchLocalRadioInfo(key: string): InfoFormat {
    const radio = localRadio[key];
    if (radio === undefined) throw new Error("FetchAudioInfo:\n• failed Local Radio");
    return {
        author: {
            name: radio.name,
            url: radio.web,
            iconURL: botPersonality.radioIcon
        },
        color: botPersonality.radioColor as DiscordJs.ColorResolvable,
        description: radio.description,
        title: radio.title,
        url: radio.url,
        thumbnail: radio.thumbnail ?? botPersonality.musicPlayerDefaultThumbnail,
        playlistDescription: radio.title,
        playlistTitle: `🟢 ${radio.name}`
    };
}

function failedRadioGardenInfo(url: string, query: string): InfoFormat {
    return {
        // Data used in the MusicDisplayer Embed
        author: {
            name: `Radio Garden`,
            url: `https://radio.garden/`,
            iconURL: botPersonality.radioIcon,
        },
        color: botPersonality.radioColor as DiscordJs.ColorResolvable,
        description: query,
        title: url,
        url: url,
        thumbnail: botPersonality.musicPlayerDefaultThumbnail,

        // Data used in the MusicDisplayer Playlist SelectMenu
        playlistDescription: `Radio Garden ○ ${query}`,
        playlistTitle: `🟢 /${url.match(/https?:\/\/radio\.garden\/([^&]+)/)?.[1] ?? '. . .'}`,
    };
}

function failedYoutubeInfo(url: string, query: string|null): InfoFormat {
    if (query == null) return failedYTDLInfo(url);
    return {
        author: {
            name: `YouTube`,
            url: `https://www.youtube.com/`,
            iconURL: `https://s2.googleusercontent.com/s2/favicons?domain_url=youtube.com&sz=48`,
        },
        color: '#FF0000',
        description: query,
        title: url,
        url: url,
        thumbnail: botPersonality.musicPlayerDefaultThumbnail,
        playlistDescription: query,
        playlistTitle: `YouTube ○ /${url.match(/https:\/\/www\.youtube\.com\/([^&]+)/)?.[1] ?? ''}`,
    };
}

function failedYTDLInfo(url: string): InfoFormat {
    /** @type {string} */ const uri = url.split('/').filter(Boolean); //Split an url and remove empty strings
	/** @type {string} */ const source = uri[1];
	/** @type {string} */ const file = uri[uri.length - 1];
	const favicon = `https://s2.googleusercontent.com/s2/favicons?domain_url=${uri}&sz=48`;

	return {
		// Data used in the MusicDisplayer Embed
		author: {
			name: source,
			url: `https://${source}`,
			iconURL: favicon,
		},
		color: botPersonality.color as DiscordJs.ColorResolvable,
		description: Lang.get("MP_GUI_webLink"),
		title: file,
		url: url,
        thumbnail: botPersonality.musicPlayerDefaultThumbnail,

		// Data used in the MusicDisplayer Playlist SelectMenu
		playlistDescription: url,
		playlistTitle: file,
	};
}

/// - - -
/// Color

async function getColorFromSiteUrl(url: string): Promise<DiscordJs.ColorResolvable> {
    return new Promise((resolve, reject) => {
        const cleanURL = url.match(/(?:http|https):\/\/(?:[^\/])+\//)?.[0];
    
        const defaultColor = botPersonality.color as DiscordJs.ColorResolvable;

        if (cleanURL === undefined){
            resolve(defaultColor);
            return;
        } 
        
        const timeout = setTimeout(()=> {
            resolve(defaultColor);
            return;
        }, 500);

        favcolor.fromSiteFavicon(cleanURL).then(color => {
            clearTimeout(timeout);
            resolve(color.toHex()  as DiscordJs.ColorResolvable);
        }, (_) => {
            clearTimeout(timeout);
            resolve(defaultColor);
        });
    });
}

/// - - -
/// Utils

function durationToString(duration: number) {
    let seconds = Math.floor(duration % 60);
    let minutes = (Math.floor(duration / 60)) % 60;
    let hours = Math.floor(duration / 3600);

    let string = "";
    if (hours) string += (`${hours}:`)
    string += (`${((hours > 0) && (minutes < 10)) ? '0' : ''}${minutes}:`)
    string += (`${seconds < 10 ? '0' : ''}${seconds}`)
    return string;
}

function viewsToString(viewCount: number) {
    let string;
    if (viewCount) {
        let views = [
            viewCount % 1e3,
            (Math.floor(viewCount / 1e3)) % 1e3,
            (Math.floor(viewCount / 1e6)) % 1e3,
            (Math.floor(viewCount / 1e9)),
        ];

        let num = 0;
        let dec: number | null = 0;
        let suf = "";

        if (views[3] > 0) {
            num = views[3];
            dec = Math.floor(views[2] / 1e2);

            if (num > 10) dec = null;
            suf = Lang.get("MP_GUI_billionViews");
        } else if (views[2] > 0) {
            num = views[2];
            dec = Math.floor(views[1] / 1e2);

            if (num > 10) dec = null;
            suf = Lang.get("MP_GUI_millionViews");
        } else if (views[1] > 0) {
            num = views[1];
            dec = Math.floor(views[0] / 1e2);

            if (num > 10) dec = null;
            suf = Lang.get("MP_GUI_thousandViews");
        } else {
            num = views[0];
            dec = null;
            suf = Lang.get("MP_GUI_unitViews");
        }

        string = `${num}`;
        if (dec !== null) string += `,${dec}`;
        string += `${suf}`;
    } else string = Lang.get("MP_GUI_unknownViews");

    return string;
}

function YYYYMMDDToString(yyyymmdd: string) {
    const matched = yyyymmdd.match(/(\d{4})(\d{2})(\d{2})/);

    if (matched === null) throw new Error("Incorrect Raw Date Format (YYYYMMDD)");

    const [year, month, day] = matched.slice(1, 4);

    const parsedYear = year.replace(/^0+/, '');

    const monthChoice = parseInt(month) - 1;
    const parsedMonth = Lang.get(`MP_GUI_shortMonth${monthChoice}`);

    const parsedDay = day.replace(/^0+/, '');

    return Lang.get("MP_GUI_dateFormat$3", [parsedDay, parsedMonth, parsedYear]);
}
