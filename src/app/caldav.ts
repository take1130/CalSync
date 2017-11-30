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
}
