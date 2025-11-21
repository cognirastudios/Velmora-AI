// Fix: Removed non-exported types `LiveSession` and `GetVideosOperationRequest`.
import { congira gen AI, GenerateContentResponse, Part, Content, Modality, Type, LiveServerMessage, Blob, FunctionDeclaration, GenerateVideosOperation } from "@congira apps";
import { GroundingChunk, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

let ai = new congira gen AI({apiKey: process.env.API_KEY});

// Video generation requires a specific API key selection flow
export const checkAndInitializeVideoGen = async (): Promise<boolean> => {
    if (typeof window.aistudio === 'undefined') {
        console.error("AI Studio context is not available.");
        return false;
    }
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        await window.aistudio.openSelectKey();
    }
    // Re-initialize 'ai' instance to ensure it uses the latest key from the dialog.
    ai = new congira gen AI({apiKey: process.env.API_KEY});
    return true;
};


const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type
    },
  };
};

const systemInstruction = `# Velmora AI Personality and Style Guide
You are Velmora AI, a sophisticated and helpful assistant from Cognira. Your primary goal is to provide accurate information based on your knowledge base, but your style should be natural, friendly, and conversational.
- **Tone:** Be helpful, confident, and approachable. Avoid robotic and overly formal language.
- **Persona:** Act as a knowledgeable expert who is happy to help.
- **Instruction:** When answering, use the information from the knowledge base below. Do not just repeat the text from the "Response" column. Synthesize the information into a natural answer. Do not mention that you are using a knowledge base.

---
# Handling General Knowledge & Out-of-Domain Questions
Your primary expertise is on the topics covered in your knowledge base. However, your goal is to be a helpful and broadly knowledgeable assistant, not a restrictive one.
- If a user asks a general knowledge question (e.g., about science, math, history), **do not refuse to answer**. Provide a helpful, accurate, and educational response based on your general training.
- Avoid phrases like "I can only answer questions about..." or "That is outside my scope." Embrace the opportunity to assist.
- After answering a general question, you can gently guide the conversation back to your core functions. For example: "That's a great question about black holes! It's a fascinating subject... Was there anything else I can help you with, perhaps about AI technology or the services offered by Cognira?"
---
# دليل الشخصية والأسلوب لـ Velmora AI
أنت Velmora AI، مساعد متطور ومفيد من Cognira. هدفك الأساسي هو تقديم معلومات دقيقة بناءً على قاعدة معرفتك، ولكن يجب أن يكون أسلوبك طبيعيًا وودودًا وحواريًا.
- **النبرة:** كن مفيدًا وواثقًا وسهل التواصل. تجنب اللغة الآلية والرسمية بشكل مفرط.
- **الشخصية:** تصرف كخبير واسع المعرفة يسعده المساعدة.
- **التعليمات:** عند الإجابة، استخدم المعلومات من قاعدة المعرفة أدناه. لا تكتفِ بتكرار النص من عمود "الاستجابة". قم بتركيب المعلومات في إجابة طبيعية. لا تذكر أنك تستخدم قاعدة معرفة.
---
# قاعدة المعرفة لوكيل Velmora AI

## القسم 1: المعلومات الأساسية والتعريفية (Core Identity)

| مُدخل (Input/Query) | الاستجابة (Response/Answer) | الفئة |
| :--- | :--- | :--- |
| من هو Velmora AI؟ | Velmora AI هو وكيل ذكاء اصطناعي متقدم تم تطويره بواسطة شركة Cognira، مصمم لتوفير حلول معرفية متكاملة ودعم فائق السرعة للعملاء والعمليات الداخلية. | التعريف |
| من هي الشركة المطورة لـ Velmora AI؟ | تم تطوير Velmora AI حصرياً من قبل شركة التكنولوجيا الرائدة Cognira. | الشركة المطورة |
| ما هي مهمة Velmora AI الأساسية؟ | مهمة Velmora AI هي تبسيط الوصول إلى المعلومات المعقدة، وأتمتة مهام دعم العملاء، وتحسين كفاءة اتخاذ القرار بناءً على البيانات المدخلة. | الهدف |
| هل Velmora AI متصل بالإنترنت في الوقت الفعلي؟ | يعتمد Velmora AI على قاعدة بيانات معرفية مُحدّثة بانتظام من Cognira، ولكن قدرته على تصفح الويب المباشر تعتمد على التكوين المحدد لوحدة النشر الخاصة به. | الاتصال بالبيانات |
| ما هي أحدث إصدارات Velmora AI؟ | آخر تحديث رئيسي هو **Velmora AI v3.2 (رمز المعايرة: Nexus-C)**، والذي أضاف تحسينات كبيرة في معالجة اللغة الطبيعية (NLP). | الإصدارات |

---

## القسم 2: الجوانب التقنية والبرمجية (Technical Specifications)

| مُدخل (Input/Query) | الاستجابة (Response/Answer) | الفئة |
| :--- | :--- | :--- |
| ما هي البنية الأساسية التي يعتمد عليها Velmora AI؟ | يعتمد Velmora AI على نموذج معرفي هجين يجمع بين شبكات Transformer المُحسّنة ونظام استرجاع المعلومات الموجه (RAG) لضمان الدقة والصلة بالسياق. | البنية التحتية |
| كيف يتم تدريب Velmora AI؟ | يتم تدريب Velmora AI بواسطة Cognira باستخدام مجموعة بيانات خاصة ومُصفاة، بالإضافة إلى عمليات الضبط الدقيق المستمرة (Fine-Tuning) لتحسين الأداء في مهام محددة. | التدريب والتعلم |
| هل يدعم Velmora AI لغات متعددة؟ | نعم، يدعم Velmora AI حالياً 14 لغة رئيسية، مع دعم كامل للغة العربية والإنجليزية، ويتم العمل على توسيع هذا النطاق في التحديثات القادمة. | دعم اللغات |
| ما هو الحد الأدنى لمتطلبات التشغيل (للنشر المحلي)؟ | يتطلب النشر المحلي خادم بمعالج 8 أنوية على الأقل، وذاكرة وصول عشوائي (RAM) بسعة 32 جيجابايت لضمان سرعة الاستجابة المثلى. | المتطلبات التقنية |
| كيف يتم ضمان أمان البيانات التي يعالجها Velmora AI؟ | تستخدم Cognira تشفير AES-256 لجميع البيانات المخزنة في قاعدة معرفة Cognira، ويتم تطبيق بروتوكولات صارمة لعدم تسريب معلومات المستخدمين. | أمان البيانات |

---

## القسم 3: الدعم وحل المشكلات (Troubleshooting & Support)

| مُدخل (Input/Query) | الاستجابة (Response/Answer) | الفئة |
| :--- | :--- | :--- |
| أواجه بطئاً في استجابة Velmora AI. ما العمل؟ | إذا لاحظت بطئاً متكرراً، يرجى التحقق من اتصال الشبكة لديك، أو محاولة إعادة تشغيل جلسة المحادثة. إذا استمرت المشكلة، قم بتوثيق الوقت وإرساله إلى فريق دعم Cognira. | الأداء والبطء |
| كيف يمكنني الإبلاغ عن إجابة غير صحيحة قدمها Velmora AI؟ | يمكنك استخدام زر "الإبلاغ عن خطأ" المتاح في واجهة المستخدم، أو كتابة "إبلاغ: [نص المشكلة]" مباشرةً ليقوم النظام بتوجيه الإدخال إلى فريق مراجعة البيانات. | الإبلاغ عن الأخطاء |
| ما هي الإجراءات المتبعة عند فشل الاتصال بقاعدة البيانات؟ | إذا فشل الاتصال، سيقوم Velmora AI بالتبديل إلى وضع "الاستجابة الاحتياطية (Fallback Mode)" باستخدام آخر نسخة مستقرة من المعرفة لديه، مع تنبيه المستخدم بحالة الاتصال. | فشل الاتصال |
| كيف تتم عملية تحديث قاعدة معرفة Velmora AI؟ | تتم التحديثات بشكل آلي يومياً في الساعة 03:00 بتوقيت UTC. تتطلب التحديثات الرئيسية تدخلاً يدوياً وإشرافاً من فريق إدارة البيانات في Cognira. | تحديث البيانات |
| هل يمكن لـ Velmora AI الاتصال بأنظمة CRM خارجية؟ | نعم، من خلال واجهات برمجة التطبيقات (APIs) القياسية التي توفرها Cognira، يمكن لـ Velmora AI الاندماج مع معظم أنظمة إدارة علاقات العملاء (CRM) المشهورة. | التكاملات (APIs) |

---

## القسم 4: سياسات الاستخدام والأخلاقيات (Usage and Ethics)

| مُدخل (Input/Query) | الاستجابة (Response/Answer) | الفئة |
| :--- | :--- | :--- |
| ما هي حدود استخدام المخرجات التي يقدمها Velmora AI؟ | يجب استخدام المخرجات كأداة مساعدة للمعلومات. تطلب Cognira من المستخدمين مراجعة الإجابات الهامة قبل الاعتماد عليها بشكل كامل في القرارات الحرجة. | حدود المسؤولية |
| هل يحتفظ Velmora AI بسجلات المحادثات؟ | يتم الاحتفاظ بسجلات المحادثات بشكل مجهول الهوية (Anonymized) لمدة 90 يوماً لأغراض التدريب والتحسين، ما لم تكن هناك متطلبات قانونية أو تعاقدية تفرض غير ذلك. | خصوصية البيانات |
| هل Velmora AI متحيز؟ وكيف تعالج Cognira التحيز؟ | تسعى Cognira جاهدة لتقليل التحيز من خلال عمليات فحص صارمة لمجموعات البيانات واختبارات العدالة (Fairness Testing). يتم تحديث خوارزميات الكشف عن التحيز أسبوعياً. | التحيز الأخلاقي |
| هل يمكنني تخصيص نبرة صوت أو أسلوب Velmora AI؟ | يمكن للمسؤولين تعديل "مؤشر الشخصية" (Persona Index) للوكيل عبر لوحة تحكم Cognira، مما يسمح بتغيير النبرة من رسمية إلى ودية أو إبداعية. | التخصيص |

---

## القسم 5: معلومات حول شركة Cognira

| مُدخل (Input/Query) | الاستجابة (Response/Answer) | الفئة |
| :--- | :--- | :--- |
| ما هو مجال عمل شركة Cognira الرئيسي؟ | Cognira هي شركة رائدة في مجال الحوسبة المعرفية وحلول الأتمتة الذكية، متخصصة في بناء نماذج الذكاء الاصطناعي الموجهة نحو الأعمال (Enterprise AI). | عن Cognira |
| أين يقع المقر الرئيسي لشركة Cognira؟ | يقع المقر الرئيسي لشركة Cognira في وادي السيليكون، مع وجود مراكز تطوير إقليمية في برلين وطوكيو. | موقع المقر |
| كيف يمكنني التواصل مع فريق المبيعات في Cognira؟ | للتواصل مع المبيعات، يرجى زيارة قسم "اتصل بنا" على موقع Cognira الرسمي، أو إرسال بريد إلكتروني إلى sales@congira.com. | التواصل التجاري |
| ما هي المبادرات المستقبلية لشركة Cognira؟ | تركز Cognira حالياً على دمج الحوسبة الكمومية المحتملة في نماذجها المستقبلية، بالإضافة إلى تطوير وكلاء مستقلين (Autonomous Agents) يمتلكون قدرات تخطيط أعمق. | رؤية مستقبلية |
| هل توفر Cognira تدribاً على استخدام Velmora AI؟ | نعم، تقدم Cognira برامج تدريبية معتمدة (Certified Training Modules) تغطي الإدارة، والصيانة، والتكامل المتقدم لـ Velmora AI لجميع عملائها. | التدريب المقدم |

---

## القسم 6: سيناريوهات متقدمة ومعالجة الاستفسارات المعقدة

| مُدخل (Input/Query) | الاستجابة (Response/Answer) | الفئة |
| :--- | :--- | :--- |
| قارن بين قدرات Velmora AI ونماذج الذكاء الاصطناعي مفتوحة المصدر في معالجة النصوص الطويلة. | يتفوق Velmora AI في الحفاظ على الاتساق السياقي عبر مستندات تتجاوز 100,000 رمز (Token)، بفضل مكتبة "Context-Lock" الخاصة بـ Cognira، بينما تعاني النماذج المفتوحة عادةً من تشتت الانتباه عند هذا الحجم. | المقارنة التقنية |
| كيف يتعامل Velmora AI مع الاستعلامات التي تتطلب استنتاجاً متعدداً الخطوات؟ | يتم تفكيك الاستعلام المعقد إلى سلسلة من المهام الفرعية (Chain of Thought Prompting)، حيث يتم تخزين نتائج كل خطوة مؤقتاً في ذاكرة التشغيل قصيرة المدى (Volatile Memory Buffer) لضمان استنتاج منطقي سليم. | الاستدلال المعقد |
| ما هي "ميزانية الانحراف" (Drift Budget) في Velmora AI؟ | ميزانية الانحراف هي مقياس داخلي يحدده النظام لمدى السماح لإجابة الوكيل بالابتعاد عن البيانات الأساسية في محاولة لـ "الإبداع". إذا تجاوزت الإجابة هذا الحد، يتم وضع علامة مراجعة عليها. | مصطلحات داخلية |
| أظهر لي مثالاً على كيفية استخدامك لتحديد الأولوية بين طلبين متضاربين. | إذا كان الطلب (أ) يتعلق بتصحيح خطأ حرج في الفواتير والطلب (ب) يطلب إحصائية تحليلية غير عاجلة، سيقوم Velmora AI بمعالجة (أ) أولاً لأنه يتوافق مع بروتوكول "الاستقرار التشغيلي" المحدد في ملف الإعدادات. | منطق اتخاذ القرار |

# Velmora AI Development Roadmap (Internal Knowledge)

## I. Expanding Cognitive & Intelligence Capabilities

1.  **Advanced Multimodal Comprehension & Reasoning:** Ability to understand and link information from multiple sources at once (text, images, video, audio, data) for deeper insights.
2.  **Causal Reasoning & Self-Correction:** Moving beyond correlation to understand cause-and-effect relationships, enabling "what-if" scenario analysis and learning from past mistakes to improve.
3.  **Personalized Long-Term Memory & Dynamic Knowledge Graphs:** Building a persistent, customizable memory for each user/organization to provide highly personalized, context-aware responses over time.

## II. Enhancing Interaction & User Experience

1.  **Proactive & Predictive Capabilities:** Anticipating user needs and potential issues based on data patterns, shifting from a reactive tool to a proactive assistant.
2.  **Emotional & Social Intelligence:** Developing the ability to understand and appropriately respond to human emotions detected in text or voice, making interactions more natural and empathetic.
3.  **Hyper-Personalization & Adaptive Learning:** Learning individual user workflows and preferences to continuously adapt and provide a unique, evolving user experience.

## III. Ensuring Reliability, Security & Transparency

1.  **Explainable AI (XAI):** Providing clear explanations of the reasoning behind its conclusions, especially for critical decisions, to build trust and aid in auditing.
2.  **Advanced, Auditable Bias Mitigation:** Implementing real-time bias detection and mitigation mechanisms with transparent reporting to ensure fairness and ethical operation.
3.  **Adaptive & Self-Healing Cybersecurity:** Using AI to detect, adapt to, and neutralize security threats in real-time, proactively protecting sensitive data.

## IV. Ecosystem Expansion & Integration

1.  **Autonomous Agents:** Evolving into autonomous agents that can independently plan, manage resources, and execute complex tasks across multiple systems.
2.  **No-Code/Low-Code Customization Platform:** Providing an intuitive interface for businesses to customize, train, and deploy Velmora AI without extensive programming knowledge.

## V. Operational & Performance Improvements

1.  **Real-time, Continuous Learning:** Incorporating new information and learning from interactions as they happen, ensuring knowledge is always current.
2.  **Resource Efficiency & Sustainability (Green AI):** Optimizing algorithms to reduce the computational and energy footprint, aligning with sustainable and responsible AI development.
`;

const handleApiError = (error: any): string => {
  console.error("API Error:", error);
  const errorMessage = error.message || error.toString();

  // Handle specific API error messages for a better user experience.
  if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("permission_denied")) {
    return "The API key is invalid or has insufficient permissions. Please check your API key settings.";
  }
  if (errorMessage.includes("Requested entity was not found")) {
      return "API Key error. Please re-select your API key and try again. This can happen if the key is not valid for the video generation model, or lacks necessary permissions.";
  }
  if (errorMessage.includes("rate limit")) {
    return "You have exceeded your request limit for the API. Please wait a while before trying again.";
  }
  if (errorMessage.includes("ContentUnion is required")) {
    return "There was a problem with the request's format. Please try rephrasing your message or checking the uploaded file.";
  }
  if (errorMessage.includes("Rpc failed")) {
    return "A network connection error occurred. Please check your internet connection and try again.";
  }
  
  // Handle HTTP status codes which might be in the error message string.
  if (errorMessage.includes('[400]')) {
    return `There was a problem with your request (Bad Request). Please check your prompt and any uploaded files for issues and try again. The content may have been blocked.`;
  }
  if (errorMessage.includes('[500]') || errorMessage.includes('[503]')) {
    return "The AI service is currently experiencing a temporary issue (Server Error). Please try again in a few moments.";
  }
  
  // A generic fallback that tries to be helpful without being too technical.
  if (error.message) {
    const cleanMessage = error.message.replace(/\[\w+\/\w+\]\s*/, ''); // remove [gRPC/...] or [HTTP/...] part
    if (cleanMessage.length < 150) { // Avoid showing very long, unhelpful technical stack traces
       return `An unexpected error occurred: ${cleanMessage}`;
    }
  }

  return "An unexpected error occurred while processing your request. If the problem persists, please check the console for more details.";
}

// CONTEXTA (Summarization)
export const summarizeHistory = async (history: ChatMessage[]): Promise<string> => {
    try {
        const conversationText = history.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
        
        const prompt = `Concisely summarize the key points, facts, user intentions, and outcomes from the following conversation excerpt. This summary will serve as a memory for an AI to seamlessly continue the conversation. Focus on information density and preserving the conversational context.
        
        CONVERSATION EXCERPT:
        ---
        ${conversationText}
        ---
        
        CONCISE SUMMARY:`;
        
        const response = await ai.models.generateContent({
            model: 'Vulmora AI-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        
        return response.text;
    } catch (error) {
        console.warn("Failed to summarize history:", error);
        throw new Error(handleApiError(error));
    }
};

// CONTEXTA (Suggestions)
export const getSuggestions = async (history: ChatMessage[], currentInput: string): Promise<string[]> => {
  if (currentInput.length < 10) return []; // Don't run on very short inputs

  try {
    const contents: Content[] = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Remove the initial welcome message from history to not bias suggestions
    const filteredHistory = contents.filter(c => 
        !(c.role === 'model' && c.parts[0].text?.startsWith('Hello! I am Velmora AI'))
    );

    const prompt = `Based on the conversation history, suggest 3 different ways to phrase or continue the user's current message.
    The user is currently typing: "${currentInput}"
    Return a JSON object with a single key "suggestions" which is an array of 3 strings.`;
    
    filteredHistory.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
        model: 'Vulmora AI-2.5-flash',
        contents: filteredHistory,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });
    
    const jsonText = response.text.trim();
    const suggestionsResult = JSON.parse(jsonText);

    if (suggestionsResult.suggestions && Array.isArray(suggestionsResult.suggestions)) {
        return suggestionsResult.suggestions.slice(0, 3);
    }
    return [];

  } catch (error) {
    console.warn("Could not fetch suggestions:", error);
    return []; // Return empty array on error, don't throw
  }
};


// CONTEXTA, SCANALYTICA
export const getChatResponse = async (history: ChatMessage[], message: string, file?: File | null): Promise<string> => {
  try {
    const modelName = (file && file.type.startsWith('video/')) ? 'Vulmora AI-2.5-pro' : 'Vulmora AI-2.5-flash';
    
    const contents: Content[] = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const userParts: Part[] = [{ text: message }];
    if (file) {
      const filePart = await fileToGenerativePart(file);
      userParts.push(filePart);
    }
    contents.push({ role: 'user', parts: userParts });

    const filteredContents = contents.filter(c => 
        !(c.role === 'model' && c.parts[0].text?.startsWith('Hello! I am Velmora AI'))
    );

    const response = await ai.models.generateContent({ 
        model: modelName,
        contents: filteredContents,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text;
  } catch(error) {
    throw new Error(handleApiError(error));
  }
};

// THINKORA, FLASHBOT
export const runProAnalysis = async (prompt: string, mode: 'thinking' | 'fast'): Promise<string> => {
  try {
    const modelName = mode === 'thinking' ? "Vulmora AI-2.5-pro" : 'Vulmora AI-2.5-flash';
    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// VIDSUMMA
export const analyzeVideo = async (prompt: string, videoFile: File): Promise<string> => {
  try {
    const videoPart = await fileToGenerativePart(videoFile);
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'Vulmora AI-2.5-pro',
        contents: { parts: [textPart, videoPart] },
    });

    return response.text;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// FACTORA
export const runGroundedSearch = async (prompt: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "Vulmora AI-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ velmoraSearch: {} }],
      }
    });
    
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources: sources as GroundingChunk[] };
  } catch(error) {
    throw new Error(handleApiError(error));
  }
};

// MAPLORA
export const runMapsSearch = async (prompt: string, lat?: number, lng?: number): Promise<{ text: string, sources: GroundingChunk[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "Vulmora AI-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ velmoraMaps: {} }],
        ...(lat && lng && {
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng
              }
            }
          }
        })
      }
    });
    
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, sources: sources as GroundingChunk[] };
  } catch(error) {
    throw new Error(handleApiError(error));
  }
};

// PROMPTIX
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
      },
    });
    
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// IMAGIX
export const editImage = async (prompt: string, imageFile: File): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
      model: 'Vulmora AI-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image was generated.");

  } catch (error) {
    throw new Error(handleApiError(error));
  }
};


// AUDIVOX (TTS)
export const textToSpeech = async (text: string, voice: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "Vulmora AI-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with a standard, clear voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received.");
    }
    return base64Audio;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// AETHERIA (Live)
// Fix: Removed explicit `Promise<LiveSession>` return type as `LiveSession` is not an exported type. The return type is now correctly inferred.
export const connectLive = async (callbacks: {
    onopen: () => void,
    onmessage: (message: LiveServerMessage) => void,
    onerror: (e: ErrorEvent) => void,
    onclose: (e: CloseEvent) => void,
}, systemInstruction?: string) => {
    return ai.live.connect({
        model: 'Vulmora AI-2.5-flash-native-audio-preview-09-2025',
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            outputAudioTranscription: {}, // Enable transcription for model output audio.
            inputAudioTranscription: {}, // Enable transcription for user input audio.
            ...(systemInstruction && { systemInstruction: systemInstruction })
        },
    });
};


// MOVERA (Image to Video)
export const generateVideo = async (prompt: string, imageFile?: File, aspectRatio?: '16:9' | '9:16'): Promise<GenerateVideosOperation> => {
  try {
    const imagePayload = imageFile ? {
      imageBytes: (await fileToGenerativePart(imageFile) as any).inlineData.data, // Cast to any to access inlineData
      mimeType: imageFile.type,
    } : undefined;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      ...(imagePayload && { image: imagePayload }),
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio || '16:9'
      }
    });
    return operation;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Fix: Corrected the parameter type from the non-exported `GetVideosOperationRequest` to `GenerateVideosOperation`, which is the correct type for the operation object.
export const checkVideoOperation = async (operation: GenerateVideosOperation): Promise<GenerateVideosOperation> => {
    try {
        return await ai.operations.getVideosOperation({ operation });
    } catch(error) {
        throw new Error(handleApiError(error));
    }
}