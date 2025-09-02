import * as readLineModule from 'readline';

export async function promptUserForInput(question:string, defaultValue:string = ''):Promise<string> {
  const readline = readLineModule.createInterface({
    input: process.stdin,
    output: process.stderr // So I can see the prompt even if stdout is being captured by eval or similar.
  });

  return new Promise((resolve) => {
    const prompt:string = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    readline.question(prompt, (answer:string) => {
      readline.close();
      answer = ("" + answer).trim();
      if (answer === "") answer = defaultValue.trim();
      resolve(answer);
    });
  });
}

export async function promptUserForSecret(question:string): Promise<string> {
  const input: any = process.stdin as any;
  const output = process.stderr; // So I can see the prompt even if stdout is being captured by eval or similar.
  return new Promise((resolve, reject) => {
    output.write(`${question}: `);

    // Ensure stdin is flowing (resume if previously paused) and keypress events are emitted.
    try { if (typeof input.isPaused === 'function' && input.isPaused()) input.resume(); } catch (_) { /* ignore */ }
    readLineModule.emitKeypressEvents(input);
    const wasRaw = !!input.isRaw;
    if (input.setRawMode) input.setRawMode(true);

    let password = '';

    function cleanup() {
      try {
        if (input.setRawMode) input.setRawMode(Boolean(wasRaw));
      } catch (_) { /* ignore */ }
      input.removeListener('keypress', onKeypress as any);
      output.write('\n');
      try { input.pause(); } catch (_) { /* ignore */ }
    }

    function onKeypress(str:string, key:any) {
      // Enter/Return
      if (str === '\r' || str === '\n' || (key && (key.name === 'return' || key.name === 'enter'))) {
        cleanup();
        resolve(password);
        return;
      }

      // Ctrl-C
      if (key && key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Cancelled'));
        return;
      }

      // Backspace
      if (key && key.name === 'backspace') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          // erase last '*' from terminal
          output.write('\b \b');
        }
        return;
      }

      // Handle pasted chunks (may contain multiple characters or a newline)
      if (str && str.length > 0) {
        // If paste contains newline, take content up to newline and finish
        const newlineIndex = str.search(/\r|\n/);
        if (newlineIndex !== -1) {
          const part = str.slice(0, newlineIndex);
          if (part.length > 0) {
            password += part;
            output.write('*'.repeat(part.length));
          }
          cleanup();
          resolve(password);
          return;
        }

        // Normal paste/typing: append all chars and mask each
        password += str;
        output.write('*'.repeat(str.length));
      }
    }

    input.on('keypress', onKeypress as any);
  });
}