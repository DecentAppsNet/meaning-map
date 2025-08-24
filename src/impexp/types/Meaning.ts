import NShotPair from '../../llm/types/NShotPair';

type Meaning = {
  meaningId:string,
  description:string,
  params:string[],
  promptInstructions:string,
  nShotPairs:NShotPair[]
}

export default Meaning;
