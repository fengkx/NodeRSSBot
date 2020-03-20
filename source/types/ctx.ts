import {ContextMessageUpdate} from "telegraf";

export interface MContext extends ContextMessageUpdate {
    state?: any;
}
