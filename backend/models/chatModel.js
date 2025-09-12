import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true
  },
  userName: { 
    type: String,
    required: false,
  },
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'messages.senderType'
    },
    senderType: {
      type: String,
      required: true,
      enum: ['User', 'Admin']
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  }]
}, {
  timestamps: true
});

const chatModel = mongoose.models.chat || mongoose.model('chat', chatSchema);
export default chatModel;
