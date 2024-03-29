import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang.js';
import Messages from '../../../messageAPI/Messages.js';
import { getAlertMessagePayload } from '../../../messageAPI/Messages.js';
import botPersonality from '../../../modules/botPersonality.js';
import { CallableButtonCommandType } from '../../userInteractiveCommandType.js';

import { Subscription } from '../../../voiceAPI/Subscription.js';
import { followOnInteraction } from '../../followOnInteraction.js';

import { stopYes } from './stopYES.js';
import { stopNo } from './stopNO.js';

const identifier = 'PotatOSMusicDisplayerStop'; 

export const stop: CallableButtonCommandType =
{
    button: (disable:boolean) => {
        return new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Button_stopLabel"))
        .setStyle(disable?DiscordJs.ButtonStyle.Secondary:DiscordJs.ButtonStyle.Danger)
        .setEmoji(Lang.get("MP_Button_stopEmoji"))
        .setDisabled(disable)
        ;
    },
    action: async function (interaction)
    {
        const guildId = interaction.guildId;
        if (guildId == null) throw new Error("MusicDisplayer Button Stop no guildId");
        const subscription = Subscription.get(guildId);
        if (subscription === null || !subscription.isMemberConnected(interaction.member)) {
            interaction.deferUpdate();
            return;
        }
        
        const message = await Messages.replyEphemeral(interaction, {
            content: Lang.get("MP_Button_stopQuestion"),
            components: [new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>().addComponents(stopYes.button, stopNo.button)]
        });

        followOnInteraction(interaction, message, [stopYes.identifier, stopNo.identifier], 'button', (collectedInteraction) => {
            collectedInteraction.deferUpdate();
            if(subscription.isMemberConnected(collectedInteraction.member)) { //the user might disconnect between the two button presses
                if (collectedInteraction.customId === stopYes.identifier) subscription.unsubscribe();
                
                Messages.replyEphemeral(interaction,{
                    content: Lang.get("MP_Button_stopRoger"),
                    components: []
                },);
            } else {
                const messageOptions = getAlertMessagePayload(Lang.get("MP_failedToExecuteCommand$1", [botPersonality.nickname]));
                messageOptions.content = "";
                messageOptions.components= [];

                Messages.update(interaction, messageOptions);
            };
        })
        
    },
    identifier: identifier
};
