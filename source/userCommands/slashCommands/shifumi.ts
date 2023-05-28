import * as DiscordJs from 'discord.js';
import {SlashCommandType} from '../UserCommandType.js';
import Messages from '../../messageAPI/Messages.js';
import Lang from '../../Lang.js';

const emojisMove = [":fist:", ":raised_hand:", ":v:"];
const emojisResult = [":arrow_right:",":regional_indicator_i:",":arrow_left:"];

const sentencesDefeat = 
[
    Lang.get('SC_shifumi_defeat1'),
    Lang.get('SC_shifumi_defeat2'),
    Lang.get('SC_shifumi_defeat3'),
];

const sentencesDraw =
[
    Lang.get('SC_shifumi_draw1'),
    Lang.get('SC_shifumi_draw2'),
    Lang.get('SC_shifumi_draw3'),
];

const sentencesVictory =
[
    Lang.get('SC_shifumi_victory1'),
    Lang.get('SC_shifumi_victory2'),
    Lang.get('SC_shifumi_victory3'),
];

const snReply = [
    sentencesDefeat,
    sentencesDraw,
    sentencesVictory
];

/** Works with (2*Human)+Bot : 0  = bot defeat, 1 = draw, 2 = bot victory */
const tableMath = [ 1, 2, 0, 0, 1, 2, 2, 0, 1];

const playOptionName = Lang.get('SC_shifumi_optionName');

export const shifumi:SlashCommandType = 
{
    description: new DiscordJs.SlashCommandBuilder()
        .setName(Lang.get('SC_shifumi_commandName'))
        .setDescription(Lang.get('SC_shifumi_commandDescription'))
        .addIntegerOption(option => option
            .setName(playOptionName)
            .setDescription(Lang.get('SC_shifumi_optionDescription'))
            .setRequired(true)
            .addChoices(
                { name: Lang.get('SC_shifumi_optionRock'), value: 0 },
                { name: Lang.get('SC_shifumi_optionPaper'), value: 1 },
                { name: Lang.get('SC_shifumi_optionScissors'), value: 2}
            )
            .setMinValue(0)
            .setMaxValue(2)   
        )
    ,
    action: function (interaction)
    {
        const playerMove = interaction.options.getInteger(playOptionName);
        if (playerMove === null) throw new Error(Lang.get('SC_interactionNotComplete'));
    
        // 0, 1, 2
        let botMove     = Math.floor(Math.random()*3);  // Bot Move
        let botResponse = Math.floor(Math.random()*3);  // Repartee
    
        let result = tableMath[(3*playerMove+botMove)]; // Evaluate win
    
        Messages.reply(interaction, `:bust_in_silhouette: ${emojisMove[playerMove]}   ${emojisResult[result]}   ${emojisMove[botMove]} ${Lang.get('SC_shifumi_emoji')}  ${snReply[result][botResponse]}`);
    }
}