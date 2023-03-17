import * as DiscordJs from 'discord.js';

export type SlashCommandType = {
    description:DiscordJs.SlashCommandBuilder | SpecialSlashCommandBuilder,
    action:(interraction:DiscordJs.ChatInputCommandInteraction) => void | Promise<void>
};

/**
 * Why did you do this Discord
 */
type SpecialSlashCommandBuilder = Omit<DiscordJs.SlashCommandBuilder, 
"addSubcommand" | "addSubcommandGroup" |
"addBooleanOption" | "addUserOption" | "addChannelOption" | "addRoleOption" | "addAttachmentOption" | "addMentionableOption" | "addStringOption" | "addIntegerOption" | "addNumberOption"

>;


export type RightClickCommandType = {
    description:DiscordJs.ContextMenuCommandBuilder,
    action:(interraction:DiscordJs.ContextMenuCommandInteraction) => void | Promise<void>
};
