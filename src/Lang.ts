type StringDictionary = 
{
    [key:string]:string | undefined;
}

type DefaultStringDictionary = 
{
    [key:string]:string;
}

export default class Lang 
{
    private static currentLanguage:StringDictionary;

    private static defaultLanguage:DefaultStringDictionary = require("../ressources/lang/default.json");

    static init(language?:string)
    {
        if (language !== undefined)
        this.setLanguage(language);
    }

    static setLanguage(language:string)
    {
        const curatedLanguageSelection = language.match(/[a-z]{2}\_[A-Z]{2}/)?.[0];

        if ((curatedLanguageSelection === null) || (curatedLanguageSelection === undefined))
        {
            console.warn("Language naming is not valid, verify that the LANGUAGE variable in .env is formatted as xx_XX in Latin Alphabet\n")
            return;
        }

        try {
            Lang.currentLanguage = require(`../ressources/lang/${language}.json`);
        }
        catch (_)
        {
            console.warn(`Chosen language does not exist.\nPlease verify that the file \`ressources/lang/${curatedLanguageSelection}.json\` exists.\nDefault language \`default.json\` will be applied\n`);
        }
    }

    static get(key:string,parameters?:Array<string>):string
    {
        return parseString(Lang.currentLanguage?.[key] ?? Lang.defaultLanguage[key], parameters);
    }
}

function parseString(rawString:string, parameters?:Array<string>):string
{
    const identifier = /\$\{[^\{\}]*\}/;
    // ${anyText here}
    const occurence:number | undefined = rawString.match(new RegExp(identifier.source, 'g'))?.length;
    // return the number of time the `identifier` is found in the `rawString`

    if ((occurence === undefined) || (parameters === undefined)) return rawString;

    let bakedString = rawString;
    for (let i = 0; i < occurence; i++)
    {
        bakedString = bakedString.replace(identifier, parameters?.[i] ?? "/undefined or missing/");
    }

    // We could `replace` the `for` loop with a `while` loop 
    // and shift the `parameters` array, and then finish with 
    // a `replaceAll` for potential remaining `identifier`
    // Or maybe there is a more fitting regex function
    // but for now it would do well
    
    return bakedString;
}
