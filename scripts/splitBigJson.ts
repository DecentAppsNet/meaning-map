import type { CStream } from 'clarinet';
import clarinet from 'clarinet';
import fs from 'fs';
import ExpectedError from './helpers/ExpectedError';
import { argsAfterScript } from './helpers/commandUtil';
import { ensureDir, fileExists, readTextFile, writeJsonFile } from '../src/common/fileUtil';

// ANSI text-formatting codes for console output.
const ANSI_START_RED = "\x1b[31m";
const ANSI_START_BOLD = "\x1b[1m";
const ANSI_RESET = "\x1b[0m";

async function _getArgs():Promise<{videoIndexFilepath:string, captionsFilepath:string, outputPath:string}> {
  const args = argsAfterScript();
  if (args.length < 3) throw new ExpectedError('Need three arguments after script.');
  const videoIndexFilepath = args[0];
  const rawCaptionsFilepath = args[1];
  const outputPath = args[2];
  if (!await fileExists(videoIndexFilepath)) throw new ExpectedError(`Video index file "${videoIndexFilepath}" does not exist.`);
  if (!await fileExists(rawCaptionsFilepath)) throw new ExpectedError(`Captions file "${rawCaptionsFilepath}" does not exist.`);
  return { videoIndexFilepath, captionsFilepath: rawCaptionsFilepath, outputPath };
}

type VideoIndex = {
  [videoId:string]: {category:string}
}

// nVbIUDjzWY4,Cars & Other Vehicles,Motorcycles,27,52907
async function _loadVideoIndex(videoIndexFilepath:string):Promise<VideoIndex> {
  const lines:string[] = (await readTextFile(videoIndexFilepath)).split('\n');
  const vi:VideoIndex = {};
  for(let i = 1; i < lines.length; ++i) {
    const fields = lines[i].trim().split(',');
    if (!fields.length || fields[0] === '') continue;
    vi[fields[0]] = { category: fields[1] };
  }
  return vi;
}

function _isVideoId(text:string):boolean {
  return (text.length === 11 && /^[a-zA-Z0-9_-]+$/.test(text));
}

function _getSplitOutputFilepath(outputPath:string, videoId:string, videoIndex:VideoIndex):string {
  if (!outputPath.endsWith('/')) outputPath += '/';
  const category = videoIndex[videoId]?.category || '';
  const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0,50); // max 50 chars
  const filename = `${safeCategory ? safeCategory : '_'}_${videoId}.json`;
  return `${outputPath}${filename}`;
}

/*
The captions file is gigabytes in size and has a format like this:
{
  "GhOxhZeJp74": {...object...},
  "dfgs34egddf": {...object...},
  ...
  "dAbs34e23dA": {...object...},
}

The keys are video IDs. For each key found in the file, capture its corresponding object value, and export that value
to a separate file. So there will be one file for key found in the file.

The output filepath will be `{outputPath}/{category}_{video ID}.json`, e.g. "Hobbies and Fun_GH0xhZeJp74.json". The category
is retrieved from the videoIndex param. If no category can be found from the videoIndex, the filepath will omit "{category}" and
be `{outputPath}/_{video ID}.json`.

The very large input file must be streamed rather than read into memory at once. Use the Clarinet library and callbacks.
*/
async function _splitCaptionsFile(captionsFilepath:string, outputPath:string, videoIndex:VideoIndex):Promise<void> { // NEXT this is garbase. Rewrite.
  
  return new Promise((resolve, reject) => {
    const stream = clarinet.createStream();

    let lastKey = '';
    let depth = 0;
    let videoId = '';
    let start:number[] = [];
    let end:number[] = [];
    let text:string[] = [];

    stream.on("error", function (e) {
      console.error("error!", e);
      reject(e);
    });

    stream.on("openobject", function (k) {
      if (_isVideoId(k)) videoId = k;
      lastKey = k;
      ++depth;
    });

    stream.on("key", (k: string) => {
      if (_isVideoId(k)) videoId = k;
      lastKey = k;
    });

    stream.on("value", (v: unknown) => {
      switch (lastKey) {
        case 'start': start.push(v as number); break;
        case 'end': end.push(v as number); break;
        case 'text': text.push(v as string); break;
      }
    });

    stream.on("closeobject", async () => {
      --depth;
      if (depth === 1) {
        const outputFilepath = _getSplitOutputFilepath(outputPath, videoId, videoIndex);
        const splitObject = { start, end, text };
        console.log(`Writing ${outputFilepath}...`);
        await writeJsonFile(outputFilepath, splitObject);
        start = []; end = []; text = [];
      }
    });

    stream.on("end", () => {
      resolve();
    });

    fs.createReadStream(captionsFilepath).pipe(stream as unknown as NodeJS.WritableStream);
  });
}   

async function main() {
  const { videoIndexFilepath, captionsFilepath, outputPath } = await _getArgs();
  await ensureDir(outputPath);
  const videoIndex = await _loadVideoIndex(videoIndexFilepath);
  console.log(`Loaded index of ${Object.keys(videoIndex).length} videos.`);
  await _splitCaptionsFile(captionsFilepath, outputPath, videoIndex);
  console.log('Done.');
}

main().catch((error) => {
  error.message = `${ANSI_START_RED}${ANSI_START_BOLD}Error:${ANSI_RESET} ${error.message}`;
  if (error instanceof ExpectedError) { // Message thrown by app code explicitly.
    console.error(error.message);
  } else { // Unexpected error.
    console.error(error); // With the ugly but helpful call stack.
  }
  process.exit(1);
});