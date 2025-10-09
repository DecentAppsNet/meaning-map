import UnitVector, { duplicateUnitVector } from "./UnitVector";

type UnitVectorGroup = UnitVector[];

export function duplicateUnitVectorGroup(group:UnitVectorGroup):UnitVectorGroup {
  return group.map(duplicateUnitVector);
}

export default UnitVectorGroup;