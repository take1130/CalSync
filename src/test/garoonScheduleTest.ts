import * as fs from "fs";
import * as mocha from "mocha";
import * as assert from "power-assert";
import * as GaroonSchedule from "../app/garoonSchedule";

describe("garoonSchedule", () => {
    let options: any;

    before(() => {
        options = JSON.parse(fs.readFileSync("server.json", "utf-8"));
    });

    it("constructor test", () => {
        const gs = new GaroonSchedule.GaroonSchedule({ url: options.garoon.url });
    });

    it("getEventVersion test, no parameter", async () => {
        const gs = new GaroonSchedule.GaroonSchedule({ url: options.garoon.url });
        gs.authenticate(options.garoon.user, options.garoon.password);
        const versions = await gs.getEventVersion();
        console.log(versions);
    });

    it("getEventVersion test, has parameter", async () => {
        const gs = new GaroonSchedule.GaroonSchedule({ url: options.garoon.url });
        gs.authenticate(options.garoon.user, options.garoon.password);
        const versions = await gs.getEventVersion([{ attributes: { id: "732635", version: "1510634372" } }]);
        console.log(versions);
    });
});
