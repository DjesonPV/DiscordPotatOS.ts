import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType.js';
import Lang from '../../../Lang.js';
import Messages from '../../../messageAPI/Messages.js';
import { Subscription } from '../../../voiceAPI/Subscription.js';
import botPersonality from '../../../modules/botPersonality.js';

export const next: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName(Lang.get('SC_next_commandName'))
    .setDescription(Lang.get('SC_next_commandDescription$1', [botPersonality.nickname]))
    ,
    action: async function (interaction) {
        let subscription = Subscription.get(interaction.guildId);

        if (subscription === null || !subscription.isMemberConnected(interaction.member)) {
            Messages.replyNotConnectedToAMusicDisplayer(interaction);
            return;
        }

        const thinkingMessage = await Messages.startThinking(interaction);
                
        subscription.skip();

        Messages.stopThinking(thinkingMessage);
    }
};
