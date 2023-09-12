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

let emojis_code, emojis;
let emojesClickCount;
let recentTitles;
let options;

utools.onPluginReady(() => {
    changeStyle();
})

copyOnly = () => {
    options = "copyOnly";
    window.utools.dbStorage.setItem('options', options)
    window.utools.showNotification("当前模式为" + options)
}

copyPaste = () => {
    options = "copyPaste";
    window.utools.dbStorage.setItem('options', options)
    window.utools.showNotification("当前模式为" + options)
}

showMode = () => {
    window.utools.showNotification("当前模式为" + options)
}

const optActions = {
    copyOnly: copyOnly,
    copyPaste: copyPaste,
    showMode: showMode
}

// 列表模式
window.exports = {
    "emoji": {
        mode: "list",
        args: {
            enter: async (action, callbackSetList) => {
                if (!emojis) {
                    console.log('init emojis')
                    emojis = require('./json/emojis.json')
                    greek = require('./json/greek_alphabet.json')
                    mathSym = require('./json/math_symbols.json')
                    pinyin = require('./json/pinyin.json')
                    numbers = require('./json/numbers.json')
                    opts = require('./json/options.json')
                    emojis = emojis.concat(greek).concat(mathSym).concat(pinyin).concat(opts).concat(numbers)
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
                options = window.utools.dbStorage.getItem('options') ?? "copyPaste"
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
                if ('optid' in itemData) {
                    console.log(itemData)
                    optid = itemData['optid']
                    optActions[optid]()
                    return
                }
                utools.copyText(itemData.title);
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
                utools.hideMainWindow();
                if (options == "copyPaste") {
                    utools.simulateKeyboardTap('v', utools.isMacOs() ? 'command' : 'ctrl')
                }
                emojis.sort((a, b) => b.c - a.c);
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
                utools.hideMainWindowTypeString(itemData.description);
                // utools.copyText(itemData.description);
                // //utools.copyText(JSON.stringify(action));
                // utools.hideMainWindow();
                // utools.simulateKeyboardTap('v', utools.isMacOs() ? 'command' : 'ctrl')
            },
            placeholder: "搜索，回车发送代码到活动窗口"
        }
    }
}
