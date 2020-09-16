import { Serializer } from "@dxos/codec-experimental-runtime";
import { MyKey } from "../my-key";
import substitutions from "../substitutions";
export interface Key {
    data: string;
}
export interface Task {
    id?: string;
    title?: string;
    key: MyKey;
}
export interface TaskList {
    tasks?: Task[];
}
export const schemaJson = JSON.parse("{\"nested\":{\"Key\":{\"fields\":{\"data\":{\"rule\":\"required\",\"type\":\"string\",\"id\":1}}},\"Task\":{\"fields\":{\"id\":{\"type\":\"string\",\"id\":1},\"title\":{\"type\":\"string\",\"id\":2},\"key\":{\"rule\":\"required\",\"type\":\"Key\",\"id\":3}}},\"TaskList\":{\"fields\":{\"tasks\":{\"rule\":\"repeated\",\"type\":\"Task\",\"id\":1}}}}}");
export const serializer = Serializer.fromJsonSchema(schemaJson, substitutions);
