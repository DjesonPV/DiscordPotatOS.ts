import * as DiscordJs from 'discord.js';

export type ButtonCommandType = {
    button: DiscordJs.ButtonBuilder,
    action:(interraction:DiscordJs.ButtonInteraction) => void | Promise<void>,
    identifier:string
}

export type CallableButtonCommandType = Omit<ButtonCommandType, 'button'> & {button: (...args:any) => DiscordJs.ButtonBuilder}

export type DropdownListCommandType = {
    dropdownList: DiscordJs.StringSelectMenuBuilder,
    action:(interraction:DiscordJs.StringSelectMenuInteraction) => void | Promise<void>,
    identifier:string
}

export type CallableDropdownListCommandType = Omit<DropdownListCommandType, 'dropdownList'> & {dropdownList: (...args:any) => DiscordJs.StringSelectMenuBuilder}
