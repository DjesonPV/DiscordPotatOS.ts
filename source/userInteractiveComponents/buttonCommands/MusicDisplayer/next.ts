import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang';
import Messages from '../../../messageAPI/Messages';
import botPersonality from '../../../modules/botPersonality';
import { CallableButtonCommandType } from '../../userInteractiveCommandType';

import { Subscription } from '../../../voiceAPI/Subscription';

const identifier = 'PotatOSMusicDisplayerNext'; 

export const next: CallableButtonCommandType =
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
        if (guildId == null) throw new Error("MusicDisplayer Button Next no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription !== null && subscription.isMemberConnected(interaction.member)) {
            subscription.skip();
        } 
        interaction.deferUpdate();
    },
    identifier: identifier
};
