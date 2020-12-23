$(document).ready(() => {
    chrome.storage.local.get("enabled", data => {
        if (data.enabled == true) {
            $("#message").text("Comment Blockerが有効です");
            $("#is_enabled").prop("checked", true);
        } else {
            $("#message").text("Comment Blockerが無効です");
            $("#is_enabled").prop("checked", false);
        }
    });
    $("#is_enabled").change(e => {
        chrome.storage.local.set({ enabled: $(e.target).prop("checked") });
        if ($(e.target).prop("checked")) {
            $("#message").text("Comment Blockerが有効です");
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { command: 'start' });
            });
        } else {
            $("#message").text("Comment Blockerが無効です");
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { command: 'stop' });
            });
        }
    });
    chrome.storage.local.get("page_count", data => $("#thispage").text(data.page_count));
    chrome.storage.local.get("page_count", data => {
        if (typeof data.page_count == "undefined") {
            chrome.storage.local.set({ page_count: 0 });
        } else {
            $("#thispage").text(data.page_count)
        }
    });
    chrome.storage.local.get("total_count", data => {
        if (typeof data.total_count == "undefined") {
            chrome.storage.local.set({ total_count: 0 });
        } else {
            $("#total").text(data.total_count);
        }
    });

    $("#options").click((e) => {
        chrome.runtime.openOptionsPage();
    });
})