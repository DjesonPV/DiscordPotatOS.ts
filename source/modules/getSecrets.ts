import { readFileSync } from 'fs';
import path from 'path';
import importJSON from './importJSON.js';

const DotEnv = await import('dotenv');


export default async function getSecrets():Promise<SecretJSON>
{
    DotEnv.config();

    if (process.env.SECRET_JSON === undefined)
    throw new Error("Environnement variable SECRET_JSON is not defined")
    return  importJSON(`./secret/${process.env.SECRET_JSON}`);
}

type SecretJSON = {
    botToken: string,
    botID: string,
    guildsID: {[key:string]:string},
    usersID: {[key:string]:string},
    hiddenVoiceChannelsID: {[key:string]:string}
};
