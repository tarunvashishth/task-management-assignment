import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    creator_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignee_id: { type: Schema.Types.ObjectId, ref: 'User' },
    deadline: { type: Date },
    version: { type: Number, default: 0 },
  },
  { timestamps: true },
);

taskSchema.index({ assignee_id: 1, createdAt: -1, _id: -1 });
taskSchema.index({ creator_id: 1 });
taskSchema.index({ status: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
