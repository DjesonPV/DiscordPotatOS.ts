import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';
import Messages from '../../../messageAPI/Messages.js';
import botPersonality from '../../../modules/botPersonality.js';
import { CallableButtonCommandType } from '../../userInteractiveCommandType.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';

const identifier = 'PotatOSMusicDisplayerNext'; 

export const next: CallableButtonCommandType =
{
    button: (disable:boolean, last:boolean, hasAudioFailed:boolean) => {
        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel( hasAudioFailed
            ? (last?Lang.get("MP_Button_autoLastLabel"):Lang.get("MP_Button_autoNextLabel"))
            : (last?Lang.get("MP_Button_lastLabel"):Lang.get("MP_Button_nextLabel"))
        )
        .setStyle(last?DiscordJs.ButtonStyle.Danger:DiscordJs.ButtonStyle.Primary)
        .setEmoji( hasAudioFailed
            ? (last?Lang.get("MP_Button_autoLastEmoji"):Lang.get("MP_Button_autoNextEmoji"))
            : (last?Lang.get("MP_Button_lastEmoji"):Lang.get("MP_Button_nextEmoji"))
        )
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
