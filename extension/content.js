chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'displayAnswer') {
    showPopup(msg.answer);
  }
});

function showPopup(answer) {
  const popup = document.createElement('div');
  popup.innerText = answer;
  popup.style.position = 'fixed';
  popup.style.top = '10px';
  popup.style.right = '10px';
  popup.style.padding = '10px 14px';
  popup.style.backgroundColor = '#222';
  popup.style.color = '#fff';
  popup.style.borderRadius = '8px';
  popup.style.zIndex = '10000';
  popup.style.fontFamily = 'Arial, sans-serif';
  popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  popup.style.fontSize = '14px';
  popup.style.maxWidth = '300px';
  popup.style.wordWrap = 'break-word';
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 5000);
}
