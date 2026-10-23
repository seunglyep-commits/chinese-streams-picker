import React, { useState, useEffect, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import {
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Undo2,
  Eye,
  EyeOff,
  HelpCircle,
  CheckCircle2,
  Layers,
  History,
  Star,
} from 'lucide-react'
import { NUMBER_DATA, createFullDeck, shuffleDeck } from './data/cards'

const STORAGE_KEY = 'chinese_streams_state_v1'

function playDrawSound(isStar = false) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    if (isStar) {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0.18, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.36)
      })
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.19)
    }
  } catch {
    // Ignore audio context restrictions
  }
}

function speakChinese(text) {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'zh-CN'
    utter.rate = 0.85
    utter.pitch = 1.0
    window.speechSynthesis.speak(utter)
  } catch {
    // Ignore TTS errors
  }
}

export default function App() {
  const [deck, setDeck] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed.deck) && parsed.deck.length === 40) {
          return parsed.deck
        }
      }
    } catch {
      // fallback
    }
    return shuffleDeck(createFullDeck())
  })

  const [drawnCount, setDrawnCount] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.drawnCount === 'number') {
          return Math.min(Math.max(parsed.drawnCount, 0), 40)
        }
      }
    } catch {
      // fallback
    }
    return 0
  })

  const [autoSpeak, setAutoSpeak] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [quizHideArabic, setQuizHideArabic] = useState(false)
  const [quizHidePron, setQuizHidePron] = useState(false)
  const [revealedCurrentCard, setRevealedCurrentCard] = useState(false)
  const [showDeckTracker, setShowDeckTracker] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)

  const animTimeoutRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ deck, drawnCount })
      )
    } catch {
      // Ignore storage quota errors
    }
  }, [deck, drawnCount])

  const drawnCards = deck.slice(0, drawnCount)
  const currentCard = drawnCount > 0 ? deck[drawnCount - 1] : null
  const remainingCount = deck.length - drawnCount

  // Count how many copies of current card's value have been drawn so far
  const getDrawnCopiesCount = (value) => {
    return drawnCards.filter((c) => c.value === value).length
  }

  const handleDrawCard = useCallback(() => {
    if (drawnCount >= deck.length) return

    const nextCard = deck[drawnCount]
    setIsAnimating(true)
    setRevealedCurrentCard(false)

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false)
    }, 320)

    setDrawnCount((prev) => prev + 1)

    if (soundEnabled) {
      playDrawSound(nextCard.isStar)
    }

    if (autoSpeak) {
      setTimeout(() => {
        speakChinese(nextCard.ttsText)
      }, 120)
    }

    if (nextCard.isStar) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.45 },
        colors: ['#f59e0b', '#fbbf24', '#ef4444', '#fde047'],
      })
    } else if (drawnCount + 1 === 20) {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.5 },
      })
    }
  }, [drawnCount, deck, soundEnabled, autoSpeak])

  const handleUndo = () => {
    if (drawnCount <= 0) return
    setDrawnCount((prev) => prev - 1)
    setRevealedCurrentCard(false)
  }

  const handleResetGame = () => {
    setDeck(shuffleDeck(createFullDeck()))
    setDrawnCount(0)
    setRevealedCurrentCard(false)
    setIsAnimating(false)
  }

  // Spacebar shortcut to draw next card
  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        showRulesModal
      ) {
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        handleDrawCard()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleDrawCard, showRulesModal])

  const isArabicVisible = !quizHideArabic || revealedCurrentCard
  const isPronVisible = !quizHidePron || revealedCurrentCard

  return (
    <div className="app-shell">
      {/* Top Header Bar */}
      <header className="top-header">
        <div className="brand-group">
          <div className="brand-badge">STREAMS · 溪流</div>
          <h1 className="brand-title">스트림스 중국어 숫자 뽑기</h1>
          <span className="deck-summary-pill">
            총 40장 (1~10 각 1장 · 11~19 각 2장 · 20~30 각 1장 · ★ 1장)
          </span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className={`chip-btn ${autoSpeak ? 'active' : ''}`}
            onClick={() => setAutoSpeak((v) => !v)}
            title="카드 뽑을 때 중국어 발음 자동 읽기"
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>중국어 음성 {autoSpeak ? '자동' : '꺼짐'}</span>
          </button>

          <button
            type="button"
            className={`chip-btn ${quizHideArabic ? 'active-warn' : ''}`}
            onClick={() => {
              setQuizHideArabic((v) => !v)
              setRevealedCurrentCard(false)
            }}
            title="아라비아 숫자를 가려 한자와 발음으로 먼저 읽게 합니다"
          >
            {quizHideArabic ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>아라비아 숫자 {quizHideArabic ? '가림(퀴즈)' : '표시'}</span>
          </button>

          <button
            type="button"
            className={`chip-btn ${quizHidePron ? 'active-warn' : ''}`}
            onClick={() => {
              setQuizHidePron((v) => !v)
              setRevealedCurrentCard(false)
            }}
            title="병음과 한국어 발음을 가려 한자만 보고 읽게 합니다"
          >
            {quizHidePron ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>발음 표기 {quizHidePron ? '가림(퀴즈)' : '표시'}</span>
          </button>

          <button
            type="button"
            className="chip-btn"
            onClick={() => setShowRulesModal(true)}
          >
            <HelpCircle size={16} />
            <span>게임 안내</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Centered Main Card Stage */}
      <main className="main-content">
        <section className="center-stage-section" aria-label="중앙 뽑힌 카드 영역">
          {/* Status & Progress Bar above the main card */}
          <div className="stage-status-bar">
            <div className="round-counter">
              <span className="round-label">현재 뽑은 순서</span>
              <strong className="round-value">
                {drawnCount} <small>/ 기본 20칸 (전체 40장)</small>
              </strong>
            </div>
            <div className="remaining-counter">
              남은 카드 <strong>{remainingCount}장</strong>
            </div>
          </div>

          {drawnCount === 20 && (
            <div className="milestone-banner" role="status">
              <CheckCircle2 size={20} />
              <span>
                <strong>스트림스 기본 20번째 카드까지 모두 뽑았습니다!</strong>{' '}
                점수를 계산하거나, 원하시면 남은 20장도 계속 뽑을 수 있습니다.
              </span>
            </div>
          )}

          {/* MAIN CENTER CARD DISPLAY */}
          <div className="main-card-wrapper">
            {currentCard ? (
              <div
                key={`${currentCard.id}-${drawnCount}`}
                className={`main-card tier-${currentCard.tier} ${
                  isAnimating ? 'card-pop-in' : ''
                }`}
                onClick={() => {
                  if (quizHideArabic || quizHidePron) {
                    setRevealedCurrentCard(true)
                  }
                  speakChinese(currentCard.ttsText)
                }}
              >
                {/* Card Top Meta Row */}
                <div className="main-card-top">
                  <span className="draw-order-badge">
                    #{drawnCount}번째 뽑힌 카드
                  </span>

                  <div className="card-top-right">
                    {currentCard.totalCopies === 2 ? (
                      <span className="copy-count-badge double">
                        2장 있는 숫자 ({getDrawnCopiesCount(currentCard.value)}/2번째 등장)
                      </span>
                    ) : currentCard.isStar ? (
                      <span className="copy-count-badge star">
                        유일한 별표 조커 (1/1)
                      </span>
                    ) : (
                      <span className="copy-count-badge single">
                        1장 있는 숫자 (1/1)
                      </span>
                    )}

                    <button
                      type="button"
                      className="speak-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        speakChinese(currentCard.ttsText)
                      }}
                      title="중국어 발음 다시 듣기"
                      aria-label="중국어 발음 듣기"
                    >
                      <Volume2 size={22} />
                      <span>발음 듣기</span>
                    </button>
                  </div>
                </div>

                {/* Center Giant Chinese Character (한자) */}
                <div className="main-card-center">
                  {currentCard.isStar ? (
                    <div className="star-card-hero">
                      <div className="star-symbol-wrap">
                        <Star className="star-svg-icon" fill="currentColor" size={110} />
                        <span className="star-hanzi-overlay">星</span>
                      </div>
                      <div className="star-hanzi-title">★ 별표 카드 · 星 (百搭)</div>
                    </div>
                  ) : (
                    <div className="hanzi-giant" lang="zh-CN">
                      {currentCard.hanzi}
                    </div>
                  )}

                  {/* Chinese Pronunciation (Pinyin + Korean pronunciation) */}
                  <div className="pronunciation-box">
                    {isPronVisible ? (
                      <>
                        <div className="pinyin-text">{currentCard.pinyin}</div>
                        <div className="korean-pron-text">
                          발음: <strong>[{currentCard.koreanPron}]</strong>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="reveal-hint-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRevealedCurrentCard(true)
                        }}
                      >
                        <Eye size={18} /> 발음(병음·독음) 정답 보기
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Arabic Number & Tier Info */}
                <div className="main-card-bottom">
                  <div className="arabic-number-box">
                    <span className="arabic-label">숫자 (Number)</span>
                    {isArabicVisible ? (
                      <span className="arabic-value">
                        {currentCard.isStar ? '★ (조커: 원하는 숫자로 사용)' : currentCard.value}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="reveal-arabic-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRevealedCurrentCard(true)
                        }}
                      >
                        <Eye size={16} /> 숫자 정답 확인하기
                      </button>
                    )}
                  </div>

                  <div className="card-tier-caption">
                    {currentCard.isStar
                      ? '원하는 어느 칸에나 어떤 숫자로든 적을 수 있는 만능 별표 카드!'
                      : currentCard.totalCopies === 2
                      ? '11~19 구간 (덱에 총 2장씩 들어있는 숫자)'
                      : currentCard.value <= 10
                      ? '1~10 구간 (덱에 1장만 들어있는 숫자)'
                      : '20~30 구간 (덱에 1장만 들어있는 숫자)'}
                  </div>
                </div>
              </div>
            ) : (
              /* Waiting State before 1st card is drawn */
              <div className="main-card empty-card" onClick={handleDrawCard}>
                <div className="empty-card-inner">
                  <div className="empty-hanzi-preview" lang="zh-CN">
                    一 · 十 · ★
                  </div>
                  <h2 className="empty-title">
                    중앙의 [카드 뽑기] 버튼을 눌러 게임을 시작하세요!
                  </h2>
                  <p className="empty-desc">
                    총 <strong>40장</strong>의 중국어 숫자 카드(1~10 각 1장, 11~19 각 2장, 20~30 각 1장, ★ 별표 카드 1장)가 골고루 섞여 있습니다.
                  </p>
                  <div className="empty-shortcut-hint">
                    키보드 <kbd>Space (스페이스바)</kbd> 를 눌러도 바로 뽑을 수 있어요!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Buttons right below the center card */}
          <div className="primary-controls">
            <button
              type="button"
              className="btn-undo"
              onClick={handleUndo}
              disabled={drawnCount === 0}
              title="방금 뽑은 카드 취소"
            >
              <Undo2 size={20} />
              <span>이전 되돌리기</span>
            </button>

            <button
              type="button"
              className="btn-draw-main"
              onClick={handleDrawCard}
              disabled={remainingCount === 0}
            >
              <Sparkles size={26} />
              <span>
                {remainingCount === 0
                  ? '40장 모두 뽑기 완료!'
                  : drawnCount === 0
                  ? '첫 번째 카드 뽑기 (Space)'
                  : `다음 카드 뽑기 (${drawnCount + 1}번째)`}
              </span>
            </button>

            <button
              type="button"
              className="btn-reset"
              onClick={handleResetGame}
              title="40장의 카드를 모두 모아서 새로 섞습니다"
            >
              <RotateCcw size={20} />
              <span>새 게임 (다시 섞기)</span>
            </button>
          </div>
        </section>

        {/* Bottom Boards: 1) Drawn History in Order & 2) Full 40-Card Deck Composition */}
        <section className="boards-grid">
          {/* Drawn Cards History */}
          <div className="board-panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <History size={18} />
                <h2>뽑힌 카드 기록 ({drawnCount}장)</h2>
              </div>
              <span className="panel-subtitle">
                카드를 클릭하면 중국어 발음을 다시 들을 수 있습니다
              </span>
            </div>

            {drawnCards.length === 0 ? (
              <div className="empty-history">
                아직 뽑힌 카드가 없습니다. 위에서 카드를 뽑아보세요!
              </div>
            ) : (
              <div className="history-cards-list">
                {drawnCards.map((card, idx) => {
                  const isLatest = idx === drawnCards.length - 1
                  return (
                    <button
                      type="button"
                      key={`${card.id}-hist-${idx}`}
                      className={`history-mini-card tier-${card.tier} ${
                        isLatest ? 'is-latest' : ''
                      }`}
                      onClick={() => speakChinese(card.ttsText)}
                      title={`${idx + 1}번째: ${card.hanzi} (${card.pinyin} / ${card.koreanPron})`}
                    >
                      <span className="mini-order">#{idx + 1}</span>
                      <span className="mini-hanzi" lang="zh-CN">
                        {card.isStar ? '★ 星' : card.hanzi}
                      </span>
                      <span className="mini-pron">
                        {card.pinyin} · {card.koreanPron}
                      </span>
                      {!quizHideArabic && (
                        <span className="mini-arabic">{card.value}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 40-Card Deck Composition & Remaining Status Tracker */}
          <div className="board-panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <Layers size={18} />
                <h2>전체 카드 구성 및 뽑힘 현황 (총 40장)</h2>
              </div>
              <button
                type="button"
                className="toggle-tracker-btn"
                onClick={() => setShowDeckTracker((v) => !v)}
              >
                {showDeckTracker ? '현황판 접기' : '현황판 펼치기'}
              </button>
            </div>

            {showDeckTracker && (
              <div className="deck-tracker-groups">
                <div className="tracker-legend">
                  <span className="legend-item">
                    <span className="dot tier-low-dot" /> 1~10 (각 1장)
                  </span>
                  <span className="legend-item">
                    <span className="dot tier-double-dot" /> 11~19 (각 2장)
                  </span>
                  <span className="legend-item">
                    <span className="dot tier-high-dot" /> 20~30 (각 1장)
                  </span>
                  <span className="legend-item">
                    <span className="dot tier-star-dot" /> ★ 별표 카드 (1장)
                  </span>
                </div>

                <div className="tracker-grid">
                  {NUMBER_DATA.map((item) => {
                    const drawnOfThis = drawnCards.filter(
                      (c) => c.value === item.value
                    ).length
                    const isAllDrawn = drawnOfThis >= item.count
                    const isPartiallyDrawn =
                      drawnOfThis > 0 && drawnOfThis < item.count

                    return (
                      <button
                        type="button"
                        key={`tracker-${item.value}`}
                        className={`tracker-tile tier-${item.tier} ${
                          isAllDrawn
                            ? 'all-drawn'
                            : isPartiallyDrawn
                            ? 'partial-drawn'
                            : ''
                        }`}
                        onClick={() => speakChinese(item.ttsText || item.hanzi)}
                        title={`${item.value}: ${item.hanzi} (${item.pinyin} / ${item.koreanPron}) - 총 ${item.count}장 중 ${drawnOfThis}장 뽑힘`}
                      >
                        <div className="tracker-top">
                          <span className="tracker-arabic">{item.value}</span>
                          <div className="tracker-copies-dots">
                            {Array.from({ length: item.count }).map((_, i) => (
                              <span
                                key={i}
                                className={`copy-pip ${
                                  i < drawnOfThis ? 'used' : 'avail'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="tracker-hanzi" lang="zh-CN">
                          {item.isStar ? '★ 星' : item.hanzi}
                        </div>
                        <div className="tracker-pron">
                          <span>{item.pinyin}</span>
                          <small>[{item.koreanPron}]</small>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Rules Modal */}
      {showRulesModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowRulesModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h2 id="modal-title" className="modal-title">
              스트림스(Streams) 중국어 숫자 게임 안내
            </h2>
            <div className="modal-body">
              <div className="rule-box">
                <h3>1. 카드 구성 (총 40장)</h3>
                <ul>
                  <li>
                    <strong>1 ~ 10</strong> (一 ~ 十): 각 <strong>1장씩</strong> (10장)
                  </li>
                  <li>
                    <strong>11 ~ 19</strong> (十一 ~ 十九): 각 <strong>2장씩</strong> (18장)
                  </li>
                  <li>
                    <strong>20 ~ 30</strong> (二十 ~ 三十): 각 <strong>1장씩</strong> (11장)
                  </li>
                  <li>
                    <strong>★ 별표 카드</strong> (星 · 百搭): <strong>1장</strong> — 원하는 어떤 숫자로든 사용할 수 있는 조커 카드!
                  </li>
                </ul>
              </div>

              <div className="rule-box">
                <h3>2. 게임 진행 방법</h3>
                <ul>
                  <li>
                    교사(진행자)가 화면 중앙의 <strong>[카드 뽑기]</strong> 버튼을 눌러 카드를 한 장씩 뽑습니다.
                  </li>
                  <li>
                    학생들은 중앙 카드에 표시된 <strong>한자와 중국어 발음(병음·독음)</strong>을 읽고, 자신의 스트림스 기록지 빈칸(보통 20칸) 중 원하는 위치에 숫자를 적습니다.
                  </li>
                  <li>
                    숫자가 <strong>오름차순(작은 수 → 큰 수, 같은 숫자 연속 가능)</strong>으로 길게 이어질수록 높은 점수를 얻습니다!
                  </li>
                  <li>
                    <strong>아라비아 숫자 가림(퀴즈)</strong> 또는 <strong>발음 표기 가림(퀴즈)</strong> 버튼을 켜면 학생들이 먼저 중국어 한자/발음을 읽은 뒤 정답을 확인하는 수업 활동으로 활용할 수 있습니다.
                  </li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowRulesModal(false)}
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
