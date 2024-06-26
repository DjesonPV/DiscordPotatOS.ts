import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';
import Messages from '../../../messageAPI/Messages.js';
import botPersonality from '../../../modules/botPersonality.js';
import { CallableButtonCommandType } from '../../userInteractiveCommandType.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';

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
    action: async function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button Display no guildId");

        const subscription = Subscription.get(guildId);
        if ((subscription === null) || (interaction.message.id !== subscription.musicDisplayer.message?.id)) {
            Messages.delete(interaction.message);
        } else {
            interaction.deferUpdate();
            await subscription.tracklist.now.fetchData();
            subscription.musicDisplayerFullUpdate();
        }
    },
    identifier: identifier
};
