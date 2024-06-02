import mongoose, { Schema, Document } from 'mongoose';

interface TemplateDesc extends Document {
    day:string,
    targetBody : string, 
    customerId : string, 
    exerciseDescId :  [mongoose.Schema.Types.ObjectId],
}

const templateDescSchema: Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    day:String,
    customerId : String, 
    exerciseDescId :  [mongoose.Schema.Types.ObjectId],
});

const TemplateDesc = mongoose.model<TemplateDesc>('templateDesc', templateDescSchema);

export default TemplateDesc;
