import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType.js';
import Messages from '../../messageAPI/Messages.js';
import Lang from '../../Lang.js';

import getSecrets from '../../modules/getSecrets.js';

export const hide:SlashCommandType = 
{
    description: new DiscordJs.SlashCommandBuilder()
        .setName('hide')
        .setDescription(Lang.get('SC_hide_commandDescription'))
    ,
    action : async function (interaction)
    {
        if (interaction.guild === null || interaction.member === null)
        throw new Error(Lang.get('SC_interactionNotComplete'));

        const memberVoice = (interaction.member as DiscordJs.GuildMember).voice;

        if (memberVoice?.channel === null)
        throw new Error(Lang.get('SC_notConnectedToVoice'));

        const hiddenChannelId = (await getSecrets()).hiddenVoiceChannelsID?.[interaction.guild.id];
        
        if (hiddenChannelId === undefined)
        throw new Error(Lang.get('SC_hide_noHiddenChannel'));

        memberVoice.setChannel(hiddenChannelId);

        Messages.noReplyForThisInterraction(interaction);
    }
}