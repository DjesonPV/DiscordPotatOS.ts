import { ButtonCommandType, CallableButtonCommandType, DropdownListCommandType, CallableDropdownListCommandType } from "./userInteractiveCommandType";

/// - - -
///> Button Commands

import { deleteMessage } from "./buttonCommands/deleteMessage";

import { stop } from "./buttonCommands/MusicDisplayer/stop";
import { playpause } from "./buttonCommands/MusicDisplayer/playpause";
import { display } from "./buttonCommands/MusicDisplayer/display";
import { next } from "./buttonCommands/MusicDisplayer/next";

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

import { playlist } from "./dropdownList/MusicDisplayer/playlist";

export const dropdownListCommands: Array<DropdownListCommandType | CallableDropdownListCommandType> = [
    playlist
];

