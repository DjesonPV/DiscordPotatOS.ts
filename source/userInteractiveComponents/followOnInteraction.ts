import * as DiscordJs from 'discord.js';


export function followOnInteraction(
    interaction: DiscordJs.ButtonInteraction | DiscordJs.AnySelectMenuInteraction,
    /** List of `interaction.customId` to listen to */
    identifierList: string[],
    /** example: `interaction.isButton()` */
    typeIdentification: () => boolean,
    /** function that will be executed once and only when an interaction with the right id and the right type will be collected */
    callback:(followUpInteraction: DiscordJs.ButtonInteraction | DiscordJs.AnySelectMenuInteraction)=> void
) {
    const collector = interaction.message.createMessageComponentCollector({
        filter: (filteredInteraction) => {
            return (typeIdentification() &&
            (filteredInteraction.user.id === interaction.user.id) &&
            (identifierList.find(id => id === filteredInteraction.customId)) !== undefined);
        },
        max: 1
    });

    collector.once('collect', collectedInteraction => {
        callback(collectedInteraction);
    })


}
