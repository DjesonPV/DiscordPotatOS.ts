import * as DiscordJs from 'discord.js';


export function followOnInteraction(
    interaction: DiscordJs.ButtonInteraction | DiscordJs.AnySelectMenuInteraction,
    /**`Message` from which the interaction should be listened */
    message: DiscordJs.Message,
    /** List of `interaction.customId` to listen to */
    identifierList: string[],
    /** example: `interaction.isButton()` */
    typeIdentification: 'button' | 'selectMenuInteraction',
    /** function that will be executed once and only when an interaction with the right id and the right type will be collected */
    callback:(followUpInteraction: DiscordJs.ButtonInteraction | DiscordJs.AnySelectMenuInteraction)=> void
) {
    const collector = message.createMessageComponentCollector({
        filter: (filteredInteraction) => {
            return typeIdentification==='button'?
                filteredInteraction.isButton():
                (typeIdentification==="selectMenuInteraction"?
                filteredInteraction.isStringSelectMenu():
                false
            &&
            (filteredInteraction.user.id === interaction.user.id) &&
            (identifierList.find(id => id === filteredInteraction.customId)) !== undefined);
        },
        max: 1
    });

    collector.once('collect', collectedInteraction => {
        callback(collectedInteraction);
    })


}
