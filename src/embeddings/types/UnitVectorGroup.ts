import UnitVector, { duplicateUnitVector } from "./UnitVector";

type UnitVectorGroup = UnitVector[];

export function duplicateUnitVectorGroup(group:UnitVectorGroup):UnitVectorGroup {
  return group.map(duplicateUnitVector);
}

export function freezeUnitVectorGroup(group:UnitVectorGroup):void {
  group.forEach(v => Object.freeze(v));
  Object.freeze(group);
}

export default UnitVectorGroup;