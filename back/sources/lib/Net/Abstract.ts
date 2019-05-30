import * as url from "url";
import * as http from "http";
import * as http2 from "http2";
import * as https from "https";

/** 传入的参数 */
export type Options = https.RequestOptions & {
    url?: string;
    encoding?: string;
    data?: any;
    cookie?: NetCookie;
    followLocation?: boolean;
};

/** Net Cookie 对象 */
export interface NetCookie {
    [key: string]: NetCookieItem;
}
export interface NetCookieItem {
    "name": string;
    "value": string;
    "exp": number;
    "path": string;
    "domain": string;
    "secure": boolean;
}

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
    headers: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader;
    /** 响应方 Http 版本号 */
    httpVersion: string;

    /**
     * --- 释放连接到池子 ---
     */
    release(): void;

    /**
     * --- 重置配置信息 ---
     */
    reset(opt: Options, config: Config, res: http.IncomingMessage | http2.ClientHttp2Stream): void;

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