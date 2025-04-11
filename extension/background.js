const ApiEndpoin = 'https://codexqa.onrender.com/send'
// const ApiEndpoin = 'http://localhost:3000/send';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sendScreenshot',
    title: 'Responder questão (selecionar área)',
    contexts: ['all'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sendScreenshot' && tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'displayAnswer',
      answer: 'Capturando a tela...',
    });
    console.log('Capturando a tela...');
    try {
      const rect = await new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'startSelection' },
          (response) => {
            resolve(response || null);
          }
        );
      });

      if (!rect) return;

      const screenshotUrl = await chrome.tabs.captureVisibleTab({
        format: 'png',
      });

      chrome.tabs.sendMessage(
        tab.id,
        {
          action: 'processScreenshot',
          screenshotUrl: screenshotUrl,
          rect: rect,
        },
        async (croppedImage) => {
          if (!croppedImage) return;

          const blob = dataURLtoBlob(croppedImage);
          const formData = new FormData();
          formData.append('image', blob, 'screenshot.png');

          chrome.tabs.sendMessage(tab.id, {
            action: 'displayAnswer',
            answer: 'Processando imagem...',
          });
          console.log('Processando imagem...');

          const response = await fetch(ApiEndpoin, {
            method: 'POST',
            body: formData,
          });

          const json = await response.json();

          chrome.tabs.sendMessage(tab.id, {
            action: 'displayAnswer',
            answer: json.answer || 'Resposta não encontrada',
          });
        }
      );
    } catch (error) {
      console.error('Erro:', error);
      chrome.tabs.sendMessage(tab.id, {
        action: 'displayAnswer',
        answer: 'Erro ao processar a solicitação',
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
