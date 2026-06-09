export function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
}

export const arrayToMap = (arr) =>
    Object.fromEntries(
        arr.map(x => [x.label.toLowerCase(), x.value])
    )