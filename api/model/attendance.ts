import mongoose, { Schema, Document } from 'mongoose';

interface Attendance extends Document {
    customerId: mongoose.Schema.Types.ObjectId,
    month: number,
    year: number,
    days: number,
}

const attendanceSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    customerId :  mongoose.Schema.Types.ObjectId,
    year: Number,
    month: Number,
    days: Number,
});

const Attendance = mongoose.model<Attendance>('attendance', attendanceSchema);

export default Attendance;
