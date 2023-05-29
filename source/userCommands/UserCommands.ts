import {SlashCommandType, RightClickCommandType} from "./UserCommandType.js";

/// - - -
///> Slash Commands

import { shifumi } from "../userCommands/slashCommands/shifumi.js";
import { ping } from "../userCommands/slashCommands/ping.js";
import { random } from "./slashCommands/random.js";
import { math } from "./slashCommands/mathConstants.js";
import { pc, pd, pk, pxtain } from "./slashCommands/privateJokes.js";
import { hide } from "./slashCommands/hide.js";

import { test } from "./slashCommands/test.js";

import { stop } from "./slashCommands/MusicPlayer/stop.js";
import { playtrack } from "./slashCommands/MusicPlayer/playtrack.js";
import { pause } from "./slashCommands/MusicPlayer/pause.js";
import { next } from "./slashCommands/MusicPlayer/next.js";
import { playsound } from "./slashCommands/MusicPlayer/playsound.js";
import { radio } from "./slashCommands/MusicPlayer/radio.js";
import { localradio } from "./slashCommands/MusicPlayer/localradio.js";

export const slashCommands:Array<SlashCommandType> = [
    shifumi,
    ping,
    random,
    math,
    pc, pd, pk, pxtain,
    hide,
    test,
    stop, playtrack, pause, next, playsound, radio, localradio
];
/// - - -
///> Right-Click Commands

import { bruh } from "./rightClickCommands/bruh.js";
import { humour } from "./rightClickCommands/humour.js";

export const rightClickCommands:Array<RightClickCommandType> = [
    bruh,
    humour,
];
