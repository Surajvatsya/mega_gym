import Attendance from "../model/attendance";

export const getThisWeekAttendance = async (customerId : any ) => {
    const thisMonth = new Date().getMonth() + 1;
    const thisYear = new Date().getFullYear();
    const  noOfDaysInCurrWeek = new Date().getDay(); // Thursday -> 4 
    const todayDate = new Date().getDate(); // 30 May
    const startingDateOfWeek = todayDate - (noOfDaysInCurrWeek - 1); // 30 - (3) = 27
    const lastDayOfWeek = startingDateOfWeek + 6; // (33) -> 1 jun

    const attendance = await Attendance.find({customerId, year : thisYear, month : thisMonth })
    if (!attendance || attendance.length === 0 || !attendance[0].days){
        console.log("Attendance is null", attendance);
        
    }else{
        const binaryString = attendance[0].days.toString(2).split('').reverse().join('');
        return binaryString.slice(startingDateOfWeek-1,lastDayOfWeek+1);
    }
}
