import * as DiscordJs from 'discord.js';
import Lang from '../Lang.js';

import { sendUserCommands } from "../modules/updateUserCommands.js";
import {slashCommands, rightClickCommands} from '../userCommands/UserCommands.js';


const commandList = [];

for (let command of slashCommands) commandList.push(command.description.toJSON());
for (let command of rightClickCommands) commandList.push(command.description.toJSON());

sendUserCommands(commandList);
