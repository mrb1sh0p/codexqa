chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sendScreenshot',
    title: 'Responder questão (enviar imagem)',
    contexts: ['all'],
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'displayAnswer') {
    showToast(msg.answer);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sendScreenshot' && tab.id) {
    console.log('Capturando a tela...');
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

      const response = await fetch('https://codexqa.onrender.com/send', {
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

function showToast(message) {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.padding = '10px 20px';
  toast.style.backgroundColor = 'rgba(0,0,0,0.8)';
  toast.style.color = '#fff';
  toast.style.fontSize = '14px';
  toast.style.borderRadius = '5px';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  toast.style.zIndex = '10000';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.5s ease';

  document.body.appendChild(toast);

  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  toast.classList.add('toast');
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 30000);
}
