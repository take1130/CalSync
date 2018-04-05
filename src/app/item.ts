import * as fs from 'fs';

export interface IItem {
    id: string;
    version: string;
    uuid: string;
}

export function readItems(path: string): IItem[] {
    if (fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path, 'utf-8')) as IItem[]
    }
    return [] as IItem[];
}

export function writeItems(path: string, items: IItem[]) {
    return fs.writeFileSync(path, JSON.stringify(items), 'utf-8');
}
