// Browser notification scheduler that sends daily reminders while the tab is open

let scheduledTimer = null;
let notifiedToday = false;

// Request notification permission from the browser
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Schedule a daily reminder notification at a specific time (e.g. "08:00")
export function scheduleReminder(timeStr) {
  // Clear any existing timer
  clearReminder();

  if (!timeStr || !('Notification' in window)) return;

  const [hours, minutes] = timeStr.split(':').map(Number);

  function checkAndNotify() {
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (now >= target && !notifiedToday) {
      notifiedToday = true;
      fireNotification();
    }

    // Reset notifiedToday flag at midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    if (now >= tomorrow) {
      notifiedToday = false;
    }
  }

  // Check immediately, then every 30 seconds
  checkAndNotify();
  scheduledTimer = setInterval(checkAndNotify, 30000);
}

// Clear any existing scheduled reminders
export function clearReminder() {
  if (scheduledTimer) {
    clearInterval(scheduledTimer);
    scheduledTimer = null;
  }
  notifiedToday = false;
}

// Display the browser notification
function fireNotification() {
  if (Notification.permission !== 'granted') return;

  const notification = new Notification('☽ HifzPath — Time for Hifz!', {
    body: 'Your daily Quran memorization session is waiting for you.',
    icon: '/favicon.png',
    tag: 'hifzpath-daily-reminder', // prevents duplicate notifications
    requireInteraction: false,
  });

  // Click notification → focus the app
  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000);
}
