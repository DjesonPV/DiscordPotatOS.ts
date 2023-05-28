import * as DiscordJs from 'discord.js';
import {RightClickCommandType} from '../UserCommandType.js';
import Messages from '../../messageAPI/Messages.js';
import Lang from '../../Lang.js';


export const bruh:RightClickCommandType =
{
    description: new DiscordJs.ContextMenuCommandBuilder()
    .setName("BRUH")
    .setType(DiscordJs.ApplicationCommandType.Message)
    ,
    action: async function (interaction)
    {
        if (interaction.channel === null) throw new Error(Lang.get('SC_interactionNotComplete'));

        const message = await (interaction.channel as DiscordJs.BaseGuildTextChannel).messages.fetch(interaction.targetId);

        Messages.noReplyForThisInterraction(interaction);
        
        let noReactionsPresent = true; //Switch to put reactions

        await Promise.all(message.reactions.cache.map(async reaction => 
        // For every reaction on the message
        {
            const reactionUsers = await reaction.users.fetch(); 
            // get the user List
            if (
                (   (reaction.emoji.name === '🅱️') ||
                    (reaction.emoji.name === '🇷') ||
                    (reaction.emoji.name === '🇺') ||
                    (reaction.emoji.name === '🇭')
                ) && reactionUsers.get(reaction.client.user.id) !== undefined
            ) // If that reaction is any B.R.U.H. emoji and it's by the bot
            {
                reaction.users.remove(reaction.client.user);
                noReactionsPresent = false;
            }
        }));

        if (noReactionsPresent)
        message.react('🅱️')
            .then(()=>{
                message.react('🇷');
            })
            .then(()=>{
                message.react('🇺');
            })
            .then(()=>{
                message.react('🇭');
            })
        ;
    }
}
