import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../../UserCommandType.js';
import Lang from '../../../Lang.js';
import Messages from '../../../messageAPI/Messages.js';
import { Subscription } from '../../../voiceAPI/Subscription.js';

export const pause: SlashCommandType = {
    description: new DiscordJs.SlashCommandBuilder()
    .setName('pause')
    .setDescription('Music Player - Pause') //###
    ,
    action: async function (interaction) {
        let subscription = Subscription.get(interaction.guildId);

        if (subscription === null || !subscription.isMemberConnected(interaction.member)) {
            Messages.replyNotConnectedToAMusicDisplayer(interaction);
            return;
        }

        const thinkingMessage = await Messages.startThinking(interaction);
        
        if (subscription.audioPlayer.paused) subscription.resume();
        else subscription.pause();

        Messages.stopThinking(thinkingMessage);
    }
};
