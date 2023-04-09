import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType';
import Lang from '../../../Lang';
import { Subscription } from '../../../voiceAPI/Subscription';
import Messages from '../../../messageAPI/Messages';
import * as RadioGarden from "../../../modules/RadioGarden";

import { Track, TrackType } from '../../../voiceAPI/Track';

export const radio: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName('radio')
    .setDescription("Music Player - Radio") // #####
    .addStringOption(option => option
        .setName('query')
        .setDescription("url or sarch terms")
        .setRequired(true)  
    )
    ,
    action: async function (interaction) {
        const thinkingMessage = await Messages.startThinking(interaction);

        const query = interaction.options.getString('query');

        if (query === null) throw new Error ("PlaySound without key")

        let subscription = Subscription.get(interaction.guildId);

        let url: string | undefined = undefined;

        if (isItAnURL(query)) {
            if (RadioGarden.getIdFromRadioURL(query) !== null)
            url = query;
            else Messages.replyAlert(interaction,"Wrong URL"); //####
        } else {
            const searchURL = await RadioGarden.searchForRadioUrl(query)
            .catch(_ => {
                Messages.replyAlert(interaction, "Didn't find nothing"); //#####
                return null;
            });
            
            if (searchURL !== null) url = `http://radio.garden${searchURL}`;
        }
        
        if (url !== undefined) {
            const track = new Track(interaction.id, query, url, TrackType.Radio, 0.20);

            if (subscription === null) Subscription.create(interaction, track);
            else subscription.tracklist.add(track);
        }
        Messages.stopThinking(thinkingMessage);
    }
};

const isItAnURL = (text:string) => text.match(/^https?:\/\/(?:[a-zA-Z0-9\-]{1,64}\.){0,}(?:[a-zA-Z0-9\-]{2,63})(?:\.(?:xn--)?[a-zA-Z0-9]{2,})(\:[0-9]{1,5})?(?:\/[^\s]*)?$/) !== null;
