import { types } from "garoon";
import * as moment from "moment-timezone";
import { RRule, RRuleSet } from "rrule";
const vobject = require("vobject");

export class VobjectConverter {
    /**
     * fromGaroonEvent
     */
    public static fromGaroonEvent(uuid: string, event: types.schedule.EventType): any {
        const calendar = new vobject.calendar();
        const vevent = new vobject.event();
        vevent.setUID(uuid);
        vevent.setProperty(new vobject.property("X-GAROON-ID", VobjectConverter.id(event)));
        vevent.setSummary(VobjectConverter.detail(event));
        vevent.setDescription(VobjectConverter.description(event));
        vevent.setLocation(VobjectConverter.location(event));
        vevent.setDTStamp(new vobject.dateTimeValue(moment().toISOString()));

        vevent.setDTStart(VobjectConverter.start(event));
        vevent.setDTEnd(VobjectConverter.end(event));

        const timestamp = Number.parseInt(VobjectConverter.version(event));
        const date = moment.unix(timestamp).toISOString();
        vevent.setLastModified(new vobject.dateTimeValue(date));

        if (event.attributes.event_type === "repeat") {
            if (event.repeat_info) {
                let rrule: RRule;
                switch (event.repeat_info.condition.attributes.type) {
                    case "day":
                    case "weekday":
                        rrule = new RRule({
                            freq: RRule.DAILY,
                            until: VobjectConverter.until(event),
                        });
                        break;
                    case "week":
                        rrule = new RRule({
                            freq: RRule.WEEKLY,
                            until: VobjectConverter.until(event),
                            byweekday: VobjectConverter.weekday[VobjectConverter.week(event)],
                        });
                        break;
                    default:
                        throw new Error("unknown repeate type");
                }
                const rset = new RRuleSet();
                rset.rrule(rrule);
                for (const x of VobjectConverter.exdates(event)) {
                    rset.exdate(x.toDate());
                }

                for (const x of rset.valueOf()) {
                    vevent.addRRULE(x);
                }
            }
        }

        calendar.pushComponent(vevent);
        return calendar;
    }

    public static fromICS(ics: string): any {
        return vobject.parseICS(ics);
    }

    private static weekday = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];

    private static id(event: types.schedule.EventType): string {
        return event.attributes.id;
    }

    private static version(event: types.schedule.EventType): string {
        return event.attributes.version;
    }

    private static detail(event: types.schedule.EventType): string {
        let detail = "";
        if (event.attributes.plan) {
            detail += event.attributes.plan;
        }
        if (event.attributes.detail) {
            if (detail.length !== 0) {
                detail += ":";
            }
            detail += event.attributes.detail;
        }
        return detail;
    }

    private static description(event: types.schedule.EventType): string {
        return event.attributes.description || "";
    }

    private static location(event: types.schedule.EventType): string {
        if (event.members) {
            if (event.members.member) {
                if (VobjectConverter.isMemberType(event.members.member)) {
                    if (event.members.member.facility) {
                        return event.members.member.facility.attributes.name || "";
                    }
                } else if (event.members.member !== undefined) {
                    for (const member of event.members.member) {
                        if (member.facility) {
                            return member.facility.attributes.name || "";
                        }
                    }
                }
            }
        }

        return "";
    }

    private static start(event: types.schedule.EventType): any {
        if (event.attributes.event_type === "normal") {
            if (event.when) {
                if (event.when.date) {
                    if (VobjectConverter.isEventDateType(event.when.date)) {
                        return new vobject.dateValue(event.when.date.attributes.start);
                    }
                } else if (event.when.datetime) {
                    if (VobjectConverter.isEventDateTimeType(event.when.datetime)) {
                        return new vobject.dateTimeValue(event.when.datetime.attributes.start);
                    }
                }
            }
        } else if (event.attributes.event_type === "repeat") {
            if (event.repeat_info) {
                if (event.attributes.allday === true) {
                    return new vobject.dateValue(event.repeat_info.condition.attributes.start_date);
                } else {
                    return new vobject.dateTimeValue(event.repeat_info.condition.attributes.start_date +
                        "T" + event.repeat_info.condition.attributes.start_time);
                }
            }
        }

        throw new Error("unknown event_type: " + event.attributes.event_type);
    }

    private static end(event: types.schedule.EventType): any {
        if (event.attributes.event_type === "normal") {
            if (event.when) {
                if (event.when.date) {
                    if (VobjectConverter.isEventDateType(event.when.date)) {
                        if (event.when.date.attributes.start === event.when.date.attributes.end) {
                            const start = moment.tz(event.when.date.attributes.start, event.attributes.timezone);
                            return new vobject.dateValue(start.add(1, "day").format("YYYY-MM-DD"));
                        } else {
                            const end = moment.tz(event.when.date.attributes.end, event.attributes.timezone);
                            return new vobject.dateValue(end.add(1, "day").format("YYYY-MM-DD"));
                        }
                    }
                } else if (event.when.datetime) {
                    if (VobjectConverter.isEventDateTimeType(event.when.datetime)) {
                        if (event.attributes.start_only == true) {
                            const start = moment.tz(event.when.datetime.attributes.start, event.attributes.timezone);
                            return new vobject.dateTimeValue(start.add(1, "hour").format());
                        }
                        else {
                            return new vobject.dateTimeValue(event.when.datetime.attributes.end);
                        }
                    }
                }
            }
        } else if (event.attributes.event_type === "repeat") {
            if (event.repeat_info) {
                if (event.attributes.allday === true) {
                    const start = moment(event.repeat_info.condition.attributes.start_date);
                    return new vobject.dateValue(start.add(1, "day").toISOString());
                } else {
                    return new vobject.dateTimeValue(event.repeat_info.condition.attributes.start_date +
                        "T" + event.repeat_info.condition.attributes.end_time);
                }
            }
        }

        throw new Error("unknown event_type: " + event.attributes.event_type);
    }

    private static until(event: types.schedule.EventType): Date {
        if (event.attributes.event_type === "repeat") {
            if (event.repeat_info) {
                if (event.attributes.allday === true) {
                    return moment(event.repeat_info.condition.attributes.end_date).toDate();
                } else {
                    return moment(event.repeat_info.condition.attributes.end_date +
                        "T" + event.repeat_info.condition.attributes.end_time).toDate();
                }
            }
        }

        throw new Error("no repeate event");
    }

    private static week(event: types.schedule.EventType): number {
        if (event.attributes.event_type === "repeat") {
            if (event.repeat_info) {
                if (event.repeat_info.condition.attributes.week) {
                    return event.repeat_info.condition.attributes.week;
                }
            }
        }

        throw new Error("no week day");
    }

    private static exdates(event: types.schedule.EventType): moment.Moment[] {
        if (event.attributes.event_type === "repeat") {
            if (event.repeat_info) {
                let startTime = moment.duration(0);
                if (event.repeat_info.condition.attributes.start_time) {
                    startTime = moment.duration(event.repeat_info.condition.attributes.start_time);
                }

                if (event.repeat_info.exclusive_datetimes) {
                    if (event.repeat_info.exclusive_datetimes.exclusive_datetime) {
                        if (VobjectConverter.isEventTypeRepeatInfoExclusiveDatetimesExclusiveDatetime(event.repeat_info.exclusive_datetimes.exclusive_datetime)) {
                            return [moment(event.repeat_info.exclusive_datetimes.exclusive_datetime.attributes.start).add(startTime)];
                        } else {
                            const dates = new Array();
                            for (const x of event.repeat_info.exclusive_datetimes.exclusive_datetime) {
                                dates.push(moment(x.attributes.start).add(startTime));
                            }
                            return dates;
                        }
                    }
                }
            }
        }

        return [];
    }

    private static isMemberType(x: any): x is types.schedule.MemberType {
        return x && (x.user || x.organization || x.facility);
    }

    private static isEventDateType(x: any): x is types.schedule.EventDateType {
        return x && x.attributes;
    }

    private static isEventDateTimeType(x: any): x is types.schedule.EventDateTimeType {
        return x && x.attributes;
    }

    private static isEventTypeRepeatInfoExclusiveDatetimesExclusiveDatetime(x: any):
        x is types.schedule.EventTypeRepeatInfoExclusiveDatetimesExclusiveDatetime {
        return x && x.attributes;
    }
}
