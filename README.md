# Nuttom

[![License](https://img.shields.io/github/license/MaiyunNET/Nuttom.svg)](https://github.com/MaiyunNET/Nuttom/blob/master/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/MaiyunNET/Nuttom.svg)](https://github.com/MaiyunNET/Nuttom/issues)
[![GitHub Releases](https://img.shields.io/github/release/MaiyunNET/Nuttom.svg)](https://github.com/MaiyunNET/Nuttom/releases "Stable Release")
[![GitHub Pre-Releases](https://img.shields.io/github/release/MaiyunNET/Nuttom/all.svg)](https://github.com/MaiyunNET/Nuttom/releases "Pre-Release")

Simple, easy to use, full functionality of the Node.js framework.

## Languages

[简体中文](doc/README.zh-CN.md) | [繁體中文](doc/README.zh-TW.md)

## Installation

Download the latest release and put it to directory, then to start development.

## Environment

Node 10+

## Library

Net (http, https, http2), Crypto (md5, sha1, aes), Fs, Mysql, Redis, Sql, Sys, Text, View, Zlib.

## Features

### No brains

Based on the idea of not using the brain, the commonly used and uniform style of the library has been encapsulated.

### UI Console

A console that contains a UI interface that automatically pairs the latest version of Mutton to detect which files have been modified or need to be upgraded.

### Net Library contains full Cookie implementation

Cookies can be obtained directly as an array of variables, which can exist anywhere, such as databases, memory, and so on.

#### And more...

## Demonstrate

### Generate 16-bit random numbers

```typescript
let str: string = Text.random(16, Text.RANDOM_N)
```

### Sql

```typescript
let s = sql.update("user", [["age", "+", "1"], {"name": "Serene"}]).where([{"name": "Ah"}]);
```

> UPDATE mu_user SET \`age\` = \`age\` + '1', \`name\` = 'Serene' WHERE `name` = 'Ah'

## Other demos

You can download and view the home Code (back/sources/www/default/ctr/test.php) to see more examples.

## Changelog

[Changelog](doc/CHANGELOG.md)

## License

This library is published under [Apache-2.0](./LICENSE) license.

## Name meaning

Mirror image of Mutton.