import { ButtonCommandType } from "../../userInteractiveCommandType";
import * as DiscordJs from 'discord.js';
import Lang from "../../../Lang";

const identifier = 'PotatOSMusicDisplayerStopYESSTOPIT';

export const stopYes: ButtonCommandType = {
    button: new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Button_stopYesLabel"))
        .setStyle(DiscordJs.ButtonStyle.Danger)
        .setEmoji(Lang.get("MP_Button_stopYesEmoji"))
    ,
    action: ()=>{}, //handled in Stop button
    identifier: identifier
};
