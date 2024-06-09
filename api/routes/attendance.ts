import Attendance from "../model/attendance";
import Customer from "../model/customer";
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
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (!lifeTImeAttandance || lifeTImeAttandance.length === 0 || !lifeTImeAttandance[0].days) {
            console.log("LifeTImeAttandance is empty");
            const resp = {
                startMonth: null,
                startYear: null,
                startDay: null,
                endMonth: null,
                endYear: null,
                data: []
            }
            return res.status(200).json(resp);
        }
        const lifeTImeAttandance_ = lifeTImeAttandance.map((att) => {
            const attendanceInNumber = att.days.toString(2).split('').map(Number).reverse();
            return {
                month: months[att.month-1],
                year: att.year,
                days: attendanceInNumber
            }
        })

        const sortedAttendance = lifeTImeAttandance_.sort(customSort);
        const startYearAndMonth = sortedAttendance[0];
        const lastYearAndMonth = sortedAttendance[sortedAttendance.length - 1];
        const startDay = await Customer.findById(customerId, { _id: 0, registeredAt: 1 });
        if (startDay) {
            const startDate = startDay.registeredAt.split(" ");
            const resp: LifeTimeAttendance = {
                startMonth: startYearAndMonth.month,
                startYear: startYearAndMonth.year,
                startDay: Number(startDate[0]),
                endMonth: lastYearAndMonth.month,
                endYear: lastYearAndMonth.year,
                data: sortedAttendance
            }
            res.status(200).json(resp);
        }
        else {
            const resp: LifeTimeAttendance = {
                startMonth: startYearAndMonth.month,
                startYear: startYearAndMonth.year,
                startDay: null,
                endMonth: lastYearAndMonth.month,
                endYear: lastYearAndMonth.year,
                data: sortedAttendance
            }
            res.status(200).json(resp);
        }
    }
    catch (error) {
        console.log(error);
        const resp = {
            startMonth: null,
            startYear: null,
            startDay: null,
            endMonth: null,
            endYear: null,
            data: []
        }
        res.status(500).json(resp);
    }
})

module.exports = router;