import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType';
import Lang from '../../../Lang';
import Messages from '../../../messageAPI/Messages';
import { Subscription } from '../../../voiceAPI/Subscription';

export const next: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName('skip')
    .setDescription('Music Player - Skip') //###
    ,
    action: async function (interaction) {
        let subscription = Subscription.get(interaction.guildId);

        if (subscription === null || subscription.isMemberConnected(interaction.member)) {
            Messages.replyNotConnectedToAMusicDisplayer(interaction);
            return;
        }

        const thinkingMessage = await Messages.startThinking(interaction);
                
        subscription.skip();

        Messages.stopThinking(thinkingMessage);
    }
};
