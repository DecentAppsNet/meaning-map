import UnitVector, { duplicateUnitVector } from "./UnitVector";

type UnitVectorGroup = UnitVector[];

export function duplicateUnitVectorGroup(group:UnitVectorGroup):UnitVectorGroup {
  return group.map(duplicateUnitVector);
}

export function freezeUnitVectorGroup(group:UnitVectorGroup):void {
  // UnitVector elements can't be frozen because they are Float32Arrays.
  Object.freeze(group);
}

export default UnitVectorGroup;