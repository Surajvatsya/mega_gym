import Attendance from "../model/attendance";
import express, { Request, Response } from 'express';
const router = express.Router();
const verifyToken = require("../middleware/jwt");
import { JWToken } from '../../requests';
import { LifeTimeAttendance } from "../../responses";
const jwt = require("jsonwebtoken");

export const getThisWeekAttendance = async (customerId: any) => {
    const thisMonth = new Date().getMonth() + 1;
    const thisYear = new Date().getFullYear();
    const noOfDaysInCurrWeek = new Date().getDay(); // Thursday -> 4 
    const todayDate = new Date().getDate(); // 30 May
    const startingDateOfWeek = todayDate - (noOfDaysInCurrWeek - 1); // 30 - (3) = 27
    const lastDayOfWeek = startingDateOfWeek + 6; // (33) -> 1 jun

    const attendance = await Attendance.find({ customerId, year: thisYear, month: thisMonth })
    if (!attendance || attendance.length === 0 || !attendance[0].days) {
        console.log("Attendance is null", attendance);

    } else {
        const binaryString = attendance[0].days.toString(2).split('').reverse().join('');
        return binaryString.slice(startingDateOfWeek - 1, lastDayOfWeek + 1);
    }
}

const customSort = (a: any, b: any): number => {
    if (a.year !== b.year)
        return b.year - a.year;
    return b.month - a.month;
}

//from users side
router.get("/getLifeTimeAttendance", verifyToken, async (req: any, res: Response<LifeTimeAttendance>) => {
    try {
        const customerId = req.jwt.ownerId;
        const lifeTImeAttandance = await Attendance.find({ customerId }, { _id: 0, customerId: 0, __v: 0 });
        if (!lifeTImeAttandance || lifeTImeAttandance.length === 0 || !lifeTImeAttandance[0].days) {
            console.log("LifeTImeAttandance is empty");
            return res.status(404).json({ sortedAttendance: null });

        }
        const lifeTImeAttandance_ = lifeTImeAttandance.map((att)=>{
            const attendanceInString = att.days.toString(2).split('').reverse().join('');
            return{
                month : att.month,
                year : att.year,
                days : attendanceInString
            }
        })

        const sortedAttendance = lifeTImeAttandance_.sort(customSort);

        console.log(lifeTImeAttandance);

        res.status(200).json({sortedAttendance});

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ sortedAttendance: null });

    }
})

module.exports = router;