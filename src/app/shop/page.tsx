'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Zap, Package, ShoppingBag, History, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/lib/store'

const SHOP_ITEMS = [
  {
    id: 'bulochka',
    title: 'Булочка с Лидла',
    image: '/shop/bulochka.jpg',
    price: 120,
    description: 'Заслуженная награда',
  },
  {
    id: 'dota',
    title: 'Сыграть катку',
    image: '/shop/dota.jpg',
    price: 500,
    description: 'Одна игра в Dota',
  },
  {
    id: 'gaz',
    title: 'Газануть водички сладкой',
    image: '/shop/gaz.jpg',
    price: 120,
    description: 'Заслуженный напиток',
  },
]

type Tab = 'shop' | 'inventory' | 'history'

const tabStyle = (active: boolean) => active
  ? { background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(167,139,250,0.1))', color: '#818cf8', boxShadow: '0 0 0 1px rgba(129,140,248,0.2) inset' }
  : { color: 'rgba(255,255,255,0.3)' }

export default function ShopPage() {
  const { trackXP, purchases, buyItem, useItem, sellItem } = useStore()
  const [tab, setTab] = useState<Tab>('shop')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const totalXP = Object.values(trackXP).reduce((a, b) => a + b, 0)
  const spentXP = purchases.reduce((s, p) => s + p.price, 0)
  const availableXP = totalXP - spentXP

  const inventory = purchases.filter(p => !p.usedAt)
  const history = purchases.filter(p => !!p.usedAt).sort((a, b) => b.usedAt!.localeCompare(a.usedAt!))

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2500)
  }

  function handleBuy(item: typeof SHOP_ITEMS[0]) {
    const ok = buyItem({ id: item.id, title: item.title, price: item.price })
    if (ok) showToast(`${item.title} — куплено!`, true)
    else showToast('Недостаточно XP', false)
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Магазин</h1>
          <p className="text-sm text-white/40 mt-0.5">Трать заработанный опыт на реальные награды</p>
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(167,139,250,0.08))', boxShadow: '0 0 0 1px rgba(129,140,248,0.15) inset', color: '#818cf8' }}
        >
          <Zap size={15} />
          {availableXP} XP доступно
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <button onClick={() => setTab('shop')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={tabStyle(tab === 'shop')}>
          <ShoppingBag size={14} />Магазин
        </button>
        <button onClick={() => setTab('inventory')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={tabStyle(tab === 'inventory')}>
          <Package size={14} />
          Инвентарь{inventory.length > 0 ? ` (${inventory.length})` : ''}
        </button>
        <button onClick={() => setTab('history')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={tabStyle(tab === 'history')}>
          <History size={14} />История
        </button>
      </div>

      {/* Shop */}
      {tab === 'shop' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {SHOP_ITEMS.map(item => {
            const canAfford = availableXP >= item.price
            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset' }}
              >
                {/* Image */}
                <div className="h-44 overflow-hidden flex items-center justify-center" style={{ background: '#0d0b18' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Info */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
                  {item.description && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                      <Zap size={12} />{item.price}
                    </span>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                      style={canAfford
                        ? { background: 'linear-gradient(135deg, #818cf8, #a78bfa)', color: 'white', cursor: 'pointer' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                      }
                    >
                      Купить
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Inventory */}
      {tab === 'inventory' && (
        inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Package size={40} style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-white/30 text-sm">Инвентарь пуст — купи что-нибудь в магазине</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {inventory.map(p => {
              const item = SHOP_ITEMS.find(i => i.id === p.itemId)
              return (
                <div
                  key={p.id}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(52,211,153,0.15) inset' }}
                >
                  {item && (
                    <div className="h-44 overflow-hidden" style={{ background: '#0d0b18' }}>
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <p className="text-sm font-semibold text-white">{p.itemTitle}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Куплено {format(parseISO(p.purchasedAt), 'd MMM, HH:mm', { locale: ru })}
                    </p>
                    <div className="mt-auto flex gap-1.5">
                      <button
                        onClick={() => { useItem(p.id); showToast('Использовано!', true) }}
                        className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all"
                        style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', boxShadow: '0 0 0 1px rgba(52,211,153,0.2) inset' }}
                      >
                        Использовать
                      </button>
                      <button
                        onClick={() => { sellItem(p.id); showToast(`+${p.price} XP возвращено`, true) }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', boxShadow: '0 0 0 1px rgba(239,68,68,0.15) inset' }}
                      >
                        Продать
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* History */}
      {tab === 'history' && (
        history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <History size={40} style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-white/30 text-sm">История пуста — используй предметы из инвентаря</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {history.map(p => {
              const item = SHOP_ITEMS.find(i => i.id === p.itemId)
              return (
                <div
                  key={p.id}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: '#0f0f1a', boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset', opacity: 0.55 }}
                >
                  {item && (
                    <div className="h-44 overflow-hidden" style={{ background: '#0d0b18' }}>
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <p className="text-sm font-semibold text-white">{p.itemTitle}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Куплено {format(parseISO(p.purchasedAt), 'd MMM', { locale: ru })}
                    </p>
                    <p className="flex items-center gap-1 text-[11px]" style={{ color: '#34d399' }}>
                      <CheckCircle2 size={11} />
                      Использовано {format(parseISO(p.usedAt!), 'd MMM, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold z-50 transition-all"
          style={{
            background: toast.ok ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
            color: toast.ok ? '#34d399' : '#ef4444',
            boxShadow: `0 0 0 1px ${toast.ok ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'} inset`,
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
