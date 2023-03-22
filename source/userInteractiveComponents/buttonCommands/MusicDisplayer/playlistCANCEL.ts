import { ButtonCommandType } from "../../userInteractiveCommandType";
import * as DiscordJs from 'discord.js';
import Lang from "../../../Lang";

const identifier = 'PotatOSMusicPlayerPlaylistDONOTHING';

export const playlistCancel: ButtonCommandType = {
    button: new DiscordJs.ButtonBuilder()
        .setCustomId(identifier)
        .setLabel(Lang.get("MP_Playlist_cancelLabel"))
        .setStyle(DiscordJs.ButtonStyle.Secondary)
        .setEmoji(Lang.get("MP_Playlist_cancelEmoji"))
    ,
    action: ()=>{}, //handled in Playlist DropdownList
    identifier: identifier
};
