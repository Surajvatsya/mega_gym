export function convertUtcToLongDateFormat(utcTime: Date): string {
    const indianDate = utcTime.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
    });
    const format: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    const formattedDate = new Date(indianDate).toLocaleDateString(
        "en-IN",
        format,
    );

    return formattedDate;
};

export function addValidTillToCurrDate(currentBeginDate: string, validTill: number): string {
    const [day, month, year] = currentBeginDate.split(" ");
    const monthNameAndNumber: { [key: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const monthNumber = monthNameAndNumber[month];

    const date = new Date(parseInt(year), monthNumber, parseInt(day));
    date.setMonth(date.getMonth() + validTill);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};


export function getMonthFromNumber(number: number) {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), number).toLocaleString("en-US", {
        month: "long",
    });
}

