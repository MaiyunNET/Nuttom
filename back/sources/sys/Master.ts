import * as os from "os";
import * as cluster from "cluster";
// --- 库和定义 ---
import * as Sys from "../lib/Sys";
import * as CopyFiles from "../sys/CopyFiles";

/** 获取 pid 对应的 cpu id */
let _workerList: any = {};
let _cpuLen = os.cpus().length;

// --- 检测是否有死掉的子进程，复活之 ---
setInterval(function() {
    let now = Date.now();
    for (let pid in _workerList) {
        if (now - _workerList[pid].hbtime < 30000) {
            // --- 距离上次心跳，小于 30 秒，正常 ---
            // --- 子线程 10 秒发送一次心跳 ---
            continue;
        }
        // --- 异常 ---
        console.log("[Master] Worker " + pid + " lost.");
        let cpu = _workerList[pid].cpu;
        delete(_workerList[pid]);
        _fork(cpu);
    }
}, 30000);  // 30 秒

export async function run() {
    // --- [主线程] ---
    await CopyFiles.run();
    // --- 启动和 CPU 数量一致的线程 ---
    console.log("[Master] Master start...");
    for (let i = 0; i < _cpuLen; ++i) {
        await _fork(i);
    }
    cluster.on("listening", function(worker, address) {
        console.log("[Master] Listening: worker " + worker.process.pid + ", Address: " + address.address + ":" + address.port + ".");
    });
    cluster.on("exit", async function(worker, code, signal) {
        // --- 子线程中断连接（可能是因为 restart，也可能因为致命错误），需要重新启动一个新的线程 ---
        console.log("[Master] Worker " + worker.process.pid + " died.");
        let cpu = _workerList[worker.process.pid].cpu;
        delete(_workerList[worker.process.pid]);
        await _fork(cpu);
    });
}

/**
 * --- 创建一个新的线程 ---
 * @param cpu CPU ID
 */
async function _fork(cpu: number) {
    let worker = cluster.fork();
    _workerList[worker.process.pid] = {
        worker: worker,
        cpu: cpu,
        hbtime: Date.now()
    };
    // --- 如果是支持将线程放到对应的 CPU，则执行相关操作 ---
    if (os.type().toLowerCase().indexOf("windows") === -1) {
        // --- 非 Windows ---
        let cpr = await Sys.exec("taskset -cp " + cpu + " " + worker.process.pid);
        console.log(cpr);
        console.log("[Master] Worker " + worker.process.pid + " start on cpu #" + cpu + ".");
    }
    // --- 监听子线程发来的讯息 ---
    worker.on("message", function(msg) {
        switch (msg.action) {
            case "reload":
            case "restart":
                // --- 为所有子线程发送 reload/restart 信息 ---
                for (let pid in _workerList) {
                    _workerList[pid].worker.send({
                        action: msg.action
                    });
                }
                break;
            case "hbtime":
                if (!_workerList[msg.pid]) {
                    // --- TODO 线程存在，主进程没找到 ---
                    console.log("[Master] Worker " + msg.pid + " not found.");
                    break;
                }
                _workerList[msg.pid].hbtime = Date.now();
                break;
        }
    });
}