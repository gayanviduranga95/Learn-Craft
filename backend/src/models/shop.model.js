import mongoose from "mongoose";

const userInventorySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ["frame", "theme", "accessory"],
    },
    name: {
      type: String,
      required: true,
    },
    pricePaid: {
      type: Number,
      default: 0,
    },
    isEquipped: {
      type: Boolean,
      default: false,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate purchases of the same cosmetic item
userInventorySchema.index(
  { student: 1, itemId: 1 },
  { unique: true }
);

export const UserInventory = mongoose.model(
  "UserInventory",
  userInventorySchema
);

export default UserInventory;
