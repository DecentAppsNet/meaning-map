import MeaningIndex from "@/impexp/types/MeaningIndex";

export const exampleMeaningIndex:MeaningIndex = {
  "0": {
    meaningId: "0",
    description: "Unclassified",
    params: [],
    promptInstructions: "Examples below should not match overlap with top level meanings.",
    nShotPairs: [
      { userMessage: "uh", assistantResponse: "Y" },
      { userMessage: "a", assistantResponse: "Y" },
      { userMessage: "i'm busy packing can we talk later", assistantResponse: "Y" },
      { userMessage: "tell her i'll come downstairs", assistantResponse: "Y" },
      { userMessage: "i need to hurry", assistantResponse: "Y" },
      { userMessage: "what was i doing", assistantResponse: "Y" }
    ],
    parentMeaningId: "0",
    childMeaningIds: []
  },
  "1": {
    meaningId: "1",
    description: "Adding",
    params: [],
    promptInstructions: "User declares or implies they are adding things to a container.",
    nShotPairs: [
      { userMessage: "adding", assistantResponse: "M" },
      { userMessage: "adding to bin", assistantResponse: "Y" },
      { userMessage: "let's put some stuff in", assistantResponse: "Y" },
      { userMessage: "let's look at this", assistantResponse: "N" },
      { userMessage: "should I add something", assistantResponse: "M" },
      { userMessage: "add ITEMS to NUMBER", assistantResponse: "Y" },
      { userMessage: "i'm putting ITEMS inside", assistantResponse: "Y" },
      { userMessage: "let's put ITEMS in NUMBER", assistantResponse: "Y" },
      { userMessage: "ITEMS go here", assistantResponse: "M" },
      { userMessage: "i have NUMBER adding ITEMS", assistantResponse: "Y" },
      { userMessage: "adding ITEMS its NUMBER i better stop", assistantResponse: "Y" },
      { userMessage: "uh i want i want to put these in", assistantResponse: "Y" }
    ],
    parentMeaningId: "0",
    childMeaningIds: ["1.1", "1.2", "1.3"]
  },
  "1.1": {
    meaningId: "1.1",
    description: "Adding only",
    params: [],
    promptInstructions: "User declares or implies they are adding things to a container. They do not specify a NUMBER that would identify a container. They do not specify ITEMS to add to a container.",
    nShotPairs: [
      { userMessage: "add ITEMS", assistantResponse: "N" },
      { userMessage: "add ITEMS to NUMBER", assistantResponse: "N" },
      { userMessage: "i'm putting ITEMS inside", assistantResponse: "N" },
      { userMessage: "let's put some things in", assistantResponse: "Y" },
      { userMessage: "adding", assistantResponse: "Y" },
      { userMessage: "a im adding", assistantResponse: "Y" },
      { userMessage: "i have NUMBER i am adding", assistantResponse: "M" },
      { userMessage: "adding its NUMBER i better stop", assistantResponse: "M" }
    ],
    parentMeaningId: "1",
    childMeaningIds: []
  },
  "1.2": {
    meaningId: "1.2",
    description: "Adding ITEMS",
    params: ["ITEMS"],
    promptInstructions: "User specifies ITEMS to add to a container. They do not specify a NUMBER that would identify a container.",
    nShotPairs: [
      { userMessage: "add ITEMS", assistantResponse: "Y" },
      { userMessage: "add ITEMS to NUMBER", assistantResponse: "N" },
      { userMessage: "i'm putting ITEMS inside", assistantResponse: "Y" },
      { userMessage: "let's put ITEMS in NUMBER", assistantResponse: "N" },
      { userMessage: "ITEMS go here", assistantResponse: "Y" },
      { userMessage: "i have NUMBER adding ITEMS", assistantResponse: "M" },
      { userMessage: "adding ITEMS its NUMBER i better stop", assistantResponse: "M" }
    ],
    parentMeaningId: "1",
    childMeaningIds: []
  },
  "1.3": {
    meaningId: "1.3",
    description: "Adding to NUMBER",
    params: ["NUMBER"],
    promptInstructions: "User specifies or implies they are adding something to a container. They specifiy a NUMBER that would identify a container. They do not specify ITEMS that they are adding.",
    nShotPairs: [
      { userMessage: "add ITEMS", assistantResponse: "N" },
      { userMessage: "add ITEMS to NUMBER", assistantResponse: "N" },
      { userMessage: "i'm putting it inside NUMBER", assistantResponse: "Y" },
      { userMessage: "let's put these in NUMBER", assistantResponse: "Y" },
      { userMessage: "ITEMS go here", assistantResponse: "N" },
      { userMessage: "adding to NUMBER", assistantResponse: "Y" },
      { userMessage: "i have NUMBER adding", assistantResponse: "M" },
      { userMessage: "adding stuff its NUMBER i better stop", assistantResponse: "M" }
    ],
    parentMeaningId: "1",
    childMeaningIds: []
  }
};