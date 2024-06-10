import mongoose, { Schema, Document } from 'mongoose';

interface ExerciseDescription extends Document {
    templateId: mongoose.Schema.Types.ObjectId,
    exerciseId: string,
    exerciseName: string,
    setNumber: number,
    weight: number,
    reps: number
}

const exerciseDescriptionSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    templateId: mongoose.Schema.Types.ObjectId,
    exerciseId: String,
    exerciseName: String,
    setNumber: Number,
    weight: Number,
    reps: Number
});

const ExerciseDescription = mongoose.model<ExerciseDescription>('exercisedescription', exerciseDescriptionSchema);

export default ExerciseDescription;
