import { endSection, log, setStatus, startSection } from "@/common/describeLog";
import { fetchGetJson } from "@/common/httpUtil";
import { modelInfo, listFiles } from "@huggingface/hub";
import { 
  AutoModel,
  AutoModelForCausalLM,
  AutoModelForMaskedLM,
  AutoModelForSequenceClassification,
  AutoModelForSeq2SeqLM,
  AutoModelForTokenClassification,
  AutoModelForQuestionAnswering
} from '@xenova/transformers';

export type HFConfig = {
  model_type?: string;
  architectures?: string[];
};

function _filesHaveExtensions(files:string[], extensions:string[]):boolean {
  return extensions.some(ext => files.some(f => f.endsWith(ext)));
}

function _filesHaveFilename(files:string[], filename:string):boolean {
  return files.some(f => f.endsWith(`/${filename}`) || f === filename);
}

function _filesHaveFilenames(files:string[], filenames:string[]):boolean {
  return filenames.some(name => files.some(f => f.endsWith(`/${name}`) || f === name));
}

export async function getModelConfig(repoId:string):Promise<HFConfig> {
  const url = `https://huggingface.co/api/models/${repoId}?config=1`;
  const json = await fetchGetJson(url);
  return json.config ?? {};
}


export async function _isTransformersJsTagged(repoId:string):Promise<boolean> {
  const url = `https://huggingface.co/api/models/${repoId}?full=1`;
  const json = await fetchGetJson(url);
  if (!json.tags || !Array.isArray(json.tags)) return false;
  return json.tags.includes('transformers.js') || json.tags.includes('transformersjs');
}

export async function getModelFiles(repoId:string):Promise<string[]> {
  const files:string[] = [];
  for await (const file of listFiles({repo:repoId})) {
    files.push(file.path);
  }
  return files;
}

export async function getModelInfo(repoId:string) {
  const info = await modelInfo({name:repoId});
  if (!info) throw new Error(`Could not retrieve model info for ${repoId}.`);
  return info;
}

const SUPPORTED_MODEL_TYPES = ['bert', 'roberta', 'distilbert', 'albert', 'gpt2', 'gpt_neo', 'gpt_j', 't5', 'bart', 'clip', 'vit'];
function _isSupportedModelType(modelType:string):boolean {
  return SUPPORTED_MODEL_TYPES.some(t => modelType.includes(t));
}

export async function isPlainModel(repoId:string) {
  const files = await getModelFiles(repoId);

  const hasWeights = _filesHaveExtensions(files, ['.bin', '.safetensors']);
  const hasTokenizerJson = _filesHaveFilename(files, 'tokenizer.json');
  const hasSentencePiece = _filesHaveFilename(files, 'tokenizer.model');
  const hasBpePair = _filesHaveFilenames(files, ['vocab.json', 'merges.txt']);
  const hasTokenizer = hasTokenizerJson || hasSentencePiece || hasBpePair;

  const config = await getModelConfig(repoId);
  const modelType = config.model_type?.toLowerCase();
  const supported = !!modelType && _isSupportedModelType(modelType);

  return hasWeights && hasTokenizer && supported;
}

async function _isTextBasedAutoModelLoadable(repoId: string): Promise<boolean> {
  startSection(`Checking if model ${repoId} is loadable via text-based auto models...`);
  try {
    const attemptDescriptions:string[] = [
      'AutoModel',
      'AutoModelForSequenceClassification',
      'AutoModelForMaskedLM',
      'AutoModelForCausalLM',
      'AutoModelForSeq2SeqLM',
      'AutoModelForTokenClassification',
      'AutoModelForQuestionAnswering'
    ];
    const attempts = [
      () => AutoModel.from_pretrained(repoId, { progress_callback: () => {} }),
      () => AutoModelForSequenceClassification.from_pretrained(repoId, { progress_callback: () => {} }),
      () => AutoModelForMaskedLM.from_pretrained(repoId, { progress_callback: () => {} }),
      () => AutoModelForCausalLM.from_pretrained(repoId, { progress_callback: () => {} }),
      () => AutoModelForSeq2SeqLM.from_pretrained(repoId, { progress_callback: () => {} }),
      () => AutoModelForTokenClassification.from_pretrained(repoId, { progress_callback: () => {} }),
      () => AutoModelForQuestionAnswering.from_pretrained(repoId, { progress_callback: () => {} })
    ];

    for(let attemptI = 0; attemptI < attempts.length; ++attemptI) {
      const loadFunc = attempts[attemptI];
      const description = attemptDescriptions[attemptI];
      setStatus(description, attemptI, attempts.length);
      try {
        const model = await loadFunc();
        await model.dispose?.();
        return true;
      } catch(err) {
        log(`${description} attempt failed - err:` + err);
      }
    }
    return false;
  } finally {
    endSection();
  }
}

export async function isTextBasedModelLoadable(repoId:string):Promise<boolean> {
  const isTagged = await _isTransformersJsTagged(repoId);
  if (!isTagged) log(`Model ${repoId} is not tagged as transformers.js compatible.`);
  const isAutoModelLoadable = await _isTextBasedAutoModelLoadable(repoId);
  if (!isAutoModelLoadable) log(`Model ${repoId} could not be loaded via any text-based AutoModel class.`);
  const success = isTagged || isAutoModelLoadable;
  const completeSuccess = isTagged && isAutoModelLoadable;
  if (success && !completeSuccess) log(`Model ${repoId} might be loadable. Give it a try!`);
  return success;
}