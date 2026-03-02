import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { useTheme } from "./contexts/ThemeContext";
import { LanguageToggle } from "./components/LanguageToggle";
import { ThemeToggle } from "./components/ThemeToggle";
import unaLogoLight from "./assets/unalogo-light.jpeg";
import unaLogoDark from "./assets/unalogo-dark.jpeg";

// ======= Config =======
const FACT_CHECK_URL = "/api/fact_check/";
const COMPOSE_NEWS_URL = "/api/fact_check/compose_news/";
const COMPOSE_TWEET_URL = "/api/fact_check/compose_tweet/";

// ======= i18n (AR / EN / FR) =======
const TRANSLATIONS = {
  arabic: {
    logoAlt: "شعار الجامعة",
    title: "التحقق من الأخبار",
    inputLabel: "اكتب عنوان الخبر المراد التحقق منه",
    placeholder: "",
    ariaInput: "مربع إدخال النص للتحقق من الخبر",
    scopeNote: "💡 ملاحظة: هذا النظام متخصص في التحقق من الأخبار المتعلقة بغزة وفلسطين فقط.",
    errorNoQuery: "اكتب الخبر أولًا.",
    errorFetch: "تعذر الحصول على النتيجة",
    errorUnexpected: "حدث خطأ غير متوقع.",
    status: "الحالة",
    analysis: "التحليل",
    sources: "المصادر",
    none: "لا يوجد",
    noSources: "لا توجد مصادر متاحة.",
    generatedNews: "خبر مصاغ",
    copyGeneratedNewsAria: "نسخ الخبر المصاغ",
    copyGeneratedTweetAria: "نسخ التغريدة المصاغة",
    buttonCopyNewsText: "نسخ الخبر",
    buttonCopyTweetText: "نسخ التغريدة",
    tweetHeading: "تغريدة مصاغة",
    tweetCardTitle: "متحقق من الأخبار",
    copyVerificationAria: "نسخ نتيجة التحقق",
    copyResult: "نسخ النتيجة",
    copied: "تم النسخ!",
    checkBtnAria: "زر التحقق من الخبر",
    checking: "جاري التحقق…",
    checkNow: "تحقق الآن",
    composeNewsBtn: "صياغة خبر",
    composeTweetBtn: "صياغة تغريدة",
    composingNews: "جاري صياغة الخبر…",
    composingTweet: "جاري صياغة التغريدة…",
    heroLine: null,
    loaderLine: "محرك الذكاء الاصطناعي يعمل… تجميع الأدلة، مطابقة الحقائق، وتكوين الحكم.",
    analysis: "التحليل",
  },
  english: {
    logoAlt: "University Logo",
    title: "Fact Checker",
    inputLabel: "Enter the news headline to fact-check",
    placeholder: "",
    ariaInput: "Text input for fact-checking",
    scopeNote: "💡 Note: This system specializes in fact-checking news related to Gaza and Palestine only.",
    errorNoQuery: "Please enter the news first.",
    errorFetch: "Failed to get result",
    errorUnexpected: "An unexpected error occurred.",
    status: "Status",
    analysis: "Analysis",
    sources: "Sources",
    none: "None",
    noSources: "No sources available.",
    generatedNews: "Generated News Article",
    copyGeneratedNewsAria: "Copy generated news article",
    copyGeneratedTweetAria: "Copy generated tweet",
    buttonCopyNewsText: "Create Article",
    buttonCopyTweetText: "X Tweet",
    tweetHeading: "Generated Tweet",
    tweetCardTitle: "Fact Checker",
    copyVerificationAria: "Copy verification result",
    copyResult: "Copy Result",
    copied: "Copied!",
    checkBtnAria: "Fact check button",
    checking: "Checking...",
    checkNow: "Check Now",
    composeNewsBtn: "Compose News",
    composeTweetBtn: "Compose Tweet",
    composingNews: "Composing news…",
    composingTweet: "Composing tweet…",
    heroLine: null,
    loaderLine: "AI engine is working… gathering evidence, matching facts, and forming the verdict.",
    analysis: "Analysis",
  },
  french: {
    logoAlt: "Logo de l'université",
    title: "Vérificateur de faits",
    inputLabel: "Saisissez le titre de la nouvelle à vérifier",
    placeholder: "",
    ariaInput: "Zone de texte pour la vérification des faits",
    scopeNote: "💡 Note : Ce système est spécialisé uniquement dans la vérification des nouvelles concernant Gaza et la Palestine.",
    errorNoQuery: "Veuillez d'abord saisir la nouvelle.",
    errorFetch: "Échec de l'obtention du résultat",
    errorUnexpected: "Une erreur inattendue s'est produite.",
    status: "Statut",
    analysis: "Analyse",
    sources: "Sources",
    none: "Aucun",
    noSources: "Aucune source disponible.",
    generatedNews: "Article généré",
    copyGeneratedNewsAria: "Copier l'article généré",
    copyGeneratedTweetAria: "Copier le tweet généré",
    buttonCopyNewsText: "Copier l'article",
    buttonCopyTweetText: "Tweet X",
    tweetHeading: "Tweet généré",
    tweetCardTitle: "Vérificateur de faits",
    copyVerificationAria: "Copier le résultat de vérification",
    copyResult: "Copier le résultat",
    copied: "Copié !",
    checkBtnAria: "Bouton de vérification",
    checking: "Vérification…",
    checkNow: "Vérifier maintenant",
    composeNewsBtn: "Rédiger un article",
    composeTweetBtn: "Rédiger un tweet",
    composingNews: "Rédaction de l'article…",
    composingTweet: "Rédaction du tweet…",
    heroLine: "Saisissez votre information, nous allons rechercher, analyser et vous renvoyer le ",
    loaderLine: "Le moteur d'IA travaille… collecte des preuves, recoupe les faits et établit le verdict.",
    analysis: "Analyse",
  }
};

// ======= Helpers =======
const urlRegex =
  /((https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi;

function toAbsoluteUrl(maybeUrl) {
  if (!/^https?:\/\//i.test(maybeUrl)) return `https://${maybeUrl}`;
  return maybeUrl;
}

function getDomain(u) {
  try {
    const url = new URL(toAbsoluteUrl(u));
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return (u || "").replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "");
  }
}

function faviconUrl(domain) {
  const d = (domain || "").trim();
  if (!d) return "";
  return `https://icons.duckduckgo.com/ip3/${d}.ico`;
}

// ========= New: List-aware renderer (fix numbers mess) =========
const ENUM_LINE = /^\s*([0-9\u0660-\u0669]+)[\.\):\-]\s+(.+)$/; // 1. , 1) , ١. , ١)
function splitIntoBlocks(text) {
  // يقسم النص إلى بلوكات: فقرة عادية أو قائمة مرقّمة متتالية
  const lines = (text || "").split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // تخطّي الأسطر الفارغة المتتالية
    if (!line.trim()) {
      i++;
      continue;
    }

    // لو بداية قائمة مرقّمة
    if (ENUM_LINE.test(line)) {
      const items = [];
      while (i < lines.length && ENUM_LINE.test(lines[i])) {
        const m = lines[i].match(ENUM_LINE);
        items.push(m[2]); // المحتوى بدون الرقم، هنربطه بعدين باللينكات
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // غير ذلك: اجمع لحد سطر فاضي أو لحد قائمة جديدة
    const buff = [];
    while (i < lines.length && lines[i].trim() && !ENUM_LINE.test(lines[i])) {
      buff.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: buff.join(" ") });
  }
  return blocks;
}

// يحوّل نص إلى عناصر React مع أزرار للروابط داخل الفقرات/العناصر
function linkifyText(txt) {
  if (!txt) return null;

  // 1) Markdown links [label](url)
  const md = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let last = 0, m;

  while ((m = md.exec(txt)) !== null) {
    const [full, label, href] = m;
    const start = m.index;
    if (start > last) parts.push(txt.slice(last, start));
    parts.push(<LinkChip key={`md-${start}`} href={href} label={label} />);
    last = start + full.length;
  }
  if (last < txt.length) parts.push(txt.slice(last));

  // 2) Raw URLs
  const out = [];
  parts.forEach((p, idx) => {
    if (typeof p !== "string") { out.push(p); return; }
    let l = 0, hit;
    while ((hit = urlRegex.exec(p)) !== null) {
      const raw = hit[0], s = hit.index;
      if (s > l) out.push(p.slice(l, s));
      out.push(<LinkChip key={`url-${idx}-${s}`} href={toAbsoluteUrl(raw)} />);
      l = s + raw.length;
    }
    if (l < p.length) out.push(p.slice(l));
  });

  return out.map((node, i) => typeof node === "string" ? <span key={`t-${i}`}>{node}</span> : node);
}

function renderTalkSmart(talk) {
  const blocks = splitIntoBlocks(talk || "");
  return blocks.map((b, idx) => {
    if (b.type === "ol") {
      return (
        <ol
          key={`b-${idx}`}
          dir="rtl"
          className="nice-ol ms-4 my-3 grid gap-2"
        >
          {b.items.map((it, j) => (
            <li key={`it-${j}`} className="leading-8 pe-2">
              {linkifyText(it)}
            </li>
          ))}
        </ol>
      );
    }
    // فقرة عادية
    return (
      <p key={`b-${idx}`} className="leading-8 my-2">
        {linkifyText(b.text)}
      </p>
    );
  });
}

// ======= Component =======
function AINeonFactChecker() {
  const { isArabic, language } = useLanguage();
  const { isDark } = useTheme();
  const T = TRANSLATIONS[language] || TRANSLATIONS.english;

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [composingNews, setComposingNews] = useState(false);
  const [composingTweet, setComposingTweet] = useState(false);

  async function handleCheck() {
    setErr("");
    setResult(null);
    const q = query.trim();
    if (!q) {
      setErr(T.errorNoQuery);
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 Sending request to:", FACT_CHECK_URL);
      console.log("📝 Request body:", {
        query: q,
        generate_news: false,
        generate_tweet: false
      });

      const res = await fetch(FACT_CHECK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          generate_news: false,
          generate_tweet: false
        }),
      });

      console.log("📡 Response status:", res.status, res.statusText);

      const text = await res.text();
      console.log("📄 Response text:", text);

      if (!text.trim()) {
        throw new Error("Server returned empty response");
      }

      let data;
      try {
        data = JSON.parse(text);
        console.log("✅ Parsed JSON data:", data);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", text);
        throw new Error("Invalid JSON response from server");
      }

      if (!data?.ok) {
        setErr(data?.error || T.errorFetch);
        setLoading(false);
        return;
      }

      setResult({
        case: data.case || "غير متوفر",
        talk: data.talk || "لا يوجد تفسير.",
        sources: Array.isArray(data.sources) ? data.sources : [],
        news_article: data.news_article || null,
        x_tweet: data.x_tweet || null,
      });

    } catch (e) {
      console.error("Error in handleCheck:", e);
      setErr(e.message || T.errorUnexpected);
    } finally {
      setLoading(false);
    }
  }

  async function handleComposeNews() {
    if (!result) return;

    setComposingNews(true);
    setErr("");
    try {
      const requestBody = {
        claim_text: query.trim(),
        case: result.case,
        talk: result.talk,
        sources: result.sources,
        lang: language === "arabic" ? "ar" : language === "french" ? "fr" : "en"
      };

      console.log("📰 Composing news via:", COMPOSE_NEWS_URL);
      console.log("📝 News request body:", requestBody);

      const res = await fetch(COMPOSE_NEWS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 News response status:", res.status, res.statusText);

      const text = await res.text();
      console.log("📄 News response text:", text);

      if (!text.trim()) {
        throw new Error("Server returned empty response");
      }

      let data;
      try {
        data = JSON.parse(text);
        console.log("✅ News parsed JSON data:", data);
      } catch (parseError) {
        console.error("JSON Parse Error in compose news:", parseError);
        console.error("Response text:", text);
        throw new Error("Invalid JSON response from server");
      }

      if (data?.ok && data?.news_article) {
        setResult(prev => ({
          ...prev,
          news_article: data.news_article
        }));
      } else {
        setErr(data?.error || T.errorFetch);
        setComposingNews(false);
        return;
      }
    } catch (e) {
      console.error("Error in handleComposeNews:", e);
      setErr(e.message || T.errorUnexpected);
    } finally {
      setComposingNews(false);
    }
  }

  async function handleComposeTweet() {
    if (!result) return;

    setComposingTweet(true);
    setErr("");
    try {
      const requestBody = {
        claim_text: query.trim(),
        case: result.case,
        talk: result.talk,
        sources: result.sources,
        lang: language === "arabic" ? "ar" : language === "french" ? "fr" : "en"
      };

      console.log("🐦 Composing tweet via:", COMPOSE_TWEET_URL);
      console.log("📝 Tweet request body:", requestBody);

      const res = await fetch(COMPOSE_TWEET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Tweet response status:", res.status, res.statusText);

      const text = await res.text();
      console.log("📄 Tweet response text:", text);

      if (!text.trim()) {
        throw new Error("Server returned empty response");
      }

      let data;
      try {
        data = JSON.parse(text);
        console.log("✅ Tweet parsed JSON data:", data);
      } catch (parseError) {
        console.error("JSON Parse Error in compose tweet:", parseError);
        console.error("Response text:", text);
        throw new Error("Invalid JSON response from server");
      }

      if (data?.ok && data?.x_tweet) {
        setResult(prev => ({
          ...prev,
          x_tweet: data.x_tweet
        }));
      } else {
        setErr(data?.error || T.errorFetch);
        setComposingTweet(false);
        return;
      }
    } catch (e) {
      console.error("Error in handleComposeTweet:", e);
      setErr(e.message || T.errorUnexpected);
    } finally {
      setComposingTweet(false);
    }
  }

  function copyAll() {
    if (!result) return;
    let text =
      `${T.status}: ${result.case}\n\n` +
      `${T.analysis}: ${result.talk}\n\n` +
      `${T.sources}:\n` +
      (result.sources?.length
        ? result.sources.map((s) => `- ${s.title || getDomain(s?.url)} — ${s.url}`).join("\n")
        : `- ${T.none}`);

    if (result.news_article) {
      text += `\n\n${T.generatedNews}:\n${result.news_article}`;
    }

    if (result.x_tweet) {
      text += `\n\n${T.tweetHeading}:\n${result.x_tweet}`;
    }

    navigator.clipboard.writeText(text).then(() => {
      // Show success feedback
      const button = document.querySelector('[aria-label*="نسخ"]') || document.querySelector('[aria-label*="Copy"]');
      if (button) {
        const originalContent = button.textContent;
        button.textContent = T.copied;
        button.style.background = 'linear-gradient(to right, #10b981, #059669)';
        setTimeout(() => {
          button.textContent = originalContent;
          button.style.background = '';
        }, 2000);
      }
    });
  }

  const renderedTalk = useMemo(() => renderTalkSmart(result?.talk || ""), [result?.talk]);

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className={`min-h-screen relative overflow-hidden px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 pb-8 sm:pb-12 transition-colors duration-300 ${isDark ? 'text-gray-100' : 'text-slate-800'}`}>

      {/* Language Toggle */}
      <div
        className="absolute z-20 top-2 left-1 xs:left-2 sm:left-4 md:left-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
      >
        <LanguageToggle />
      </div>

      {/* Theme Toggle */}
      <div
        className="absolute z-20 top-2 right-1 xs:right-2 sm:right-4 md:right-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}
      >
        <ThemeToggle />
      </div>

      {/* Header with Logo and Branding */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto pt-12 xs:pt-14 sm:pt-14 md:pt-16 flex flex-col items-center gap-1"
      >
        {/* WAFA Logo */}
        <img
          src={unaLogoDark}
          alt="Wafa Fact Check"
          className="h-16 xs:h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 max-w-[80vw] sm:max-w-[85vw] object-contain select-none"
          draggable="false"
        />


        {/* Title - Wafa Fact Check */}
        <h1
          className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-none font-extrabold tracking-tight select-none my-3 xs:my-4 sm:my-1 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          Wafa Fact Check
        </h1>

        {/* Subtitle in Arabic */}
        <p className={`text-xs xs:text-sm sm:text-base md:text-lg text-center max-w-[95vw] xs:max-w-[90vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl leading-relaxed px-2 xs:px-3 sm:px-4 mt-2 xs:mt-1 sm:-mt-3 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
          {language === 'arabic' ? (
            <>
              تنويه: المنصة تعمل فقط على فحص وتدقيق الأخبار المرتبطة <span className="font-bold" style={{color: '#4b7544'}}>بدولة فلسطين</span> <span className="font-bold text-slate-900">و</span> <span className="font-bold" style={{color: '#c20009'}}>الحق الفلسطيني</span>
            </>
          ) : language === 'french' ? (
            <>
              Avis: La plateforme ne fonctionne que pour vérifier les actualités liées à <span className="font-bold" style={{color: '#4b7544'}}>l'État de Palestine</span> <span className="font-bold" style={{color: '#c20009'}}>et la cause palestinienne</span>
            </>
          ) : (
            <>
              Notice: The platform only works to verify news related to <span className="font-bold" style={{color: '#4b7544'}}>the State of Palestine</span> <span className="font-bold" style={{color: '#c20009'}}>and the Palestinian cause</span>
            </>
          )}
        </p>
      </motion.div>

      {/* Main card */}
      <div className="relative z-10 mx-auto mt-6 xs:mt-7 sm:mt-6 md:mt-8 w-full max-w-[92vw] xs:max-w-[88vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        <div className={`rounded-2xl xs:rounded-3xl p-5 xs:p-6 sm:p-6 md:p-8 transition-colors duration-300 ${isDark ? 'bg-slate-800/95 shadow-[0_4px_30px_rgba(0,0,0,0.4)] border border-slate-700' : 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]'}`}>
          {/* Fact Checker Input */}
          <div className="flex flex-col gap-4 xs:gap-5 sm:gap-4">
            <label className={`text-sm xs:text-base md:text-lg font-semibold ${language === 'arabic' ? 'text-right' : 'text-left'}`} style={{color: '#4b7544'}}>
              {T.inputLabel}
            </label>
            <textarea
              className={`min-h-[120px] xs:min-h-[140px] sm:min-h-[140px] md:min-h-[160px] rounded-xl xs:rounded-2xl px-4 xs:px-5 sm:px-5 py-3.5 xs:py-4 sm:py-4 focus:outline-none focus:ring-2 transition-all resize-none border-2 text-sm xs:text-base ${isDark ? 'bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'}`}
              style={{'--tw-ring-color': '#77b16e'}}
              placeholder={language === 'arabic' ? 'اكتب العنوان هنا' : T.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleCheck();
                }
              }}
              aria-label={T.ariaInput}
              aria-describedby="input-help"
            />

            {/* Specialization Note */}
            <div className={`rounded-xl xs:rounded-2xl border-2 p-4 xs:p-5 sm:p-4 md:p-5 ${isDark ? 'bg-slate-900/80 border-slate-600' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-start gap-3 xs:gap-4 sm:gap-3 ${language === 'arabic' ? '' : 'flex-row-reverse'}`}>
                <motion.span
                  className="text-lg xs:text-xl sm:text-2xl flex-shrink-0"
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                >
                  ⭐
                </motion.span>
                <p className={`text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed font-medium ${language === 'arabic' ? '' : 'text-left'} ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {language === 'arabic' ? (
                    <>
                      <span className="font-bold" style={{color: '#4b7544'}}>نطاق التخصص:</span> <span className="font-bold" style={{color: '#4b7544'}}>دولة فلسطين</span> <span className="font-bold text-slate-900">و</span> <span className="font-bold" style={{color: '#c20009'}}>الحق الفلسطيني</span>
                    </>
                  ) : language === 'french' ? (
                    <>
                      <span className="font-bold" style={{color: '#4b7544'}}>Domaine de spécialisation:</span> <span className="font-bold" style={{color: '#4b7544'}}>État de Palestine</span> . <span className="font-bold" style={{color: '#c20009'}}>Cause palestinienne</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold" style={{color: '#4b7544'}}>Scope of Specialization:</span> <span className="font-bold" style={{color: '#4b7544'}}>State of Palestine</span> . <span className="font-bold" style={{color: '#c20009'}}>Palestinian Cause</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 xs:gap-4 sm:gap-3 flex-wrap justify-center">
              {/* Check Now Button - Green */}
              <motion.button
                onClick={handleCheck}
                disabled={loading}
                className="flex-1 min-w-0 xs:min-w-[160px] sm:min-w-[180px] md:min-w-[200px] px-5 xs:px-6 sm:px-6 py-3.5 xs:py-4 sm:py-4 rounded-xl xs:rounded-2xl font-bold text-sm xs:text-base sm:text-lg text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(to bottom, #4b7544, #77b16e)',
                  '--tw-ring-color': '#77b16e'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #77b16e, #4b7544)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #4b7544, #77b16e)'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label={T.checkBtnAria}
              >
                <span className="flex items-center justify-center gap-1.5 xs:gap-2">
                  {loading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 xs:w-5 xs:h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>{T.checking}</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>{T.checkNow}</span>
                    </>
                  )}
                </span>
              </motion.button>

              {/* Copy Result Button - Light Gray */}
              {result && (
                <motion.button
                  onClick={copyAll}
                  className={`flex-1 min-w-0 xs:min-w-[160px] sm:min-w-[180px] md:min-w-[200px] px-5 xs:px-6 sm:px-6 py-3.5 xs:py-4 sm:py-4 rounded-xl xs:rounded-2xl font-bold text-sm xs:text-base sm:text-lg shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 active:scale-[0.98] ${isDark ? 'text-slate-100 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 border border-slate-600' : 'text-slate-700 bg-slate-100 hover:bg-slate-200 focus:ring-slate-300'}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label={T.copyVerificationAria}
                >
                  <span className="flex items-center justify-center gap-1.5 xs:gap-2">
                    <svg className="w-4 h-4 xs:w-[18px] xs:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>{T.copyResult}</span>
                  </span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {err && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-3 xs:mt-4 rounded-xl xs:rounded-2xl px-3 xs:px-4 sm:px-5 py-3 xs:py-4 border-2"
                style={{
                  backgroundColor: 'rgba(75, 117, 68, 0.1)',
                  borderColor: '#77b16e',
                  color: '#4b7544'
                }}
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-2 xs:gap-3">
                  <span className="text-lg xs:text-xl">⚠️</span>
                  <p className="text-sm xs:text-base font-semibold leading-relaxed">{err}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loader */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 xs:mt-5 sm:mt-6 text-center py-6 xs:py-8"
              >
                <div className="flex flex-col items-center gap-3 xs:gap-4">
                  <motion.div
                    className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-4 rounded-full"
                    style={{
                      borderColor: 'rgba(119, 177, 110, 0.3)',
                      borderTopColor: '#4b7544'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className={`text-xs xs:text-sm sm:text-base font-medium px-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{T.loaderLine}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-5 xs:mt-6 sm:mt-8 grid gap-4 xs:gap-5 sm:gap-5"
              >
                {/* Case Status with Colored Circle - Only show if case exists */}
                {result.case && (
                  <motion.div
                    className={`rounded-xl xs:rounded-2xl p-5 xs:p-6 sm:p-6 border shadow-sm ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                      {/* Colored Circle Indicator */}
                      <div className={`w-4 h-4 xs:w-5 xs:h-5 rounded-full flex-shrink-0 ${
                        result.case?.includes('صحيح') || result.case?.toLowerCase().includes('true') || result.case?.toLowerCase().includes('verified')
                          ? 'bg-green-500'
                          : result.case?.includes('خطأ') || result.case?.toLowerCase().includes('false') || result.case?.toLowerCase().includes('misleading')
                          ? 'bg-green-600'
                          : 'bg-yellow-500'
                      }`} />
                      <h3 className={`text-base xs:text-lg sm:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{T.status}</h3>
                    </div>
                    <p className={`mt-2 xs:mt-3 text-sm xs:text-base sm:text-lg font-semibold ps-6 xs:ps-7 sm:ps-9 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{result.case}</p>
                  </motion.div>
                )}

                {/* Analysis - Only show if talk exists */}
                {result.talk && (
                  <motion.div
                    className={`rounded-xl xs:rounded-2xl p-5 xs:p-6 sm:p-6 border shadow-sm ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4">
                      <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-blue-500 flex-shrink-0" />
                      <h3 className={`text-base xs:text-lg sm:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{T.analysis}</h3>
                    </div>
                    <div className={`prose max-w-none leading-relaxed text-sm xs:text-base ps-6 xs:ps-7 sm:ps-9 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {renderedTalk}
                    </div>
                  </motion.div>
                )}

                {/* Sources - Only show if sources exist */}
                {result.sources && result.sources.length > 0 && (
                  <motion.div
                    className={`rounded-xl xs:rounded-2xl p-5 xs:p-6 sm:p-6 border shadow-sm ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 sm:mb-5">
                      <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-purple-500 flex-shrink-0" />
                      <h3 className={`text-base xs:text-lg sm:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{T.sources}</h3>
                    </div>

                    <ul className="grid gap-2 xs:gap-3 grid-cols-1">
                      {result.sources.map((s, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                        >
                          <LinkChip href={s?.url} label={s?.title} big />
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Compose Actions */}
                <motion.div
                  className="flex flex-col xs:flex-row gap-2 xs:gap-3 flex-wrap justify-center mt-1 xs:mt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {!result.news_article && (
                    <motion.button
                      onClick={handleComposeNews}
                      disabled={composingNews}
                      className="px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 rounded-xl xs:rounded-2xl font-bold text-sm xs:text-base text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(to bottom, #c20009, #e6000b)',
                        '--tw-ring-color': '#e6000b'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #e6000b, #c20009)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #c20009, #e6000b)'}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center gap-1.5 xs:gap-2">
                        {composingNews ? (
                          <>
                            <motion.div
                              className="w-3.5 h-3.5 xs:w-4 xs:h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <span>{T.composingNews}</span>
                          </>
                        ) : (
                          <span>{T.composeNewsBtn}</span>
                        )}
                      </span>
                    </motion.button>
                  )}

                  {!result.x_tweet && (
                    <motion.button
                      onClick={handleComposeTweet}
                      disabled={composingTweet}
                      className="px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 rounded-xl xs:rounded-2xl font-bold text-sm xs:text-base text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(to bottom, #4b7544, #77b16e)',
                        '--tw-ring-color': '#77b16e'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #77b16e, #4b7544)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #4b7544, #77b16e)'}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center gap-1.5 xs:gap-2">
                        {composingTweet ? (
                          <>
                            <motion.div
                              className="w-3.5 h-3.5 xs:w-4 xs:h-4 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <span>{T.composingTweet}</span>
                          </>
                        ) : (
                          <span>{T.composeTweetBtn}</span>
                        )}
                      </span>
                    </motion.button>
                  )}
                </motion.div>

                {/* Generated News Article */}
                {result.news_article && (
                  <motion.div
                    className={`rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 border shadow-sm ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4 mb-3 xs:mb-4">
                      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                        <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-green-500 flex-shrink-0" />
                        <h3 className={`text-base xs:text-lg sm:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{T.generatedNews}</h3>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          navigator.clipboard.writeText(result.news_article).then(() => {
                            const button = e.currentTarget;
                            const originalText = button.textContent;
                            button.textContent = `${T.copied} ✓`;
                            setTimeout(() => {
                              button.textContent = originalText;
                            }, 2000);
                          });
                        }}
                        className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl font-semibold text-xs xs:text-sm transition-all duration-300 focus:outline-none focus:ring-2 active:scale-[0.98] ${isDark ? 'text-slate-100 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500' : 'text-slate-700 bg-slate-100 hover:bg-slate-200 focus:ring-slate-300'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={T.copyGeneratedNewsAria}
                      >
                        {T.buttonCopyNewsText}
                      </motion.button>
                    </div>
                    <div className={`rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-5 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`prose max-w-none leading-relaxed text-sm xs:text-base whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {result.news_article}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Generated Tweet */}
                {result.x_tweet && (
                  <motion.div
                    className={`rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 border shadow-sm ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4 mb-3 xs:mb-4">
                      <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                        <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-blue-500 flex-shrink-0" />
                        <h3 className={`text-base xs:text-lg sm:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{T.tweetHeading}</h3>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          navigator.clipboard.writeText(result.x_tweet).then(() => {
                            const button = e.currentTarget;
                            const originalText = button.textContent;
                            button.textContent = `${T.copied} ✓`;
                            setTimeout(() => {
                              button.textContent = originalText;
                            }, 2000);
                          });
                        }}
                        className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl font-semibold text-xs xs:text-sm transition-all duration-300 focus:outline-none focus:ring-2 active:scale-[0.98] ${isDark ? 'text-slate-100 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500' : 'text-slate-700 bg-slate-100 hover:bg-slate-200 focus:ring-slate-300'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={T.copyGeneratedTweetAria}
                      >
                        {T.buttonCopyTweetText}
                      </motion.button>
                    </div>
                    <div className={`rounded-lg xs:rounded-xl p-3 xs:p-4 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 xs:gap-3 mb-2 xs:mb-3">
                        <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm xs:text-base">
                          F
                        </div>
                        <div>
                          <div className={`font-bold text-sm xs:text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{T.tweetCardTitle}</div>
                          <div className={`text-xs xs:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>@factchecker</div>
                        </div>
                      </div>
                      <div className={`text-sm xs:text-base leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        {result.x_tweet}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>

      {/* Local styles for ordered list */}
      <style>{`
        /* Ordered list with Arabic numbering */
        .nice-ol {
          list-style: none;
          counter-reset: item;
          padding-inline-start: 0;
        }
        .nice-ol > li {
          counter-increment: item;
          position: relative;
          padding-right: 2.2em;
        }
        .nice-ol > li::before {
          content: counter(item, arabic-indic) "‎. ";
          position: absolute;
          right: 0;
          top: 0;
          font-weight: 800;
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
}

/* ----------------- Small UI components ----------------- */
function LinkChip({ href, label, big = false }) {
  const { isDark } = useTheme();
  if (!href) return null;
  const abs = toAbsoluteUrl(href);
  const domain = getDomain(abs);
  const text = label?.trim() || domain;

  return (
    <a
      href={abs}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 xs:gap-3 rounded-lg xs:rounded-xl transition-all px-3 xs:px-4 py-2.5 xs:py-3 ${big ? "w-full" : ""} border shadow-sm active:scale-[0.99] ${isDark ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-600' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'}`}
      title={text}
    >
      <img
        src={faviconUrl(domain)}
        alt=""
        className={`${big ? "w-4 h-4 xs:w-5 xs:h-5" : "w-3.5 h-3.5 xs:w-4 xs:h-4"} rounded flex-shrink-0`}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <span className={`truncate ${big ? "text-sm xs:text-base font-medium" : "text-xs xs:text-sm"} ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        {text}
      </span>
      <span className={`ms-auto opacity-0 group-hover:opacity-100 transition flex-shrink-0 text-sm xs:text-base ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
        ↗
      </span>
    </a>
  );
}

// Main App component with LanguageProvider
export default function App() {
  return (
    <LanguageProvider>
      <AINeonFactChecker />
    </LanguageProvider>
  );
}