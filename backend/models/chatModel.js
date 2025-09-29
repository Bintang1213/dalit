import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      match: /^user_[a-f\d]{24}_admin$/,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "messages.senderType",
        },
        senderType: {
          type: String,
          required: true,
          enum: ["User", "Admin"],
        },
        senderName: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
          maxLength: 1000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index untuk performa yang lebih baik
chatSchema.index({ conversationId: 1 });
chatSchema.index({ userId: 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ isActive: 1 });

chatSchema.pre("save", function (next) {
  if (this.isModified("messages")) {
    this.lastMessageAt = new Date();
  }
  next();
});

chatSchema.virtual("lastMessage").get(function () {
  return this.messages && this.messages.length > 0
    ? this.messages[this.messages.length - 1]
    : null;
});

chatSchema.methods.addMessage = function (messageData) {
  this.messages.push({
    senderId: messageData.senderId,
    senderType: messageData.senderType,
    senderName: messageData.senderName,
    message: messageData.message.trim(),
    timestamp: new Date(),
  });
  this.lastMessageAt = new Date();
  return this.save();
};

chatSchema.statics.findOrCreateConversation = async function (
  conversationId,
  userData,
) {
  let conversation = await this.findOne({ conversationId });

  if (!conversation) {
    const match = conversationId.match(/^user_([a-f\d]{24})_admin$/);
    if (!match) {
      throw new Error("Invalid conversationId format");
    }

    const userId = match[1];

    conversation = new this({
      conversationId,
      userId,
      userName: userData.userName || "User",
      messages: [],
      isActive: true,
      lastMessageAt: new Date(),
    });

    await conversation.save();
  }

  return conversation;
};

const chatModel = mongoose.models.chat || mongoose.model("chat", chatSchema);
export default chatModel;
