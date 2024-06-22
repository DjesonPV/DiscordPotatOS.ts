import youtubeDl from "youtube-dl-exec";
import * as RadioGarden from "../modules/RadioGarden.js";
import favcolor from 'favcolor';

import * as DiscordJs from 'discord.js';
import {Track, TrackType} from "./Track.js";

import Lang from "../Lang.js";
import botPersonality from "../modules/botPersonality.js";
import localRadio from "../modules/localRadio.js";
import importJSON from "../modules/importJSON.js";

const soundlist: { [key: string]: soundDescription | undefined } = importJSON("./resources/mp3sounds/soundlist.json");

const DESCRIPTION_LIMIT = 2048; // max is 4096 as per https://discord.com/developers/docs/resources/channel#embed-object-embed-author-structure

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
    playlistTitle: string,
    dataFailed?:boolean
}

export type TrackInfo = {
    author: DiscordJs.EmbedAuthorData,
    color: DiscordJs.ColorResolvable,
    description: string,
    title: string,
    thumbnail: string,
    url: string | null,
    playlistDescription: string,
    playlistTitle: string,
    audioFailed?: boolean,
    dataFailed?: boolean
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
            const info = await fetchAudioTrackInfo(track.url, track.query);
            track.isLive = info.isLive;
            return curateInfo(info.info);
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
            iconURL: (info.author.iconURL ?? botPersonality.icon).substring(0, 512), // custom limit
            url: info.author.url?.substring(0, 512) // custom limit like bro you need more than that ?
        },
        color: info.color,
        description: info.description.substring(0, DESCRIPTION_LIMIT), // full limit is 4096
        title: info.title.substring(0,256),
        thumbnail: (info.thumbnail ?? botPersonality.musicPlayerDefaultThumbnail).substring(0, 512), // custom limit
        url: info.url?.substring(0, 1024) ?? null, // custom
        playlistDescription: info.playlistDescription.substring(0,100),
        playlistTitle: info.playlistTitle.substring(0,100),
        dataFailed: info.dataFailed ?? false,
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

function timeLimit(fun:Promise<any>, ms:number) {
    return new Promise (async (resolve, reject) => {
        const timeout = setTimeout(() => {reject('Timed out')}, 5000)
        try {
            const data = await fun;
            resolve(data);
        } catch (error) {
            reject(error)
        } finally {
            clearTimeout(timeout);
        }
    });
}

async function fetchAudioTrackInfo(url: string , query: string) { 
    try {     
        const metadata = await timeLimit(fetchYTDLData(url), 10000) as any;

        const sourceName = `${metadata.webpage_url_domain}`;
        const creatorName = metadata.channel ?? metadata.artist ?? metadata.uploader ?? metadata.creator ?? undefined;

        if (creatorName == undefined) throw "`• • • Music Player\n • fetchAudioTrackInfo\n • noCreatorName";

        const authorName = `${sourceName} • ${creatorName}`;
        const authorURL = metadata.uploader_url ?? metadata.channel_url ?? metadata.webpage_url;
        const duration = metadata.duration;
        const iconURL = `https://s2.googleusercontent.com/s2/favicons?domain_url=${metadata.webpage_url_domain}&sz=48`;
        const isLive = `${metadata.is_live}` == "true"; // it's true when live and null when not
        const title = metadata.fulltitle || metadata.title;
        const thumbnail = metadata.thumbnail ?? undefined;
        const uploadDate = metadata.upload_date;
        const weburl = metadata.webpage_url;
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
            url: weburl,

            playlistDescription: `${authorName} • ${isLive ? `⬤ LIVE` : durationToString(duration)} • ${viewsToString(viewCount)} • ${YYYYMMDDToString(uploadDate)}`,
            playlistTitle: title,
        }

        return {info:info, isLive: isLive};

    } catch (error) {
        console.warn(`• • • Music Player\n • fetchAudioTrackInfo\n • error: ${error}\n• • •\n`);
        return {
            info: failedYoutubeInfo(url, query),
            isLive : true
        }
    }
}

async function fetchYTDLData(url:string) {
    const data = await youtubeDl.exec(
        url,
        {
            embedMetadata: true,
            noEmbedChapters: true,
            noEmbedInfoJson: true,
            simulate: true,
            dumpSingleJson: true,
        } as any
    ).then(out => out); // because eh

    const metadata = JSON.parse(data.stdout);
    if (metadata.extracor === 'generic') throw new Error("Generic extracor, will use custom Info");
    return metadata;
}

async function fetchRadioGardenInfo(url: string, query: string) {
    
    try  {
        const data  = await RadioGarden.getRadioData(url);

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
        } as InfoFormat;
    } catch (error) {
        console.warn(`• • • RadioGarden\n • date: ${Date.now()}\n • url: ${url}\n • query: ${query} \n • error: ${error}\n• • •\n`);
        return failedRadioGardenInfo(url, query);
    };
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
        description: `${radio.description}\n${radio.place}, ${radio.country}`,
        title: radio.title,
        url: radio.url,
        thumbnail: radio.thumbnail ?? botPersonality.musicPlayerDefaultThumbnail,
        playlistDescription: `${radio.title} • ${radio.place}, ${radio.country}`,
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
        dataFailed: true,
    };
}

function failedYoutubeInfo(url: string, query: string): InfoFormat {
    if (query === url) return failedYTDLInfo(url);
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
        dataFailed: true,
    };
}

function failedYTDLInfo(url: string): InfoFormat {
    const uri = url.split('/').filter(Boolean); //Split an url and remove empty strings
	const source = uri[1];
	const file = uri[uri.length - 1];
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
        dataFailed: true,
	};
}

/// - - -
/// Color

async function getColorFromSiteUrl(url: string) {
    const defaultColor = botPersonality.color as DiscordJs.ColorResolvable;
    try {
        const cleanURL = url.match(/https?:\/\/(?:[^\/])+\//)?.[0];
        
        if (cleanURL === undefined) throw new Error("Clean URL not defined");
        
        
        const color = await (timeLimit(favcolor.fromSiteFavicon(cleanURL), 500) as Promise<{r: number; g: number; b: number; toHex: () => string;}>);
        const hexColor = color.toHex()  as DiscordJs.ColorResolvable;
        return hexColor;
        
    } catch (error) {
        console.warn(`• • • GetColorFromSiteURL\n • url: ${url}\n • error: ${error}\n• • •\n`);
        return defaultColor;
    }
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
    const matched = yyyymmdd?.match(/(\d{4})(\d{2})(\d{2})/) ?? undefined;

    if (matched == undefined) return Lang.get("MP_GUI_noUploadDate");

    const [year, month, day] = matched.slice(1, 4);

    const parsedYear = year.replace(/^0+/, '');

    const monthChoice = parseInt(month);
    const parsedMonth = Lang.get(`MP_GUI_shortMonth${monthChoice}`);

    const parsedDay = day.replace(/^0+/, '');

    return Lang.get("MP_GUI_dateFormat$3", [parsedDay, parsedMonth, parsedYear]);
}
