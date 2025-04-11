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
  const existingPopup = document.getElementById('custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement('div');
  popup.innerText = answer;
  popup.id = 'custom-popup';
  popup.style.cssText = `
    display: block;
    position: fixed;
    top: 25%;
    left: 10%;
    transform: translate(-50%, -50%);
    padding: 12px 16px;
    background: #2d2d2d;
    color: white;
    border-radius: 8px;
    z-index: 100000;
    font-family: Arial;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    max-width: 300px;
    font-size: 14px;
    line-height: 1.4;
    cursor: pointer;
  `;

  popup.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  document.body.appendChild(popup);
}
