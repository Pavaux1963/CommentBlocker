(() => {
    let timer;
    let ban_words;
    let current_replyid = 0;
    let reply_blocklist = [];
    chrome.storage.local.set({ page_count: 0 });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.command == "start") {
            chrome.runtime.sendMessage({ method: "getSettings" },
                function(response) {
                    chrome.storage.local.get("enabled", data => {
                        if (data.enabled == true) {
                            startBlocking(response);
                        }
                    });
                }
            );
        } else if (request.command == "stop") {
            stopBlocking();
        } else if (request.command == "menu_block") {
            let comment = getCommentElement(document.elementFromPoint(request.posX, request.posY));
            let user_id = comment.querySelector("a#author-text").getAttribute("href");
            let user_url = "https://www.youtube.com" + user_id;
            chrome.runtime.sendMessage({ method: "addUser", user_url: user_url });
            clearInterval(timer);
            for (let element of document.querySelectorAll(".cb-checked")) {
                element.classList.remove("cb-checked");
            }
            chrome.runtime.sendMessage({ method: "getSettings" },
                function(response) {
                    chrome.storage.local.get("enabled", data => {
                        if (data.enabled == true) {
                            startBlocking(response);
                        }
                    });
                }
            );
        }
    });

    document.addEventListener("mousedown", e => {
        if (e.which == 3) {
            let element = getCommentElement(e.target);
            if (element == null) {
                console.log("removeMenu");
                chrome.runtime.sendMessage({ method: "removeMenu" });
            } else {
                console.log("createMenu");
                chrome.runtime.sendMessage({ method: "createMenu", posX: e.clientX, posY: e.clientY });
            }
        }
    });

    function startBlocking(r) {
        if (r.comment_blocked == "true") {
            document.getElementById("comments").style.display = "none";
            return;
        }
        for (let blocked of document.getElementsByClassName("cb-blocked")) {
            blocked.style.display = "none";
        }
        ban_words = new Set(r.words);
        timer = setInterval(() => {
            for (let hasreply of document.querySelectorAll("ytd-comment-thread-renderer.ytd-item-section-renderer div#expander:not([data-cb-hasreply-id])")) {
                hasreply.setAttribute("data-cb-hasreply-id", current_replyid);
                reply_blocklist[current_replyid] = new Set();
                current_replyid++;
            }
            for (let user of r.users) {
                user = user.replace("https://www.youtube.com", "");
                //ブロックしたユーザーをチェック
                for (let x of document.querySelectorAll("#author-text[href='" + user + "']:not(.cb-blocked-user)")) {
                    let target = x.parentNode.parentNode.parentNode.parentNode.parentNode;
                    if (target.parentNode.getAttribute("id") == "loaded-replies") {
                        if (r.user_replies_blocked == "true") {
                            reply_blocklist[parseInt(target.parentNode.parentNode.parentNode.getAttribute("data-cb-hasreply-id"))].add(x.querySelector("span").textContent.trim());
                        }
                    } else {
                        target = target.parentNode;
                    }
                    target.style.display = "none";
                    x.classList.add("cb-blocked-user");
                    addPageCount();
                    addTotalCount();
                    target.classList.add("cb-blocked");
                }
            }
            //禁止語句のチェック
            for (let comment of document.querySelectorAll("yt-formatted-string#content-text:not(.cb-blocked-word)")) {
                for (let word of ban_words) {
                    if (comment.textContent.indexOf(word) !== -1) {
                        let target = comment.parentNode.parentNode.parentNode.parentNode.parentNode;
                        if (target.parentNode.getAttribute("id") == "loaded-replies") {
                            if (r.replies_blocked == "true") {
                                reply_blocklist[parseInt(target.parentNode.parentNode.parentNode.getAttribute("data-cb-hasreply-id"))].add(target.querySelector("#author-text span").textContent.trim());
                            }
                        } else {
                            target = target.parentNode;
                        }
                        target.style.display = "none";
                        comment.classList.add("cb-blocked-word");
                        addPageCount();
                        addTotalCount();
                        target.classList.add("cb-blocked");
                    }
                }
            }
            //ブロックしたコメントに対する返信をチェック
            if (r.user_replies_blocked == "true") {
                for (let comment of document.querySelectorAll("ytd-comment-renderer[is-reply]:not(.cb-blocked) yt-formatted-string#content-text:not(.cb-checked)")) {
                    let target = comment.parentNode.parentNode.parentNode.parentNode.parentNode;
                    let comment_blocklist = reply_blocklist[parseInt(target.parentNode.parentNode.parentNode.getAttribute("data-cb-hasreply-id"))];
                    for (let r_word of comment_blocklist) {
                        if (comment.textContent.indexOf(r_word) !== -1) {
                            if (r.replies_blocked == "true") {
                                comment_blocklist.add(target.querySelector("#author-text span").textContent.trim());
                            }
                            target.style.display = "none";
                            addPageCount();
                            addTotalCount();
                            target.classList.add("cb-blocked");
                        }
                    }
                    comment.classList.add("cb-checked");
                }
            }
        }, 200);
    }

    function stopBlocking() {
        clearInterval(timer);
        for (let blocked of document.getElementsByClassName("cb-blocked")) {
            blocked.style.display = "block";
        }
    }

    function addTotalCount() {
        chrome.storage.local.get("total_count", data => {
            if (typeof data.total_count == "undefined") {
                chrome.storage.local.set({ total_count: 0 });
            } else {
                chrome.storage.local.set({ total_count: data.total_count + 1 });
            }
        });
    }

    function addPageCount() {
        chrome.storage.local.get("page_count", data => {
            if (typeof data.page_count == "undefined") {
                chrome.storage.local.set({ page_count: 0 });
            } else {
                chrome.storage.local.set({ page_count: data.page_count + 1 });
            }
        });
    }

    function getCommentElement(element) {
        while (element) {
            if ((element.tagName.toLowerCase() == "ytd-comment-thread-renderer" && element.classList.contains("ytd-item-section-renderer")) ||
                (element.tagName.toLowerCase() == "ytd-comment-renderer" && element.classList.contains("ytd-comment-replies-renderer"))) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }
})();