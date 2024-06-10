import mongoose, { Schema, Document } from 'mongoose';

interface Template extends Document {
    day: string,
    customerId: string,
}

const templateSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    day: String,
    customerId: String,
});

const Template = mongoose.model<Template>('template', templateSchema);

export default Template;
