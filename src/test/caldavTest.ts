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

    it("get calendar component set", async () => {
        const url = new URL(server.caldav.url);
        const json = await CalDav.getCalendarComponentSet(url, server.caldav.user, server.caldav.password);
        console.log(util.inspect(json, true, null, true));
    });

    it("put", async () => {
        const url = new URL(server.caldav.url);
        const ics = fs.readFileSync("test.ics", "utf-8");

        const caldav = new CalDav(server.caldav.url, server.caldav.user, server.caldav.password);
        const json = await caldav.put("9e9d1541-d4ec-47ff-924b-a56cb4e6d540.ics", ics);
        console.log(util.inspect(json, true, null, true));
    });

    it("search", async () => {
        const url = new URL(server.caldav.url);

        const caldav = new CalDav(url, server.caldav.user, server.caldav.password);
        const json = await caldav.search("X-GAROON-ID", "12345678");
        console.log(util.inspect(json, true, null, true));
    });

    it("delete", async () => {
        const url = new URL(server.caldav.url);

        const caldav = new CalDav(url, server.caldav.user, server.caldav.password);
        const json: any = await caldav.search("X-GAROON-ID", "12345678");
        const response = json.multistatus.response;
        const json2 = await caldav.delete(response.href, response.propstat.prop.getetag);
        console.log(util.inspect(json2, true, null, true));
    });
});
