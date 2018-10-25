import { helper } from '@ember/component/helper';

export function jsonPrettify([value]) {
  return JSON.stringify(value, null, 2);
}

export default helper(jsonPrettify);