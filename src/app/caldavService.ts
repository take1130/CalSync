import { URL } from "url";
import * as CalDav from "./caldav";

export interface ICalendarInfo {
    displayname: string;
    url: string;
}

export class CalDavService {
    private server: string;
    private user: string;
    private password: string;
    private proxy?: string;

    public constructor(server: string, user: string, password: string, proxy?: string) {
        this.server = server;
        this.user = user;
        this.password = password;
        this.proxy = proxy;
    }

    public async put(uuid: string, ics: string): Promise<boolean> {
        const caldav = new CalDav.CalDav(new URL(this.server), this.user, this.password, this.proxy);
        const response = await caldav.put(uuid + ".ics", ics);
        if (response) {
            return true;
        }
        return false;
    }

    public async search(id: string): Promise<string | null> {
        const caldav = new CalDav.CalDav(new URL(this.server), this.user, this.password, this.proxy);
        const status = await caldav.search("X-GAROON-ID", id);
        if (this.isIResponse(status.response)) {
            if (this.isIPropStat(status.response.propstat)) {
                if (status.response.propstat) {
                    if (status.response.propstat.prop) {
                        const data = status.response.propstat.prop["calendar-data"] as string;
                        return data;
                    }
                }
            }
        }
        return null;
    }

    public async delete(id: string): Promise<boolean> {
        const caldav = new CalDav.CalDav(new URL(this.server), this.user, this.password, this.proxy);
        const status = await caldav.search("X-GAROON-ID", id);
        if (this.isIResponse(status.response)) {
            if (this.isIPropStat(status.response.propstat)) {
                if (status.response.propstat) {
                    if (status.response.propstat.prop) {
                        if (status.response.propstat.prop.getetag) {
                            const status2 = await caldav.delete(status.response.href,
                                status.response.propstat.prop.getetag);
                            if (this.isIResponse(status2.response)) {
                                if (status2.response.status) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    public async getCalendars(): Promise<ICalendarInfo[]> {
        const currentUserPrincipal = await this.getCurrentUserPrincipal(this.server);
        let url = new URL(currentUserPrincipal, this.server);
        const calendarHomeSet = await this.getCalendarHomeSet(url.toString());
        url = new URL(calendarHomeSet, url);
        const calendars = await this.getCalendarComponentSet(url.toString());
        return calendars;
    }

    private async getCurrentUserPrincipal(url: string): Promise<string> {
        const status = await CalDav.CalDav.getCurrentUserPrincipal(new URL(url), this.user, this.password, this.proxy);
        if (this.isIResponse(status.response)) {
            if (this.isIPropStat(status.response.propstat)) {
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

    private async getCalendarHomeSet(url: string): Promise<string> {
        const status = await CalDav.CalDav.getCalendarHomeSet(new URL(url), this.user, this.password, this.proxy);
        if (!this.isIResponse(status.response)) {
            throw new Error();
        }

        if (!this.isIPropStat(status.response.propstat)) {
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

    private async getCalendarComponentSet(url: string): Promise<ICalendarInfo[]> {
        const status = await CalDav.CalDav.getCalendarComponentSet(new URL(url), this.user, this.password, this.proxy);

        const response: CalDav.IResponse[] = new Array();
        if (this.isIResponse(status.response)) {
            response.push(status.response);
        } else {
            status.response.forEach((x) => { response.push(x); });
        }

        const calendars: ICalendarInfo[] = new Array();
        response.forEach((x) => {
            if (this.isIPropStat(x.propstat)) {
                if (x.propstat.prop) {
                    const displayname = x.propstat.prop.displayname || "";
                    const cs = x.propstat.prop["supported-calendar-component-set"];
                    if (cs) {
                        const components: CalDav.IComponent[] = new Array();
                        if (this.isIComponent(cs.comp)) {
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

    private isIResponse(x: any): x is CalDav.IResponse {
        return x && x.href;
    }

    private isIPropStat(x: any): x is CalDav.IPropStat {
        return x && x.status;
    }

    private isIComponent(x: any): x is CalDav.IComponent {
        return x && x.$attributes;
    }
}
