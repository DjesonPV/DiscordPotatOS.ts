import { ButtonCommandType } from "../../userInteractiveCommandType";
import * as DiscordJs from 'discord.js';
import Lang from "../../../Lang";

const identifier = 'PotatOSMusicPlayerPlaylistPLAYNEXT';

export const playlistNext: ButtonCommandType = {
    button: new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Playlist_nextLabel"))
        .setStyle(DiscordJs.ButtonStyle.Primary)
        .setEmoji(Lang.get("MP_Playlist_nextEmoji"))
    ,
    action: ()=>{}, //handled in Playlist DropdownList
    identifier: identifier
};
