import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert, Animated, Dimensions, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { colors, radii, spacing, typography } from '../theme';
import { useCountries } from '../hooks/useCountries';
import { Country } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProgressBar } from '../components/ProgressBar';

// ─── Tipler ──────────────────────────────────────────────────────────────────

type ShapeQuizParams = { questionCount?: number };
type ShapeQuizRoute  = RouteProp<Record<string, ShapeQuizParams>, string>;

interface Viewport {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
  label: string;
}

interface ShapeQuestion {
  target: Country;
  options: Country[];
  correctIndex: number;
  viewport: Viewport;
  continentCountries: Country[];
}

interface PixelBox { x: number; y: number; w: number; h: number }

// ─── Kıta viewport'ları ──────────────────────────────────────────────────────

const VIEWPORTS: Record<string, Viewport> = {
  Africa:   { minLat: -35, maxLat: 38,  minLng: -18, maxLng: 52,  label: 'Afrika'    },
  Americas: { minLat: -56, maxLat: 72,  minLng: -170,maxLng: -34, label: 'Amerika'   },
  Asia:     { minLat: -11, maxLat: 77,  minLng: 26,  maxLng: 180, label: 'Asya'      },
  Europe:   { minLat: 34,  maxLat: 72,  minLng: -25, maxLng: 45,  label: 'Avrupa'    },
  Oceania:  { minLat: -50, maxLat: 5,   minLng: 110, maxLng: 180, label: 'Okyanusya' },
};

const getViewport = (region: string): Viewport =>
  VIEWPORTS[region] ?? VIEWPORTS['Asia'];

// ─── Projeksiyon ─────────────────────────────────────────────────────────────

const mercY = (lat: number): number => {
  const r = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + r / 2));
};

function project(
  lat: number, lng: number,
  halfLat: number, halfLng: number,
  vp: Viewport, mapW: number, mapH: number,
): PixelBox {
  const mTop = mercY(vp.maxLat);
  const mBot = mercY(vp.minLat);
  const mR   = mTop - mBot;
  const toX  = (lo: number) => ((lo - vp.minLng) / (vp.maxLng - vp.minLng)) * mapW;
  const toY  = (la: number) => ((mTop - mercY(la)) / mR) * mapH;
  return {
    x: toX(lng - halfLng),
    y: toY(lat + halfLat),
    w: Math.abs(toX(lng + halfLng) - toX(lng - halfLng)),
    h: Math.abs(toY(lat - halfLat) - toY(lat + halfLat)),
  };
}

/** km² → yaklaşık derece yarıçap */
const areaToHalf = (km2: number): number =>
  Math.max(0.35, Math.min(22, Math.sqrt(Math.max(km2, 1)) / 111));

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Country tipinde latlng alanı var — erişim için yardımcı */
const getLatlng = (c: Country): [number, number] | null => {
  const ll = c.latlng;
  if (Array.isArray(ll) && ll.length >= 2) return [ll[0], ll[1]];
  return null;
};

function buildQuestion(target: Country, peers: Country[]): ShapeQuestion {
  const wrong = shuffle(peers.filter((c) => c.cca3 !== target.cca3)).slice(0, 3);
  const opts  = shuffle([target, ...wrong]);
  return {
    target,
    options: opts,
    correctIndex: opts.findIndex((o) => o.cca3 === target.cca3),
    viewport: getViewport(target.region),
    continentCountries: peers,
  };
}

// ─── ContinentMap bileşeni ───────────────────────────────────────────────────

interface ContinentMapProps {
  question: ShapeQuestion;
  mapW: number; mapH: number;
  revealed: boolean;
}

const ContinentMap: React.FC<ContinentMapProps> = ({ question, mapW, mapH, revealed }) => {
  const { target, continentCountries, viewport } = question;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pulseAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [question.target.cca3, pulseAnim]);

  const targetHalf = areaToHalf(target.area);
  const targetLL   = getLatlng(target);
  const targetBox  = targetLL
    ? project(targetLL[0], targetLL[1], targetHalf, targetHalf * 1.5, viewport, mapW, mapH)
    : null;

  return (
    <View style={[cm.root, { width: mapW, height: mapH }]}>
      {/* Arka plan ülkeler */}
      {continentCountries.map((c) => {
        if (c.cca3 === target.cca3) return null;
        const ll = getLatlng(c);
        if (!ll) return null;
        const half = areaToHalf(c.area);
        const box  = project(ll[0], ll[1], half, half * 1.5, viewport, mapW, mapH);
        if (box.x + box.w < -8 || box.x > mapW + 8) return null;
        if (box.y + box.h < -8 || box.y > mapH + 8) return null;
        const br = Math.max(2, Math.min(6, Math.min(box.w, box.h) * 0.25));
        return (
          <View
            key={c.cca3}
            style={[cm.countryBox, {
              left: box.x, top: box.y,
              width: Math.max(4, box.w), height: Math.max(4, box.h),
              borderRadius: br,
            }]}
          />
        );
      })}

      {/* Hedef ülke — kırmızı + pulse */}
      {targetBox && (
        <Animated.View style={[cm.targetBox, {
          left:   targetBox.x,
          top:    targetBox.y,
          width:  Math.max(10, targetBox.w),
          height: Math.max(10, targetBox.h),
          borderRadius: Math.max(3, Math.min(8, Math.min(targetBox.w, targetBox.h) * 0.2)),
          opacity: revealed ? 1 : pulseAnim,
        }]} />
      )}

      {/* Cevap sonrası isim */}
      {revealed && targetBox && (
        <View style={[cm.nameTag, {
          left: Math.max(4, targetBox.x + targetBox.w / 2 - 52),
          top:  Math.max(4, targetBox.y - 22),
        }]}>
          <Text style={cm.nameTxt} numberOfLines={1}>{target.name.common}</Text>
        </View>
      )}

      <View style={cm.watermark} pointerEvents="none">
        <Text style={cm.watermarkTxt}>{viewport.label.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const cm = StyleSheet.create({
  root: {
    backgroundColor: '#071626',
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  countryBox: {
    position: 'absolute',
    backgroundColor: '#1A3A4E',
    borderWidth: 1,
    borderColor: '#2A5068',
  },
  targetBox: {
    position: 'absolute',
    backgroundColor: '#C53030',
    borderWidth: 2,
    borderColor: '#FC8181',
    shadowColor: '#FC8181',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 10,
  },
  nameTag: {
    position: 'absolute',
    width: 104,
    backgroundColor: 'rgba(197,48,48,0.9)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
  },
  nameTxt:      { color: '#fff', fontSize: 9, fontWeight: '700' },
  watermark:    { position: 'absolute', bottom: 8, right: 10 },
  watermarkTxt: { color: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});

// ─── OptionBtn ───────────────────────────────────────────────────────────────

const LETTERS = ['A', 'B', 'C', 'D'];

interface OptionBtnProps {
  label: string; index: number;
  selected: number | null; correct: number;
  onPress: (i: number) => void;
}

const OptionBtn: React.FC<OptionBtnProps> = ({ label, index, selected, correct, onPress }) => {
  const answered   = selected !== null;
  const isCorrect  = correct === index;
  const isSelected = selected === index;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  let bg: string = colors.surface, border: string = 'rgba(255,255,255,0.07)', clr: string = colors.text;
  if (answered) {
    if (isCorrect)       { bg = 'rgba(72,199,142,0.15)'; border = colors.success; clr = colors.success; }
    else if (isSelected) { bg = 'rgba(229,62,62,0.15)';  border = colors.danger;  clr = colors.danger;  }
  }

  const press = () => {
    if (answered) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 70, useNativeDriver: true }),
    ]).start();
    onPress(index);
  };

  return (
    <Animated.View style={[{ flex: 1 }, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.8} onPress={press}
        style={[ob.btn, { backgroundColor: bg, borderColor: border }]}
      >
        <View style={[ob.letter, { borderColor: border }]}>
          <Text style={[ob.letterTxt, { color: clr }]}>{LETTERS[index]}</Text>
        </View>
        <Text style={[ob.lbl, { color: clr }]} numberOfLines={2}>{label}</Text>
        {answered && isCorrect               && <Text style={[ob.mark, { color: colors.success }]}>✓</Text>}
        {answered && isSelected && !isCorrect && <Text style={[ob.mark, { color: colors.danger  }]}>✗</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ob = StyleSheet.create({
  btn:       { flexDirection: 'row', alignItems: 'center', borderRadius: radii.large, padding: spacing.sm, borderWidth: 1.5, gap: spacing.sm, minHeight: 50 },
  letter:    { width: 26, height: 26, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  letterTxt: { fontSize: 12, fontWeight: '700' },
  lbl:       { flex: 1, fontSize: 12, fontWeight: '500' },
  mark:      { fontSize: 16, fontWeight: '700' },
});

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const MAP_W      = SCREEN_W - spacing.lg * 2;
const MAP_H      = MAP_W * 0.58;
const TIME_PER_Q = 20;

const ShapeQuizScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<ShapeQuizRoute>();
  const { questionCount = 10 } = route.params ?? {};

  const { allCountries, loading } = useCountries();

  const [questions, setQuestions]   = useState<ShapeQuestion[]>([]);
  const [idx, setIdx]               = useState(0);
  const [selected, setSelected]     = useState<number | null>(null);
  const [timeLeft, setTimeLeft]     = useState(TIME_PER_Q);
  const [totalScore, setTotalScore] = useState(0);
  const [correctCnt, setCorrectCnt] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedAnim = useRef(new Animated.Value(0)).current;

  // Soruları oluştur
  useEffect(() => {
    if (!allCountries.length) return;

    const valid = allCountries.filter(
      (c) => c.region && c.region !== 'Antarctic' && c.cca3 && getLatlng(c) !== null,
    );

    const byRegion: Record<string, Country[]> = {};
    for (const c of valid) {
      if (!byRegion[c.region]) byRegion[c.region] = [];
      byRegion[c.region].push(c);
    }

    const eligible = valid.filter((c) => (byRegion[c.region]?.length ?? 0) >= 4);
    const targets  = shuffle(eligible).slice(0, questionCount);
    setQuestions(targets.map((t) => buildQuestion(t, byRegion[t.region] ?? [])));
  }, [allCountries, questionCount]);

  const currentQ = questions[idx] ?? null;

  // Timer
  useEffect(() => {
    if (!currentQ || selected !== null) return;
    setTimeLeft(TIME_PER_Q);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          commitAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, currentQ]);

  const commitAnswer = useCallback(
    (optIdx: number) => {
      if (!currentQ || selected !== null) return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelected(optIdx);
      if (optIdx === currentQ.correctIndex) {
        setTotalScore((s) => s + 100 + Math.max(0, timeLeft - 5) * 8);
        setCorrectCnt((c) => c + 1);
      }
      feedAnim.setValue(0);
      Animated.spring(feedAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
    },
    [currentQ, selected, timeLeft, feedAnim],
  );

  const handleNext = useCallback(() => {
    if (idx + 1 >= questions.length) {
      const acc = questions.length > 0 ? (correctCnt / questions.length) * 100 : 0;
      navigation.replace('QuizResult', {
        result: {
          score: totalScore, correct: correctCnt,
          wrong: questions.length - correctCnt,
          blank: 0, accuracy: acc,
          isNewRecord: false, wrongCountries: [],
        },
        mode: 'shape',
      });
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    feedAnim.setValue(0);
  }, [idx, questions.length, correctCnt, totalScore, navigation, feedAnim]);

  const handleExit = () => {
    Alert.alert('Quizden Çık', 'İlerleme kaydedilmeyecek. Çıkmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çık', style: 'destructive',
        onPress: () => navigation.navigate('QuizStack', { screen: 'QuizMenu' }) },
    ]);
  };

  if (loading || !questions.length || !currentQ) {
    return <SafeAreaView style={s.container}><LoadingSpinner fullscreen /></SafeAreaView>;
  }

  const isCorrect  = selected === currentQ.correctIndex;
  const timerColor = timeLeft > 12 ? colors.success : timeLeft > 6 ? colors.warning : colors.danger;

  return (
    <SafeAreaView style={s.container}>

      {/* Üst bar */}
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.topLbl}>Soru {idx + 1} / {questions.length}</Text>
          <ProgressBar progress={(idx + 1) / questions.length} />
        </View>
        <View style={s.scoreBox}>
          <Text style={s.scoreLbl}>Skor</Text>
          <Text style={s.scoreVal}>{totalScore}</Text>
        </View>
        <View style={s.timerBox}>
          <Text style={[s.timerNum, { color: timerColor }]}>{timeLeft}</Text>
          <Text style={s.timerSub}>sn</Text>
        </View>
        <TouchableOpacity style={s.exitBtn} onPress={handleExit}>
          <Text style={s.exitTxt}>Çık</Text>
        </TouchableOpacity>
      </View>

      {/* Soru başlığı */}
      <View style={s.qRow}>
        <Text style={s.qTxt}>🔴 Kırmızı ülke hangisi?</Text>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{currentQ.viewport.label}</Text>
        </View>
      </View>

      {/* Harita */}
      <View style={s.mapWrap}>
        <ContinentMap
          question={currentQ}
          mapW={MAP_W} mapH={MAP_H}
          revealed={selected !== null}
        />
      </View>

      {/* Şıklar 2×2 */}
      <View style={s.optGrid}>
        <View style={s.optRow}>
          {currentQ.options.slice(0, 2).map((opt, i) => (
            <OptionBtn key={opt.cca3} label={opt.name.common} index={i}
              selected={selected} correct={currentQ.correctIndex} onPress={commitAnswer} />
          ))}
        </View>
        <View style={s.optRow}>
          {currentQ.options.slice(2, 4).map((opt, i) => (
            <OptionBtn key={opt.cca3} label={opt.name.common} index={i + 2}
              selected={selected} correct={currentQ.correctIndex} onPress={commitAnswer} />
          ))}
        </View>
      </View>

      {/* Feedback */}
      {selected !== null && (
        <Animated.View style={[s.feedBar, {
          borderColor: isCorrect ? colors.success : colors.danger,
          backgroundColor: isCorrect ? 'rgba(72,199,142,0.1)' : 'rgba(229,62,62,0.1)',
          opacity: feedAnim,
          transform: [{ translateY: feedAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }]}>
          <View style={s.feedLeft}>
            <Text style={s.feedEmoji}>{isCorrect ? '🎉' : '😔'}</Text>
            <View>
              <Text style={[s.feedTitle, { color: isCorrect ? colors.success : colors.danger }]}>
                {isCorrect ? 'Doğru!' : 'Yanlış!'}
              </Text>
              {!isCorrect && (
                <Text style={s.feedSub}>Doğru: {currentQ.target.name.common}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: isCorrect ? colors.success : colors.danger }]}
            onPress={handleNext} activeOpacity={0.9}
          >
            <Text style={s.nextTxt}>
              {idx + 1 >= questions.length ? '🏁 Bitir' : 'Sonraki →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  topLbl:    { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginBottom: 4 },
  scoreBox:  { alignItems: 'center' },
  scoreLbl:  { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  scoreVal:  { color: colors.accent, fontSize: typography.fontSizeLG, fontWeight: '700' },
  timerBox:  { alignItems: 'center', minWidth: 36 },
  timerNum:  { fontSize: typography.fontSizeXL, fontWeight: '800' },
  timerSub:  { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: -4 },
  exitBtn:   { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.round, backgroundColor: '#1B2737' },
  exitTxt:   { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  qRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm, flexWrap: 'wrap' },
  qTxt:      { flex: 1, color: colors.text, fontSize: typography.fontSizeMD, fontWeight: '700' },
  badge:     { backgroundColor: 'rgba(0,180,216,0.15)', borderRadius: radii.round, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeTxt:  { color: colors.primary, fontSize: typography.fontSizeXS, fontWeight: '600' },
  mapWrap:   { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  optGrid:   { paddingHorizontal: spacing.lg, gap: spacing.sm, flex: 1, justifyContent: 'center' },
  optRow:    { flexDirection: 'row', gap: spacing.sm },
  feedBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: radii.xl, borderWidth: 1.5, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  feedLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feedEmoji: { fontSize: 26 },
  feedTitle: { fontSize: typography.fontSizeLG, fontWeight: '700' },
  feedSub:   { color: colors.textSecondary, fontSize: typography.fontSizeSM, marginTop: 2 },
  nextBtn:   { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.large },
  nextTxt:   { color: '#fff', fontSize: typography.fontSizeSM, fontWeight: '700' },
});

export default ShapeQuizScreen;