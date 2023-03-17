
const radios: LocalRadioDescription = require("../../ressources/localradio.json")

export default radios;

type LocalRadioDescription = {
    [key: string]: {
        name: string,
        title: string,
        description: string,
        web: string,
        url: string,
        thumbnail: string | undefined
    } | undefined
}