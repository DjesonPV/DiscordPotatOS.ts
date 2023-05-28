import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType.js';
import Lang from '../../../Lang.js';
import { Subscription } from '../../../voiceAPI/Subscription.js';
import Messages from '../../../messageAPI/Messages.js';
import { Track, TrackType } from '../../../voiceAPI/Track.js';
import importJSON from '../../../modules/importJSON.js';

const radiolist:{[key:string]:LocalRadioData} = importJSON("./resources/localradio.json");

export const localradio: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName('localradio')
    .setDescription("Music Player - LocalRadio") // #####
    .addStringOption(option => option
        .setName('radio')
        .setDescription("live radio to play")
        .addChoices(...getLocalRadioChoices())
        .setRequired(true)    
    )
    ,
    action: async function (interaction) {
        const thinkingMessage = await Messages.startThinking(interaction);

        const query = interaction.options.getString('radio');
        if (query === null) throw new Error ("LocalRadio without key")

        let subscription = Subscription.get(interaction.guildId);

        const radioData = radiolist[query];


        const track = new Track(interaction.id, query, radioData.url, TrackType.LocalRadio, radioData.volume ?? 0.15);

        if (subscription === null) Subscription.create(interaction, track);
        else subscription.playTrackNow(track);

        Messages.stopThinking(thinkingMessage);
    }
};

type LocalRadioData = {
    name:string,
    title: string,
    description: string,
    web:string,
    url:string,
    volume?: number,
    thumbnail?: string
}

function getLocalRadioChoices(){
    const choices = [];

    for (const key in radiolist) {
        if (Object.hasOwnProperty.call(radiolist, key)) {
            choices.push({name : `${key}`, value: `${key}`});
        }
    }
    return choices;
}
