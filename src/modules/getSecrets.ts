import * as DotEnv from 'dotenv';

export default function getSecrets():SecretJSON
{
    DotEnv.config();

    if (process.env.SECRET_JSON === undefined)
    throw new Error("Environnement variable SECRET_JSON is not defined")

    return require(process.env.SECRET_JSON);
}

type SecretJSON = {
    botToken: string,
    botID: string,
    guildsID: {[key:string]:string},
    usersID: {[key:string]:string},
    hiddenVoiceChannelsID: {[key:string]:string}
};
