import * as http2 from "http2";
import * as url from "url";
import * as querystring from "querystring";

// --- 虚拟机配置对象 ---
export interface Vhost {
    readonly name: string;
    readonly domains: string[];
    readonly root: string;
    readonly cert: string;
    readonly key: string;
}

/** --- 控制器使用的常量 --- */
export interface NuConst {
    VER: string;
    START_TIME: bigint;
    URI: string;

    ROOT_PATH: string;
    VIEW_PATH: string;
    DATA_PATH: string;

    HTTP_BASE: string;
    HTTP_HOST: string;
    HTTP_PATH: string;
}

/** --- 动态目录配置文件 --- */
export interface Config {
    readonly route: {
        [key: string]: string;
    };
    readonly etc: {
        [key: string]: string;
    } & ConfigEtc;
}

/** --- ETC 配置 --- */
export interface ConfigEtc {
    "__Nuttom__": {
        "pwd": string;
    };
    "mysql": ConfigEtcMysql;
    "sql": ConfigEtcSql;
}
export interface ConfigEtcMysql {
    "host": string;
    "port": number;
    "charset": string;
    "name": string;
    "username": string;
    "password": string;
}
export interface ConfigEtcSql {
    "pre": string;
}

/** --- Nu 核心对象 --- */
export interface Nu {
    const: NuConst;
    readonly req: http2.Http2ServerRequest;
    readonly res: http2.Http2ServerResponse;
    readonly uri: url.UrlWithStringQuery;
    get: querystring.ParsedUrlQuery;
    post: NuPost;
    cookie: NuCookie;
    param: string[];
    locale: string;
    config: Config;
    readonly isNu: boolean;
}

/** Nu Cookie 对象 */
export interface NuCookie {
    [key: string]: string;
}

/** --- Nu Post 对象 --- */
export interface NuPost {
    [key: string]: NuPostItem | NuPostItem[];
}
export type NuPostItem = string | NuPostFile;

/** --- Nu Post File 对象 --- */
export interface NuPostFile {
    name: string;
    size: number;
    path: string;
}