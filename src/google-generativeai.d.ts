// src/google-generativeai.d.ts
declare module 'google-generativeai' {
    export function configure(): void;
    export class GenerativeModel {
      constructor(config: any);
      generateContent(prompts: string[]): Promise<{ text: string }>;
    }
  }
  