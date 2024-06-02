import mongoose, { Schema, Document } from 'mongoose';

interface Exercise extends Document {
    name: String,
}

const exerciseSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name : String,
});

const Exercise = mongoose.model<Exercise>('exercise', exerciseSchema);

export default Exercise;
