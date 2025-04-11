chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'displayAnswer') {
    showPopup(msg.answer);
  } else if (msg.action === 'startSelection') {
    startSelection(sendResponse);
    return true;
  } else if (msg.action === 'processScreenshot') {
    cropImage(msg.screenshotUrl, msg.rect).then(sendResponse);
    return true;
  }
});

function cropImage(imageUrl, rect) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );

      resolve(canvas.toDataURL());
    };
    img.src = imageUrl;
  });
}

function startSelection(sendResponse) {
  let overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.4);
    cursor: crosshair;
    z-index: 999999;
  `;

  let selection = document.createElement('div');
  selection.style.cssText = `
    position: absolute;
    border: 1px solid #ff0000;
    background: rgba(255,0,0,0.1);
  `;

  overlay.appendChild(selection);
  document.body.appendChild(overlay);

  let startX, startY, rect;

  const onMouseDown = (e) => {
    startX = e.clientX;
    startY = e.clientY;
    selection.style.left = startX + 'px';
    selection.style.top = startY + 'px';
    selection.style.width = '0';
    selection.style.height = '0';
  };

  const onMouseMove = (e) => {
    if (!startX || !startY) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = currentX - startX;
    const height = currentY - startY;

    selection.style.width = Math.abs(width) + 'px';
    selection.style.height = Math.abs(height) + 'px';
    selection.style.left = (width < 0 ? currentX : startX) + 'px';
    selection.style.top = (height < 0 ? currentY : startY) + 'px';
  };

  const onMouseUp = (e) => {
    const endX = e.clientX;
    const endY = e.clientY;

    rect = {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
    };

    document.body.removeChild(overlay);
    cleanup();
    sendResponse(rect);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
      cleanup();
      sendResponse(null);
    }
  };

  const cleanup = () => {
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
  };

  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);
}

function showPopup(answer) {
  console.log('Exibindo popup com a resposta:', answer);
  const existingPopup = document.getElementById('custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.id = 'custom-popup';
  popup.style.cssText = `
    position: fixed;
    top: 15%;
    left: 20%;
    transform: translate(-50%, -50%);
    width: 400px;
    max-width: 90%;
    background: #2d2d2d;
    color: white;
    border-radius: 8px;
    z-index: 100000;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #1a1a1a;
    cursor: move;
  `;

  const title = document.createElement('span');
  title.textContent = 'Resposta';
  title.style.cssText = `
    font-weight: bold;
    color: #fff;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0 6px;
  `;
  closeBtn.onclick = () => popup.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);

  const textArea = document.createElement('textarea');
  textArea.value = answer;
  textArea.style.cssText = `
    width: 100%;
    min-height: 150px;
    padding: 12px;
    background: #2d2d2d;
    color: white;
    border: none;
    resize: vertical;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    outline: none;
  `;
  textArea.readOnly = true;

  const toolbar = document.createElement('div');
  toolbar.style.cssText = `
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px;
    background: #1a1a1a;
    gap: 8px;
  `;

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copiar';
  copyBtn.style.cssText = `
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;
  `;
  copyBtn.onmouseover = () => (copyBtn.style.background = '#45a049');
  copyBtn.onmouseout = () => (copyBtn.style.background = '#4CAF50');
  copyBtn.onclick = () => {
    textArea.select();
    document.execCommand('copy');

    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copiado!';
    copyBtn.style.background = '#45a049';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '#4CAF50';
    }, 2000);
  };

  toolbar.appendChild(copyBtn);

  popup.appendChild(header);
  popup.appendChild(textArea);
  popup.appendChild(toolbar);
  document.body.appendChild(popup);

  makeDraggable(popup, header);
}

function makeDraggable(element, handle) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  handle.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = element.offsetTop - pos2 + 'px';
    element.style.left = element.offsetLeft - pos1 + 'px';
    element.style.transform = 'none';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
