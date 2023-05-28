import { ButtonCommandType } from "../../userInteractiveCommandType.js";
import * as DiscordJs from 'discord.js';
import Lang from "../../../Lang.js";

const identifier = 'PotatOSMusicDisplayerStopDONOT';

export const stopNo: ButtonCommandType = {
    button: new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Button_stopNoLabel"))
        .setStyle(DiscordJs.ButtonStyle.Secondary)
        .setEmoji(Lang.get("MP_Button_stopNoEmoji"))
    ,
    action: ()=>{}, //handled in Stop button
    identifier: identifier
};
