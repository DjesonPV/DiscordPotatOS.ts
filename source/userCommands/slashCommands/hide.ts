import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType';
import Messages from '../../messageAPI/Messages';
import Lang from '../../Lang';

import getSecrets from '../../modules/getSecrets';

export const hide:SlashCommandType = 
{
    description: new DiscordJs.SlashCommandBuilder()
        .setName('hide')
        .setDescription(Lang.get('SC_hide_commandDescription'))
    ,
    action : function (interaction)
    {
        if (interaction.guild === null || interaction.member === null)
        throw new Error(Lang.get('SC_interactionNotComplete'));

        const memberVoice = (interaction.member as DiscordJs.GuildMember).voice;

        if (memberVoice?.channel === null)
        throw new Error(Lang.get('SC_notConnectedToVoice'));

        const hiddenChannelId = getSecrets().hiddenVoiceChannelsID?.[interaction.guild.id];
        
        if (hiddenChannelId === undefined)
        throw new Error(Lang.get('SC_hide_noHiddenChannel'));

        memberVoice.setChannel(hiddenChannelId);

        Messages.noReplyForThisInterraction(interaction);
    }
}