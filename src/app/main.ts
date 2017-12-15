import * as fs from "fs";
import { types } from "garoon";
import { URL } from "url";
import * as Uuid from "uuid/v4";
import { CalDav } from "./caldav";
import { GaroonSchedule } from "./garoonSchedule";
import * as ServerInfo from "./serverInfo";
import { VobjectConverter } from "./vobjectConverter";

const itemsJson = "items.json";
const serverJson = "server.json";

function readItems(): types.base.ItemVersionType[] {
    if (fs.existsSync(itemsJson)) {
        return JSON.parse(fs.readFileSync(itemsJson, "utf-8")) as types.base.ItemVersionType[];
    }
    return [];
}

function writeItems(items: types.base.ItemVersionType[]) {
    fs.writeFileSync(itemsJson, JSON.stringify(items), "utf-8");
}

async function main() {
    const serverInfo = ServerInfo.readServerInfo(serverJson);
    const items = readItems();

    const garoon = new GaroonSchedule({ url: serverInfo.garoon.url });
    garoon.authenticate(serverInfo.garoon.user, serverInfo.garoon.password);
    const events = await garoon.getEventVersion(items);

    const caldav = new CalDav(new URL(serverInfo.caldav.url), serverInfo.caldav.user, serverInfo.caldav.password);

    for (const x of events) {
        switch (x.attributes.operation) {
            case "add":
                {
                    const event = await garoon.getEvent(x.attributes.id);
                    const uuid = Uuid();
                    const vobject = VobjectConverter.fromGaroonEvent(uuid, event);
                    const response = await caldav.put(uuid + ".ics", vobject.toICS());
                    items.push({ attributes: { id: x.attributes.id, version: x.attributes.version } });
                    break;
                }
            case "modify":
                {
                    const status = await caldav.search("X-GAROON-ID", x.attributes.id);
                    if (CalDav.isIResponse(status.response)) {
                        if (CalDav.isIPropStat(status.response.propstat)) {
                            if (status.response.propstat) {
                                if (status.response.propstat.prop) {
                                    const data = status.response.propstat.prop["calendar-data"];
                                    if (data) {
                                        let vobject = VobjectConverter.fromICS(data);
                                        const vevent = vobject.getComponents("VEVENT");
                                        const response = await garoon.getEvent(x.attributes.id);
                                        vobject = VobjectConverter.fromGaroonEvent(vevent[0].getUID(), response);
                                        await caldav.put(vevent[0].getUID() + ".ics", vobject.toICS());
                                        const n = items.findIndex((v) => v.attributes.id === x.attributes.id);
                                        items[n].attributes.version = x.attributes.version;
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
            case "remove":
                {
                    try {
                        const event = await garoon.getEvent(x.attributes.id);
                        // Garoon 上にはまだ登録されている -> 現在より古いイベントなので、そのまま残す
                    } catch (event) {
                        // Garoon から削除されたイベント -> CalDavからも削除
                        const status = await caldav.search("X-GAROON-ID", x.attributes.id);
                        if (CalDav.isIResponse(status.response)) {
                            if (CalDav.isIPropStat(status.response.propstat)) {
                                if (status.response.propstat) {
                                    if (status.response.propstat.prop) {
                                        if (status.response.propstat.prop.getetag) {
                                            const status2 = await caldav.delete(status.response.href,
                                                status.response.propstat.prop.getetag);
                                            if (CalDav.isIResponse(status2.response)) {
                                                if (status2.response.status) {
                                                    const n = items.findIndex((v) => v.attributes.id === x.attributes.id);
                                                    items.splice(n);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
        }
    }

    writeItems(items);
}

main();
