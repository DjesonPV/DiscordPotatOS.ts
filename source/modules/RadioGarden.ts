
export async function searchForRadioUrl(query:string)
{
    try
    {
        const fetched = await (await fetch(`https://radio.garden/api/search?q=${encodeURIComponent(query)}`)).json();

        const url:string = fetched?.hits?.hits
        ?.find((hit:any) => hit?._source?.type === 'channel')
        ?._source.url;

        if (url === undefined) throw new Error('Failed to get an URL');

        return url;

    } catch (error)
    {
        return Promise.reject(`RadioGarden\n• Failed to find Radio URL :\n${error}`)
    }
}

export async function getRadioData(radioUrl:string)
{
    const radioID = getIdFromRadioURL(radioUrl);
    try
    {
        if (radioID === undefined) throw new Error('Provied URL is not valid');

        const channel = await (await fetch(`https://radio.garden/api/ara/content/channel/${radioID}`)).json();
        return channel.data;

    } catch (error)
    {
        return Promise.reject(`RadioGarden:\n• Failed to fetch Data\n${error}`)
    }
}

export function getRadioFluxURL(radioID:string)
{
    return `https://radio.garden/api/ara/content/listen/${radioID}/channel.mp3`;

}

export function getIdFromRadioURL(url:string)
{
    return url.match(/^https?:\/\/radio\.garden\/listen\/(?:[^\/]+)\/([^\/]+)$/)?.[1];
}
