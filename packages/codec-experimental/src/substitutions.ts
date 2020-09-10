import { MyKey } from "./my-key";

export default {
  'Key': {
    encode: (value: MyKey) => ({ data: value.keyData }),
    decode: (value: any) => new MyKey(value.data),
  }
};
