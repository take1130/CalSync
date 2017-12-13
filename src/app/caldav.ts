import * as request from "request";
import { soap } from "strong-soap";
import { URL } from "url";
import * as util from "util";

export interface IMultiStatus {
    response: IResponse | IResponse[];
}

export interface IResponse {
    href: string;
    propstat?: IPropStat | IPropStat[];
    status?: string;
}

export interface IPropStat {
    prop: IProp | undefined;
    status: string;
}

export interface ISupportedCalendarComponentSet {
    comp: IComponent | IComponent[];
}

export interface IComponent {
    "$attributes": IComponentAttribute;
}

export interface IComponentAttribute {
    name: string;
}

export interface IProp {
    "current-user-principal"?: IHref;
    "calendar-home-set"?: IHref;
    displayname?: string;
    getctag?: string;
    "supported-calendar-component-set"?: ISupportedCalendarComponentSet;
    getetag?: string;
    "calendar-data"?: string;
}

export interface IHref {
    href: string;
}

export class CalDav {
    /**
     * getCurrentUserPrincipal
     */
    public static getCurrentUserPrincipal(url: URL, user: string, password: string): Promise<IMultiStatus> {
        const xml: string = `
        <d:propfind xmlns:d="DAV:">
          <d:prop>
            <d:current-user-principal />
          </d:prop>
        </d:propfind>
        `;
        const options: request.CoreOptions = {
            method: "PROPFIND",
            headers: {
                Depth: "0",
                Prefer: "return-minimal",
            },
            proxy: "",
            body: xml,
        };
        return new Promise((resolve, reject) => {
            request(url.toString(), options, (error: any, response: request.RequestResponse, body: any) => {
                if (error) {
                    reject(error);
                }

                const handler = new soap.XMLHandler();
                let json = handler.xmlToJson(null, body.toString(), null);
                resolve(json.multistatus as IMultiStatus);
            }).auth(user, password);
        });
    }

    /**
     * getCalendarHomeSet
     */
    public static getCalendarHomeSet(url: URL, user: string, password: string): Promise<IMultiStatus> {
        const xml = `
        <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
          <d:prop>
            <c:calendar-home-set />
          </d:prop>
        </d:propfind>
        `;
        const options: request.CoreOptions = {
            method: "PROPFIND",
            headers: {
                Depth: "0",
                Prefer: "return-minimal",
            },
            proxy: "",
            body: xml,
        };
        return new Promise((resolve, reject) => {
            request(url.toString(), options, (error: any, response: request.RequestResponse, body: any) => {
                if (error) {
                    reject(error);
                }

                const handler = new soap.XMLHandler();
                const json = handler.xmlToJson(null, body.toString(), null);
                resolve(json.multistatus as IMultiStatus);
            }).auth(user, password);
        });
    }

    /**
     * getCalendarComponentSet
     */
    public static getCalendarComponentSet(url: URL, user: string, password: string): Promise<IMultiStatus> {
        const xml = `
        <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/" xmlns:c="urn:ietf:params:xml:ns:caldav">
          <d:prop>
           <d:resourcetype />
           <d:displayname />
           <cs:getctag />
           <c:supported-calendar-component-set />
          </d:prop>
        </d:propfind>
        `;
        const options: request.CoreOptions = {
            method: "PROPFIND",
            headers: {
                Depth: "1",
                Prefer: "return-minimal",
            },
            proxy: "",
            body: xml,
        };
        return new Promise((resolve, reject) => {
            request(url.toString(), options, (error: any, response: request.RequestResponse, body: any) => {
                if (error) {
                    reject(error);
                }

                const handler = new soap.XMLHandler();
                const json = handler.xmlToJson(null, body.toString(), null);
                resolve(json.multistatus as IMultiStatus);
            }).auth(user, password);
        });
    }

    private url: URL;
    private user: string;
    private password: string;

    constructor(url: URL, user: string, password: string) {
        this.url = url;
        this.user = user;
        this.password = password;
    }

    /**
     * search
     */
    public search(field: string, id: string): Promise<IMultiStatus> {
        const xml = `
        <c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
          <d:prop>
            <d:getetag />
            <c:calendar-data />
          </d:prop>
          <c:filter>
            <c:comp-filter name="VCALENDAR">
              <c:comp-filter name="VEVENT">
                <c:prop-filter name="%s">
                  <c:text-match>%s</c:text-match>
                </c:prop-filter>
              </c:comp-filter>
            </c:comp-filter>
          </c:filter>
        </c:calendar-query>
        `;
        const options: request.CoreOptions = {
            method: "REPORT",
            headers: {
                Depth: "1",
                Prefer: "return-minimal",
            },
            proxy: "",
            body: util.format(xml, field, id),
        };
        return new Promise((resolve, reject) => {
            request(this.url.toString(), options, (error: any, response: request.RequestResponse, body: any) => {
                if (error) {
                    reject(error);
                }

                const handler = new soap.XMLHandler();
                const json = handler.xmlToJson(null, body.toString(), null);
                resolve(json.multistatus as IMultiStatus);
            }).auth(this.user, this.password);
        });
    }

    /**
     * put
     */
    public put(ics: string, event: string, etag?: string): Promise<string> {
        const options: request.CoreOptions = {
            method: "PUT",
            proxy: "",
            body: event,
        };

        if (etag) {
            options.headers = { "If-Match": etag };
        }

        const putUrl = new URL(ics, this.url);

        return new Promise((resolve, reject) => {
            request(putUrl.toString(), options, (error: any, response: request.RequestResponse, body: any) => {
                if (error) {
                    reject(error);
                }

                if (response.statusCode) {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        // 200番台ならOK
                        const tag = response.headers.etag;
                        if (tag) {
                            if (typeof tag === "string") {
                                resolve(tag);
                            }
                        }
                        return;
                    }
                }
                reject("error");
            }).auth(this.user, this.password);
        });
    }

    /**
     * delete
     */
    public delete(ics: string, etag: string): Promise<IMultiStatus> {
        const options: request.CoreOptions = {
            method: "DELETE",
            proxy: "",
            headers: {
                "If-Match": etag,
            },
        };

        const deleteUrl = new URL(ics, this.url);

        return new Promise((resolve, reject) => {
            request(deleteUrl.toString(), options, (error: any, response: request.RequestResponse, body: any) => {
                if (error) {
                    reject(error);
                }

                const handler = new soap.XMLHandler();
                const json = handler.xmlToJson(null, body.toString(), null);
                resolve(json.multistatus as IMultiStatus);
            }).auth(this.user, this.password);
        });
    }
}
