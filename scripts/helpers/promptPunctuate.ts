import NShotPair from '../../src/llm/types/NShotPair';
import { prompt } from '../../src/llm/llmUtil';
import { getNlp } from '../../src/classification/nlpUtil';

const SYSTEM_PROMPT = `Output the user's text restoring any missing punctuation and correcting capitalization as needed. ` +
    `You should not change any text provided by the user. All text provided by the user should be in your output. ` +
    `You should not output anything else besides this.`;

const N_SHOT_PAIRS:NShotPair[] = [
  {userMessage:`i am a man i am an island`, assistantResponse:`I am a man. I am an island.`},
  {userMessage:`I am a man. I am an island.`, assistantResponse:`I am a man. I am an island.`},
  {userMessage:`i don't i uh don't know why she does that really i don't`, assistantResponse:`I don't... I uh... don't know why she does that. Really, i don't.`},
  {userMessage:`why i want to know why`, assistantResponse:`Why? I want to know why.`},
  {userMessage:`what is your name`, assistantResponse:`What is your name?`},
  {userMessage:`Mr Feebles is a champion. We all love him.`, assistantResponse:`Mr. Feebles is a champion. We all love him.`},
  {userMessage:`i.am.going.to.leave.are.you.coming`, assistantResponse:`I am going to leave. Are you coming?`}
];

export async function promptSplitSentences(utteranceGroup:string):Promise<string[]> {
  const response = await prompt(utteranceGroup, SYSTEM_PROMPT, N_SHOT_PAIRS);
  const nlp = getNlp();
  const doc = nlp.readDoc(response);
  const sentences = doc.sentences().out();
  return sentences;
}