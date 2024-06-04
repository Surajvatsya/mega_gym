import mongoose, { Schema, Document } from 'mongoose';

interface Template extends Document {
    day:number,
    customerId : string, 
}

const templateSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    day:Number,
    customerId : String, 
});

const Template = mongoose.model<Template>('template', templateSchema);

export default Template;
