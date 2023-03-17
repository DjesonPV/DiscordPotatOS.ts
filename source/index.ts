
import * as DiscordJs from 'discord.js';
import * as DotEnv from 'dotenv';
import Lang from './Lang';
import gracefulShutdownHandler from './modules/gracefulShutdownHandler';

import connectionToDiscordAPI from './modules/connectionToDiscordAPI';
import interactionHandler from './modules/interactionHandler';

DotEnv.config();

// Bot Initialisation
Lang.init(process.env.LANGUAGE);
console.log(Lang.get("botStarting"));
const client:DiscordJs.Client = connectionToDiscordAPI();

// Main Listener which will handle User Interaction
client.on('interactionCreate', interactionHandler);

// Graceful Shutdown
gracefulShutdownHandler(client);
