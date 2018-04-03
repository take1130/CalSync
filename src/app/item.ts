import * as fs from 'fs';

export interface IItem {
    id: string;
    version: string;
    url: string;
}

export function readItems(path: string): IItem[] {
    return JSON.parse(fs.readFileSync(path, 'utf-8')) as IItem[]
}

export function writeItems(path: string, items: IItem[]) {
    return fs.writeFileSync(path, JSON.stringify(items), 'utf-8');
}
