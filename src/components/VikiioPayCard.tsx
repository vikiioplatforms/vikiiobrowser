import React, { useState } from 'react'
import styles from './VikiioPayCard.module.css'

interface Transaction {
  id: string
  label: string
  amount: number
  type: 'credit' | 'debit'
  icon: string
  time: string
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', label: 'Netflix',        amount: -15.99, type: 'debit',  icon: '🎬', time: 'Today, 9:41 AM'  },
  { id: '2', label: 'Received',       amount: +250.00, type: 'credit', icon: '💸', time: 'Yesterday'       },
  { id: '3', label: 'Spotify',        amount: -9.99,  type: 'debit',  icon: '🎵', time: 'Apr 22'          },
  { id: '4', label: 'Apple Pay',      amount: -42.50, type: 'debit',  icon: '🍎', time: 'Apr 21'          },
]

interface VikiioPayCardProps {
  onOpenPay?: () => void
}

export default function VikiioPayCard({ onOpenPay }: VikiioPayCardProps) {
  const [hidden, setHidden] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const balance = 1_284.50
  const displayBalance = hidden ? '••••••' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  const visibleTxns = expanded ? MOCK_TRANSACTIONS : MOCK_TRANSACTIONS.slice(0, 2)

  return (
    <div className={styles.card}>
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.payBadge}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Vikiio Pay
          </span>
        </div>
        <div className={styles.headerRight}>
          {/* Privacy toggle */}
          <button
            className={styles.iconBtn}
            onClick={() => setHidden(h => !h)}
            title={hidden ? 'Show balance' : 'Hide balance'}
          >
            {hidden ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
          {/* Open Pay button */}
          <button className={styles.openBtn} onClick={onOpenPay}>
            Open
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className={styles.balanceRow}>
        <div>
          <div className={styles.balanceLabel}>Available Balance</div>
          <div className={`${styles.balance} ${hidden ? styles.blurred : ''}`}>
            {displayBalance}
          </div>
        </div>
        <div className={styles.balanceMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaDot} style={{ background: '#4ade80' }} />
            <span className={styles.metaText}>Active</span>
          </div>
          <div className={styles.metaItem}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            <span className={styles.metaText} style={{ color: '#4ade80' }}>+12.4%</span>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className={styles.actions}>
        {[
          { icon: '↑', label: 'Send' },
          { icon: '↓', label: 'Receive' },
          { icon: '+', label: 'Top Up' },
          { icon: '⋯', label: 'More' },
        ].map(a => (
          <button key={a.label} className={styles.actionBtn} onClick={onOpenPay}>
            <span className={styles.actionIcon}>{a.icon}</span>
            <span className={styles.actionLabel}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Recent transactions */}
      <div className={styles.txnHeader}>
        <span className={styles.txnTitle}>Recent</span>
        <button className={styles.txnToggle} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Less' : 'All'}
        </button>
      </div>

      <div className={styles.txnList}>
        {visibleTxns.map(tx => (
          <div key={tx.id} className={`${styles.txn} ${hidden ? styles.blurred : ''}`}>
            <span className={styles.txnIcon}>{tx.icon}</span>
            <div className={styles.txnInfo}>
              <span className={styles.txnLabel}>{tx.label}</span>
              <span className={styles.txnTime}>{tx.time}</span>
            </div>
            <span className={`${styles.txnAmount} ${tx.type === 'credit' ? styles.credit : styles.debit}`}>
              {tx.type === 'credit' ? '+' : ''}
              {tx.amount < 0
                ? `-$${Math.abs(tx.amount).toFixed(2)}`
                : `$${tx.amount.toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>End-to-end encrypted · Vikiio Pay</span>
      </div>
    </div>
  )
}
