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
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const monthNumber = monthNameAndNumber[month];

  const date = new Date(year, monthNumber, day);
  date.setMonth(date.getMonth() + validTill);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function getMonthFromNumber(number)
{
  const currentDate = new Date();
  return new Date(currentDate.getFullYear(), number).toLocaleString('en-US', { month: 'long' });
}


module.exports = { convertUtcToLongDateFormat, addValidTillToCurrDate,getMonthFromNumber };
