
import * as DiscordJs from 'discord.js';
import Lang from './Lang.js';
import gracefulShutdownHandler from './modules/gracefulShutdownHandler.js';

import connectionToDiscordAPI from './modules/connectionToDiscordAPI.js';
import interactionHandler from './modules/interactionHandler.js';

// Bot Initialisation
console.log(Lang.get("botStarting"));
const client:DiscordJs.Client = await connectionToDiscordAPI();

// Main Listener which will handle User Interaction
client.on('interactionCreate', interactionHandler);

// Graceful Shutdown
gracefulShutdownHandler(client);
