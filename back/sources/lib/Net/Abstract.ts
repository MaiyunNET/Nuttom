import * as url from "url";
import * as http2 from "http2";
import * as https from "https";

/** 传入的参数 */
export type Options = https.RequestOptions & {
    url: string;
    encoding?: string;
    data?: any;
};

/** 内部需要的参数 */
export type Config = {
    uri: url.UrlWithStringQuery;
    isSecure: boolean;
    level: string;
    headers?: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader;
};

/** 内部需要用的获取 POST 之前的回调数据 */
export type BeforePostResult = {
    "headers": {
        "Content-Type": string;
        "Content-Length": number;
    };
    "content": string;
    "upload": boolean;
    "boundary": string;
    "fcontent": string[];
    "flist": string[];
};

/** HTTP 响应对象 */
export interface NetResponse {
    /** 响应方 header 列表 */
    readonly headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader;
    /** 响应方 Http 版本号 */
    readonly httpVersion: string;

    /**
     * --- 读取所有内容到内存 ---
     */
    readContent(): Promise<string>;

    /**
     * --- 绑定到输入流 ---
     * @param destination 输入流
     */
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean; }): T;
}