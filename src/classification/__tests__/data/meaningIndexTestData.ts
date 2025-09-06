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
    promptInstructions: `User doesn't specify the "NUMBER" keyword or, if specified, it isn't used as a destination for adding. User doesn't specify the "ITEMS" keyword.`,
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
    promptInstructions: `User specifies "ITEMS" keyword to represent items to add to a container. User doesn't specify the "NUMBER" keyword or, if specified, it isn't used as a destination for adding.`,
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
    promptInstructions: `User specifies "NUMBER" keyword to represent a destination for adding items. User doesn't specify the "ITEMS" keyword.`,
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
  },

  // The meanings under 999 are contrived to make tests hit certain conditions. To avoid
  // non-deterministic LLM responses, use nShotPairs to cover utterances in tests as they
  // will deterministically return their responses for matches. (No mocking needed.)
  "999": {
    meaningId: "999",
    description: "Test Meanings",
    params: [],
    promptInstructions: `User has the keyword "test:" at the beginning of their request.`,
    nShotPairs: [
      { userMessage: "test", assistantResponse: "N" },
      { userMessage: "test:", assistantResponse: "Y" },
      { userMessage: "test me", assistantResponse: "N" },
      { userMessage: "test: me", assistantResponse: "Y" },
      { userMessage: "test: hello my name is simon", assistantResponse: "Y" },
      { userMessage: "test: ITEMS are nice to have", assistantResponse: "Y" },
      { userMessage: "testosterone does not go on pizza", assistantResponse: "N" } 
    ],
    parentMeaningId: "0",
    childMeaningIds: ["999.1", "999.2", "999.3"]
  },
  "999.1": {
    meaningId: "999.1",
    description: "ITEMS is probably an animal",
    params: ["ITEMS"],
    promptInstructions: "User describes ITEMS with animal-like attributes.",
    nShotPairs: [
      { userMessage: "test: i always like to pet ITEMS", assistantResponse: "Y" },
      { userMessage: "test: ITEMS is furry, prickly", assistantResponse: "M" },
      { userMessage: "test: ITEMS is something i eat", assistantResponse: "M" },
      { userMessage: "test: i see ITEMS in the heavens", assistantResponse: "N" },
    ],
    parentMeaningId: "999",
    childMeaningIds: ["999.1.1", "999.1.2"]
  },
  "999.1.1": {
    meaningId: "999.1.1",
    description: "user intends to eat ITEMS",
    params: ["ITEMS"],
    promptInstructions: "User likes to or plans to eat ITEMS.",
    nShotPairs: [
      { userMessage: "test: ITEMS taste better than anything else", assistantResponse: "Y" },
      { userMessage: "test: ITEMS are inedible", assistantResponse: "N" },
      { userMessage: "test: ITEMS is something i eat", assistantResponse: "Y" },
      { userMessage: "test: i always like to pet ITEMS", assistantResponse: "N" },
    ],
    parentMeaningId: "999.1",
    childMeaningIds: []
  },
  "999.1.2": {
    meaningId: "999.1",
    description: "ITEMS is a pet",
    params: ["ITEMS"],
    promptInstructions: "User thinks of ITEMS as a pet",
    nShotPairs: [
      { userMessage: "test: i always like to pet ITEMS", assistantResponse: "Y" },
      { userMessage: "test: i brought ITEMS for a walk", assistantResponse: "Y" },
      { userMessage: "test: ITEMS is a ferocious killer", assistantResponse: "N" },
    ],
    parentMeaningId: "999.1",
    childMeaningIds: []
  },
  "999.2": {
    meaningId: "999.2",
    description: "ITEMS is probably a vegetable",
    params: ["ITEMS"],
    promptInstructions: "User describes ITEMS with vegetable-like attributes.",
    nShotPairs: [
      { userMessage: `test: ITEMS grow underground and are typically prepared hot.`, assistantResponse: "Y" },
      { userMessage: `test: ITEMS are tasty and good for your health`, assistantResponse: "M" },
      { userMessage: "test: ITEMS is furry, prickly", assistantResponse: "M" },
      { userMessage: "test: ITEMS is something i eat", assistantResponse: "M" }
    ],
    parentMeaningId: "999",
    childMeaningIds: []
  },
  "999.3": {
    meaningId: "999.3",
    description: "ITEMS is probably a mineral",
    params: ["ITEMS"],
    promptInstructions: "User describes ITEMS with mineral-like attributes.",
    nShotPairs: [
      { userMessage: `test: ITEMS conducts electricity efficiently and adds sparkle to designs`, assistantResponse: "Y" },
      { userMessage: `test: ITEMS are forever`, assistantResponse: "M" },
      { userMessage: `test: i eat ITEMS every day`, assistantResponse: "N" }
    ],
    parentMeaningId: "999",
    childMeaningIds: []
  },
};