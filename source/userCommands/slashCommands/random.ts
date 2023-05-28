import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType.js';
import Messages from '../../messageAPI/Messages.js';
import Lang from '../../Lang.js';

export const random: SlashCommandType =
{
    description: new DiscordJs.SlashCommandBuilder()
        .setName(Lang.get('SC_random_commandName'))
        .setDescription(Lang.get('SC_random_commandDescription'))
        .addSubcommand(subcommand => subcommand
            .setName(Lang.get('SC_random_coin_commandName'))
            .setDescription(Lang.get('SC_random_coin_commandDescription'))    
        )
        .addSubcommand(subcommand => subcommand
            .setName(Lang.get('SC_random_cat_commandName'))
            .setDescription(Lang.get('SC_random_cat_commandDescription'))
        )
        .addSubcommand(subcommand => subcommand
            .setName(Lang.get('SC_random_number_commandName'))
            .setDescription(Lang.get('SC_random_number_commandDescription'))
            .addNumberOption(option => option
                .setName(Lang.get('SC_random_number_minimumName'))
                .setDescription(Lang.get('SC_random_number_minimumDescription'))
                .setRequired(true)
            )
            .addNumberOption(option => option
                .setName(Lang.get('SC_random_number_maximumName'))
                .setDescription(Lang.get('SC_random_number_maximumDescription'))
                .setRequired(true)    
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName(Lang.get('SC_random_list_commandName'))
            .setDescription(Lang.get('SC_random_list_commandDescription'))
            .addStringOption(option => option
                .setName(Lang.get('SC_random_list_optionName'))
                .setDescription(Lang.get('SC_random_list_optionDescription'))
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName(Lang.get('SC_random_hash_commandName'))
            .setDescription(Lang.get('SC_random_hash_commandDescription'))
            .addNumberOption(option => option
                .setName(Lang.get('SC_random_hash_optionName'))
                .setDescription(Lang.get('SC_random_hash_optionDescription'))
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
            )
        )
    ,
    action: async function (interaction)
    {
        
        const subcommand = interaction.options.getSubcommand();
        const min = interaction.options.getNumber(Lang.get('SC_random_number_minimumName'));
        const max = interaction.options.getNumber(Lang.get('SC_random_number_maximumName'));
        const input = interaction.options.getString(Lang.get('SC_random_list_optionName'));
        const stringLength = interaction.options.getNumber(Lang.get('SC_random_hash_optionName'));

        //await Messages.defer(interaction);

        switch (subcommand) {
            /// Cat
            case Lang.get('SC_random_cat_commandName'):
                const response = await fetch("http://aws.random.cat/meow");
                const data = await response.json();

                Messages.reply(interaction, `${data.file}`);
            break;
            /// Number
            case Lang.get('SC_random_number_commandName'):
                
                if (min === null || max === null) throw new Error(Lang.get('SC_interactionNotComplete'));

                let result = Math.floor(Math.random() * (max-min)) + min;
                //           whole number    random       range    min

                Messages.reply(interaction, Lang.get('SC_random_number_response$1',[`${result}`]));
            break;
            /// List
            case Lang.get('SC_random_list_commandName'):
                
                if (input === null) throw new Error(Lang.get('SC_interactionNotComplete'));

                const list = input.split(' ');
                const word = list[Math.floor(Math.random()*list.length)];

                Messages.reply(interaction, Lang.get('SC_random_list_response$1', [word]))
            break;
            /// Hash
            case Lang.get('SC_random_hash_commandName'):
                const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                if (stringLength === null) throw new Error(Lang.get('SC_interactionNotComplete'));
                
                const string:string[] = [];
                for (let i = 0; i < stringLength; ++i) string.push(possible.charAt(Math.floor(Math.random() * possible.length)));
                
                Messages.reply(interaction, Lang.get('SC_random_hash_response$1', [string.join("")]));
            break;
            /// Coin
            case Lang.get('SC_random_coin_commandName'):
            default:
                Messages.reply(interaction, Lang.get('SC_random_coin_response$1', [Math.random() < 0.5?Lang.get('SC_random_coin_heads'):Lang.get('SC_random_coin_tails')]));
            break;
        }
    }
};
