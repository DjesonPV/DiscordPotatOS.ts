import * as DiscordJs from 'discord.js';
import botPersonality from '../modules/botPersonality.js';
import { deleteMessage } from '../userInteractiveComponents/buttonCommands/deleteMessage.js';


type TypicalInteraction = DiscordJs.MessageComponentInteraction | DiscordJs.ChatInputCommandInteraction;

export default class Messages {
    private static botUserID: DiscordJs.Snowflake | undefined;

    static setBotUserID(id: DiscordJs.Snowflake) {// Set-up for Delete check
        if (this.botUserID !== undefined)
            throw new Error(`MessageAPI botUserID is already defined, normal use never call this function more than once`);

        this.botUserID = id;
    }

    static getBotUserID() {
        return Messages.botUserID;
    }

    static async delete(message: DiscordJs.Message) {
        if (this.botUserID === undefined)
            throw new Error(`MessageAPI botUserID undefined`);

        if (message.author.id !== this.botUserID || !message.deletable)
            return;

        try {
            await message.delete();
        } catch (error:any) {
            console.warn(error); 
        }
    }

    static async noReplyForThisInterraction(
        interaction: DiscordJs.ChatInputCommandInteraction | DiscordJs.ContextMenuCommandInteraction
    ) {
        interaction.deferReply({ withResponse: true })
            .then((callback) => {
                if (callback.resource?.message)
                Messages.delete(callback.resource?.message);
            });
    }

    /// - - -
    ///> PRINT ON CHANNEL

    static async print(
        channel: Exclude<DiscordJs.TextBasedChannel,DiscordJs.PartialGroupDMChannel>,
        messageOptions: DiscordJs.BaseMessageOptions | string,
        duration: number = 0,
        isAlert: boolean = false
    ) {
        return await channel.send(getMessagePayload(messageOptions, duration, isAlert))
            .then((message) => {
                if (duration > 0) {
                    deleteAfterDuration(message, duration);
                    return null;
                } else return message;
            })
        ;
    }

    /// - - -
    ///> REPLY TO INTERRACTION

    static async replyAlert(
        interaction: TypicalInteraction,
        messageOptions: DiscordJs.InteractionReplyOptions | string
    ) {

        const messagePayload: DiscordJs.InteractionReplyOptions = getMessagePayload(messageOptions, 0, true);
        messagePayload.ephemeral = true;

        if (interaction.replied)
            return interaction.followUp(messagePayload);
        else if (interaction.deferred) {
            await interaction.followUp('Alert!');
            return interaction.followUp(messagePayload);
        }
        else return (await interaction.reply({...messagePayload, withResponse: true})).resource?.message;
    }

    static async replyEphemeral(
        interaction: TypicalInteraction,
        messageOptions: DiscordJs.InteractionReplyOptions | string,
        newReply: boolean = false
    ) {

        if (typeof (messageOptions) === "string") messageOptions = { content: messageOptions }

        messageOptions.flags = 'Ephemeral';

        if (interaction.replied) {
            if (newReply) return interaction.followUp(messageOptions);
            else return interaction.editReply(messageOptions as DiscordJs.InteractionEditReplyOptions);
        } else if (interaction.deferred) {
            return interaction.followUp(messageOptions);
        }
        else return (await interaction.reply({...messageOptions, withResponse: true})).resource?.message;
    }

    static async reply(
        interaction: TypicalInteraction,
        messageOptions: DiscordJs.InteractionReplyOptions | string,
        duration: number = 0,
    ) {

        const messagePayload: DiscordJs.InteractionReplyOptions = getMessagePayload(messageOptions, duration, false);

        messagePayload.flags = undefined;

        if (interaction.replied) {
            return await interaction.followUp(messagePayload)
                .then((message: DiscordJs.Message) => { if (duration > 0) {
                    deleteAfterDuration(message, duration);
                    return null;
                } else return message });
        }
        else if (interaction.deferred) {
            return await interaction.editReply(messagePayload as DiscordJs.InteractionEditReplyOptions)
                .then((message: DiscordJs.Message) => { if (duration > 0) {
                    deleteAfterDuration(message, duration);
                    return null;
                } else return message});
        }
        else {
            return await interaction.reply({ ...messagePayload, withResponse: true })
                .then((callback) => { 
                    const message = callback.resource?.message;
                    if (duration > 0) {
                            if(message) deleteAfterDuration(message, duration);
                        return null;
                    } else return message});
        }
    }

    static async defer(interaction: TypicalInteraction) {
        await interaction.deferReply();
    }

    static update(interaction: DiscordJs.MessageComponentInteraction, options:string | DiscordJs.MessagePayload | DiscordJs.InteractionUpdateOptions) {
        return interaction.update(options);
    }

    static async edit(message: DiscordJs.Message, options:string | DiscordJs.MessagePayload | DiscordJs.MessageEditOptions) {
        return await message.edit(options);
    }

    static replyNotConnectedToAMusicDisplayer(interaction: TypicalInteraction) {
        Messages.replyAlert(interaction, "Your not connected to a Music Displayer"); /// ####
    }

    static async startThinking(interaction: TypicalInteraction) {
        return (await interaction.deferReply({withResponse: true})).resource?.message;
    }

    static stopThinking(message: DiscordJs.Message<boolean> | undefined | null) {
        if (message === undefined) return;
        if (message === null) return;
        Messages.delete(message);
    }

}

export function getAlertMessagePayload(text: string) {
    return getMessagePayload(text, 0, true);
}

/// - - -
///> MESSAGE FORMATTING

function getMessagePayload(
    messageOptions: DiscordJs.BaseMessageOptions | string,
    duration: number,
    isAlert: boolean
): DiscordJs.BaseMessageOptions {

    duration = Math.min(180, duration);

    let alertEmbed: DiscordJs.EmbedBuilder | undefined;

    if (isAlert) {
        let alertContent: string;

        if (typeof (messageOptions) === 'string') {
            alertContent = messageOptions;
            messageOptions = {};
        }
        else alertContent = `Alert`; //##LANG 

        alertEmbed = new DiscordJs.EmbedBuilder()
            .setColor(botPersonality.errorColor as DiscordJs.ColorResolvable)
            .setAuthor({
                iconURL: "https://cdn.discordapp.com/attachments/329613279204999170/970413892792623204/Error_icon.png",
                name: alertContent.substring(0, 256)
            })

        if (messageOptions.embeds === undefined)
            messageOptions.embeds = [alertEmbed];
        else messageOptions.embeds = [alertEmbed, ...messageOptions.embeds];

    } else {
        if (typeof (messageOptions) === 'string') {
            messageOptions = {
                content: messageOptions
            };
        }
    }

    const button = deleteMessage.button(duration);

    const durationButtonRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>().addComponents(button);

    if (duration > 0) {
        if (messageOptions.components === undefined)
            messageOptions.components = [durationButtonRow];
        else messageOptions.components = [durationButtonRow, ...messageOptions.components];

    }

    return messageOptions;
}

/// - - -
///> DELETE AFTER DURATION

function deleteAfterDuration(
    message: DiscordJs.Message,
    duration: number
): void {
    if (duration > 0)
        setTimeout(
            () => {
                Messages.delete(message).catch((error) => {
                    if (error.code !== 10008)
                        throw error;
                });
            },
            duration * 1000
        );
}
