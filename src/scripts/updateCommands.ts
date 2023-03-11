import * as DiscordJs from 'discord.js';
import Lang from '../Lang';
import * as DotEnv from 'dotenv';
import { sendUserCommands } from "../modules/updateUserCommands";

DotEnv.config();
Lang.init(process.env.LANGUAGE);

import {slashCommands, rightClickCommands} from '../userCommands/UserCommands';

const commandList = [];

for (let command of slashCommands) commandList.push(command.description.toJSON());
for (let command of rightClickCommands) commandList.push(command.description.toJSON());

sendUserCommands(commandList);
