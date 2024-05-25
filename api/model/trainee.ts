import mongoose, { Schema, Document } from 'mongoose';

interface Trainee extends Document {
    gymId: mongoose.Schema.Types.ObjectId,
    name: String,
    experience: Number,
}

const traineeSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    gymId: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
    },
    experience: Number,
});

const Trainee = mongoose.model<Trainee>('trainee', traineeSchema);

export default Trainee;

