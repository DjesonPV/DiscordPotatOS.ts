import * as DiscordJs from 'discord.js';
import Lang from '../Lang.js';

import getSecrets from './getSecrets.js';

type CommandsJSONBody = DiscordJs.RESTPostAPIChatInputApplicationCommandsJSONBody | DiscordJs.RESTPostAPIContextMenuApplicationCommandsJSONBody;

export async function sendUserCommands(list:Array<CommandsJSONBody>)
{

    const secrets = (await getSecrets());

    const rest = new DiscordJs.REST({version: '10'}).setToken(secrets.botToken);

    console.log(Lang.get("refreshCommands$2", [`${list.length}`, `${Object.keys(secrets.guildsID).length}`]));

    for (let guildName in secrets.guildsID)
    {
        await rest.put(
            DiscordJs.Routes.applicationGuildCommands(secrets.botID, secrets.guildsID[guildName]),
            {body: list}
        ).catch((reason) => 
        {
            console.error(reason);
        });
    }

    console.log(Lang.get("refreshComplete"))

}
