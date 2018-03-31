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
        const status = await caldav.search("763733");
        console.log(util.inspect(status, true, null, true));
        assert.fail();
    });
});
