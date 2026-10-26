import { useEffect } from "react";
import { Zap, Coins, Trophy, Sparkles, X } from "lucide-react";
import "./RewardToast.css";

export default function RewardToast({ reward, onClose }) {
  useEffect(() => {
    if (!reward) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [reward, onClose]);

  if (!reward) return null;

  const { xpAwarded = 0, coinsAwarded = 0, description = "", title = "Reward Earned!" } = reward;

  return (
    <div className="lc-reward-toast" role="alert">
      <div className="lc-toast-sparkles">
        <Sparkles size={20} className="sparkle-icon" />
      </div>

      <div className="lc-toast-body">
        <div className="lc-toast-title">
          <Trophy size={16} />
          <span>{title}</span>
        </div>
        {description && <div className="lc-toast-desc">{description}</div>}

        <div className="lc-toast-pills">
          {xpAwarded > 0 && (
            <span className="toast-pill toast-pill-xp">
              <Zap size={14} /> +{xpAwarded} XP
            </span>
          )}
          {coinsAwarded > 0 && (
            <span className="toast-pill toast-pill-coins">
              <Coins size={14} /> +{coinsAwarded} Coins
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="lc-toast-close"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
