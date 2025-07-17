chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scanSelection",
    title: "Select Area to Scan QR Code",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scanSelection") {
    chrome.tabs.sendMessage(tab.id, { action: "startSelection" });
  }
});
