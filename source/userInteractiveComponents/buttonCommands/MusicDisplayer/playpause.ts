import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';

import { CallableButtonCommandType } from '../../userInteractiveCommandType.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';

const identifier = 'PotatOSMusicDisplayerPlaypause'; 

export const playpause: CallableButtonCommandType =
{
    button: (paused:boolean, live:boolean | undefined, disable:boolean, ready:boolean) => {

        const [label, emoji] = !ready? [Lang.get("MP_Button_loadLabel"), Lang.get("MP_Button_loadEmoji")] : (!paused?
            ( live? 
                [Lang.get("MP_Button_ejectLabel"), Lang.get("MP_Button_ejectEmoji")]:
                [Lang.get("MP_Button_pauseLabel"), Lang.get("MP_Button_pauseEmoji")]
            ): (live?
                [Lang.get("MP_Button_startLabel"), Lang.get("MP_Button_startEmoji")]:
                [Lang.get("MP_Button_playLabel"), Lang.get("MP_Button_playEmoji")]
            ))
        ;

        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(label)
        .setStyle(paused && ready ?DiscordJs.ButtonStyle.Success:DiscordJs.ButtonStyle.Secondary)
        .setEmoji(emoji)
        .setDisabled(disable || (live === undefined) || !ready);
    },
    action: function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button PlayPause no guildId");

        const subscription = Subscription.get(guildId);
        if (subscription === null) {
            interaction.deferUpdate();
            return;
        }

        if(subscription.isMemberConnected(interaction.member)){
            if (subscription.audioPlayer.paused) subscription.resume();
            else subscription.pause();
        }
        interaction.deferUpdate();

    },
    identifier: identifier
};
