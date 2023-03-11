import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType';
import Messages from '../../messageAPI/Messages';
import Lang from '../../Lang';


export const test:SlashCommandType = 
{
    description: new DiscordJs.SlashCommandBuilder()
        .setName('test')
        .setDescription("La famille ici ca test un max")
    ,
    action: function (interaction)
    {
        Messages.reply(interaction, "test", 10);
    }
}