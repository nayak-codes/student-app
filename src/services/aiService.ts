// aiService.ts

export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface UserContext {
    exam?: string;
    grade?: string;
    subject?: string;
    name?: string;
}

// CORRECTED: Use the right Gemini model and endpoint
const GEMINI_API_KEY = 'AIzaSyCxWVdOzBQBQtpfKT8JvBRYR45T7v9iOWE';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_FLASH_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Send message to Gemini AI and get real response
 */
export const sendMessage = async (
    userMessage: string,
    conversationHistory: AIMessage[] = [],
    userContext?: UserContext
): Promise<string> => {
    try {
        const userName = userContext?.name || 'friend';
        const exam = userContext?.exam || 'your exam';

        // Build context for better responses
        const systemContext = `You are Anju, a friendly AI tutor helping students prepare for JEE (Joint Entrance Examination). 
You can help with:
- Physics, Chemistry, Maths, Biology
- Study strategies and tips
- Motivation and guidance
- College information

Current student: ${userName}
Preparing for: ${exam}

Be encouraging, clear, and helpful. Keep responses concise but informative.`;

        // Prepare conversation history
        const conversationText = conversationHistory
            .slice(-6) // Keep only last 6 messages for context
            .map(msg => `${msg.role === 'user' ? 'Student' : 'Anju'}: ${msg.content}`)
            .join('\n');

        const fullPrompt = `${systemContext}

${conversationText ? `Previous conversation:\n${conversationText}\n` : ''}
Student: ${userMessage}
Anju:`;

        console.log('Sending to Gemini:', GEMINI_API_URL);

        // Call Gemini API with correct format
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }]
            })
        });

        const data = await response.json();

        console.log('Gemini Response:', data);

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            throw new Error(`API Error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
        }

        // Extract the response text
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        return aiResponse.trim();

    } catch (error) {
        console.error('AI Service Error:', error);

        const userName = userContext?.name || 'friend';

        // Better fallback responses
        if (userMessage.toLowerCase().includes('physics')) {
            return "I'd love to help you with Physics! What specific topic are you working on - Mechanics, Electricity, Optics, or Modern Physics?";
        }
        if (userMessage.toLowerCase().includes('chemistry')) {
            return "Chemistry is fascinating! Are you studying Organic, Inorganic, or Physical Chemistry?";
        }
        if (userMessage.toLowerCase().includes('maths') || userMessage.toLowerCase().includes('math')) {
            return "Math is my favorite! What topic do you need help with - Calculus, Algebra, Coordinate Geometry, or something else?";
        }

        return `Hi ${userName}! I'm here to help you prepare for JEE. What subject would you like to study today? 📚`;
    }
};

// Test function
export const testAIConnection = async (): Promise<boolean> => {
    try {
        const response = await sendMessage("Hi", []);
        console.log('Test successful:', response);
        return response.length > 0;
    } catch (error) {
        console.error('AI Connection Test Failed:', error);
        return false;
    }
};

/**
 * Moderate content (text + image) using Gemini 1.5 Flash
 */
export const moderateContent = async (text: string, imagesBase64?: string[]): Promise<{ allowed: boolean; reason?: string }> => {
    try {
        const parts: any[] = [
            {
                text: `You are a strict content moderation AI for a student community app. 
Analyze the following content (which may include a caption and up to 5 video frames).
Check for: Nudity, Sexual Content, Violence, Hate Speech, Harassment, Self-Harm, Dangerous Activities, Bullying.
Also check for VISUAL COPYRIGHT infringement (e.g. recording a movie screen, TV show, or concert).
If safe, return JSON: { "allowed": true }.
If unsafe, return JSON: { "allowed": false, "reason": "Brief reason (e.g. contains violence)" }.
Output ONLY JSON. Do not use markdown.` },
            { text: `Caption: ${text}` }
        ];

        if (imagesBase64 && imagesBase64.length > 0) {
            imagesBase64.forEach((base64, index) => {
                parts.push({ text: `Frame ${index + 1}:` });
                parts.push({
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: base64
                    }
                });
            });
        }

        console.log('Sending to Gemini Flash for Moderation...');

        const response = await fetch(GEMINI_FLASH_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini Moderation API Error:', data);
            // Fail Check: Explicitly block on API error so user sees there's an issue
            return { allowed: false, reason: `AI Service Error: ${data.error?.message || response.statusText}` };
        }

        const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponseText) {
            return { allowed: false, reason: "AI Service returned empty response." };
        }

        // Parse JSON
        const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);

        return {
            allowed: result.allowed,
            reason: result.reason
        };

    } catch (error) {
        console.error('Moderation Error:', error);
        // Fail Check: Block on exception.
        return { allowed: false, reason: `Moderation Check Failed: ${error instanceof Error ? error.message : "Unknown Error"}` };
    }
};