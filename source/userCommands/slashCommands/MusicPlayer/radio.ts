import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType.js';
import Lang from '../../../Lang.js';
import { Subscription } from '../../../voiceAPI/Subscription.js';
import Messages from '../../../messageAPI/Messages.js';
import * as RadioGarden from "../../../modules/RadioGarden.js";

import { Track, TrackType } from '../../../voiceAPI/Track.js';
import botPersonality from '../../../modules/botPersonality.js';

export const radio: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName(Lang.get('SC_radio_commandName'))
    .setDescription(Lang.get('SC_radio_commandDescription$1', [botPersonality.nickname]))
    .addStringOption(option => option
        .setName(Lang.get('SC_radio_optionName'))
        .setDescription(Lang.get('SC_radio_optionDescription'))
        .setRequired(true)  
    )
    ,
    action: async function (interaction) {
        const thinkingMessage = await Messages.startThinking(interaction);

        const query = interaction.options.getString(Lang.get('SC_radio_optionName'));

        if (query === null) throw new Error ("PlaySound without key")

        let subscription = Subscription.get(interaction.guildId);

        let url: string | undefined = undefined;

        if (isItAnURL(query)) {
            if (RadioGarden.getIdFromRadioURL(query) !== null)
            url = query;
            else Messages.replyAlert(interaction, Lang.get('MP_RadioNonValidLink$1', [query]));
        } else {
            const searchURL = await RadioGarden.searchForRadioUrl(query)
            .catch(_ => {
                Messages.replyAlert(interaction, Lang.get('MP_RadioSearchError$1', [query]));
                return null;
            });
            
            if (searchURL !== null) url = `http://radio.garden${searchURL}`;
        }
        
        if (url !== undefined) {
            const track = new Track(interaction.id, query, url, TrackType.Radio, 0.2);

            if (subscription === null) Subscription.create(interaction, track);
            else subscription.tracklist.add(track);
        }
        Messages.stopThinking(thinkingMessage);
    }
};

const isItAnURL = (text:string) => text.match(/^https?:\/\/(?:[a-zA-Z0-9\-]{1,64}\.){0,}(?:[a-zA-Z0-9\-]{2,63})(?:\.(?:xn--)?[a-zA-Z0-9]{2,})(\:[0-9]{1,5})?(?:\/[^\s]*)?$/) !== null;
