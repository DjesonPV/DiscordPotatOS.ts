export default function isStringAnURL(string:string | null) {
    return ( 
    (string !== null) &&
    string.match(/^https?:\/\/(?:[a-zA-Z0-9\-]{1,64}\.){0,}(?:[a-zA-Z0-9\-]{2,63})(?:\.(?:xn--)?[a-zA-Z0-9]{2,})(\:[0-9]{1,5})?(?:\/[^\s]*)?$/) !== null);
}