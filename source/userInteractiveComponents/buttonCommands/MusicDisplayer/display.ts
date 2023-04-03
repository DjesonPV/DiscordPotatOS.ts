import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang';
import Messages from '../../../messageAPI/Messages';
import botPersonality from '../../../modules/botPersonality';
import { CallableButtonCommandType } from '../../userInteractiveCommandType';

import { Subscription } from '../../../voiceAPI/Subscription';

const identifier = 'PotatOSMusicDisplayer'; 

export const display: CallableButtonCommandType =
{
    button: (disable:boolean) => {
        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Button_displayLabel$1", [botPersonality.nickname]))
        .setStyle(DiscordJs.ButtonStyle.Secondary)
        .setEmoji(Lang.get("MP_Button_displayEmoji"))
        .setDisabled(disable)
        ;
    },
    action: function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button Display no guildId");

        const subscription = Subscription.get(guildId);
        if (subscription === null) {
            Messages.delete(interaction.message);
        } else {
            //subscription.; //#### update displayer
            interaction.deferUpdate();
        }
    },
    identifier: identifier
};
