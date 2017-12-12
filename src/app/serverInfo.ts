import * as fs from "fs";

export interface IGaroonServerInfo {
    url: string;
    user: string;
    password: string;
}

export interface ICalDavServerInfo {
    url: string;
    user: string;
    password: string;
}

export interface IServerInfo {
    garoon: IGaroonServerInfo;
    caldav: ICalDavServerInfo;
}

export function readServerInfo(path: string): IServerInfo {
    return JSON.parse(fs.readFileSync(path, "utf-8")) as IServerInfo;
}
