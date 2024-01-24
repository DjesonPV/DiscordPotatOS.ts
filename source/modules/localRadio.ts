import importJSON from './importJSON.js';

const radios: LocalRadioDescription = importJSON("./resources/localradio.json");

export default radios;

type LocalRadioDescription = {
    [key: string]: {
        name: string,
        title: string,
        description: string,
        web: string,
        url: string,
        place: string,
        country: string,
        thumbnail: string | undefined
    } | undefined
}
