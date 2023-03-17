import * as DotEnv from 'dotenv';

DotEnv.config();

if (process.env.PERSONALITY_JSON === undefined)
    throw new Error("Environnement variable PERSONALITY_JSON is not defined")

const botPersonality:Personality = require(process.env.PERSONALITY_JSON);

type Personality = {
    nickname: string,
    icon: string,
    color: string,

    errorIcon: string,
    errorColor: string,

    musicPlayerDefaultThumbnail: string,
    
    radioIcon: string,
    radioThumbnail: string,
    radioColor: string
};

export default botPersonality;
