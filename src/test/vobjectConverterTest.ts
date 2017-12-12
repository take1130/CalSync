import * as fs from "fs";
import { types } from "garoon";
import * as mocha from "mocha";
import * as assert from "power-assert";
import * as util from "util";
import * as uuid from "uuid/v4";
import { VobjectConverter } from "../app/vobjectConverter";

function isEventType(x: any): x is types.schedule.EventType {
    if (x && x.attributes) {
        return true;
    }
    return false;
}

describe("converter test", () => {
    it("to ics", () => {
        const json = JSON.parse(fs.readFileSync("test.json", "utf-8")) as types.schedule.ScheduleGetEventsResponseType;

        if (isEventType(json.schedule_event)) {
            console.log("1");
            const vobject = VobjectConverter.fromGaroonEvent(uuid(), json.schedule_event);
            console.log(vobject.toICS());
        } else if (json.schedule_event) {
            console.log("array");
            const vobject = VobjectConverter.fromGaroonEvent(uuid(), json.schedule_event[0]);
            console.log(vobject.toICS());
        }
    });

    it("from ics", () => {
        const ics = fs.readFileSync("test.ics", "utf-8");
        const vobject = VobjectConverter.fromICS(ics);
        console.log(vobject.toICS());
    });
});
