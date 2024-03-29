import { ButtonCommandType } from "../../userInteractiveCommandType.js";
import * as DiscordJs from 'discord.js';
import Lang from "../../../Lang.js";

const identifier = 'PotatOSMusicPlayerPlaylistREMOVE';

export const playlistRemove: ButtonCommandType = {
    button: new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Playlist_removeLabel"))
        .setStyle(DiscordJs.ButtonStyle.Danger)
        .setEmoji(Lang.get("MP_Playlist_removeEmoji"))
    ,
    action: ()=>{}, //handled in Playlist DropdownList
    identifier: identifier
};
