import Attendance from "../model/attendance";
import express, { Request, Response } from 'express';
const router = express.Router();
const verifyToken = require("../middleware/jwt");
import { LifeTimeAttendance } from "../../responses";
const jwt = require("jsonwebtoken");

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
            return res.status(404).json({ sortedAttendance: [] });

        }
        const lifeTImeAttandance_ = lifeTImeAttandance.map((att) => {
            const attendanceInString = att.days.toString(2).split('').reverse().join('');
            return {
                month: att.month,
                year: att.year,
                days: attendanceInString
            }
        })

        const sortedAttendance = lifeTImeAttandance_.sort(customSort);

        console.log(lifeTImeAttandance);

        res.status(200).json({ sortedAttendance });

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ sortedAttendance: [] });

    }
})

module.exports = router;