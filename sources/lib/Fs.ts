import * as fs from "fs";
import * as Crypto from "./Crypto";

/**
 * --- 读取文件内容 ---
 * @param path 文件路径
 * @param options 编码/选项
 */
export function readFile(path: fs.PathLike | number, options: { encoding: string; flag?: string; } | string = "utf-8"): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, options, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * --- 获取文件夹列表 ---
 * @param path 文件夹路径
 */
export function readDir(path: fs.PathLike): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

/**
 * --- 获取对象是否存在，存在则返回 stats 对象，否则返回 undefined ---
 * @param path 对象路径
 */
export function getStats(path: fs.PathLike): Promise<fs.Stats | undefined> {
    return new Promise((resolve, reject) => {
        fs.lstat(path, (err, stats) => {
            if (err) {
                resolve(undefined);
            } else {
                resolve(stats);
            }
        });
    });
}

/**
 * --- 复制文件 ---
 * @param src 从文件
 * @param dest 到路径
 */
export function copyFile(src: fs.PathLike, dest: fs.PathLike): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.copyFile(src, dest, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * --- 创建单层目录 ---
 * @param path 要创建的路径
 */
export function mkdir(path: fs.PathLike): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, (err) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * --- 深度创建多层目录 ---
 * @param path 要创建的路径
 */
export async function mkdirDeep(path: string): Promise<boolean> {
    path = path.replace("\\", "/");
    if (path.slice(-1) === "/") {
        path = path.slice(0, -1);
    }
    // --- 创建当前目录 ---
    return await _mkdirDeepSub(path);
}
async function _mkdirDeepSub(path: string): Promise<boolean> {
    let stats = await getStats(path);
    if (stats !== undefined && stats.isDirectory()) {
        // --- 当前有目录，不用创建直接成功 ---
        return true;
    }
    // --- 需要创建当前目录前，先判断上级目录 ---
    let upPath = path.slice(0, path.lastIndexOf("/"));
    if (!await _mkdirDeepSub(upPath)) {
        return false;
    }
    // --- 创建当前目录 ---
    return await mkdir(path);
}

interface SyncOptions {
    ignoreExt?: string[];
}

/**
 * --- 从 from 路径同步到 to 路径，to 路径多出的文件不会被移除 ---
 * @param from 从
 * @param to 到
 * @param opt 选项
 */
export async function sync(from: string, to: string, opt: SyncOptions = {}): Promise<void> {
    opt.ignoreExt = opt.ignoreExt || ["ts", "scss"];

    from = from.replace("\\", "/");
    to = to.replace("\\", "/");
    if (from.slice(0, -1) === "/") {
        from = from.slice(0, -1);
    }
    if (to.slice(0, -1) === "/") {
        to = to.slice(0, -1);
    }

    await _syncSub(from, to, "/", opt);
}
async function _syncSub(from: string, to: string, path: string, opt: SyncOptions) {
    let list = await readDir(from + path);
    for (let item of list) {
        if (item === "." || item === "..") {
            continue;
        }
        let stats = await getStats(from + path + item);
        if (!stats) {
            continue;
        }
        let tstats = await getStats(to + path + item);
        if (stats.isDirectory()) {
            if (!tstats || !tstats.isDirectory()) {
                await mkdir(to + path + item);
            }
            await _syncSub(from, to, path + item + "/", opt);
        } else {
            let lio = item.lastIndexOf(".");
            if (lio !== -1) {
                let ext = item.slice(lio + 1);
                if ((<string[]>opt.ignoreExt).indexOf(ext) !== -1) {
                    continue;
                }
            }
            let fmd5 = Crypto.md5(await readFile(from + path + item));
            let tmd5 = tstats ? Crypto.md5(await readFile(to + path + item)) : "";
            if (fmd5 === tmd5) {
                continue;
            }
            await copyFile(from + path + item, to + path + item);
        }
    }
}