import { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Coins,
  Sparkles,
  Zap,
  Check,
  CheckCircle,
  Crown,
  Bot,
  Terminal,
  Gamepad2,
  AlertCircle,
} from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import RewardToast from '../components/common/RewardToast'
import { shopApi, gamificationApi } from '../services/api'
import './Shop.css'

const ICON_MAP = {
  Zap,
  Crown,
  Sparkles,
  Gamepad2,
  Terminal,
  Bot,
}

export default function Shop() {
  const [catalog, setCatalog] = useState([])
  const [coins, setCoins] = useState(0)
  const [equippedFrame, setEquippedFrame] = useState('default')
  const [equippedTheme, setEquippedTheme] = useState('default')
  const [filterType, setFilterType] = useState('all') // 'all' | 'frame' | 'theme' | 'accessory'
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [rewardNotification, setRewardNotification] = useState(null)
  const [gamification, setGamification] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const loadShop = async () => {
    try {
      setLoading(true)
      const [shopRes, profileRes] = await Promise.all([
        shopApi.getCatalog(),
        gamificationApi.getProfile(),
      ])

      if (shopRes.success) {
        setCatalog(shopRes.catalog || [])
        setCoins(shopRes.coins || 0)
        setEquippedFrame(shopRes.equippedFrame || 'default')
        setEquippedTheme(shopRes.equippedTheme || 'default')
      }

      if (profileRes.success) {
        setGamification(profileRes.data)
      }
    } catch (err) {
      console.warn('Failed to load shop:', err)
      setErrorMessage(err.message || 'Could not load the Reward Shop.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadShop()
  }, [])

  const handleBuy = async (item) => {
    setErrorMessage('')
    setSuccessMessage('')
    setActionLoadingId(item.id)

    try {
      const res = await shopApi.buyItem(item.id)
      if (res.success) {
        setSuccessMessage(`Purchased ${item.name}! You can now equip it.`)
        setCoins(res.remainingCoins)
        setRewardNotification({
          title: 'Item Unlocked!',
          description: `Acquired ${item.name}`,
          coinsAwarded: 0,
          xpAwarded: 10,
        })
        await loadShop()
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete purchase.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleEquip = async (item) => {
    setErrorMessage('')
    setSuccessMessage('')
    setActionLoadingId(item.id)

    try {
      const isCurrentlyEquipped =
        (item.type === 'frame' && equippedFrame === item.id) ||
        (item.type === 'theme' && equippedTheme === item.id)

      const targetId = isCurrentlyEquipped ? 'default' : item.id
      const res = await shopApi.equipItem(targetId, item.type)

      if (res.success) {
        setSuccessMessage(res.message)
        if (item.type === 'frame') setEquippedFrame(res.equippedFrame)
        if (item.type === 'theme') setEquippedTheme(res.equippedTheme)
        await loadShop()
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not equip item.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredCatalog =
    filterType === 'all'
      ? catalog
      : catalog.filter((i) => i.type === filterType)

  return (
    <div className="dashboard shop-page">
      <Sidebar
        gamificationData={gamification}
        totalLessonsDone={gamification?.stats?.lessonsCompleted || 0}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <main className="dashboard-main">
        <DashboardHeader
          coins={coins}
          streak={gamification?.streak?.current || 0}
          equippedFrame={equippedFrame}
          onToggleMobileNav={() => setMobileNavOpen((v) => !v)}
          isMobileNavOpen={mobileNavOpen}
        />

        <div className="dashboard-content shop-content">
          {/* Shop Hero Banner */}
          <div className="shop-banner">
            <div>
              <span className="arcade-pill">
                <ShoppingBag size={16} /> REWARD SHOP
              </span>
              <h1>LearnCraft Cosmetic Shop</h1>
              <p>
                Exchange the Game Coins you earn from lessons and games for exclusive avatar frames, neon card themes, and digital pins!
              </p>
            </div>

            <div className="shop-balance-pill">
              <span className="shop-balance-label">Your Spendable Balance</span>
              <div className="shop-balance-amount">
                <Coins size={24} />
                <strong>{coins.toLocaleString()}</strong>
                <span>Coins</span>
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="shop-alert error">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="shop-alert success">
              <CheckCircle size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Filters */}
          <div className="shop-filters">
            {[
              { key: 'all', label: 'All Items' },
              { key: 'frame', label: 'Avatar Frames' },
              { key: 'theme', label: 'Dashboard Themes' },
              { key: 'accessory', label: 'Accessories' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`shop-filter-btn ${filterType === key ? 'active' : ''}`}
                onClick={() => setFilterType(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="shop-loading">
              <ShoppingBag size={36} className="spin-bounce" />
              <p>Loading cosmetic collection...</p>
            </div>
          ) : (
            <div className="shop-grid">
              {filteredCatalog.map((item) => {
                const Icon = ICON_MAP[item.icon] || Sparkles
                const isAffordable = coins >= item.price
                const isCurrentlyEquipped = item.isEquipped

                return (
                  <div
                    key={item.id}
                    className={`shop-card ${item.isOwned ? 'owned' : ''} ${isCurrentlyEquipped ? 'equipped' : ''}`}
                  >
                    <div
                      className="shop-card-preview"
                      style={{ borderTop: `4px solid ${item.previewColor || '#00e5f5'}` }}
                    >
                      <div
                        className="preview-avatar-circle"
                        style={{
                          borderColor: item.previewColor || '#00e5f5',
                          boxShadow: `0 0 16px ${item.previewColor}55`,
                        }}
                      >
                        <Icon size={28} style={{ color: item.previewColor }} />
                      </div>
                      {isCurrentlyEquipped && (
                        <span className="equipped-badge">
                          <Check size={12} strokeWidth={3} /> Equipped
                        </span>
                      )}
                    </div>

                    <div className="shop-card-body">
                      <div className="shop-card-type">{item.type.toUpperCase()}</div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>

                      <div className="shop-card-footer">
                        {item.isOwned ? (
                          <button
                            type="button"
                            className={`equip-btn ${isCurrentlyEquipped ? 'is-active' : ''}`}
                            onClick={() => handleEquip(item)}
                            disabled={actionLoadingId === item.id}
                          >
                            {isCurrentlyEquipped ? 'Unequip' : 'Equip Appearance'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`buy-btn ${!isAffordable ? 'disabled' : ''}`}
                            onClick={() => handleBuy(item)}
                            disabled={!isAffordable || actionLoadingId === item.id}
                          >
                            <Coins size={16} />
                            <span>{item.price} Coins</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <RewardToast
        reward={rewardNotification}
        onClose={() => setRewardNotification(null)}
      />
    </div>
  )
}
