import mongoose from "mongoose";
import User from "../models/user.model.js";
import UserInventory from "../models/shop.model.js";
import CoinTransaction from "../models/coin-transaction.model.js";
import UserAchievement from "../models/achievement.model.js";
import { awardReward } from "../services/reward.service.js";
import { SHOP_CATALOG } from "../config/gamification.config.js";

/**
 * 1. Get Shop Catalog with ownership state
 */
export async function getShopCatalog(req, res, next) {
  try {
    const studentId = req.auth.userId;

    const [user, inventory] = await Promise.all([
      User.findById(studentId).lean(),
      UserInventory.find({ student: studentId }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const ownedItemIds = new Set(inventory.map((i) => i.itemId));

    const catalog = SHOP_CATALOG.map((item) => ({
      ...item,
      isOwned: ownedItemIds.has(item.id),
      isEquipped:
        (item.type === "frame" && user.equippedFrame === item.id) ||
        (item.type === "theme" && user.equippedTheme === item.id),
    }));

    res.json({
      success: true,
      coins: user.coins || 0,
      equippedFrame: user.equippedFrame || "default",
      equippedTheme: user.equippedTheme || "default",
      catalog,
      inventory,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Purchase a cosmetic shop item
 */
export async function purchaseItem(req, res, next) {
  try {
    const studentId = req.auth.userId;
    const { itemId } = req.body || {};

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    const item = SHOP_CATALOG.find((i) => i.id === itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in catalog." });
    }

    // 1. Check duplicate purchase
    const existing = await UserInventory.findOne({
      student: studentId,
      itemId,
    });

    if (existing) {
      return res.status(400).json({
        message: "You already own this item.",
      });
    }

    // 2. Atomic coin deduction with $gte constraint to guarantee no negative balances
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: studentId,
        coins: { $gte: item.price },
      },
      {
        $inc: { coins: -item.price },
      },
      {
        returnDocument: "after",
      }
    );

    if (!updatedUser) {
      const user = await User.findById(studentId).lean();
      return res.status(400).json({
        message: `Insufficient coins. You have ${user?.coins || 0} coins, but this item costs ${item.price} coins. Earn more by completing lessons and quizzes!`,
      });
    }

    // 3. Create UserInventory record
    const inventoryItem = await UserInventory.create({
      student: studentId,
      itemId: item.id,
      itemType: item.type,
      name: item.name,
      pricePaid: item.price,
    });

    // 4. Record Coin Transaction
    await CoinTransaction.create({
      student: studentId,
      type: "spend",
      amount: item.price,
      balanceAfter: updatedUser.coins,
      source: "shop_purchase",
      referenceId: item.id,
      description: `Purchased: ${item.name}`,
    });

    // 5. Check achievement: Style Icon (shop_shopper)
    try {
      await UserAchievement.create({
        student: studentId,
        achievementId: "shop_shopper",
        title: "Style Icon",
        description: "Purchase your first cosmetic shop item",
        xpAwarded: 25,
        coinsAwarded: 10,
      });
      await awardReward({
        studentId,
        eventType: "achievement_reward",
        targetId: "shop_shopper",
        xp: 25,
        coins: 10,
        description: "Unlocked Style Icon achievement",
      });
    } catch (e) {
      // Already unlocked
    }

    res.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      item: inventoryItem,
      remainingCoins: updatedUser.coins,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already own this item." });
    }
    next(error);
  }
}

/**
 * 3. Equip or unequip cosmetic item
 */
export async function equipItem(req, res, next) {
  try {
    const studentId = req.auth.userId;
    const { itemId, itemType } = req.body || {};

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (itemId === "default") {
      // Unequip
      if (itemType === "frame") user.equippedFrame = "default";
      if (itemType === "theme") user.equippedTheme = "default";
      await user.save();
      return res.json({
        success: true,
        message: "Equipped default appearance.",
        equippedFrame: user.equippedFrame,
        equippedTheme: user.equippedTheme,
      });
    }

    // Verify user owns the item
    const owned = await UserInventory.findOne({
      student: studentId,
      itemId,
    });

    if (!owned) {
      return res.status(403).json({
        message: "You must purchase this item before equipping it.",
      });
    }

    if (owned.itemType === "frame") {
      user.equippedFrame = itemId;
    } else if (owned.itemType === "theme") {
      user.equippedTheme = itemId;
    }

    await user.save();

    res.json({
      success: true,
      message: `Equipped ${owned.name}!`,
      equippedFrame: user.equippedFrame,
      equippedTheme: user.equippedTheme,
    });
  } catch (error) {
    next(error);
  }
}
