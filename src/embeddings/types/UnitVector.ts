type UnitVector = Float32Array & { __brand: "Unit" };

export function duplicateUnitVector(uv:UnitVector):UnitVector {
  return new Float32Array(uv) as UnitVector;
}

export default UnitVector;