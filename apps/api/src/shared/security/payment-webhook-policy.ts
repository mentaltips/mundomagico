export function toMoneyNumber(value: unknown) {
  if (value === null || value === undefined) return 0
  return Number(value)
}

export function isSameMoneyValue(left: unknown, right: unknown) {
  const leftNumber = toMoneyNumber(left)
  const rightNumber = toMoneyNumber(right)
  return leftNumber > 0 && Math.abs(leftNumber - rightNumber) < 0.01
}

