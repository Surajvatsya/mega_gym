import mongoose, { Schema, Document } from 'mongoose';

interface Plan extends Document {
    gymId: mongoose.Schema.Types.ObjectId,
    customerId: mongoose.Schema.Types.ObjectId,
    duration: number,
    startDate: string,
    endDate: string,
    fee: number,
    discount: number,
}


const planSchema: Schema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    gymId: mongoose.Schema.Types.ObjectId,
    customerId: mongoose.Schema.Types.ObjectId,
    duration: Number,
    startDate: String,
    endDate: String,
    fee: Number,
    discount: Number,
});

const Plan = mongoose.model<Plan>('plan', planSchema);

export default Plan;

