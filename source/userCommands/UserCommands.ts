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

import { stop } from "./slashCommands/MusicPlayer/stop";
import { play } from "./slashCommands/MusicPlayer/play";
import { pause } from "./slashCommands/MusicPlayer/pause";
import { next } from "./slashCommands/MusicPlayer/next";
import { playsound } from "./slashCommands/MusicPlayer/playsound";
import { radio } from "./slashCommands/MusicPlayer/radio";

export const slashCommands:Array<SlashCommandType> = [
    shifumi,
    ping,
    random,
    math,
    pc, pd, pk, pxtain,
    hide,
    test,
    stop, play, pause, next, playsound, radio
];
/// - - -
///> Right-Click Commands

import { bruh } from "./rightClickCommands/bruh";
import { humour } from "./rightClickCommands/humour";

export const rightClickCommands:Array<RightClickCommandType> = [
    bruh,
    humour,
];
