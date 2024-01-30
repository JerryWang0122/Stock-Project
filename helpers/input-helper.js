const isValidDateFormat = (inputDate, isTransaction = false) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  if (!dateRegex.test(inputDate)) {
    return false // 不符合 YYYY-MM-DD 格式
  }

  const [year, month, day] = inputDate.split('-')
  const parsedDate = new Date(year, month - 1, day)
  if (isTransaction && (new Date() < parsedDate)) throw new Error('Future transaction cannot be accepted!')

  // 检查日期对象是否有效，并且年月日与输入一致
  return (
    parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day)
  )
}

module.exports = {
  isValidDateFormat
}
