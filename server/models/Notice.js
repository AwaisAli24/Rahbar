import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Notice content is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    audience: {
      type: String,
      enum: ['All', 'Students', 'Faculty'],
      default: 'All',
    },
    urgency: {
      type: String,
      enum: ['Normal', 'High', 'Urgent'],
      default: 'Normal',
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for faster retrieval by audience and creation date
noticeSchema.index({ audience: 1, createdAt: -1 });

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
