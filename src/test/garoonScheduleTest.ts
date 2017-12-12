import * as fs from "fs";
import * as mocha from "mocha";
import * as assert from "power-assert";
import * as util from "util";
import * as GaroonSchedule from "../app/garoonSchedule";
import * as ServerInfo from "../app/serverInfo";

describe("garoonSchedule", () => {
    let options: ServerInfo.IServerInfo;
    let gs: GaroonSchedule.GaroonSchedule;

    before(() => {
        options = ServerInfo.readServerInfo("server.json");
        gs = new GaroonSchedule.GaroonSchedule({ url: options.garoon.url });
        gs.authenticate(options.garoon.user, options.garoon.password);
    });

    it("getEventVersion test, no parameter", async () => {
        const versions = await gs.getEventVersion();
        console.log(versions);
    });

    it("getEventVersion test, has parameter", async () => {
        const versions = await gs.getEventVersion([{ attributes: { id: "732635", version: "1510634372" } }]);
        console.log(versions);
    });

    it("getEvent test", async () => {
        const event = await gs.getEvent("732635");
        console.log(util.inspect(event, true, null, true));
    });
});
