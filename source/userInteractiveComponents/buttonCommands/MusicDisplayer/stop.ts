import * as DiscordJs from 'discord.js';
import Lang from '../../../Lang';
import Messages from '../../../messageAPI/Messages';
import { getAlertMessagePayload } from '../../../messageAPI/Messages';
import botPersonality from '../../../modules/botPersonality';
import { CallableButtonCommandType } from '../../userInteractiveCommandType';

import { Subscription } from '../../../voiceAPI/Subscription';

const identifier = 'PotatOSMusicDisplayerStop'; 

const identifierYES = 'PotatOSMusicDisplayerStopYESSTOPIT';
const identifierNO = 'PotatOSMusicDisplayerStopDONOT';

const buttonCollector = (interaction:DiscordJs.ButtonInteraction) => {
    return interaction.message.createMessageComponentCollector({ 
        filter: (filteredInteraction) => {
            return ( filteredInteraction.isButton() &&
                (filteredInteraction.user.id === interaction.user.id) &&
                ((filteredInteraction.customId === identifierYES) || (filteredInteraction.customId === identifierNO)))
            ;
        },
        max: 1
    });
}

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
        if (subscription !== undefined && subscription.isMemberConnected(interaction.member)) {
        
            Messages.reply(interaction, {
                content: Lang.get("MP_Button_stopQuestion"),
                components: [stopButtonActionRow]
            }, 0, true);

            const collector = buttonCollector(interaction);
            
            collector.once('collect', collectedInteraction => {
                collectedInteraction.deferUpdate();

                if(subscription.isMemberConnected(interaction.member)) { //the user might disconnect between the two button presses
                    if (collectedInteraction.customId === identifierYES) subscription.unsubscribe();
                    
                    Messages.editReplyAlert(interaction,{
                        content: Lang.get("MP_Button_stopRoger"),
                        components: []
                    });
                } else {
                    const messageOptions = getAlertMessagePayload(Lang.get("MP_failedToExecuteCommand$1", [botPersonality.nickname]));
                    messageOptions.content = "";
                    messageOptions.components= [];

                    Messages.editReplyAlert(interaction, messageOptions);
                }
            })
        } 
        interaction.deferUpdate();
    },
    identifier: identifier
};

const buttonYES = new DiscordJs.ButtonBuilder()
    .setCustomId(identifierYES)
    .setLabel(Lang.get("MP_Button_stopYesLabel"))
    .setStyle(DiscordJs.ButtonStyle.Danger)
    .setEmoji(Lang.get("MP_Button_stopYesEmoji"))
;

const buttonNO = new DiscordJs.ButtonBuilder()
    .setCustomId(identifierNO)
    .setLabel(Lang.get("MP_Button_stopNoLabel"))
    .setStyle(DiscordJs.ButtonStyle.Secondary)
    .setEmoji(Lang.get("MP_Button_stopNoEmoji"))
;

const stopButtonActionRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>().addComponents(buttonYES, buttonNO);
