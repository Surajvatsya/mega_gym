import mongoose, { Schema, Document } from 'mongoose';

interface ExerciseDescription extends Document {
    templateId: String,
    exerciseId: string,
    createdAt: String,
    weight: number,
    reps: number
}

const exerciseDescriptionSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    exerciseId: String,
    templateId: String,
    createdAt: String,
    weight: Number,
    reps: Number
});

const ExerciseDescription = mongoose.model<ExerciseDescription>('exerciseDescription', exerciseDescriptionSchema);

export default ExerciseDescription;
