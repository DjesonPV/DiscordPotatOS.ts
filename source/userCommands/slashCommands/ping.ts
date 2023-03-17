import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType';
import Messages from '../../messageAPI/Messages';
import Lang from '../../Lang';

export const ping:SlashCommandType = 
{
    description: new DiscordJs.SlashCommandBuilder()
        .setName('ping')
        .setDescription(Lang.get("SC_ping_commandDescription"))
    ,
    action: function (interaction)
    {
        Messages.noReplyForThisInterraction(interaction);
        interaction.user.send("***pong***");
    }
}
