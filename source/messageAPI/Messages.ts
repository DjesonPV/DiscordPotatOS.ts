import * as DiscordJs from 'discord.js';
import botPersonality from '../modules/botPersonality';
import { deleteMessage } from '../userInteractiveComponents/buttonCommands/deleteMessage';

export default class Messages
{
    private static botUserID:DiscordJs.Snowflake|undefined;
    
    static setBotUserID(id:DiscordJs.Snowflake)
    // Set-up for Delete check
    {
        if (this.botUserID !== undefined)
        throw new Error(`MessageAPI botUserID is already defined, normal use never call this function more than once`);
        
        this.botUserID = id;
    }

    static getBotUserID(){
        return Messages.botUserID;
    }

    static async delete(message:DiscordJs.Message)
    {
        if (this.botUserID === undefined)
        throw new Error(`MessageAPI botUserID undefined`);

        if (message.author.id !== this.botUserID || !message.deletable) 
        return;

        return message.delete();
    }

    static async noReplyForThisInterraction(
        interaction:DiscordJs.ChatInputCommandInteraction|DiscordJs.ContextMenuCommandInteraction
    )
    {
        interaction.deferReply({fetchReply: true})
        .then((message) => {
            Messages.delete(message);
        });
    }

    /// - - -
    ///> PRINT ON CHANNEL

    static async print(
        channel:DiscordJs.BaseGuildTextChannel, 
        messageOptions:DiscordJs.BaseMessageOptions | string, 
        duration:number = 0,
        isAlert:boolean = false
    ):Promise<void>
    {
        
        channel.send(getMessagePayload(messageOptions, duration, isAlert))
        .then((message) => 
        {
            deleteAfterDuration(message, duration);
        });
    }

    /// - - -
    ///> REPLY TO INTERRACTION

    static async replyAlert(
        interaction:DiscordJs.MessageComponentInteraction | DiscordJs.ChatInputCommandInteraction,
        messageOptions:DiscordJs.InteractionReplyOptions | string
    ) {

        const messagePayload: DiscordJs.InteractionReplyOptions = getMessagePayload(messageOptions, 0, true);
        messagePayload.ephemeral = true;

        if (interaction.replied)
            await interaction.followUp(messagePayload);
        else if (interaction.deferred)
        {
            await interaction.followUp('Alert!');
            await interaction.followUp(messagePayload);
        }
        else await interaction.reply(messagePayload);

    }

    static async replyEphemeral(
        interaction:DiscordJs.MessageComponentInteraction | DiscordJs.ChatInputCommandInteraction,
        messageOptions:DiscordJs.InteractionReplyOptions | string,
        newReply:boolean = false
    ) {

        if (typeof(messageOptions) === "string") messageOptions = {content: messageOptions}

        messageOptions.ephemeral = true;

        if (interaction.replied) {
            if (newReply) interaction.followUp(messageOptions);
            else interaction.editReply(messageOptions);
        } else if (interaction.deferred)
        {
            interaction.followUp(messageOptions);
        }
        
        else interaction.reply(messageOptions);
    }
  
    static async reply(
        interaction:DiscordJs.MessageComponentInteraction | DiscordJs.ChatInputCommandInteraction,
        messageOptions:DiscordJs.InteractionReplyOptions | string,
        duration:number = 0,
        isAlert:boolean = false,
        isEphemeral: boolean = false,
    ):Promise<void>
    {

        if (isAlert || isEphemeral) duration = 0;
        // Because it will be ephemeral

        const messagePayload:DiscordJs.InteractionReplyOptions = getMessagePayload(messageOptions, duration, isAlert);

        if (isAlert || isEphemeral)
        {
            messagePayload.ephemeral = true;

            if (interaction.replied)
                await interaction.followUp(messagePayload);
            else if (interaction.deferred)
            {
                await interaction.followUp('Alert!');
                await interaction.followUp(messagePayload);
            }
            else await interaction.reply(messagePayload);
        }
        else 
        {
            if (interaction.replied)
            {
                await interaction.followUp(messagePayload)
                .then((message:DiscordJs.Message) =>{ if (duration>0) deleteAfterDuration(message, duration); });
            }
            else if (interaction.deferred)
            {
                await Messages.editReply(interaction, messagePayload)
                .then((message:DiscordJs.Message) =>{ if (duration>0) deleteAfterDuration(message, duration); });
            }
            else
            {
                await interaction.reply({...messagePayload, fetchReply:true})
                .then((message:DiscordJs.Message) =>{ if (duration>0) deleteAfterDuration(message, duration); });
            }
        }
    }

    static editReply(interaction:DiscordJs.MessageComponentInteraction | DiscordJs.ChatInputCommandInteraction, messageOptions:DiscordJs.BaseMessageOptions) {
        return interaction.editReply(messageOptions);
    }

    static async defer(interaction:DiscordJs.MessageComponentInteraction | DiscordJs.ChatInputCommandInteraction)
    {
        await interaction.deferReply();
    };
}

export function getAlertMessagePayload(text:string) {
    return getMessagePayload(text, 0, true);
}

/// - - -
///> MESSAGE FORMATTING

function getMessagePayload(
    messageOptions:DiscordJs.BaseMessageOptions | string,
    duration:number,
    isAlert:boolean
):DiscordJs.BaseMessageOptions
{

    duration = Math.min(180, duration);

    let alertEmbed:DiscordJs.EmbedBuilder | undefined;

    if (isAlert)
    {
        let alertContent:string;

        if(typeof(messageOptions) === 'string') {
            alertContent = messageOptions;
            messageOptions = {};
        }
        else alertContent = `Alert`; //##LANG 

        alertEmbed = new DiscordJs.EmbedBuilder()
        .setColor(botPersonality.errorColor as DiscordJs.ColorResolvable)
        .setAuthor({
            iconURL: "https://cdn.discordapp.com/attachments/329613279204999170/970413892792623204/Error_icon.png",
            name: alertContent.substring(0,256)
        })

        if (messageOptions.embeds === undefined) 
            messageOptions.embeds = [alertEmbed];
        else messageOptions.embeds.unshift(alertEmbed);

    } else {
        if (typeof(messageOptions) === 'string')
        {
            messageOptions = {
                content: messageOptions
            };
        }
    }

    const button = deleteMessage.button(duration);

    const durationButtonRow = new DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>().addComponents(button);

    if (duration > 0)
    {
        if (messageOptions.components === undefined)
            messageOptions.components = [durationButtonRow];
        else messageOptions.components.unshift(durationButtonRow);
       
    }

    return messageOptions;
}

/// - - -
///> DELETE AFTER DURATION

function deleteAfterDuration(
    message:DiscordJs.Message,
    duration:number
):void
{
    if (duration > 0)
    setTimeout(
        () => { Messages.delete(message).catch((error)=>{
            if (error.code !== 10008)
            throw error;
        });},
        duration*1000
    );
}
