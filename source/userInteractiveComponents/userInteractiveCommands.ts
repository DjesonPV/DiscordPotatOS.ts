import { ButtonCommandType, CallableButtonCommandType, DropdownListCommandType, CallableDropdownListCommandType } from "./userInteractiveCommandType.js";

/// - - -
///> Button Commands

import { deleteMessage } from "./buttonCommands/deleteMessage.js";

import { stop } from "./buttonCommands/MusicDisplayer/stop.js";
import { playpause } from "./buttonCommands/MusicDisplayer/playpause.js";
import { display } from "./buttonCommands/MusicDisplayer/display.js";
import { next } from "./buttonCommands/MusicDisplayer/next.js";

// no need to import stopNo, stopYes, playlistCancel, playlistNext and playlistRemove
// because they are handled in specific cases rather than in the global bot

export const buttonCommands: Array<ButtonCommandType | CallableButtonCommandType> = [
    deleteMessage,
    display,
    playpause,
    next,
    stop
];


/// - - -
///> Dropdown List Commands

import { playlist } from "./dropdownList/MusicDisplayer/playlist.js";

export const dropdownListCommands: Array<DropdownListCommandType | CallableDropdownListCommandType> = [
    playlist
];

