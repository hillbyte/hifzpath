// Core SM-2 spaced repetition algorithm implementation.
// Ratings scale: 0 (Again), 1 (Hard), 2 (Good), 3 (Easy)
// Calculates how many days until the next review based on the rating.
export function sm2(rating, currentInterval, currentEaseFactor) {
  let newInterval;
  let newEase;

  if (rating < 2) {
    // If they failed to remember, reset the interval to 1 day and drop the ease factor slightly
    newInterval = 1;
    newEase = Math.max(1.3, currentEaseFactor - 0.2);
  } else {
    // If they remembered, increase the ease factor and push out the interval
    newEase =
      currentEaseFactor +
      (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
    newEase = Math.max(1.3, newEase);

    if (currentInterval <= 1) {
      newInterval = 1;
    } else if (currentInterval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEase);
    }

    // Give a small boost if they got it right on the very first try
    if (currentInterval <= 1 && rating >= 2) {
      newInterval = rating === 3 ? 4 : 1;
    }
  }

  return { interval: newInterval, easeFactor: newEase };
}

// Helper to figure out the exact date for the next review
export function nextReviewDate(intervalDays) {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  return d;
}

// Figure out the current learning status based on their rating and interval.
// Once an ayah is pushed out past a week, we consider it "memorised".
export function deriveStatus(rating, newInterval) {
  if (rating < 2) return 'learning';
  if (newInterval >= 7) return 'memorised';
  return 'learning';
}
