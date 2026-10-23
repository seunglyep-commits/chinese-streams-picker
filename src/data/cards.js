export const NUMBER_DATA = [
  { value: 1, hanzi: '一', pinyin: 'yī', koreanPron: '이', count: 1, tier: 'low' },
  { value: 2, hanzi: '二', pinyin: 'èr', koreanPron: '얼', count: 1, tier: 'low' },
  { value: 3, hanzi: '三', pinyin: 'sān', koreanPron: '싼', count: 1, tier: 'low' },
  { value: 4, hanzi: '四', pinyin: 'sì', koreanPron: '쓰', count: 1, tier: 'low' },
  { value: 5, hanzi: '五', pinyin: 'wǔ', koreanPron: '우', count: 1, tier: 'low' },
  { value: 6, hanzi: '六', pinyin: 'liù', koreanPron: '리우', count: 1, tier: 'low' },
  { value: 7, hanzi: '七', pinyin: 'qī', koreanPron: '치', count: 1, tier: 'low' },
  { value: 8, hanzi: '八', pinyin: 'bā', koreanPron: '빠', count: 1, tier: 'low' },
  { value: 9, hanzi: '九', pinyin: 'jiǔ', koreanPron: '지우', count: 1, tier: 'low' },
  { value: 10, hanzi: '十', pinyin: 'shí', koreanPron: '스', count: 1, tier: 'low' },

  { value: 11, hanzi: '十一', pinyin: 'shí yī', koreanPron: '스이', count: 2, tier: 'double' },
  { value: 12, hanzi: '十二', pinyin: 'shí èr', koreanPron: '스얼', count: 2, tier: 'double' },
  { value: 13, hanzi: '十三', pinyin: 'shí sān', koreanPron: '스싼', count: 2, tier: 'double' },
  { value: 14, hanzi: '十四', pinyin: 'shí sì', koreanPron: '스쓰', count: 2, tier: 'double' },
  { value: 15, hanzi: '十五', pinyin: 'shí wǔ', koreanPron: '스우', count: 2, tier: 'double' },
  { value: 16, hanzi: '十六', pinyin: 'shí liù', koreanPron: '스리우', count: 2, tier: 'double' },
  { value: 17, hanzi: '十七', pinyin: 'shí qī', koreanPron: '스치', count: 2, tier: 'double' },
  { value: 18, hanzi: '十八', pinyin: 'shí bā', koreanPron: '스빠', count: 2, tier: 'double' },
  { value: 19, hanzi: '十九', pinyin: 'shí jiǔ', koreanPron: '스지우', count: 2, tier: 'double' },

  { value: 20, hanzi: '二十', pinyin: 'èr shí', koreanPron: '얼스', count: 1, tier: 'high' },
  { value: 21, hanzi: '二十一', pinyin: 'èr shí yī', koreanPron: '얼스이', count: 1, tier: 'high' },
  { value: 22, hanzi: '二十二', pinyin: 'èr shí èr', koreanPron: '얼스얼', count: 1, tier: 'high' },
  { value: 23, hanzi: '二十三', pinyin: 'èr shí sān', koreanPron: '얼스싼', count: 1, tier: 'high' },
  { value: 24, hanzi: '二十四', pinyin: 'èr shí sì', koreanPron: '얼스쓰', count: 1, tier: 'high' },
  { value: 25, hanzi: '二十五', pinyin: 'èr shí wǔ', koreanPron: '얼스우', count: 1, tier: 'high' },
  { value: 26, hanzi: '二十六', pinyin: 'èr shí liù', koreanPron: '얼스리우', count: 1, tier: 'high' },
  { value: 27, hanzi: '二十七', pinyin: 'èr shí qī', koreanPron: '얼스치', count: 1, tier: 'high' },
  { value: 28, hanzi: '二十八', pinyin: 'èr shí bā', koreanPron: '얼스빠', count: 1, tier: 'high' },
  { value: 29, hanzi: '二十九', pinyin: 'èr shí jiǔ', koreanPron: '얼스지우', count: 1, tier: 'high' },
  { value: 30, hanzi: '三十', pinyin: 'sān shí', koreanPron: '싼스', count: 1, tier: 'high' },

  {
    value: '★',
    isStar: true,
    hanzi: '★',
    hanziSub: '星 (百搭)',
    pinyin: 'xīng · bǎi dā',
    koreanPron: '싱 (별표 조커)',
    ttsText: '星',
    count: 1,
    tier: 'star',
  },
]

export function createFullDeck() {
  const deck = []
  for (const item of NUMBER_DATA) {
    for (let i = 1; i <= item.count; i++) {
      deck.push({
        id: `${item.isStar ? 'star' : `num-${item.value}`}-${i}`,
        value: item.value,
        isStar: Boolean(item.isStar),
        hanzi: item.hanzi,
        hanziSub: item.hanziSub || null,
        pinyin: item.pinyin,
        koreanPron: item.koreanPron,
        ttsText: item.ttsText || item.hanzi,
        copyIndex: i,
        totalCopies: item.count,
        tier: item.tier,
      })
    }
  }
  return deck
}

export function shuffleDeck(deck) {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
