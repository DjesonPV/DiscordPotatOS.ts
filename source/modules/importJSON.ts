import { readFileSync } from 'fs';
import path from 'path';

export default function importJSON (pathOfJSON:string) {
    const jsonO = JSON.parse(readFileSync(path.resolve(pathOfJSON),"utf-8"))
    return jsonO;
}
