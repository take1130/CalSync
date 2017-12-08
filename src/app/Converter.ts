import { types } from "garoon";
import * as moment from "moment";
import { RRule, RRuleSet } from "rrule";
import * as uuid from "uuid/v4";
const vobject = require("vobject");

export class Converter {
    private event: types.schedule.EventType;

    private const weekday = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];

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

        if (this.event.attributes.event_type === "repeat") {
            if (this.event.repeat_info) {
                let rrule: RRule;
                switch (this.event.repeat_info.condition.attributes.type) {
                    case "day":
                        rrule = new RRule({
                            freq: RRule.DAILY,
                            until: this.until(),
                        });
                        break;
                    case "week":
                    case "weekday":
                        rrule = new RRule({
                            freq: RRule.WEEKLY,
                            until: this.until(),
                            byweekday: this.weekday[this.week()],
                        });
                        break;
                    default:
                        throw new Error("unknown repeate type");
                }
                const rset = new RRuleSet();
                rset.rrule(rrule);
                for (const x of this.exdates()) {
                    rset.exdate(moment(x).toDate());
                }

                for (const x of rset.valueOf()) {
                    vevent.addRRULE(x);
                }
            }
        }

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

    private until(): Date {
        if (this.event.attributes.event_type === "repeat") {
            if (this.event.repeat_info) {
                if (this.event.attributes.allday === true) {
                    return moment(this.event.repeat_info.condition.attributes.end_date).toDate();
                } else {
                    return moment(this.event.repeat_info.condition.attributes.end_date +
                        "T" + this.event.repeat_info.condition.attributes.end_time).toDate();
                }
            }
        }

        throw new Error("no repeate event");
    }

    private week(): number {
        if (this.event.attributes.event_type === "repeat") {
            if (this.event.repeat_info) {
                if (this.event.repeat_info.condition.attributes.week) {
                    return this.event.repeat_info.condition.attributes.week;
                }
            }
        }

        throw new Error("no week day");
    }

    private exdates(): string[] {
        if (this.event.attributes.event_type === "repeat") {
            if (this.event.repeat_info) {
                if (this.event.repeat_info.exclusive_datetimes) {
                    if (this.event.repeat_info.exclusive_datetimes.exclusive_datetime) {
                        if (this.isEventTypeRepeatInfoExclusiveDatetimesExclusiveDatetime(this.event.repeat_info.exclusive_datetimes.exclusive_datetime)) {
                            return [this.event.repeat_info.exclusive_datetimes.exclusive_datetime.attributes.start];
                        } else {
                            const dates = new Array();
                            for (const x of this.event.repeat_info.exclusive_datetimes.exclusive_datetime) {
                                dates.push(x.attributes.start);
                            }
                            return dates;
                        }
                    }
                }
            }
        }

        throw new Error("");
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

    private isEventTypeRepeatInfoExclusiveDatetimesExclusiveDatetime(x: any):
        x is types.schedule.EventTypeRepeatInfoExclusiveDatetimesExclusiveDatetime {
        return x && x.attributes;
    }
}
