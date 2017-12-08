import * as fs from "fs";
import { types } from "garoon";
import * as mocha from "mocha";
import * as assert from "power-assert";
import * as util from "util";
import { Converter } from "../app/Converter";

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
            const converter = new Converter(json.schedule_event);
            console.log(converter.toICS());
        }
        else if (json.schedule_event) {
            console.log("array");
            const converter = new Converter(json.schedule_event[0]);
            console.log(converter.toICS());
        }
    });
});
