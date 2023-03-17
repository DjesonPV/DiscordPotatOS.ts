import * as DiscordJs from 'discord.js';
import Lang from '../Lang';
import Messages from '../messageAPI/Messages';
import getSecrets from './getSecrets';

export default function connectionToDiscordAPI():DiscordJs.Client
{
    const client:DiscordJs.Client = new DiscordJs.Client(
    {
        intents: [
            DiscordJs.GatewayIntentBits.Guilds,
            // UserCommands
            DiscordJs.GatewayIntentBits.GuildMessageReactions,
            // To be able to put reaction for BRUH
            DiscordJs.GatewayIntentBits.GuildVoiceStates,
            // To connect VoiceChannels
            DiscordJs.GatewayIntentBits.GuildMembers
            // Tikilist and Hidden VoiceChannel
        ]
    });

    
    client.once("ready", botIsReady);
    client.login(getSecrets().botToken);
    
    function botIsReady():void
    {
        if (client.user == null || client.application == null)
        throw new Error(Lang.get("botIsNotReady"));
    
        Messages.setBotUserID(client.user.id);
    
        console.log(Lang.get("botIsOnline$1", [client.user.username]));
    }

    return client;
}
