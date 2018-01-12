import { URL } from "url";
import * as CalDav from "./caldav";

export interface ICalendarInfo {
    displayname: string;
    url: string;
}

export class CalDavService {
    public static async getCalendars(server: string, user: string, password: string, proxy?: string): Promise<ICalendarInfo[]> {
        const currentUserPrincipal = await CalDavService.getCurrentUserPrincipal(server, user, password, proxy);
        let url = new URL(currentUserPrincipal, server);
        const calendarHomeSet = await CalDavService.getCalendarHomeSet(url.toString(), user, password, proxy);
        url = new URL(calendarHomeSet, url);
        const calendars = await CalDavService.getCalendarComponentSet(url.toString(), user, password, proxy);
        return calendars;
    }

    private static async getCurrentUserPrincipal(url: string, user: string, password: string, proxy?: string): Promise<string> {
        const status = await CalDav.CalDav.getCurrentUserPrincipal(new URL(url), user, password, proxy);
        if (CalDavService.isIResponse(status.response)) {
            if (CalDavService.isIPropStat(status.response.propstat)) {
                if (status.response.propstat.prop) {
                    const href = status.response.propstat.prop["current-user-principal"];
                    if (href) {
                        return href.href;
                    }
                }
            }
        }

        throw new Error();
    }

    private static async getCalendarHomeSet(url: string, user: string, password: string, proxy?: string): Promise<string> {
        const status = await CalDav.CalDav.getCalendarHomeSet(new URL(url), user, password, proxy);
        if (!CalDavService.isIResponse(status.response)) {
            throw new Error();
        }

        if (!CalDavService.isIPropStat(status.response.propstat)) {
            throw new Error();
        }

        if (status.response.propstat.status !== "HTTP/1.1 200 OK") {
            throw new Error();
        }

        if (status.response.propstat.prop) {
            const href = status.response.propstat.prop["calendar-home-set"];
            if (href) {
                return href.href;
            }
        }

        throw new Error();
    }

    private static async getCalendarComponentSet(url: string, user: string, password: string, proxy?: string): Promise<ICalendarInfo[]> {
        const status = await CalDav.CalDav.getCalendarComponentSet(new URL(url), user, password, proxy);

        const response: CalDav.IResponse[] = new Array();
        if (CalDavService.isIResponse(status.response)) {
            response.push(status.response);
        } else {
            status.response.forEach((x) => { response.push(x); });
        }

        const calendars: ICalendarInfo[] = new Array();
        response.forEach((x) => {
            if (CalDavService.isIPropStat(x.propstat)) {
                if (x.propstat.prop) {
                    const displayname = x.propstat.prop.displayname || "";
                    const cs = x.propstat.prop["supported-calendar-component-set"];
                    if (cs) {
                        const components: CalDav.IComponent[] = new Array();
                        if (CalDavService.isIComponent(cs.comp)) {
                            components.push(cs.comp);
                        } else {
                            cs.comp.forEach((y) => { components.push(y); });
                        }

                        components.forEach((z) => {
                            if (z.$attributes.name === "VEVENT") {
                                calendars.push({ displayname, url: new URL(x.href, url).toString() });
                            }
                        });
                    }
                }
            }
        });
        return calendars;
    }

    private static isIResponse(x: any): x is CalDav.IResponse {
        return x && x.href;
    }

    private static isIPropStat(x: any): x is CalDav.IPropStat {
        return x && x.status;
    }

    private static isIComponent(x: any): x is CalDav.IComponent {
        return x && x.$attributes;
    }
}
