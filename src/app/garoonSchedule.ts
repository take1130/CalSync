import * as garoon from "garoon";
import { URL } from "url";

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

        const response = await this.client.ScheduleGetEventVersions(request);

        if (response.event_item !== undefined) {
            if (this.isItemVersionResultType(response.event_item)) {
                return [response.event_item];
            } else {
                return response.event_item;
            }
        }

        return [];
    }

    /**
     * getEvent
     */
    public async getEvent(id: string): Promise<garoon.types.schedule.EventType> {
        const response = await this.client.ScheduleGetEventsById({ event_id: id });

        if (response.schedule_event !== undefined) {
            if (this.isEventType(response.schedule_event)) {
                return response.schedule_event;
            } else {
                return response.schedule_event[0];
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
