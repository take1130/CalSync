import * as fs from "fs";
import * as mocha from "mocha";
import * as assert from "power-assert";
import { URL } from "url";
import * as util from "util";
import * as CalDav from "../app/caldav";
import * as ServerInfo from "../app/serverInfo";

function isIResponse(x: any): x is CalDav.IResponse {
    return x && x.href;
}

function isIPropStat(x: any): x is CalDav.IPropStat {
    return x && x.status;
}

describe("caldav", () => {
    let server: ServerInfo.IServerInfo;
    let currentUserPrincipal: string;
    let calendarHomeSet: string;

    before(() => {
        server = ServerInfo.readServerInfo("server.json") as ServerInfo.IServerInfo;
    });

    it("get current user principal", async () => {
        const url = new URL(server.caldav.url);
        const status = await CalDav.CalDav.getCurrentUserPrincipal(url, server.caldav.user, server.caldav.password);
        console.log(util.inspect(status, true, null, true));
        if (isIResponse(status.response)) {
            if (isIPropStat(status.response.propstat)) {
                assert.equal(status.response.propstat.status, "HTTP/1.1 200 OK");
                if (status.response.propstat.prop) {
                    const href = status.response.propstat.prop["current-user-principal"];
                    if (href) {
                        currentUserPrincipal = href.href;
                        return;
                    }
                }
            }
        }
        assert.fail();
    });

    it("get calendar home set", async () => {
        if (currentUserPrincipal === undefined) {
            assert.fail();
        }

        const url = new URL(currentUserPrincipal, server.caldav.url);
        const status = await CalDav.CalDav.getCalendarHomeSet(url, server.caldav.user, server.caldav.password);
        console.log(util.inspect(status, true, null, true));
        if (isIResponse(status.response)) {
            if (isIPropStat(status.response.propstat)) {
                assert.equal(status.response.propstat.status, "HTTP/1.1 200 OK");
                if (status.response.propstat.prop) {
                    const href = status.response.propstat.prop["calendar-home-set"];
                    if (href) {
                        calendarHomeSet = href.href;
                        return;
                    }
                }
            }
        }
        assert.fail();
    });

    it("get calendar component set", async () => {
        if (calendarHomeSet === undefined) {
            assert.fail();
        }

        const url = new URL(calendarHomeSet, server.caldav.url);
        const status = await CalDav.CalDav.getCalendarComponentSet(url, server.caldav.user, server.caldav.password);
        console.log(util.inspect(status, true, null, true));
    });

    it("put", async () => {
        const url = new URL(server.caldav.url);
        const ics = fs.readFileSync("test.ics", "utf-8");

        const caldav = new CalDav.CalDav(new URL(server.caldav.url), server.caldav.user, server.caldav.password);
        const json = await caldav.put("9e9d1541-d4ec-47ff-924b-a56cb4e6d540.ics", ics);
        console.log(util.inspect(json, true, null, true));
    });

    it("search", async () => {
        const url = new URL(server.caldav.url);

        const caldav = new CalDav.CalDav(url, server.caldav.user, server.caldav.password);
        const status = await caldav.search("X-GAROON-ID", "12345678");
        console.log(util.inspect(status, true, null, true));
        if (isIResponse(status.response)) {
            if (isIPropStat(status.response.propstat)) {
                if (status.response.propstat.prop) {
                    if (status.response.propstat.prop["calendar-data"]) {
                        const ics = fs.readFileSync("test.ics", "utf-8");
                        // assert.equal(status.response.propstat.prop["calendar-data"], ics);
                        return;
                    }
                }
            }
        }
        assert.fail();
    });

    it("delete", async () => {
        const url = new URL(server.caldav.url);

        const caldav = new CalDav.CalDav(url, server.caldav.user, server.caldav.password);
        const status = await caldav.search("X-GAROON-ID", "12345678");
        if (isIResponse(status.response)) {
            if (isIPropStat(status.response.propstat)) {
                if (status.response.propstat) {
                    if (status.response.propstat.prop) {
                        if (status.response.propstat.prop.getetag) {
                            const status2 = await caldav.delete(status.response.href);
                            console.log(util.inspect(status2, true, null, true));
                            if (isIResponse(status2.response)) {
                                if (status2.response.status) {
                                    assert.equal(status2.response.status, "HTTP/1.1 200 OK");
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
        assert.fail();
    });
});
