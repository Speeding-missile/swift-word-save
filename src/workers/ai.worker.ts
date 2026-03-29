import { pipeline, env } from '@huggingface/transformers';

// Skip local model check since we are running in the browser and relying on Hugging Face CDN
env.allowLocalModels = false;

class PipelineSingleton {
    static task: any = 'text2text-generation';
    static model = 'Xenova/LaMini-Flan-T5-77M';
    static instance: any = null;

    static async getInstance(progress_callback: any) {
        if (this.instance === null) {
            // Initiate the pipeline
            this.instance = pipeline(this.task, this.model, { 
                progress_callback,
            });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    // Pipeline initialization (with progress callback for download state)
    let generator = await PipelineSingleton.getInstance((x: any) => {
        self.postMessage(x);
    });
    
    // Warmup / Load request
    if (event.data.type === 'load') {
       self.postMessage({ status: 'ready' });
       return;
    }

    // Generation request (general)
    if (event.data.type === 'generate') {
       const result = await generator(event.data.text, {
          max_new_tokens: 150,
          temperature: 0.8,
          repetition_penalty: 1.2,
       });

       self.postMessage({
          status: 'complete',
          output: result,
       });
    }

    // Word Detail generation request (specifically structured)
    if (event.data.type === 'getWordDetails') {
       const prompt = `Task: Provide dictionary details for the English word "${event.data.word}".
Rule: Output strictly in this format: 
Phonetic: [approximate phonetic spelling]
Meaning: [concise definition]
Usage: [a natural example sentence using the word]
No extra text, no conversation, no markdown formatting.`;

       const result = await generator(prompt, {
          max_new_tokens: 150,
          temperature: 0.5, // lower temperature for more consistent formatting
          repetition_penalty: 1.1,
       });

       self.postMessage({
          status: 'completeDetails',
          word: event.data.word,
          output: result,
       });
    }
});
