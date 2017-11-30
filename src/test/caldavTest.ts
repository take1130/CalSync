import * as fs from "fs";
import * as mocha from "mocha";
import * as assert from "power-assert";
import { URL } from "url";
import * as util from "util";
import { CalDav } from "../app/caldav";

describe("caldav", () => {
    let server: any;

    before(() => {
        server = JSON.parse(fs.readFileSync("server.json", "utf-8"));
    });

    it("get current user principal", async () => {
        const url = new URL(server.caldav.url);
        const json = await CalDav.getCurrentUserPrincipal(url, server.caldav.user, server.caldav.password);
        console.log(util.inspect(json, true, null, true));
    });

    it("get calendar home set", async () => {
        const url = new URL(server.caldav.url);
        const json = await CalDav.getCalendarHomeSet(url, server.caldav.user, server.caldav.password);
        console.log(util.inspect(json, true, null, true));
    });

    it("get calendar component set", async() => {
        const url = new URL(server.caldav.url);
        const json = await CalDav.getCalendarComponentSet(url, server.caldav.user, server.caldav.password);
        console.log(util.inspect(json, true, null, true));
    });
});
