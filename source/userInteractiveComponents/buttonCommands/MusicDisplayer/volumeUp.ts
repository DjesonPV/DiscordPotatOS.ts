import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';
import { CallableButtonCommandType } from '../../userInteractiveCommandType.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';

const identifier = 'PotatOSMusicDisplayerVolumeUp'; 

export const volumeUp: CallableButtonCommandType =
{
    button: (disable:boolean) => {
        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setStyle(DiscordJs.ButtonStyle.Success)
        .setEmoji('🔊')
        .setDisabled(disable)
        ;
    },
    action: function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button VolumeUp no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription !== null && subscription.isMemberConnected(interaction.member)) {
            subscription.volumeRise();
        } 
        interaction.deferUpdate();
    },
    identifier: identifier
};
