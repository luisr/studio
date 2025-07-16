import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-project-status.ts';
import '@/ai/flows/generate-lessons-learned.ts';
import '@/ai/flows/predict-project-risks.ts';
import '@/ai/flows/summarize-all-projects.ts';
import '@/ai/flows/analyze-critical-path.ts';
