import * as log4js from "log4js";

export class Logger {
    public static get Logger(): log4js.Logger {
        if (Logger.logger === undefined) {
            log4js.configure("./logging.json");
            Logger.logger = log4js.getLogger();
        }
        return Logger.logger;
    }

    private static logger: log4js.Logger;
}
