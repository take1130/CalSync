import * as fs from "fs";
import * as mocha from "mocha";
import * as assert from "power-assert";
import { URL } from "url";
import * as util from "util";
import { CalDavService } from "../app/caldavService";
import * as ServerInfo from "../app/serverInfo";

describe("caldav", () => {
    let server: ServerInfo.IServerInfo;
    let currentUserPrincipal: string;
    let calendarHomeSet: string;

    before(() => {
        server = ServerInfo.readServerInfo("server.json") as ServerInfo.IServerInfo;
    });

    it("search", async () => {
        const url = new URL(server.caldav.url);

        const caldav = new CalDavService(server.caldav.url, server.caldav.user, server.caldav.password);
        const status = await caldav.search("287875fe-35a6-4e7b-9acc-b5c408df95c8");
        console.log(util.inspect(status, true, null, true));
        assert.fail();
    });

    it("get", async() => {
        const url = new URL(server.caldav.url);

        const caldav = new CalDavService(server.caldav.url, server.caldav.user, server.caldav.password);
        const status = await caldav.get("287875fe-35a6-4e7b-9acc-b5c408df95c8");
        console.log(util.inspect(status, true, null, true));
        assert.fail();
    })
});
