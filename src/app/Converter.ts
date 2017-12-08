import { types } from "garoon";
import * as moment from "moment";
import * as uuid from "uuid/v4";
const vobject = require("vobject");

export class Converter {
    private event: types.schedule.EventType;

    constructor(event: types.schedule.EventType) {
        this.event = event;
    }

    /**
     * toICS
     */
    public toICS(): string {
        const calendar = new vobject.calendar();
        const vevent = new vobject.event();
        vevent.setUID(uuid());
        vevent.setProperty(new vobject.property("X-GAROON-ID", this.id()));
        vevent.setSummary(this.detail());
        vevent.setDescription(this.description());
        vevent.setLocation(this.location());
        vevent.setDTStamp(new vobject.dateTimeValue(moment().toISOString()));

        vevent.setDTStart(this.start());
        vevent.setDTEnd(this.end());

        const timestamp = Number.parseInt(this.version());
        const date = moment.unix(timestamp).toISOString();
        vevent.setLastModified(new vobject.dateTimeValue(date));

        calendar.pushComponent(vevent);
        return calendar.toICS();
    }

    private id(): string {
        return this.event.attributes.id;
    }

    private version(): string {
        return this.event.attributes.version;
    }

    private detail(): string {
        return this.event.attributes.detail || "";
    }

    private description(): string {
        return this.event.attributes.description || "";
    }

    private location(): string {
        if (this.event.members) {
            if (this.event.members.member) {
                if (this.isMemberType(this.event.members.member)) {
                    if (this.event.members.member.facility) {
                        return this.event.members.member.facility.attributes.name || "";
                    }
                } else if (this.event.members.member !== undefined) {
                    for (const member of this.event.members.member) {
                        if (member.facility) {
                            return member.facility.attributes.name || "";
                        }
                    }
                }
            }
        }

        return "";
    }

    private start(): any {
        if (this.event.attributes.event_type === "normal") {
            if (this.event.when) {
                if (this.event.when.date) {
                    if (this.isEventDateType(this.event.when.date)) {
                        return new vobject.dateValue(this.event.when.date.attributes.start);
                    }
                } else if (this.event.when.datetime) {
                    if (this.isEventDateTimeType(this.event.when.datetime)) {
                        return new vobject.dateTimeValue(this.event.when.datetime.attributes.start);
                    }
                }
            }
        } else if (this.event.attributes.event_type === "repeat") {
            if (this.event.repeat_info) {
                if (this.event.attributes.allday === true) {
                    return new vobject.dateValue(this.event.repeat_info.condition.attributes.start_date);
                } else {
                    return new vobject.dateTimeValue(this.event.repeat_info.condition.attributes.start_date +
                        "T" + this.event.repeat_info.condition.attributes.start_time);
                }
            }
        }

        throw new Error("unknown event_type: " + this.event.attributes.event_type);
    }

    private end(): any {
        if (this.event.attributes.event_type === "normal") {
            if (this.event.when) {
                if (this.event.when.date) {
                    if (this.isEventDateType(this.event.when.date)) {
                        return new vobject.dateValue(this.event.when.date.attributes.end);
                    }
                } else if (this.event.when.datetime) {
                    if (this.isEventDateTimeType(this.event.when.datetime)) {
                        return new vobject.dateTimeValue(this.event.when.datetime.attributes.end);
                    }
                }
            }
        } else if (this.event.attributes.event_type === "repeat") {
            if (this.event.repeat_info) {
                if (this.event.attributes.allday === true) {
                    const start = moment(this.event.repeat_info.condition.attributes.start_date);
                    return new vobject.dateValue(start.add(1, "day").toISOString());
                } else {
                    return new vobject.dateTimeValue(this.event.repeat_info.condition.attributes.start_date +
                                                     "T" + this.event.repeat_info.condition.attributes.end_time);
                }
            }
        }

        throw new Error("unknown event_type: " + this.event.attributes.event_type);
    }

    private isMemberType(x: any): x is types.schedule.MemberType {
        return x && x.attributes;
    }

    private isEventDateType(x: any): x is types.schedule.EventDateType {
        return x && x.attributes;
    }

    private isEventDateTimeType(x: any): x is types.schedule.EventDateTimeType {
        return x && x.attributes;
    }
}
