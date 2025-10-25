import { assert } from '../common/assertUtil.js';
import type UnitVector from './types/UnitVector.js';

const FLOATING_POINT_TOLERANCE = 1e-3; // Allow for some floating point noise.
function _clampFloatingPoint(value:number, min:number, max:number):number {
  assert(value >= min - FLOATING_POINT_TOLERANCE && value <= max + FLOATING_POINT_TOLERANCE, `Value ${value} out of range [${min}, ${max}] with tolerance ${FLOATING_POINT_TOLERANCE}`);
  /* v8 ignore next */ // Not worth contriving a test for this
  return value < min ? min : (value > max ? max : value);
}

function _floatingPointEquals(valueA:number, valueB:number):boolean {
  return Math.abs(valueA - valueB) < FLOATING_POINT_TOLERANCE;
}

function _calcVectorMagnitude(vector:ArrayLike<number>):number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    const x = vector[i];
    assert(Number.isFinite(x), `Non-finite value at index ${i}: ${x}`);
    sum += x * x;
  }
  const magnitude = Math.sqrt(sum);
  assert(Number.isFinite(magnitude) && magnitude > 0, 'Cannot normalize zero or non-finite vector');
  return magnitude;
}

function _scaleVector(vector:ArrayLike<number>, scale:number):Float32Array {
  const out = new Float32Array(vector);
  if (!_floatingPointEquals(scale, 1)) {
    for (let i = 0; i < vector.length; i++) out[i] *= scale;
  }
  return out;
}

function _calcDotProduct(vectorA:ArrayLike<number>, vectorB:ArrayLike<number>):number {
  assert(vectorA.length === vectorB.length, `length mismatch: ${vectorA.length} vs ${vectorB.length}`);
  let dotProduct = 0; 
  for (let i = 0; i < vectorA.length; i++) dotProduct += vectorA[i] * vectorB[i];
  return dotProduct;
}

export function compareUnitVectors(vectorA:UnitVector, vectorB:UnitVector):number {
  const dotProduct = _calcDotProduct(vectorA, vectorB);
  return _clampFloatingPoint(dotProduct, -1, 1);
}

// Returns a normalized (unit length) vector, allowing future comparisons to be made with just a dot product.
export function createUnitVector(vector:ArrayLike<number>):UnitVector {
  assert(vector.length > 0, `Can't normalize empty vector.`);
  const magnitude = _calcVectorMagnitude(vector);
  if (magnitude < FLOATING_POINT_TOLERANCE) throw Error('Vector magnitude too small to normalize.');
  const scale = 1 / magnitude;
  return _scaleVector(vector, scale) as UnitVector;
}

export function subtractUnitVectors(vectorA:UnitVector, vectorB:UnitVector):UnitVector {
  const dotProduct = _clampFloatingPoint(_calcDotProduct(vectorA, vectorB), -1, 1);
  const magnitude = Math.sqrt(Math.max(0, 2 - 2 * dotProduct));
  if (magnitude < FLOATING_POINT_TOLERANCE) throw Error('Vectors are identical.'); // Impossible to create a *unit* vector because there is no direction to scale.
  const scale = 1 / magnitude;
  const out = new Float32Array(vectorA.length);
  for (let i = 0; i < vectorA.length; i++) out[i] = (vectorA[i]- vectorB[i]) * scale;
  return out as UnitVector;
}

// Returns a centroid unit vector representing the average direction of the input vectors.
export function averageUnitVectors(vectors:UnitVector[]):UnitVector {
  assert(vectors.length > 0, 'No vectors to average');
  const length = vectors[0].length;
  assert(vectors.every(v => v.length === length), 'Vector length mismatch');
  const combinedVector = new Array(length).fill(0); // Accumulate in higher-precision JS number.
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < vectors.length; j++) {
      combinedVector[i] += vectors[j][i];
    }
  }
  return createUnitVector(new Float32Array(combinedVector));
}

export function removeProjectionFromUnitVector(vector:UnitVector, projection:UnitVector):UnitVector {
  const dotProduct = compareUnitVectors(vector, projection);
  const result = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) result[i] = vector[i] - dotProduct * projection[i];
  return createUnitVector(result);
}

export function unitVectorToBytes(vector:UnitVector):Uint8Array {
  return new Uint8Array(new Float32Array(vector).buffer);
}

export function bytesToUnitVector(bytes:Uint8Array):UnitVector {
  const floatArray = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  return createUnitVector(floatArray);
}