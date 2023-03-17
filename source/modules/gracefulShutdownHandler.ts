import * as DiscordJs from 'discord.js';
import Lang from '../Lang';

export default function (client:DiscordJs.Client):void
{
    if (process.platform === 'win32')
    // If the code is ran on Windows
    {
        let readline = require('readline')
        .createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        readline.on('SIGINT', () =>
        {
            process.emit('SIGINT');
        });
    }

    process.on('SIGINT', () =>
    {
        process.exit();
    });

    process.on('exit', code =>
    {
        client.destroy();
        console.log(Lang.get("botShutingDown"));
    });
}
