import * as fs from "fs";
import { types } from "garoon";
import { URL } from "url";
import * as Uuid from "uuid/v4";
import { CalDavService } from "./caldavService";
import { GaroonSchedule } from "./garoonSchedule";
import { Logger } from "./logger";
import * as ServerInfo from "./serverInfo";
import { VobjectConverter } from "./vobjectConverter";
import * as Item from "./item";
import { List } from "linqts";

const itemsJson = "items.json";
const serverJson = "server.json";

async function main() {
    Logger.Logger.debug("start gssync");

    const serverInfo = ServerInfo.readServerInfo(serverJson);
    const items = Item.readItems(itemsJson);

    const garoon = new GaroonSchedule({
        url: serverInfo.garoon.url,
        extraHeaders: serverInfo.garoon.options.extraHeaders,
        endpoint: serverInfo.garoon.options.endpoint
    });
    garoon.authenticate(serverInfo.garoon.user, serverInfo.garoon.password);

    const iv = new List<Item.IItem>(items)
        .Select(x => { return { attributes: { id: x.id, version: x.version } } })
        .Cast<types.base.ItemVersionType>()
        .ToArray();
    const events = await garoon.getEventVersion(iv);

    const caldav = new CalDavService(serverInfo.caldav.url, serverInfo.caldav.user, serverInfo.caldav.password);

    for (const x of events) {
        switch (x.attributes.operation) {
            case "add":
                {
                    const event = await garoon.getEvent(x.attributes.id);
                    const uuid = Uuid();
                    const vobject = VobjectConverter.fromGaroonEvent(uuid, event);
                    const response = await caldav.put(uuid, vobject.toICS());
                    items.push({ id: x.attributes.id, version: x.attributes.version, uuid } as Item.IItem);
                    break;
                }
            case "modify":
                {
                    const uuid = new List<Item.IItem>(items)
                        .Single(y => y != undefined && (y.id == x.attributes.id)).uuid;
                    const status = await caldav.get(uuid);
                    if (status !== null) {
                        let vobject = VobjectConverter.fromICS(status);
                        const vevent = vobject.getComponents("VEVENT");
                        const response = await garoon.getEvent(x.attributes.id);
                        vobject = VobjectConverter.fromGaroonEvent(vevent[0].getUID(), response);
                        await caldav.put(vevent[0].getUID(), vobject.toICS());
                        const n = items.findIndex((v) => v.id === x.attributes.id);
                        items[n].version = x.attributes.version;
                    }
                    break;
                }
            case "remove":
                {
                    try {
                        const event = await garoon.getEvent(x.attributes.id);
                        // Garoon 上にはまだ登録されている -> 現在より古いイベントなので、そのまま残す, 更新itemから削除
                        const n = items.findIndex((v) => v.id === x.attributes.id);
                        items.splice(n, 1);
                    } catch (event) {
                        // Garoon から削除されたイベント -> CalDavからも削除
                        const uuid = new List<Item.IItem>(items)
                            .Single(y => y != undefined && (y.id == x.attributes.id)).uuid;
                        const status = await caldav.delete(uuid);
                        if (status) {
                            const n = items.findIndex((v) => v.id === x.attributes.id);
                            items.splice(n, 1);
                        }
                        break;
                    }
                }
        }
    }

    Item.writeItems(itemsJson, items);
    Logger.Logger.debug("end gssync");
}

main();
