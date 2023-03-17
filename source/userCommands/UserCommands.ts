import {SlashCommandType, RightClickCommandType} from "./UserCommandType";

/// - - -
///> Slash Commands

import { shifumi } from "../userCommands/slashCommands/shifumi";
import { ping } from "../userCommands/slashCommands/ping";
import { random } from "./slashCommands/random";
import { math } from "./slashCommands/mathConstants";
import { pc, pd, pk, pxtain } from "./slashCommands/privateJokes";
import { hide } from "./slashCommands/hide";

import { test } from "./slashCommands/test";

export const slashCommands:Array<SlashCommandType> = [
    shifumi,
    ping,
    random,
    math,
    pc, pd, pk, pxtain,
    hide,
    test,
];
/// - - -
///> Right-Click Commands

import { bruh } from "./rightClickCommands/bruh";
import { humour } from "./rightClickCommands/humour";

export const rightClickCommands:Array<RightClickCommandType> = [
    bruh,
    humour,
];
