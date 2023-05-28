import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType.js';
import Lang from '../../../Lang.js';
import { Subscription } from '../../../voiceAPI/Subscription.js';
import Messages from '../../../messageAPI/Messages.js';
import { Track, TrackType } from '../../../voiceAPI/Track.js';
import importJSON from '../../../modules/importJSON.js';

const soundlist:{[key:string]:SoundData} = importJSON("./resources/mp3sounds/soundlist.json");

export const playsound: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName('playsound')
    .setDescription("Music Player - PlaySound") // #####
    .addStringOption(option => option
        .setName('sound')
        .setDescription("sound to play")
        .addChoices(...getSampleChoices())
        .setRequired(true)    
    )
    ,
    action: async function (interaction) {
        const thinkingMessage = await Messages.startThinking(interaction);

        const query = interaction.options.getString('sound');

        if (query === null) throw new Error ("PlaySound without key")

        let subscription = Subscription.get(interaction.guildId);

        const trackData = soundlist[query];


        const track = new Track(interaction.id, query, trackData.file, TrackType.File, trackData.volume ?? 0.5);

        if (subscription === null) Subscription.create(interaction, track);
        else subscription.playTrackNow(track);

        Messages.stopThinking(thinkingMessage);
    }
};

type SoundData = {
    file:string,
    title: string,
    description: string,
    volume?: number,
    thumbnail?: string
}

function getSampleChoices(){
    const choices = [];

    for (const key in soundlist) {
        if (Object.hasOwnProperty.call(soundlist, key)) {
            choices.push({name : `${key}`, value: `${key}`});
        }
    }
    return choices;
}

