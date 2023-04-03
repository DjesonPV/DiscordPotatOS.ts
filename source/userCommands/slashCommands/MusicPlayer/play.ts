import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType';
import Lang from '../../../Lang';
import { Subscription } from '../../../voiceAPI/Subscription';

export const play: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    ,
    action: function (interaction) {

        const query = interaction.options.getString('query');

        let subscription = Subscription.get(interaction.guildId);

        if (query === null && subscription !== null) {
            if (subscription.audioPlayer.paused) subscription.resume();
            return;
        }

        if (query === null) return;

        ####


    }
};
