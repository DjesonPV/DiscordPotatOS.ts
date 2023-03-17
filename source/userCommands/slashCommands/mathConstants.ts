import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType';
import Messages from '../../messageAPI/Messages';
import Lang from '../../Lang';

enum MathChoices
{
    Pi = 'pi',
    Tau = 'tau',
    One = 'one',
    Exp = 'exp',
    Ln = 'ln',
    Phi = 'phi'
}

/// - - -
///> Math Functions

function phi(number:number|null):string
{
    let integer:number = Math.floor(Math.abs(number ?? 1));
    let metallicMean:number = (integer + Math.sqrt(Math.pow(integer, 2) + 4)) / 2;

    return `φ(${integer}) = ${metallicMean}`;
}

function exp(number:number|null):string
{
    let float = number ?? 1;

    return `e^(${float}) = ${Math.exp(float)}`;
}

function ln(number:number|null):string
{
    let float = number ?? 1;

    return `log_e(${float}) = ${Math.log(float)}`;
}

/// - - -
///> Command

export const math:SlashCommandType = 
{
    description: new DiscordJs.SlashCommandBuilder()
        .setName(Lang.get('SC_math_commandName'))
        .setDescription(Lang.get('SC_math_commandDescription'))
        .addStringOption(option => option
            .setName(Lang.get('SC_math_inputName'))
            .setDescription(Lang.get('SC_math_inputDescription'))
            .addChoices(
                { name: Lang.get('SC_math_inputPi'),   value: MathChoices.Pi  },
                { name: Lang.get('SC_math_inputTau'),  value: MathChoices.Tau },
                { name: Lang.get('SC_math_inputExp'),  value: MathChoices.Exp },
                { name: Lang.get('SC_math_inputLogE'), value: MathChoices.Ln  },
                { name: Lang.get('SC_math_inputPhi'),  value: MathChoices.Phi },
                { name: Lang.get('SC_math_inputOne'),  value: MathChoices.One }
            )
            .setRequired(true)
        )
        .addNumberOption(option => option
            .setName(Lang.get('SC_math_optionName'))
            .setDescription(Lang.get('SC_math_optionDescription'))
        )
    ,
    action: function(interaction)
    {
        let result:string|undefined;

        const optionnalNumber = interaction.options.getNumber(Lang.get('SC_math_optionName'))

        switch(interaction.options.getString(Lang.get('SC_math_inputName'))){
            case MathChoices.Pi:
                result = `π = ${Math.PI}`;
              break;
            case MathChoices.Tau:
                result = `τ = ${2 * Math.PI}`;
              break;
            case MathChoices.One:
                result = `${Lang.get('SC_math_inputOne')} = 1`;
              break;
            case MathChoices.Exp:
                result = exp(optionnalNumber);
              break;
            case MathChoices.Ln:
                result = ln(optionnalNumber);
              break;
            case MathChoices.Phi:
                result = phi(optionnalNumber);
            break;
            default:
                throw new Error(Lang.get('SC_math_didNotComputeAValue'))
        }

        Messages.reply(interaction, result);
    }

};
