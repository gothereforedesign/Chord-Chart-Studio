import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  let ai: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return ai;
  }

  // Robust retry mechanism with exponential backoff and stable model fallback
  async function generateContentWithRetry(aiClient: GoogleGenAI, params: any, retryCount = 3, initialDelayMs = 1200): Promise<any> {
    let delay = initialDelayMs;
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        return await aiClient.models.generateContent(params);
      } catch (error: any) {
        const errorMsg = String(error?.message || '').toUpperCase();
        const statusCode = error?.status || error?.statusCode || 0;
        const is503 = statusCode === 503 || errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('OVERLOADED') || errorMsg.includes('HIGH DEMAND');
        
        if (is503 && attempt < retryCount) {
          console.warn(`[Gemini API] 503/Unavailable received (attempt ${attempt}/${retryCount}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2.2; // Exponential backoff scaling
          continue;
        }

        // If it's a 503 and we out of retries, fallback to official stable release
        if (is503 && attempt === retryCount) {
          console.warn(`[Gemini API] All ${retryCount} attempts for '${params.model}' failed due to high demand. Attempting fallback 'gemini-flash-latest'...`);
          try {
            const fallbackParams = { ...params, model: 'gemini-flash-latest' };
            return await aiClient.models.generateContent(fallbackParams);
          } catch (fallbackError: any) {
            console.error(`[Gemini API] Fallback model 'gemini-flash-latest' also encountered error:`, fallbackError);
            throw error; // Throw the original error or the fallback error
          }
        }
        throw error;
      }
    }
  }

  // API endpoint for analyzing sheet music or chord chart text via Gemini AI
  app.post('/api/analyze-chart', async (req, res) => {
    try {
      const { text, image, mimeType } = req.body;

      if (!text && !image) {
        return res.status(400).json({ error: 'No text or image provided for analysis.' });
      }

      const aiClient = getGeminiClient();
      const parts: any[] = [];

      if (image) {
        let cleanBase64 = image;
        let cleanMimeType = mimeType || 'image/png';
        if (image.startsWith('data:')) {
          const matches = image.match(/^data:([^;]+);base64,(.*)$/);
          if (matches && matches.length === 3) {
            cleanMimeType = matches[1];
            cleanBase64 = matches[2];
          }
        }

        // Support fallback filtering in case data transport encoded mimeType as application/octet-stream
        if (!cleanMimeType || cleanMimeType === 'application/octet-stream' || !cleanMimeType.includes('/')) {
          if (cleanBase64.startsWith('JVBERi')) {
            cleanMimeType = 'application/pdf';
          } else if (cleanBase64.startsWith('iVBORw')) {
            cleanMimeType = 'image/png';
          } else if (cleanBase64.startsWith('/9j/')) {
            cleanMimeType = 'image/jpeg';
          } else {
            // Default safe fallback for rendering models
            cleanMimeType = 'image/jpeg';
          }
        }

        parts.push({
          inlineData: {
            mimeType: cleanMimeType,
            data: cleanBase64,
          }
        });
      }

      let prompt = `Analyze the sheet music image and generate a structured Chord Chart JSON conforming precisely to the responseSchema.

CRITICAL VISUAL PARSING: You must first identify and mentally draw bounding boxes around every vertical bar line to isolate each individual measure, then determine the rhythmic grid within *only* that specific box before extracting the chord symbols above it. By forcing the vision model to process the image as a sequence of isolated, measure-bound visual cells rather than a single fluid page, you anchor the floating text directly to the structural beats. This constraints-based approach drastically reduces rhythmic drift, ensuring the resulting JSON array feeds seamlessly into your TypeScript parser.

CRITICAL RHYTHMIC & GRID RULES (1:1 CORRESPONDENCE):
1. ONE SUB-ARRAY = ONE MEASURE (BAR):
   The "measures" property must be an array of sub-arrays. Every sub-array in the outer list represents EXACTLY ONE physical measure (bar) from the sheet music. Do NOT skip empty bars or cluster multiple bars together. Locate thin vertical black bar lines to divide measures correctly.

2. SUB-ARRAY LENGTH = TIME SIGNATURE NUMERATOR (BEATS):
   - For 3/4 time signature: Every measure sub-array MUST have EXACTLY 3 string elements: [beat1, beat2, beat3].
   - For 4/4 time signature: Every measure sub-array MUST have EXACTLY 4 string elements: [beat1, beat2, beat3, beat4].

3. RHYTHMIC SPACING & SUSTAIN DOT (".") SYMBOLS:
   To communicate rhythm and durational spelling, use a dot "." string to represent beats where the previous chord is sustained or held.
   - One chord lasting the entire measure (changes only on the downbeat):
     * In 4/4: ["C", ".", ".", "."]
     * In 3/4: ["C", ".", "."]
   - Two chords sharing a measure:
     * In 4/4 (changes on beat 1 and 3): ["C", ".", "G", "."]
     * In 4/4 (changes on beat 1 and 4): ["C", ".", ".", "G"]
     * In 3/4 (changes on beat 1 and 3): ["C", ".", "G"]
   - Three chords sharing a measure:
     * In 4/4 (holds first chord for 2 beats, then changes on 3 and 4): ["C", ".", "F", "G"]
     * In 3/4 (one chord on each of the three beats): ["C", "F", "G"]
   - Four chords sharing a measure:
     * In 4/4 (one chord on each of the four beats): ["C", "Am", "Dm", "G"]

4. DOWNBEATS ONLY DISCIPLINE:
   If a chord is played once on the downbeat of a bar and lasts for that entire bar, do NOT pack consecutive chords into a single measure sub-array (e.g., ["C", "Am", "F", "G"] is FOUR beats inside ONE single 4/4 bar). Instead, split them into four distinct measures:
   [["C", ".", ".", "."], ["Am", ".", ".", "."], ["F", ".", ".", "."], ["G", ".", ".", "."]]

5. 1:1 SPECIFIC TUTORIAL INDEX ("Great Is Thy Faithfulness" example):
   Observe this exact 1:1 mapping of the first 8 bars of "Great Is Thy Faithfulness" (3/4 time signature, with a chord change on the downbeat of most measures, and splits like "G/B to C" or "Csus4 to C" occurring inside single measures containing multiple chords):
   - Measure 1 (C on downbeat): ["C", ".", "."]
   - Measure 2 (F on downbeat): ["F", ".", "."]
   - Measure 3 (G on downbeat): ["G", ".", "."]
   - Measure 4 (G/B on downbeat, changes to C on beat 3): ["G/B", ".", "C"]
   - Measure 5 (F on downbeat): ["F", ".", "."]
   - Measure 6 (C/E on downbeat): ["C/E", ".", "."]
   - Measure 7 (D on downbeat): ["D", ".", "."]
   - Measure 8 (G on downbeat): ["G", ".", "."]
   - Measure 18 (Csus4 on downbeat, resolving to C on beat 3): ["Csus4", ".", "C"]

CHORD SPELLING CONSTRAINTS:
- Roots: Respect and preserve the exact spelling and enharmonics shown on the sheet music (e.g., use C#, D#, G#, A# or Db, Eb, Gb, Ab, Bb precisely as written in the source). Do NOT force flats onto sharps or vice-versa.
- Suffixes only: "", "min", "maj7", "maj9", "min7", "7", "m7b5", "dim7", "7alt", "9", "13", "sus4", "alt".
- Slash chords allowed (e.g. "Cmaj7/Eb", "C#min/E"). Keep the original spelling of both the root and slash bass precisely as shown.

CRITICAL RULES:
- Ignore pickup bars. Start strictly at measure 1.
- Do not include tempo or BPM.
- If the sheet music provided or textual query contains "Baptist Hymnal" followed by a number (e.g., "1991 Baptist Hymnal #231", "Baptist Hymnal No. 450", etc.), you MUST set that exact phrasing (e.g., "1991 Baptist Hymnal #231") as the "subtitle" property of the output JSON. This takes absolute precedence over lyric lines, poets, or composers.
- If the sheet music provided or textual query contains "Hymn Booklet" followed by a number (e.g., "Hymn Booklet 5", "Hymn Booklet booklet no. 10", etc.), you MUST set that exact phrasing (e.g., "Hymn Booklet 5") as the "subtitle" property of the output JSON. This takes absolute precedence over other metadata.`;

      if (text) {
        prompt += `\n\nHere is additional text/lyric paste content to analyze:\n${text}`;
      }

      parts.push({ text: prompt });

      const response = await generateContentWithRetry(aiClient, {
        model: 'gemini-3.5-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Title of the song' },
              subtitle: { type: Type.STRING, description: 'Subtitle or subheading of the song (e.g., "Baptist Hymnal 234" or "Hymn Booklet 12")' },
              key: { type: Type.STRING, description: "Master key signature, must be one of: 'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'" },
              timeSignature: { type: Type.STRING, description: 'Time signature of the song, supporting 4/4, 3/4, 5/4, 6/8, etc.' },
              measures: {
                type: Type.ARRAY,
                description: 'Array of measures. Each measure is an array of strings representing chords or "." matching the signature count.',
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              sections: {
                type: Type.ARRAY,
                description: 'Optional array mapping measure index to section name (e.g. Intro, Chorus, Verse, A, B)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    index: { type: Type.INTEGER, description: '0-based index of the measure starting this section' },
                    label: { type: Type.STRING, description: 'Label name of the section' }
                  },
                  required: ['index', 'label']
                }
              },
              grid: {
                type: Type.ARRAY,
                description: 'Optional high-fidelity layout grid. Allows declaring custom sizes per chord slot (e.g., isSmall, sizePercent) for dense/complex measures.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    slots: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          root: { type: Type.INTEGER, description: 'Root pitch index (0 to 11 for C to B)' },
                          accidental: { type: Type.STRING, description: "'natural', 'sharp', or 'flat'" },
                          suffix: { type: Type.STRING, description: 'Chord suffix (e.g., min, min7, maj7)' },
                          isEmpty: { type: Type.BOOLEAN, description: 'true if slot is a sub-measure hold/silent beat' },
                          slashRoot: { type: Type.INTEGER, description: 'Optional bass slash root (0 to 11)' },
                          slashAccidental: { type: Type.STRING, description: "accidental of bass slash" },
                          sizePercent: { type: Type.INTEGER, description: 'Custom scale percentage (e.g., 50 to 100)' },
                          isSmall: { type: Type.BOOLEAN, description: 'true if the chord uses standard compact text' }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ['title', 'key', 'timeSignature', 'measures']
          }
        }
      });

      let parsedText = response.text;
      if (!parsedText) {
        throw new Error('No text returned from Gemini API.');
      }
      parsedText = parsedText.trim();
      
      // Robust JSON extraction between first { and last }
      const firstCurly = parsedText.indexOf('{');
      const lastCurly = parsedText.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
        parsedText = parsedText.substring(firstCurly, lastCurly + 1);
      } else if (parsedText.startsWith('```')) {
        parsedText = parsedText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }

      res.json(JSON.parse(parsedText));
    } catch (error: any) {
      console.error('Error in analyze-chart endpoint:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze chord chart.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
