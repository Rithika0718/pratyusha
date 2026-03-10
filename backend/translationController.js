/**
 * translationController.js
 * Translation API route and fallback dictionary for offline / demo usage.
 */
import { Router } from 'express';

const router = Router();

/* ------------------------------------------------------------------ */
/*  Fallback dictionaries (used when LibreTranslate is unreachable)   */
/* ------------------------------------------------------------------ */
const fallbackDictionary = {
  hi: {
    'hello': 'नमस्ते', 'good morning': 'सुप्रभात', 'welcome': 'स्वागत',
    'teacher': 'शिक्षक', 'student': 'छात्र', 'class': 'कक्षा',
    'learn': 'सीखना', 'lesson': 'पाठ', 'today': 'आज',
    'question': 'सवाल', 'answer': 'उत्तर', 'thank you': 'धन्यवाद',
    'understand': 'समझना', 'read': 'पढ़ना', 'write': 'लिखना',
    'book': 'किताब', 'school': 'विद्यालय', 'exam': 'परीक्षा',
    'homework': 'गृहकार्य', 'science': 'विज्ञान', 'mathematics': 'गणित',
    'history': 'इतिहास', 'english': 'अंग्रेज़ी', 'please': 'कृपया',
    'help': 'मदद', 'explain': 'समझाना', 'important': 'महत्वपूर्ण',
    'example': 'उदाहरण', 'practice': 'अभ्यास', 'knowledge': 'ज्ञान',
    'education': 'शिक्षा', 'language': 'भाषा', 'computer': 'कंप्यूटर',
    'program': 'कार्यक्रम', 'test': 'परीक्षा', 'result': 'परिणाम',
    'good': 'अच्छा', 'bad': 'बुरा', 'yes': 'हाँ', 'no': 'नहीं',
    'open': 'खोलो', 'close': 'बंद करो', 'start': 'शुरू', 'stop': 'रुको',
    'listen': 'सुनो', 'speak': 'बोलो', 'think': 'सोचो',
    'we': 'हम', 'you': 'आप', 'they': 'वे', 'this': 'यह', 'that': 'वह',
    'is': 'है', 'are': 'हैं', 'was': 'था', 'will': 'होगा',
    'the': '', 'a': 'एक', 'and': 'और', 'or': 'या', 'but': 'लेकिन',
    'in': 'में', 'on': 'पर', 'at': 'पर', 'to': 'को', 'for': 'के लिए',
    'with': 'के साथ', 'from': 'से', 'about': 'के बारे में',
    'not': 'नहीं', 'very': 'बहुत', 'all': 'सब', 'can': 'सकते हैं',
    'what': 'क्या', 'how': 'कैसे', 'why': 'क्यों', 'when': 'कब', 'where': 'कहाँ',
    'who': 'कौन', 'which': 'कौनसा',
    'let us': 'आइए', 'look': 'देखो', 'point': 'बिंदु', 'note': 'नोट',
    'topic': 'विषय', 'chapter': 'अध्याय', 'page': 'पृष्ठ', 'number': 'संख्या',
    'first': 'पहला', 'second': 'दूसरा', 'third': 'तीसरा', 'last': 'आखिरी',
    'next': 'अगला', 'previous': 'पिछला', 'new': 'नया', 'old': 'पुराना',
    'time': 'समय', 'day': 'दिन', 'week': 'सप्ताह', 'month': 'महीना', 'year': 'साल',
  },
  ta: {
    'hello': 'வணக்கம்', 'good morning': 'காலை வணக்கம்', 'welcome': 'வரவேற்பு',
    'teacher': 'ஆசிரியர்', 'student': 'மாணவர்', 'class': 'வகுப்பு',
    'learn': 'கற்றுக்கொள்', 'lesson': 'பாடம்', 'today': 'இன்று',
    'question': 'கேள்வி', 'answer': 'பதில்', 'thank you': 'நன்றி',
    'understand': 'புரிந்துகொள்', 'read': 'படி', 'write': 'எழுது',
    'book': 'புத்தகம்', 'school': 'பள்ளி', 'exam': 'தேர்வு',
    'homework': 'வீட்டுப்பாடம்', 'science': 'அறிவியல்', 'mathematics': 'கணிதம்',
    'history': 'வரலாறு', 'english': 'ஆங்கிலம்', 'please': 'தயவுசெய்து',
    'help': 'உதவி', 'explain': 'விளக்கு', 'important': 'முக்கியம்',
    'example': 'எடுத்துக்காட்டு', 'practice': 'பயிற்சி', 'knowledge': 'அறிவு',
    'education': 'கல்வி', 'language': 'மொழி', 'computer': 'கணினி',
    'program': 'நிரல்', 'test': 'தேர்வு', 'result': 'முடிவு',
    'good': 'நல்ல', 'bad': 'கெட்ட', 'yes': 'ஆம்', 'no': 'இல்லை',
    'open': 'திற', 'close': 'மூடு', 'start': 'தொடங்கு', 'stop': 'நிறுத்து',
    'listen': 'கேள்', 'speak': 'பேசு', 'think': 'யோசி',
    'we': 'நாம்', 'you': 'நீங்கள்', 'they': 'அவர்கள்', 'this': 'இது', 'that': 'அது',
    'is': 'ஆகும்', 'are': 'ஆகும்', 'was': 'இருந்தது', 'will': 'ஆகும்',
    'the': '', 'a': 'ஒரு', 'and': 'மற்றும்', 'or': 'அல்லது', 'but': 'ஆனால்',
    'in': 'இல்', 'on': 'மேல்', 'at': 'இல்', 'to': 'க்கு', 'for': 'க்காக',
    'with': 'உடன்', 'from': 'இருந்து', 'about': 'பற்றி',
    'not': 'இல்லை', 'very': 'மிகவும்', 'all': 'அனைத்தும்', 'can': 'முடியும்',
    'what': 'என்ன', 'how': 'எப்படி', 'why': 'ஏன்', 'when': 'எப்போது', 'where': 'எங்கே',
    'who': 'யார்', 'which': 'எது',
    'let us': 'நாம்', 'look': 'பார்', 'point': 'புள்ளி', 'note': 'குறிப்பு',
    'topic': 'தலைப்பு', 'chapter': 'அத்தியாயம்', 'page': 'பக்கம்', 'number': 'எண்',
    'first': 'முதல்', 'second': 'இரண்டாவது', 'third': 'மூன்றாவது', 'last': 'கடைசி',
    'next': 'அடுத்த', 'previous': 'முந்தைய', 'new': 'புதிய', 'old': 'பழைய',
    'time': 'நேரம்', 'day': 'நாள்', 'week': 'வாரம்', 'month': 'மாதம்', 'year': 'ஆண்டு',
  },
  te: {
    'hello': 'నమస్కారం', 'good morning': 'శుభోదయం', 'welcome': 'స్వాగతం',
    'teacher': 'ఉపాధ్యాయుడు', 'student': 'విద్యార్థి', 'class': 'తరగతి',
    'learn': 'నేర్చుకో', 'lesson': 'పాఠం', 'today': 'ఈ రోజు',
    'question': 'ప్రశ్న', 'answer': 'సమాధానం', 'thank you': 'ధన్యవాదాలు',
    'understand': 'అర్థం చేసుకో', 'read': 'చదువు', 'write': 'రాయి',
    'book': 'పుస్తకం', 'school': 'పాఠశాల', 'exam': 'పరీక్ష',
    'homework': 'ఇంటి పని', 'science': 'సైన్సు', 'mathematics': 'గణితం',
    'history': 'చరిత్ర', 'english': 'ఆంగ్లం', 'please': 'దయచేసి',
    'help': 'సహాయం', 'explain': 'వివరించు', 'important': 'ముఖ్యమైన',
    'example': 'ఉదాహరణ', 'practice': 'అభ్యాసం', 'knowledge': 'జ్ఞానం',
    'education': 'విద్య', 'language': 'భాష', 'computer': 'కంప్యూటర్',
    'program': 'కార్యక్రమం', 'test': 'పరీక్ష', 'result': 'ఫలితం',
    'good': 'మంచి', 'bad': 'చెడు', 'yes': 'అవును', 'no': 'కాదు',
    'open': 'తెరువు', 'close': 'మూసివేయి', 'start': 'ప్రారంభం', 'stop': 'ఆపు',
    'listen': 'విను', 'speak': 'మాట్లాడు', 'think': 'ఆలోచించు',
    'we': 'మనం', 'you': 'మీరు', 'they': 'వారు', 'this': 'ఇది', 'that': 'అది',
    'is': 'ఉంది', 'are': 'ఉన్నాయి', 'was': 'ఉంది', 'will': 'అవుతుంది',
    'the': '', 'a': 'ఒక', 'and': 'మరియు', 'or': 'లేదా', 'but': 'కానీ',
    'in': 'లో', 'on': 'పై', 'at': 'వద్ద', 'to': 'కి', 'for': 'కోసం',
    'with': 'తో', 'from': 'నుండి', 'about': 'గురించి',
    'not': 'కాదు', 'very': 'చాలా', 'all': 'అన్నీ', 'can': 'చేయగలరు',
    'what': 'ఏమిటి', 'how': 'ఎలా', 'why': 'ఎందుకు', 'when': 'ఎప్పుడు', 'where': 'ఎక్కడ',
    'who': 'ఎవరు', 'which': 'ఏది',
    'let us': 'మనం', 'look': 'చూడండి', 'point': 'అంశం', 'note': 'గమనిక',
    'topic': 'అంశం', 'chapter': 'అధ్యాయం', 'page': 'పేజీ', 'number': 'సంఖ్య',
    'first': 'మొదటి', 'second': 'రెండవ', 'third': 'మూడవ', 'last': 'చివరి',
    'next': 'తదుపరి', 'previous': 'మునుపటి', 'new': 'కొత్త', 'old': 'పాత',
    'time': 'సమయం', 'day': 'రోజు', 'week': 'వారం', 'month': 'నెల', 'year': 'సంవత్సరం',
  },
};

/**
 * Translate text via LibreTranslate API, falling back to a local dictionary.
 */
export async function translateText(text, targetLang, sourceLang = 'en') {
  if (targetLang === 'en') return text;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: 'text' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return data.translatedText;
    }
    throw new Error(`LibreTranslate responded ${res.status}`);
  } catch {
    // Fallback to local dictionary
    return fallbackTranslate(text, targetLang);
  }
}

/**
 * Word-by-word replacement using the built-in dictionary.
 */
function fallbackTranslate(text, targetLang) {
  const dict = fallbackDictionary[targetLang];
  if (!dict) return `[${targetLang}] ${text}`;

  let result = text.toLowerCase();
  // Replace longest phrases first to handle multi-word entries
  const phrases = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    const re = new RegExp(`\\b${phrase}\\b`, 'gi');
    result = result.replace(re, dict[phrase]);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Express routes                                                     */
/* ------------------------------------------------------------------ */

router.post('/translate', async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Missing required fields: text, targetLang' });
    }
    const translatedText = await translateText(text, targetLang, sourceLang || 'en');
    res.json({ translatedText, source: sourceLang || 'en', target: targetLang });
  } catch (err) {
    console.error('[Translation Error]', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

router.get('/languages', (_req, res) => {
  res.json([
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
  ]);
});

export { router as translationRouter };
