// For exceptions thrown by this code that correspond to expected errors like failed input validation.
class ExpectedError extends Error { 
  constructor(message:string) {
    super(message);
    this.name = "ExpectedError";
  }
}

export default ExpectedError;