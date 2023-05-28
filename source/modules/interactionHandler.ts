import * as DiscordJs from 'discord.js';
import Messages from '../messageAPI/Messages.js';

import {slashCommands, rightClickCommands} from '../userCommands/UserCommands.js';
import { buttonCommands, dropdownListCommands } from '../userInteractiveComponents/userInteractiveCommands.js';

export default async function interactionHandler(interaction:DiscordJs.BaseInteraction):Promise<void>
{
    try
    {
        if (interaction.isChatInputCommand())
        // (/) Commands
        {
            const command = slashCommands.find(command => command.description.name === interaction.commandName);
            if (command !== undefined) await command.action(interaction);
        }
        else if (interaction.isContextMenuCommand())
        // Right-click Commmands
        {
            const command = rightClickCommands.find(command => command.description.name === interaction.commandName);
            if (command !== undefined) await command.action(interaction);
        }
        else if (
            !interaction.isMessageComponent() || 
            (interaction.message.author.id === Messages.getBotUserID())
        )
        // Message from Bot
        {
            if (interaction.isButton())
            // Message Button
            {
                const command = buttonCommands.find(command => command.identifier === interaction.customId);
                if (command !== undefined) await command.action(interaction);
            }
            else if (interaction.isStringSelectMenu())
            // Message Dropdown List
            {
                const command = dropdownListCommands.find(command => command.identifier === interaction.customId);
                if (command !== undefined) await command.action(interaction);
            }
        }
    }
    catch (error)
    {
        console.error(error);

        if (typeof(error) === 'string')
        Messages.replyAlert(interaction as DiscordJs.MessageComponentInteraction | DiscordJs.ChatInputCommandInteraction, error);
    }
    
}
