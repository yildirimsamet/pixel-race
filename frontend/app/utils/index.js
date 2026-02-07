export const closestFive = (num) => {
  if (num <= 5) return 5;
  if (num >= 100) return 100;

  const min = Math.floor(num / 5) * 5;
  const max = Math.ceil(num / 5) * 5;

  if (num - min <= max - num) {
    return min;
  } else {
    return max;
  }
}

