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
