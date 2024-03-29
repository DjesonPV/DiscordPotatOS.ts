import * as DiscordJs from 'discord.js';
import Messages from "../../messageAPI/Messages.js"
import Lang from '../../Lang.js';

import { CallableButtonCommandType } from '../userInteractiveCommandType.js';

const identifier = 'PotatOSDeleteMessage'; 

export const deleteMessage:CallableButtonCommandType =
{
    button: (duration:number) => {
        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get('BT_delete_label$1', [`${duration}`]))
        .setStyle(DiscordJs.ButtonStyle.Secondary)
        .setEmoji('🚮');
    },
    action: function (interaction)
    {
        Messages.delete(interaction.message);
    },
    identifier: identifier
};
