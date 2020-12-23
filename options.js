$(document).ready(function() {
    $('.content_title > a').eq(0).addClass("selected");
    $('.page').eq(0).css('display', 'block');
    $("#version").text(chrome.runtime.getManifest().version);

    let users, words;
    try {
        users = chrome.extension.getBackgroundPage().getBlockedUsers();
        words = chrome.extension.getBackgroundPage().getBlockedWords();
        $(".checkbox_settings").each((index, element) => {
            if (chrome.extension.getBackgroundPage()["get" + $(element).attr("id")]() == "true") {
                $(element).prop("checked", true);
            } else {
                $(element).prop("checked", false);
            }
        });
    } catch {
        alert("Error occured")
        location.reload();
    }

    if (users != null) {
        for (let user of users) {
            addUser(user);
        }
    }

    if (words != null) {
        let set_words = new Set(words);
        for (let word of set_words) {
            addWord(word);
        }
    }

    $(".list_input").keydown(e => {
        if (e.key == "Enter") {
            $(e.target.parentElement).find(".btn-square-so-pop").trigger("click");
        }
    });

    $('#content_titles').click(function(e) {

        if ($(e.target).is("a")) {
            $('.content_title > a').removeClass("selected");
            $(e.target).addClass("selected");

            var clicked_index = $("a", this).index(e.target);
            $('.page').css('display', 'none');
            $('.page').eq(clicked_index).fadeIn();

        }

        $(this).blur();
        return false;

    });

    function removeUser(e) {
        let tag = e.target.parentElement.parentElement.parentElement;
        if (tag.tagName.toLowerCase() == "li") {
            let blocked_users = chrome.extension.getBackgroundPage().getBlockedUsers();
            let text = tag.getElementsByTagName("a")[0].getAttribute("href");
            chrome.extension.getBackgroundPage().setBlockedUsers(blocked_users.filter(n => n != text));
            tag.remove();
        }
    }

    function removeWord(e) {
        let tag = e.target.parentElement.parentElement.parentElement;
        if (tag.tagName.toLowerCase() == "li") {
            let blocked_words = chrome.extension.getBackgroundPage().getBlockedWords();
            let text = tag.getElementsByTagName("span")[0].textContent;
            chrome.extension.getBackgroundPage().setBlockedWords(blocked_words.filter(n => n != text));
            tag.remove();
        }
    }

    $("#add_user").click((e) => {
        const text = e.target.parentElement.parentElement.querySelector(".list_input").value;
        if (text == "") {
            return;
        } else if (text.match(/https:\/\/(www\.)?youtube\.com\/channel|user\/.+/g) == null) {
            Swal.fire({
                icon: 'error',
                title: '不正なURLです',
                text: 'ブロックしたいチャンネルのURLを指定してください。'
            });
            return;
        }
        let list = e.target.parentElement.parentElement.querySelector(".item_list");
        for (let x of list.getElementsByClassName("user_name")) {
            if (x.getAttribute("href") == text) {
                Swal.fire({
                    icon: 'error',
                    title: '重複しています',
                    text: 'そのチャンネルは既に登録されています。'
                });
                return;
            }
        }
        addUser(text);
        if (chrome.extension.getBackgroundPage().getBlockedUsers() == null) {
            chrome.extension.getBackgroundPage().setBlockedUsers([text]);
        } else {
            let blocked_users = chrome.extension.getBackgroundPage().getBlockedUsers();
            blocked_users.push(text);
            chrome.extension.getBackgroundPage().setBlockedUsers(blocked_users);
        }
        e.target.parentElement.parentElement.querySelector(".list_input").value = "";
    });

    $("#add_word").click((e) => {
        const text = e.target.parentElement.parentElement.querySelector(".list_input").value;
        if (text == "") {
            return;
        }
        let list = e.target.parentElement.parentElement.querySelector(".item_list");
        for (let x of list.getElementsByClassName("word")) {
            if (x.textContent == text) {
                Swal.fire({
                    icon: 'error',
                    title: '重複しています',
                    text: 'その語句は既に登録されています。'
                });
                return;
            }
        }
        addWord(text);
        if (chrome.extension.getBackgroundPage().getBlockedWords() == null) {
            chrome.extension.getBackgroundPage().setBlockedWords([text]);
        } else {
            let blocked_words = chrome.extension.getBackgroundPage().getBlockedWords();
            blocked_words.push(text);
            chrome.extension.getBackgroundPage().setBlockedWords(blocked_words);
        }
        e.target.parentElement.parentElement.querySelector(".list_input").value = "";
    });

    $(".checkbox_settings").change(e => {
        console.log("set" + $(e.target).attr("id"));
        chrome.extension.getBackgroundPage()["set" + $(e.target).attr("id")]($(e.target).prop("checked"));
    });

    function addUser(user) {
        let listbox = document.getElementById("blocked_users");
        let tmp = document.querySelector("#hidden_item .users_list").cloneNode(true);
        getUserInfo(user).then(result => {
            $(tmp).find(".user_name").text(result.username).attr("href", user);
            $(tmp).find(".user_icon").attr("src", result.imgurl);
            $(tmp).find(".remove").click(e => removeUser(e));
            listbox.appendChild(tmp);
        }).catch(e => {
            $(tmp).find(".user_name").text(e.message).attr("href", user).css("color", "gray");
            $(tmp).find(".remove").click(e => removeUser(e));
            listbox.appendChild(tmp);
        });
    }

    function addWord(text) {
        let listbox = document.getElementById("blocked_words");
        let tmp = document.querySelector("#hidden_item .words_list").cloneNode(true);
        $(tmp).find(".word").text(text);
        $(tmp).find(".remove").click(e => removeWord(e));
        listbox.appendChild(tmp);
    }

    function getUserInfo(channel_url) {
        return fetch(channel_url).then(response => {
            if (response.ok) {
                return response.text();
            } else {
                return Promise.reject(new Error("[情報を取得できません]"));
            }
        }).then(text => {
            let doc = new DOMParser().parseFromString(text, "text/html");
            let username = doc.querySelector("meta[itemprop=name]").getAttribute("content");
            let imgurl = text.split('"avatar":{"thumbnails":[')[1].split(',{')[0];
            imgurl = JSON.parse(imgurl)["url"];
            return {
                "username": username,
                "imgurl": imgurl
            }
        });
    }
}); //end ready
/*
"avatar":{"thumbnails": - },"subscribeButton"
"avatar":{"thumbnails":[ - ,{
*/