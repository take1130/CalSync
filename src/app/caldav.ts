import * as request from "request";
import { soap } from "strong-soap";
import { URL } from "url";
import * as util from "util";

export class CalDav {
    /**
     * getCurrentUserPrincipal
     */
    public static getCurrentUserPrincipal(url: URL, user: string, password: string) {
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
                resolve(json);
            }).auth(user, password);
        });
    }

    /**
     * getCalendarHomeSet
     */
    public static getCalendarHomeSet(url: URL, user: string, password: string) {
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
                resolve(json);
            }).auth(user, password);
        });
    }

    /**
     * getCalendarComponentSet
     */
    public static getCalendarComponentSet(url: URL, user: string, password: string) {
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
                resolve(json);
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
    public search(field: string, id: string) {
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
                resolve(json);
            }).auth(this.user, this.password);
        });
    }

    /**
     * put
     */
    public put(ics: string, event: string, etag?: string) {
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

                const handler = new soap.XMLHandler();
                const json = handler.xmlToJson(null, body.toString(), null);
                resolve(json);
            }).auth(this.user, this.password);
        });
    }

    /**
     * delete
     */
    public delete(ics: string, etag: string) {
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
                resolve(json);
            }).auth(this.user, this.password);
        });
    }
}
