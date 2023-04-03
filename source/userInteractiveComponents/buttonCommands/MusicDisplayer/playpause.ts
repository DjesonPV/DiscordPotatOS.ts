import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang';

import { CallableButtonCommandType } from '../../userInteractiveCommandType';

import { Subscription } from '../../../voiceAPI/Subscription';

const identifier = 'PotatOSMusicDisplayerPlaypause'; 

export const playpause: CallableButtonCommandType =
{
    button: (paused:boolean, live:boolean | undefined, disable:boolean) => {

        const [label, emoji] = paused?
            ( live? 
                [Lang.get("MP_Button_ejectLabel"), Lang.get("MP_Button_ejectEmoji")]:
                [Lang.get("MP_Button_pauseLabel"), Lang.get("MP_Button_pauseEmoji")]
            ): (live?
                [Lang.get("MP_Button_startLabel"), Lang.get("MP_Button_startEmoji")]:
                [Lang.get("MP_Button_playLabel"), Lang.get("MP_Button_playEmoji")]
            )
        ;

        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(label)
        .setStyle(DiscordJs.ButtonStyle.Secondary)
        .setEmoji(emoji)
        .setDisabled(disable || (live === undefined));
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
