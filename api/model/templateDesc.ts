import mongoose, { Schema, Document } from 'mongoose';

interface TemplateDesc extends Document {
    day:string,
    customerId : string
}

const templateDescSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    day:String,
    customerId : String
});

const TemplateDesc = mongoose.model<TemplateDesc>('templateDesc', templateDescSchema);

export default TemplateDesc;
