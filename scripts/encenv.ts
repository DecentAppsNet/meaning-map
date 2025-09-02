/* Script to manage encrypted environment variables in a .enc-env file.
   How it works - you enter a password each time you run it. Pick whatever password you like.
   The password is used to encrypt/decrypt the .enc-env file. If you lose the password, 
   there is no recovery - at that point you can delete .enc-env and start over.

   Usage:
    add VARNAME       - prompts for value, adds or updates VARNAME in .enc-env
    addplain VARNAME  - prompts for value, adds or updates VARNAME in .enc-env as a 
                        non-secret (visible in cleartext when listing)
    remove VARNAME    - removes VARNAME from .enc-env
    list              - lists all variables in .enc-env
    set               - outputs shell commands to set all variables in the current shell

  To use the variables in your shell, run from project root:
    eval "$(npx tsx ./scripts/encenv.ts set)"

  This is safer than keeping API keys and other secrets in an .env file. Your filesystem is an attack vector, and
  if you ever get spicy malware on your computer, .env files are a traditional target. Also, it's easy to
  accidentally commit an .env file to a public repo.
*/
import * as fs from 'fs';
import { generateKeyFromPassword, encryptText, decryptText, Key } from './helpers/cryptoUtil.ts';
import { promptUserForInput, promptUserForSecret } from './helpers/inputUtil.ts';

const ENC_ENV_FILE = '.enc-env';
const PLAIN_SUFFIX = '__PLAIN';
const ENC_ENV_KEY_ENV = 'ENC_ENV_KEY';

function _isPlain(varName:string):boolean {
  return varName.endsWith(PLAIN_SUFFIX);
}

function _plain(varName:string):string {
  return (_isPlain(varName)) ? varName : `${varName}${PLAIN_SUFFIX}`;
}

function _unplain(varName:string):string {
  if (_isPlain(varName)) return varName.slice(0, -PLAIN_SUFFIX.length);
  return varName;
}

function _doesEncEnvFileExist():boolean {
  return fs.existsSync(ENC_ENV_FILE);
}

async function _loadEnv(key:Key):Promise<Record<string,string>> {
  if (!_doesEncEnvFileExist()) return {};
  const encrypted = fs.readFileSync(ENC_ENV_FILE);
  let plaintext:string;
  try {
    plaintext = await decryptText(key, encrypted);
  } catch (_ignored) {
    throw new Error('Failed to decrypt .enc-env file. Wrong password?');
  }
  let env:Record<string, string>;
  try {
    env = JSON.parse(plaintext);
  } catch (_ignored) {
    throw new Error('Failed to parse .enc-env file. Wrong password?');
  }
  return env;
}

async function _getEncEnvKeyFromEnv():Promise<Key|null> {
  const k = process.env[ENC_ENV_KEY_ENV];
  if (!k || !k.length) return null; 
  const key = Buffer.from(k, 'hex');
  try {
    _loadEnv(key); // try to decrypt to verify key is valid
    return key;
  } catch (_ignored) { /* ignore */ }
  return null;
}

function _storeEncEnvKeyInEnv(key:Key) {
  process.env[ENC_ENV_KEY_ENV] = key.toString('hex');
}

// Will show if the value is empty, otherwise hides it.
function _representSecretValue(value:string):string {
  return (value.length === 0) ? '""' : '***';
}

function _representPlainValue(value:string):string {
  if (value.length === 0) return '""';
  if (value.length > 100) return `${value.slice(0, 50)}...${value.slice(-50)}`;
  return value;
}

function _removeVariableFromEnv(env:Record<string,string>, varName:string) {
  delete env[_plain(varName)];
  delete env[_unplain(varName)];
}

async function _saveEnv(key:Key, env:Record<string,string>) {
  const plaintext = JSON.stringify(env);
  const encrypted = await encryptText(key, plaintext);
  fs.writeFileSync(ENC_ENV_FILE, encrypted);
}

async function _main() {
  const [,, cmd, arg] = process.argv;
  if (!cmd || !['set', 'add', 'addplain', 'remove', 'list'].includes(cmd)) {
    console.error('Usage: enc-env [set|add VARNAME|addplain VARNAME|remove VARNAME|list]');
    process.exit(1);
  }

  if (!_doesEncEnvFileExist() && (cmd !== 'add' && cmd !== 'addplain')) {
    console.error(`No ${ENC_ENV_FILE} file found. Use "add" or "addplain" command to create it.`);
    process.exit(1);
  }

  if ((cmd === 'add' || cmd === 'addplain' || cmd === 'remove') && !arg) {
    console.error(`You must specify a variable name for the "${cmd}" command.`);
    process.exit(1);
  }

  let key = await _getEncEnvKeyFromEnv();
  if (!key) {
    const password = await promptUserForSecret('Password: ');
    key = await generateKeyFromPassword(password);
    _storeEncEnvKeyInEnv(key);
  }
  const env = await _loadEnv(key);

  switch (cmd) {
    case 'set':
      for (const [k, v] of Object.entries(env)) {
        process.env[_unplain(k)] = v;
        console.log(`export ${_unplain(k)}=${v}`);
      }
      console.log(`export ${ENC_ENV_KEY_ENV}=${key.toString('hex')}`); // Avoids re-prompting for password in same session.
      console.log('# Run the above commands in your shell to set the variables. Or use eval.');
      break;

    case 'add': case 'addplain': {
      const v = (cmd === 'add') 
        ? await promptUserForSecret(`Value for ${arg}`)
        : await promptUserForInput(`Value for ${arg}`);
      if ((env[arg] || env[_plain(arg)]) && (await promptUserForInput(
          `Variable ${arg} already exists. Overwrite? (y/N)`, 'N')).toLowerCase() !== 'y') {
        console.log('Aborted');
        process.exit(0);
      }
      const variableName = (cmd === 'add') ? _unplain(arg) : _plain(arg);
      _removeVariableFromEnv(env, variableName);
      env[variableName] = v;
      await _saveEnv(key, env);
      break;
    }

    case 'remove':
      _removeVariableFromEnv(env, arg);
      await _saveEnv(key, env);
      break;

    case 'list':
      for (const [k, v] of Object.entries(env)) {
        console.log(`${_unplain(k)}=${_isPlain(k) ? _representPlainValue(v) : _representSecretValue(v)}`);
      }
      break;
  }
}

_main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
