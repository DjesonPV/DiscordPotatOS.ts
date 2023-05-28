import importJSON from './importJSON.js';

const DotEnv = await import('dotenv');


DotEnv.config();

if (process.env.PERSONALITY_JSON === undefined)
    throw new Error("Environnement variable PERSONALITY_JSON is not defined")

const botPersonality:Personality = importJSON(`./resources/botPersonality/${process.env.PERSONALITY_JSON}`);

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
