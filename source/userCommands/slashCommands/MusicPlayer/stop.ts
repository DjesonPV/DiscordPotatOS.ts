import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType';
import Lang from '../../../Lang';
import Messages from '../../../messageAPI/Messages';
import { Subscription } from '../../../voiceAPI/Subscription';

export const stop: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName('stop')
    .setDescription('Music Player - Stop') //###
    ,
    action: async function (interaction) {
        let subscription = Subscription.get(interaction.guildId);

        if (subscription === null || subscription.isMemberConnected(interaction.member)) {
            Messages.replyNotConnectedToAMusicDisplayer(interaction);
            return;
        }

        const thinkingMessage = await Messages.startThinking(interaction);
        
        subscription.unsubscribe();
        
        Messages.stopThinking(thinkingMessage);
    }
};
