import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';
import { CallableButtonCommandType } from '../../userInteractiveCommandType.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';

const identifier = 'PotatOSMusicVolumeShow'; 

export const volumeShow: CallableButtonCommandType =
{
    button: (volume:undefined|number) => {

        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel( `${Lang.get("MP_Button_volumeLabel")}${volume===undefined?'---':Math.round(volume*10).toFixed(0)}`
        )
        .setStyle(DiscordJs.ButtonStyle.Success)
        ;
    },
    action: function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button VolumeUp no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription !== null && subscription.isMemberConnected(interaction.member)) {
            subscription.volumeReset();
        } 
        interaction.deferUpdate();
    },
    identifier: identifier
};
