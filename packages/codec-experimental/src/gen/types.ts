import { Codec } from "../codec";
import { MyKey } from "../my-key";
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
export const SCHEMA_JSON = JSON.parse("{\"nested\":{\"Key\":{\"fields\":{\"data\":{\"rule\":\"required\",\"type\":\"string\",\"id\":1}}},\"Task\":{\"fields\":{\"id\":{\"type\":\"string\",\"id\":1},\"title\":{\"type\":\"string\",\"id\":2},\"key\":{\"rule\":\"required\",\"type\":\"Key\",\"id\":3}}},\"TaskList\":{\"fields\":{\"tasks\":{\"rule\":\"repeated\",\"type\":\"Task\",\"id\":1}}}}}");
