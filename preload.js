changeStyle = () => {
    style = document.createElement("style");
    style.innerHTML = (`
    .list .list-item-content .list-item-title {
        padding-top: unset;
        height: unset;
        line-height: unset;
        font-size: 2rem;
        float: left;}
    .list .list-item-content .list-item-description {
        line-height: 3rem;
        font-size: 1rem;
        padding-left: 10px;
    `);
    document.head.appendChild(style);
}

let emojis_code, emojis, emojis_options;
let emojesClickCount;
let recentTitles;
let config;

const defaultConfig = {
    copy: true,
    paste: true
}

const allDicNames = ["emojis_通用", "emojis_通用_繁體", "emojiscode",
    "greek_alphabet_希腊字母", "greek_alphabet_希臘字母_繁體",
    "math_symbols_数学符号", "numbers_數學符號_繁體",
    "numbers_数字序号", "numbers_數字序號_繁體",
    "pinyin_拼音韵母"];
const defaultDic = ["emojis_通用", "greek_alphabet_希腊字母", "math_symbols_数学符号", "numbers_数字序号", "pinyin_拼音韵母"];
let dic;
let userDic;

function getUserDic() {
    if (userDic) return userDic;
    userDic = window.utools.dbStorage.getItem('userDic');
    if (!userDic) userDic = [];
    return userDic;
}

function saveUserDic() {
    window.utools.dbStorage.setItem('userDic', userDic);
}

function getDic() {
    if (dic) return dic;
    let d = window.utools.dbStorage.getItem('dic');
    if (d && d.length) dic = d;
    else dic = Object.assign([], defaultDic);
    return dic;
}

function saveDic() {
    window.utools.dbStorage.setItem('dic', dic);
    //window.utools.showNotification("配置保存成功")
}

function getConfig() {
    if (config) return config;
    config = Object.assign({}, defaultConfig, window.utools.dbStorage.getItem('config'));
    return config;
}

function saveConfig() {
    window.utools.dbStorage.setItem('config', config);
    //window.utools.showNotification("配置保存成功")
}


utools.onPluginReady(() => {
    changeStyle();
})


function doSelect(text) {
    let cfg = getConfig();
    console.info(cfg);
    if (cfg.copy) {
        utools.copyText(text);
    }
    if (cfg.paste) utools.hideMainWindowTypeString(text);
    else utools.hideMainWindow();

}

// 列表模式
window.exports = {
    "emoji": {
        mode: "list",
        args: {
            enter: async (action, callbackSetList) => {
                if (!emojis) {
                    console.log('init emojis')
                    emojis = [];
                    getDic().forEach(name => {
                        try {
                            emojis = emojis.concat(require('./json/' + name + '.json'))
                        } catch (error) {
                            console.error(`加载${name}出错!!`)
                        }

                    });

                    getUserDic().forEach(name => {
                        try {
                            emojis = emojis.concat(require(name))
                        } catch (error) {
                            console.error(`加载${name}出错!!`)
                        }

                    });

                    //emojis = emojis.concat(require("F:\\test\\options.json"));

                    emojesClickCount = utools.db.get("emojesClickCount");
                    if (!emojesClickCount) emojesClickCount = {
                        _id: "emojesClickCount",
                        c: {}
                    }
                    emojis.forEach(e => {
                        e.keyword += e.title;
                        e.c = emojesClickCount.c[e.title] ?? 0;
                    });
                    emojis.sort((a, b) => b.c - a.c);
                }
                recentTitles = window.utools.dbStorage.getItem('recentTitles') ?? []
                recentItems = new Array(recentTitles.length)
                emojis = emojis.filter(x => {
                    if (recentTitles.includes(x.title)) {
                        const idx = recentTitles.indexOf(x.title)
                        recentItems[idx] = x
                        return false
                    }
                    return true
                })
                emojis = recentItems.concat(emojis)
                callbackSetList(emojis)
            },
            search: (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim();
                if (!searchWord) return callbackSetList(emojis);
                let kw = searchWord.toLowerCase().split(' ');
                let sRet = emojis.filter(x => {
                    for (let k of kw) {
                        if (k) {
                            if (!x.keyword.includes(k)) return false;
                        }
                    }
                    return true;
                });
                if (/^[a-zA-Z]+$/.test(searchWord)) {
                    //纯粹英文进行排序
                    let reg = new RegExp("\\b" + searchWord + "\\b", "i");
                    sRet.sort((a, b) => {
                        if (a.c == b.c) return reg.test(a.keyword) ? -1 : 1;
                        return b.c - a.c;
                    });
                }
                callbackSetList(sRet);
            },
            select: async (action, itemData, callbackSetList) => {
                itemData.c++;
                //将点击次数保存到数据库。
                if (itemData.c < 50000) {
                    console.log("save to db:", itemData);
                    emojesClickCount.c[itemData.title] = itemData.c;
                    let r = utools.db.put(emojesClickCount);
                    if (r.ok) emojesClickCount._rev = r.rev;
                    console.info(r);
                }
                if (recentTitles.length >= 10) {
                    recentTitles.shift()
                }
                recentTitles.unshift(itemData.title)
                window.utools.dbStorage.setItem('recentTitles', recentTitles)

                emojis.sort((a, b) => b.c - a.c);
                //debugger;
                doSelect(itemData.title);
            },
            placeholder: "搜索，回车发送到活动窗口"
        }
    },
    "emojicode": {
        mode: "list",
        args: {
            enter: async (action, callbackSetList) => {
                //changeStyle();
                if (!emojis_code) {
                    console.log('init emojis_code')
                    emojis_code = require('./json/emojiscode.json')
                }
                callbackSetList(emojis_code)
            },
            search: (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim();
                if (!searchWord) return callbackSetList(emojis_code);
                let kw = searchWord.toLowerCase().split(' ');
                callbackSetList(emojis_code.filter(x => {
                    for (let k of kw) {
                        if (k) {
                            if (!x.keyword.includes(k)) return false;
                        }
                    }
                    return true;
                }))
            },
            select: async (action, itemData, callbackSetList) => {
                doSelect(itemData.description);
            },
            placeholder: "搜索，回车发送代码到活动窗口"
        }
    }, "setting": {
        mode: "list",
        args: {
            enter: async (action, callbackSetList) => {
                //changeStyle();
                if (!emojis_options) {
                    emojis_options = [];
                    let cfg = getConfig();
                    console.info("enter", cfg)
                    emojis_options.push({
                        "title": cfg.copy ? "✅" : "⬜",
                        "description": "[⚙] 复制到剪贴板(Copy to clipboard)",
                        "type": "config",
                        "key": "copy"
                    })
                    emojis_options.push({
                        "title": cfg.paste ? "✅" : "⬜",
                        "description": "[⚙] 输出到活动文本框(Output to the active text box)",
                        "type": "config",
                        "key": "paste"
                    })

                    let dic = getDic();
                    allDicNames.forEach(d => {
                        emojis_options.push({
                            "title": dic.includes(d) ? "✅" : "⬜",
                            "description": "[📗] " + d,
                            "type": "dic",
                            "key": d
                        })
                    });
                    let uDic = getUserDic();
                    uDic.forEach(d => {
                        emojis_options.push({
                            "title": "✅",
                            "description": "[📕] " + d,
                            "type": "userdic",
                            "key": d
                        })
                    });
                    emojis_options.push({
                        "title": "➕",
                        "description": "[📕] 添加自定义emoji对照表",
                        "type": "cmd",
                        "key": "addDic"
                    })

                }
                callbackSetList(emojis_options)
            },
            // search: (action, searchWord, callbackSetList) => {
            //     debugger;
            //     callbackSetList(emojis_options)
            // },
            select: async (action, itemData, callbackSetList) => {
                //doSelect(itemData.description);
                let selected = true;
                if (itemData.type != "cmd") {
                    if (itemData.title == '⬜') { itemData.title = '✅'; selected = true }
                    else { itemData.title = '⬜'; selected = false }
                    document.querySelector(".list-item-selected .list-item-title").innerText = itemData.title;
                }

                let key = itemData.key;
                switch (itemData.type) {
                    case "config":
                        let cfg = getConfig();
                        cfg[key] = selected;
                        saveConfig();
                        break;
                    case "dic":
                        let d = getDic();
                        if (selected) {
                            d.push(key);
                        } else {
                            d = d.filter(item => item !== key);
                        }
                        dic = d;
                        saveDic();
                        break;
                    case "userdic":
                        let uDic = getUserDic();
                        if (selected) {
                            uDic.push(key);
                        } else {
                            uDic = uDic.filter(d => d !== key);
                            window.utools.showNotification("自定义对照表取消后可以再次添加!")
                        }
                        userDic = uDic;
                        saveUserDic();
                        break;
                    case "cmd":
                        if (key == "addDic") {
                            let files = utools.showOpenDialog({
                                title: "选择emoji对照表文件(可多选)",
                                filters: [{ 'name': 'emoji对照表文件', extensions: ['json'] }],
                                properties: ['openFile', "multiSelections"]
                            })
                            console.info(files);
                            if (files) {
                                let uDic = getUserDic();
                                let changed = 0;
                                files.forEach(f => {
                                    if (uDic.includes(f)) return;
                                    uDic.push(f);
                                    changed++;
                                });
                                if (changed) {
                                    userDic = uDic;
                                    saveUserDic();
                                    window.utools.showNotification(`成功添加了${changed}个对照表文件。`);
                                    utools.redirect("emojisetting");
                                } else {
                                    window.utools.showNotification("对照表已经存在，没有添加!")
                                }
                            }
                        }

                        break;
                }

            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "设置，✅为有效"
        }
    }
}
