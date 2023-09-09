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
        color: rgba(0, 0, 0, 0.5);
        line-height: 3rem;
        font-size: 1rem;
        padding-left: 10px;
    `);
    document.head.appendChild(style);
}

let emojis_code, emojis;
let emojesClickCount;

utools.onPluginReady(() => {
    changeStyle();
})



// 列表模式
window.exports = {
    "emoji": {
        mode: "list",
        args: {
            enter: async (action, callbackSetList) => {
                //changeStyle();
                if (!emojis) {
                    console.log('init emojis')
                    emojis = require('./emojis.json')
                    greek = require('./greek_alphabet.json')
                    mathSym = require('./math_symbols.json')
                    pinyin = require('./pinyin.json')
                    numbers = require('./numbers.json')
                    emojis = emojis.concat(greek).concat(mathSym).concat(pinyin).concat(numbers)
                    emojesClickCount = utools.db.get("emojesClickCount");
                    if(!emojesClickCount) emojesClickCount = {
                        _id:"emojesClickCount",
                        c:{}
                    }
                    emojis.forEach(e => {
                        e.keyword += e.title;
                        e.c = emojesClickCount.c[e.title]??0;
                    });
                    emojis.sort((a,b)=>b.c-a.c);
                }

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
                        if(a.c == b.c)   return reg.test(a.keyword) ? -1 : 1;
                        return b.c-a.c;
                    });
                }
                callbackSetList(sRet);
            },
            select: async (action, itemData, callbackSetList) => {
                utools.copyText(itemData.title);
                itemData.c++;
                //将点击次数保存到数据库。
                if(itemData.c<50000) {
                    console.log("save to db:",itemData);
                    emojesClickCount.c[itemData.title]=itemData.c;
                    let r = utools.db.put(emojesClickCount);
                    if(r.ok)  emojesClickCount._rev = r.rev;
                    console.info(r);
                }
                utools.hideMainWindow();
                utools.simulateKeyboardTap('v', utools.isMacOs() ? 'command' : 'ctrl')
                emojis.sort((a,b)=>b.c-a.c);


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
                    emojis_code = require('./emojiscode.json')
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
                utools.copyText(itemData.description);
                //utools.copyText(JSON.stringify(action));
                utools.hideMainWindow();
                utools.simulateKeyboardTap('v', utools.isMacOs() ? 'command' : 'ctrl')
            },
            placeholder: "搜索，回车发送代码到活动窗口"
        }
    }
}
