import { ButtonCommandType, CallableButtonCommandType, DropdownListCommandType } from "./userInteractiveCommandType";

/// - - -
///> Button Commands

import { deleteMessage } from "./buttonCommands/deleteMessage";

export const buttonCommands:Array<ButtonCommandType|CallableButtonCommandType> = [
    deleteMessage,
];


/// - - -
///> Dropdown List Commands

export const dropdownListCommands:Array<DropdownListCommandType> = [

];

