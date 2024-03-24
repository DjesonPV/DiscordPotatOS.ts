import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';
import { CallableButtonCommandType } from '../../userInteractiveCommandType.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';

const identifier = 'PotatOSMusicDisplayerVolumeDown'; 

export const volumeDown: CallableButtonCommandType =
{
    button: (disable:boolean) => {
        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setStyle(DiscordJs.ButtonStyle.Success)
        .setEmoji('🔉')
        .setDisabled(disable)
        ;
    },
    action: function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button VolumeDown no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription !== null && subscription.isMemberConnected(interaction.member)) {
            subscription.volumeFall();
        } 
        interaction.deferUpdate();
    },
    identifier: identifier
};
