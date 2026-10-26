import mongoose from "mongoose";
import User from "../models/user.model.js";
import XPTransaction from "../models/xp-transaction.model.js";
import { calculateLevelDetails } from "../config/gamification.config.js";

/**
 * Get Global, Weekly, or Monthly Leaderboard
 * Bounded to top 50, strictly sanitized, with deterministic tie-breaking.
 */
export async function getLeaderboard(req, res, next) {
  try {
    const period = String(req.query.period || "global").toLowerCase();
    const currentUserId = req.auth?.userId;

    let leaderboard = [];
    let userRankInfo = null;

    if (period === "weekly" || period === "monthly") {
      // 1. Calculate time boundary in UTC
      const now = new Date();
      let startTime;

      if (period === "weekly") {
        // Start of current week (Monday 00:00:00 UTC)
        startTime = new Date(now);
        const day = startTime.getUTCDay();
        const diff = (day === 0 ? -6 : 1) - day;
        startTime.setUTCDate(startTime.getUTCDate() + diff);
        startTime.setUTCHours(0, 0, 0, 0);
      } else {
        // Start of current month (1st of month 00:00:00 UTC)
        startTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      }

      // 2. Aggregate XP earned in this period from the XPTransaction ledger
      const aggregated = await XPTransaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startTime },
          },
        },
        {
          $group: {
            _id: "$student",
            periodXp: { $sum: "$xpAwarded" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $match: {
            "user.role": "student",
          },
        },
        {
          $sort: {
            periodXp: -1,
            _id: 1, // Deterministic tie-breaking
          },
        },
      ]);

      // Assign ranks
      let rank = 1;
      const mapped = aggregated.map((entry) => {
        const item = {
          rank: rank++,
          userId: String(entry.user._id),
          name: entry.user.name,
          avatar: entry.user.avatar || "",
          equippedFrame: entry.user.equippedFrame || "default",
          level: entry.user.level || 1,
          xp: entry.periodXp,
          lifetimeXp: entry.user.lifetimeXp || entry.user.xp || 0,
        };

        if (currentUserId && String(entry.user._id) === String(currentUserId)) {
          userRankInfo = item;
        }

        return item;
      });

      leaderboard = mapped.slice(0, 50);

      // If current user is not in the top 50, locate their position or default
      if (!userRankInfo && currentUserId) {
        const userInList = mapped.find((m) => m.userId === String(currentUserId));
        if (userInList) {
          userRankInfo = userInList;
        } else {
          const currentUser = await User.findById(currentUserId).lean();
          if (currentUser) {
            userRankInfo = {
              rank: mapped.length + 1,
              userId: String(currentUser._id),
              name: currentUser.name,
              avatar: currentUser.avatar || "",
              equippedFrame: currentUser.equippedFrame || "default",
              level: currentUser.level || 1,
              xp: 0,
              lifetimeXp: currentUser.lifetimeXp || currentUser.xp || 0,
            };
          }
        }
      }
    } else {
      // Global Leaderboard based on lifetimeXp
      const students = await User.find({ role: "student" })
        .select("name avatar level xp lifetimeXp equippedFrame createdAt")
        .sort({ lifetimeXp: -1, _id: 1 })
        .lean();

      let rank = 1;
      const mapped = students.map((s) => {
        const safeLifetimeXp = Math.max(s.lifetimeXp || 0, s.xp || 0);
        const levelDetails = calculateLevelDetails(safeLifetimeXp);

        const item = {
          rank: rank++,
          userId: String(s._id),
          name: s.name,
          avatar: s.avatar || "",
          equippedFrame: s.equippedFrame || "default",
          level: s.level || levelDetails.level,
          xp: safeLifetimeXp,
          lifetimeXp: safeLifetimeXp,
        };

        if (currentUserId && String(s._id) === String(currentUserId)) {
          userRankInfo = item;
        }

        return item;
      });

      leaderboard = mapped.slice(0, 50);

      if (!userRankInfo && currentUserId) {
        userRankInfo = mapped.find((m) => m.userId === String(currentUserId)) || null;
      }
    }

    res.json({
      success: true,
      period,
      leaderboard,
      currentUserRank: userRankInfo,
      totalParticipants: leaderboard.length,
    });
  } catch (error) {
    next(error);
  }
}
