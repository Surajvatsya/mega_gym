import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface WorkoutLogs extends Document {
    customerId:  ObjectId,
    exerciseId: string,
    timestamp: string,
    weight: number,
    setIndex: number,
    reps: number,
}

const workoutLogsSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    customerId :  mongoose.Schema.Types.ObjectId,
    timestamp: String,
    weight: Number,
    reps: Number,
    setIndex: Number,
    exerciseId: String,
});

const WorkoutLog = mongoose.model<WorkoutLogs>('workout_logs', workoutLogsSchema);

export default WorkoutLog;
