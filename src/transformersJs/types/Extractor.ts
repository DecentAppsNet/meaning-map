import { FeatureExtractionPipeline } from '@xenova/transformers';
/* type Extractor = (input: string, options?: { pooling?: 'mean' | 'max'; normalize?: boolean }) => 
  Promise<number[] | Float32Array | { data?: Float32Array | number[] } | unknown>; */

type Extractor = FeatureExtractionPipeline;

export default Extractor;