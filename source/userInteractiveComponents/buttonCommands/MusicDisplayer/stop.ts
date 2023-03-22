import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang';
import Messages from '../../../messageAPI/Messages';
import { getAlertMessagePayload } from '../../../messageAPI/Messages';
import botPersonality from '../../../modules/botPersonality';
import { CallableButtonCommandType } from '../../userInteractiveCommandType';

import { Subscription } from '../../../voiceAPI/Subscription';
import { followOnInteraction } from '../../followOnInteraction';

import { stopYes } from './stopYES';
import { stopNo } from './stopNO';

const identifier = 'PotatOSMusicDisplayerStop'; 

export const stop: CallableButtonCommandType =
{
    button: (disable:boolean) => {
        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Button_stopLabel"))
        .setStyle(DiscordJs.ButtonStyle.Danger)
        .setEmoji(Lang.get("MP_Button_stopEmoji"))
        .setDisabled(disable)
        ;
    },
    action: function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button Stop no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription === undefined || !subscription.isMemberConnected(interaction.member)) {
            interaction.deferUpdate();
            return;
        }
        
        Messages.reply(interaction, {
            content: Lang.get("MP_Button_stopQuestion"),
            components: [new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>().addComponents(stopYes.button, stopNo.button)]
        }, 0, false, true);

        followOnInteraction(interaction, [stopYes.identifier, stopNo.identifier], interaction.isButton, (collectedInteraction) => {
            collectedInteraction.deferUpdate();
            if(subscription.isMemberConnected(interaction.member)) { //the user might disconnect between the two button presses
                if (collectedInteraction.customId === stopYes.identifier) subscription.unsubscribe();
                
                Messages.editReply(interaction,{
                    content: Lang.get("MP_Button_stopRoger"),
                    components: []
                },);
            } else {
                const messageOptions = getAlertMessagePayload(Lang.get("MP_failedToExecuteCommand$1", [botPersonality.nickname]));
                messageOptions.content = "";
                messageOptions.components= [];

                Messages.editReply(interaction, messageOptions);
            };
        })
        
        interaction.deferUpdate();
    },
    identifier: identifier
};
