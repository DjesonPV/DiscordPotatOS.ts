import * as DiscordJs from 'discord.js';
import Lang from '../Lang.js';
import Messages from '../messageAPI/Messages.js';
import getSecrets from './getSecrets.js';
import importJSON from './importJSON.js';
import { init } from './tikilist.js';

export default async function connectionToDiscordAPI():Promise<DiscordJs.Client>
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
    
    client.once("ready", setTikilist);
    client.once("ready", botIsReady);
    client.once("ready", disconnectFromAllVoiceChannels);
    client.login((await getSecrets()).botToken);
    
    function botIsReady():void
    {
        if (client.user == null || client.application == null)
        throw new Error(Lang.get("botIsNotReady"));
    
        Messages.setBotUserID(client.user.id);
    
        console.log(Lang.get("botIsOnline$1", [client.user.username]));
    }

    function disconnectFromAllVoiceChannels(){
        client.guilds.cache.forEach(async (guild) => {
            const memberMe = await guild.members.fetchMe();
            if (memberMe) memberMe.voice.disconnect();
        });
    }

    function setTikilist() {
        const tiki = importJSON("./secret/tikitik.json")
        init(client, tiki.serverID, tiki.userID);
    }

    return client;
}
