// --- 第三方 ---
import * as mysql2 from "mysql2/promise";
// --- 库和定义 ---
import * as Sys from "~/lib/Sys";
import * as abs from "~/abstract";

class Sql {
    private _pre: string = "";
    private _sql: string[] = [];
    private _data: any[] = [];

    constructor(etc?: abs.Nu | abs.ConfigEtcSql) {
        this.reset(etc);
    }

    public reset(etc?: abs.Nu | abs.ConfigEtcSql) {
        if (!etc) {
            this._pre = "";
            return;
        }
        this._pre = Sys.isNu(etc) ? etc.config.etc.sql.pre : etc.pre;
    }

    /**
     * --- 释放连接到池子 ---
     */
    public release() {
        _sqlList.push(this);
    }

    // --- 前导 ---

    public insert(f: string, cs: any = [], vs?: any[]): Sql {
        this._data = [];
        let sql = `INSERT INTO ${this._pre + f} (`;
        if (vs) {
            // --- 'xx', ['id', 'name'], [['1', 'wow'], ['2', 'oh']] ---
            // --- 'xx', ['id', 'name'], ['1', 'wow'] ---
            for (let i of cs) {
                sql += this.field(i) + ",";
            }
            sql = sql.slice(0, -1) + `) VALUES `;
            // --- 判断插入单条记录还是多条记录 ---
            if (Array.isArray(vs[0])) {
                // --- 多条记录 ---
                // --- INSERT INTO xx (id, name) VALUES ? ---
                for (let i in vs[0]) {
                    sql += "(?), ";
                }
                sql = sql.slice(0, -2);
                this._data = vs;
            } else {
                // --- 单条记录 ---
                // --- INSERT INTO xx (id, name) VALUES (?) ---
                sql += "(";
                for (let i in vs) {
                    sql += "?, ";
                }
                sql = sql.slice(0, -2) + ")";
                this._data = vs;
            }
        } else {
            // --- 'xx', ['id' => '1', 'name' => 'wow'] ---
            // --- INSERT INTO xx (id, name) VALUES (?) ---
            let data: any[] = [];
            let values: string = "";
            for (let k in cs) {
                sql += this.field(k) + ",";
                data.push(cs[k]);
                values += "?,";
            }
            sql = sql.slice(0, -1) + ") VALUES (" + values.slice(0, -1) + ")";
            this._data = data;
        }
        this._sql = [sql];
        return this;
    }

    /**
     * --- 当不能 insert 时，update（仅能配合 insert 方法用） ---
     * @param s 更新数据
     */
    public onDuplicate(s: any[]): Sql {
        if (s.length > 0) {
            let sql = " ON DUPLICATE KEY UPDATE " + this._updateSub(s);
            this._sql.push(sql);
        }
        return this;
    }

    /**
     * --- '*', 'xx' ---
     * @param c 字段
     * @param f 表
     */
    public select(c: string | string[], f: string): Sql {
        this._data = [];
        let sql = "SELECT ";
        if (typeof c === "string") {
            sql += c;
        } else {
            for (let i of c) {
                sql += this.field(i) + ",";
            }
            sql = sql.slice(0, -1);
        }
        sql += " FROM " + this._pre + f;
        this._sql = [sql];
        return this;
    }

    /**
     * --- UPDATE SQL 方法 ---
     * @param f 表名
     * @param s 设定 update 的值
     */
    public update(f: string, s: any[]): Sql {
        this._data = [];
        let sql = `UPDATE ${this._pre}${f} SET ${this._updateSub(s)}`;
        this._sql = [sql];
        return this;
    }
    private _updateSub(s: any[]): string {
        // --- 例子：      1                 2          3 ---
        // --- [["total", "+", "1"], {'type': '6', 'str': ['(CASE `id` WHEN 1 THEN ? WHEN 2 THEN ? END)', ['val1', 'val2']]}] ---
        let sql = "";
        for (let v of s) {
            if (Array.isArray(v)) {
                // --- 1 ---
                sql += this.field(v[0]) + " = " + this.field(v[0]) + " " + v[1] + " ?,";
                this._data.push(v[2]);
            } else {
                for (let k1 in v) {
                    let v1 = v[k1];
                    if (Array.isArray(v1)) {
                        // --- 3 ---
                        sql += this.field(k1) + " = " + v1[0] + ",";
                        if (v1[1] !== undefined) {
                            this._data = this._data.concat(v1[1]);
                        }
                    } else {
                        // --- 2 ---
                        sql += this.field(k1) + " = ?,";
                        this._data.push(v1);
                    }
                }
            }
        }
        sql = sql.slice(0, -1);
        return sql;
    }

    /**
     * --- 'xx' ---
     * @param f 表名
     */
    public delete(f: string): Sql {
        this._data = [];
        this._sql = ["DELETE FROM " + this._pre + f];
        return this;
    }

    /**
     * --- 筛选器 ---
     * --- 1. [{"city": "bj", "type": "2"}] ---
     * --- 2. [{"city": "bj"}, ["type", ">", "1"]] ---
     * --- 3. [{"city": "bj"}, ["type", "in", ["1", "2"]]] ---
     * --- 4. [{"city": "bj", "type": ["1", "2"]}] ---
     * --- 5. [{"$or": [{"city": "bj"}, {"city": "sh"}], "type": "2"}] ---
     * @param s 筛选数据
     */
    public where(s: any[]): Sql {
        if (s.length > 0) {
            this._sql.push(" WHERE " + this._whereSub(s));
        }
        return this;
    }
    private _whereSub(s: any[], type: string = " AND ", lev: number = 0): string {
        let sql = "";
        if (lev > 0) {
            sql = "(";
        }
        for (let v of s) {
            if (Array.isArray(v)) {
                // --- 2, 3 ---
                if (Array.isArray(v[2])) {
                    // --- 3 ---
                    sql += this.field(v[0]) + " " + v[1].toUpperCase() + " (?)" + type;
                    this._data.push(v[2]);
                } else {
                    // --- 2 ---
                    sql += this.field(v[0]) + " " + v[1] + " ?" + type;
                    this._data.push(v[2]);
                }
            } else {
                // --- 1, 4, 5 ---
                for (let k1 in v) {
                    let v1 = v[k1];
                    if (k1[0] === "$") {
                        // --- 5 ---
                        sql += this._whereSub(v1, " " + k1.slice(1).toUpperCase() + " ", lev + 1) + type;
                    } else if (typeof v1 === "string") {
                        // --- 1 ---
                        sql += this.field(k1) + " = ?" + type;
                        this._data.push(v1);
                    } else {
                        // --- 4 ---
                        sql += this.field(k1) + " IN (?)" + type;
                        this._data.push(v1);
                    }
                }
            }
        }
        return sql.slice(0, -type.length) + (lev > 0 ? ")" : "");
    }

    /**
     * --- ORDER BY ---
     * @param c 字段字符串或数组
     * @param d 排序规则
     */
    public by(c: string | string[], d: string = "DESC"): Sql {
        let sql: string = " ORDER BY ";
        if (typeof c === "string") {
            sql += c + " " + d;
        } else {
            for (let v of c) {
                sql += this.field(v) + ",";
            }
            sql = sql.slice(0, -1) + " " + d;
        }
        this._sql.push(sql);
        return this;
    }

    /**
     * --- GROUP BY ---
     * @param c 字段字符串或数组
     */
    public groupBy(c: string | string[]): Sql {
        let sql = " GROUP BY ";
        if (typeof c === "string") {
            sql += c;
        } else {
            for (let v of c) {
                sql += this.field(v) + ",";
            }
            sql = sql.slice(0, -1);
        }
        this._sql.push(sql);
        return this;
    }

    /**
     * --- LIMIT ---
     * @param a 起始
     * @param b 长度
     */
    public limit(a: number, b: number): Sql {
        this._sql.push(` LIMIT ${a}, ${b}`);
        return this;
    }

    // --- 操作 ---

    public getSql(): string  {
        return this._sql.join("");
    }

    public getData(): any[] {
        return this._data;
    }

    public format(sql?: string, data?: any[]): string {
        return mysql2.format(sql || this.getSql(), data || this.getData());
    }

    // --- 特殊方法 ---

    public append(sql: string): Sql {
        this._sql.push(sql);
        return this;
    }

    /**
     * --- 字段转义 ---
     */
    public field(str: string): string {
        let l = str.split(".");
        if (l[1] === undefined) {
            return "`" + str + "`";
        }
        return l[0] + "`" + l[1] + "`";
    }

}

/** --- 对象池 --- */
let _sqlList: Sql[] = [];

export function get(etc?: abs.Nu | abs.ConfigEtcSql): Sql {
    if (_sqlList[0]) {
        let sql = _sqlList[0];
        _sqlList.splice(0, 1);
        sql.reset(etc);
        return sql;
    }
    return new Sql(etc);
}