chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sendScreenshot',
    title: 'Responder questão (enviar imagem)',
    contexts: ['all'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sendScreenshot' && tab.id) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });

      const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
      });

      chrome.tabs.sendMessage(tab.id, {
        action: 'displayAnswer',
        answer: 'Aguarde...',
      });

      const blob = dataURLtoBlob(screenshotUrl);
      const formData = new FormData();
      formData.append('image', blob, 'screenshot.png');

      const response = await fetch('http://localhost:3000/send', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Erro ao enviar a imagem:', await response.json());
        chrome.tabs.sendMessage(tab.id, {
          action: 'displayAnswer',
          answer: 'Erro ao enviar a imagem.',
        });

        throw new Error('Erro ao enviar a imagem para o servidor');
      }

      const json = await response.json();
      console.log('Resposta recebida:', json.answer);

      chrome.tabs.sendMessage(tab.id, {
        action: 'displayAnswer',
        answer: json.answer || 'Resposta não encontrada.',
      });
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      chrome.tabs.sendMessage(tab.id, {
        action: 'displayAnswer',
        answer: 'Erro ao enviar a imagem.',
      });
    }
  }
});

function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(',');
  const byteString = atob(parts[1]);
  const mimeString = parts[0].match(/:(.*?);/)[1];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
