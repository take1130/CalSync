import * as fs from "fs";
import { types } from "garoon";
import { URL } from "url";
import * as Uuid from "uuid/v4";
import { CalDav } from "./caldav";
import { GaroonSchedule } from "./garoonSchedule";
import * as ServerInfo from "./serverInfo";
import { VobjectConverter } from "./vobjectConverter";

async function main() {
    const serverInfo = JSON.parse(fs.readFileSync("server.json", "utf-8")) as ServerInfo.IServerInfo;

    let garoon = new GaroonSchedule({ url: serverInfo.garoon.url });
    garoon.authenticate(serverInfo.garoon.user, serverInfo.garoon.password);
    let items = await garoon.getEventVersion();

    let caldav = new CalDav(new URL(serverInfo.caldav.url), serverInfo.caldav.user, serverInfo.caldav.password);

    for (let item of items) {
        switch (item.attributes.operation) {
            case "add":
            {
                const event = await garoon.getEvent(item.attributes.id);
                const uuid = Uuid();
                const vobject = VobjectConverter.fromGaroonEvent(uuid, event);
                const response = await caldav.put(uuid + ".ics", vobject.toICS());
                break;
            }
            case "modify":
                break;
            case "remove":
                break;
        }
    }
}

main();
