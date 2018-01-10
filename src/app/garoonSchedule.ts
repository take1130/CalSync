import * as garoon from "garoon";
import { URL } from "url";
import * as util from "util";
import { Logger } from "./logger";

export class GaroonSchedule {
    private client: garoon.Client;

    /**
     * コンストラクタ
     * @param options 接続オプション
     */
    constructor(options: garoon.Option) {
        this.client = new garoon.Client(options);
    }

    /**
     * authenticate
     */
    public authenticate(user: string, password: string) {
        this.client.authenticate(user, password);
    }

    /**
     * getEventVersion
     */
    public async getEventVersion(items?: garoon.types.base.ItemVersionType[]): Promise<garoon.types.base.ItemVersionResultType[]> {
        const request: garoon.types.schedule.ScheduleGetEventVersionsRequestType = {
            attributes: {
                start: new Date().toISOString(),
            },
        };
        if (items) {
            request.event_item = items;
        }

        Logger.Logger.info("getEventVersion: request = [%s]", util.inspect(request, true, null, false));
        const response = await this.client.ScheduleGetEventVersions(request);
        Logger.Logger.info("getEventVersion: response = [%s]", util.inspect(response, true, null, false));

        if (response) {
            if (response.event_item !== undefined) {
                if (this.isItemVersionResultType(response.event_item)) {
                    return [response.event_item];
                } else {
                    return response.event_item;
                }
            }
        }

        return [];
    }

    /**
     * getEvent
     */
    public async getEvent(id: string): Promise<garoon.types.schedule.EventType> {
        const request = { event_id: id };
        Logger.Logger.info("getEvent(): request = [%s]", util.inspect(request, true, null, false));
        const response = await this.client.ScheduleGetEventsById(request);
        Logger.Logger.info("getEvent(): response = [%s]", util.inspect(response, true, null, false));

        if (response) {
            if (response.schedule_event !== undefined) {
                if (this.isEventType(response.schedule_event)) {
                    return response.schedule_event;
                } else {
                    return response.schedule_event[0];
                }
            }
        }

        throw new Error("no event");
    }

    private isItemVersionResultType(x: any): x is garoon.types.base.ItemVersionResultType {
        if (x === undefined) {
            return false;
        }
        if (x.attributes === undefined) {
            return false;
        }
        return true;
    }

    private isEventType(x: any): x is garoon.types.schedule.EventType {
        if (x === undefined) {
            return false;
        }
        if (x.attributes === undefined) {
            return false;
        }
        return true;
    }
}
