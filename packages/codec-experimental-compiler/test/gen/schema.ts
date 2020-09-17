import { Schema } from "@dxos/codec-experimental-runtime";
import substitutions from "../substitutions";
import { MyKey } from "../my-key";
export interface Key {
    data: Uint8Array;
}
export interface AllTypes {
    doubleField?: number;
    floatField?: number;
    int32Field?: number;
    int64Field?: number;
    uint32Field?: number;
    uint64Field?: number;
    sint32Field?: number;
    sint64Field?: number;
    fixed32Field?: number;
    fixed64Field?: number;
    sfixed32Field?: number;
    sfixed64Field?: number;
    boolField?: boolean;
    stringField?: string;
    bytesField?: Uint8Array;
    repeatedField?: MyKey[];
    requiredField: MyKey;
    mappedField?: Partial<Record<string, MyKey>>;
    inner?: AllTypes.Inner;
}
export namespace AllTypes {
    export interface Inner {
        foo?: string;
        bar?: InnerEnum;
    }
    export enum InnerEnum {
        FOO = 1,
        BAR = 2
    }
}
export interface Outer {
    inner?: AllTypes.Inner;
}
export namespace Outer {
    export interface Inner {
        inner?: AllTypes.InnerEnum;
    }
}
export enum TaskType {
    IN_PROGRESS = 1,
    COMPLETED = 2
}
export interface Task {
    id?: string;
    title?: string;
    key: MyKey;
    type: TaskType;
}
export interface TaskList {
    tasks?: Task[];
}
export interface TYPES {
    "dxos.test.Key": Key;
    "dxos.test.AllTypes": AllTypes;
    "dxos.test.AllTypes.Inner": AllTypes.Inner;
    "dxos.test.AllTypes.InnerEnum": AllTypes.InnerEnum;
    "dxos.test.Outer": Outer;
    "dxos.test.Outer.Inner": Outer.Inner;
    "dxos.test.TaskType": TaskType;
    "dxos.test.Task": Task;
    "dxos.test.TaskList": TaskList;
}
export const schemaJson = JSON.parse("{\"nested\":{\"dxos\":{\"nested\":{\"test\":{\"nested\":{\"Key\":{\"fields\":{\"data\":{\"rule\":\"required\",\"type\":\"bytes\",\"id\":1}}},\"AllTypes\":{\"fields\":{\"doubleField\":{\"type\":\"double\",\"id\":1},\"floatField\":{\"type\":\"float\",\"id\":2},\"int32Field\":{\"type\":\"int32\",\"id\":3},\"int64Field\":{\"type\":\"int64\",\"id\":4},\"uint32Field\":{\"type\":\"uint32\",\"id\":5},\"uint64Field\":{\"type\":\"uint64\",\"id\":6},\"sint32Field\":{\"type\":\"sint32\",\"id\":7},\"sint64Field\":{\"type\":\"sint64\",\"id\":8},\"fixed32Field\":{\"type\":\"fixed32\",\"id\":9},\"fixed64Field\":{\"type\":\"fixed64\",\"id\":10},\"sfixed32Field\":{\"type\":\"sfixed32\",\"id\":11},\"sfixed64Field\":{\"type\":\"sfixed64\",\"id\":12},\"boolField\":{\"type\":\"bool\",\"id\":13},\"stringField\":{\"type\":\"string\",\"id\":14},\"bytesField\":{\"type\":\"bytes\",\"id\":15},\"repeatedField\":{\"rule\":\"repeated\",\"type\":\"Key\",\"id\":16},\"requiredField\":{\"rule\":\"required\",\"type\":\"Key\",\"id\":17},\"mappedField\":{\"keyType\":\"string\",\"type\":\"Key\",\"id\":18},\"inner\":{\"type\":\"Inner\",\"id\":19}},\"nested\":{\"Inner\":{\"fields\":{\"foo\":{\"type\":\"string\",\"id\":1},\"bar\":{\"type\":\"InnerEnum\",\"id\":2}}},\"InnerEnum\":{\"values\":{\"FOO\":1,\"BAR\":2}}}},\"Outer\":{\"fields\":{\"inner\":{\"type\":\"AllTypes.Inner\",\"id\":1}},\"nested\":{\"Inner\":{\"fields\":{\"inner\":{\"type\":\"AllTypes.InnerEnum\",\"id\":1}}}}},\"TaskType\":{\"values\":{\"IN_PROGRESS\":1,\"COMPLETED\":2}},\"Task\":{\"fields\":{\"id\":{\"type\":\"string\",\"id\":1},\"title\":{\"type\":\"string\",\"id\":2},\"key\":{\"rule\":\"required\",\"type\":\"Key\",\"id\":3},\"type\":{\"rule\":\"required\",\"type\":\"TaskType\",\"id\":4}}},\"TaskList\":{\"fields\":{\"tasks\":{\"rule\":\"repeated\",\"type\":\"Task\",\"id\":1}}}}}}}}}");
export const schema = Schema.fromJson<TYPES>(schemaJson, substitutions);
