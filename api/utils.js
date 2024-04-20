const convertUtcToLongDateFormat = (utcTime) => {
  // Convert to Indian Standard Time
  // const abcstr = (utcTime).toString;
  // console.log("String(utcTime)",abcstr);
  const indianDate = utcTime.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  // console.log("indianDate", indianDate);

  // Extract date only
  const format = { day: "numeric", month: "long", year: "numeric" };
  const formattedDate = new Date(indianDate).toLocaleDateString(
    "en-IN",
    format,
  );
  // console.log("formattedDate", formattedDate);

  return formattedDate;
};

const addValidTillToCurrDate = (currentBeginDate, validTill) => {
  [day, month, year] = currentBeginDate.split(" ");
  const monthNameAndNumber = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };
  const monthNumber = monthNameAndNumber[month];

  const date = new Date(year, monthNumber, day);
  date.setMonth(date.getMonth() + validTill);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

module.exports = { convertUtcToLongDateFormat, addValidTillToCurrDate };
