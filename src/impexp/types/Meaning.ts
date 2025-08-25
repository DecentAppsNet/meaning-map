import NShotPair from '../../llm/types/NShotPair';

type Meaning = {
  meaningId:string,
  description:string,
  params:string[],
  promptInstructions:string,
  nShotPairs:NShotPair[],
  parentMeaningId:string,
  childMeaningIds:string[]
}

export default Meaning;
