// Show a confetti animation when the user hits a milestone
export function triggerConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#a8c5a0', '#cae6fb', '#e4b660', '#e8c5b0', '#cdebc4', '#ffdea6'];
  const shapes = ['circle', 'square', 'triangle'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.8}s`;
    piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;

    if (shape === 'circle') {
      piece.style.borderRadius = '50%';
      piece.style.background = color;
    } else if (shape === 'square') {
      piece.style.background = color;
      piece.style.borderRadius = '2px';
    } else {
      piece.style.width = '0';
      piece.style.height = '0';
      piece.style.borderLeft = '5px solid transparent';
      piece.style.borderRight = '5px solid transparent';
      piece.style.borderBottom = `10px solid ${color}`;
      piece.style.background = 'none';
    }

    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 3500);
}

// Display a temporary toast notification message on the screen
export function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
