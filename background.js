let menu = null;
let latestX = 0;
let latestY = 0;

function getBlockedUsers() {
    return JSON.parse(localStorage.getItem("blocked_users"));
}

function setBlockedUsers(blocked_users) {
    localStorage.setItem("blocked_users", JSON.stringify(blocked_users));
}

function getBlockedWords() {
    return JSON.parse(localStorage.getItem("blocked_words"));
}

function setBlockedWords(blocked_words) {
    localStorage.setItem("blocked_words", JSON.stringify(blocked_words));
}

function getIsCommentBlocked() {
    return localStorage.getItem("comment_blocked");
}

function setIsCommentBlocked(is_blocked) {
    localStorage.setItem("comment_blocked", is_blocked);
}

function getIsRepliesBlocked() {
    return localStorage.getItem("replies_blocked");
}

function setIsRepliesBlocked(is_blocked) {
    localStorage.setItem("replies_blocked", is_blocked);
}

function getIsRepliesToBlockedUsersBlocked() {
    return localStorage.getItem("user_replies_blocked");
}

function setIsRepliesToBlockedUsersBlocked(is_blocked) {
    localStorage.setItem("user_replies_blocked", is_blocked);
}

chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [
            new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostEquals: 'www.youtube.com' },
            })
        ],
        actions: [
            new chrome.declarativeContent.ShowPageAction()
        ]
    }]);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getSettings") {
        sendResponse({
            users: getBlockedUsers(),
            words: getBlockedWords(),
            comment_blocked: getIsCommentBlocked(),
            user_replies_blocked: getIsRepliesToBlockedUsersBlocked(),
            replies_blocked: getIsRepliesBlocked()
        });
    } else if (request.method == "createMenu") {
        latestX = request.posX;
        latestY = request.posY;
        chrome.contextMenus.removeAll();
        menu = chrome.contextMenus.create({
            id: 'block_menuitem',
            title: 'このユーザーをブロック',
            contexts: ["page", "image", "link"]
        });
    } else if (request.method == "removeMenu") {
        chrome.contextMenus.removeAll();
    } else if (request.method == "addUser") {
        if (getBlockedUsers() == null) {
            setBlockedUsers([request.user_url]);
        } else {
            let blocked_users = new Set(getBlockedUsers());
            blocked_users.add(request.user_url);
            setBlockedUsers(Array.from(blocked_users.values()));
        }
    } else if (request.method == "addWord") {
        if (getBlockedWords() == null) {
            setBlockedWords([request.word]);
        } else {
            let blocked_words = new Set(getBlockedWords());
            blocked_words.add(request.word);
            setBlockedWords(Array.from(blocked_words.values()));
        }
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    if (info.status === 'complete') {
        if (tab.url.indexOf('https://www.youtube.com') !== -1) {
            chrome.tabs.sendMessage(tabId, { command: 'start' });
        }
    }
});

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "install") {
        localStorage.setItem("blocked_users", "[]");
        localStorage.setItem("blocked_words", "[]");
        localStorage.setItem("comment_blocked", "false");
        localStorage.setItem("user_replies_blocked", "true");
        localStorage.setItem("replies_blocked", "true");
        chrome.storage.local.set({ enabled: true });
    }
});

chrome.contextMenus.onClicked.addListener(function(info, tab, text, pos) {
    if (info.menuItemId == "block_menuitem") {
        chrome.tabs.sendMessage(tab.id, { command: "menu_block", posX: latestX, posY: latestY });
    }
});