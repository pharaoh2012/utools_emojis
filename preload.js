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

// searchEmoji = (emoji, search) => {
//     let kw = search.toLowerCase();
//     for (var keyword of emoji.keywords) {
//         if (keyword.toLowerCase().includes(kw)) {
//             return true
//         }
//     }
//     return false
// }

// 列表模式
window.exports = {
    "emoji": {
        mode: "list",
        args: {
            enter: async (action, callbackSetList) => {
                changeStyle();
                emojis = require('./emojis.json')
                callbackSetList(emojis)
            },
            search: (action, searchWord, callbackSetList) => {
                searchWord = searchWord.trim();
                if (!searchWord) return callbackSetList(emojis);
                let kw = searchWord.toLowerCase().split(' ');
                callbackSetList(emojis.filter(x => {
                    for(let k of kw) {
                        if(k) {
                            if(!x.keyword.includes(k)) return false;
                        }
                    }
                    return true;
                }))
            },
            select: async (action, itemData, callbackSetList) => {
                utools.copyText(itemData.title);
                utools.hideMainWindow();
                utools.simulateKeyboardTap('v', utools.isWindows() ? 'ctrl' : 'command')
            },
            placeholder: "搜索，回车发送到活动窗口"
        }
    }
}
