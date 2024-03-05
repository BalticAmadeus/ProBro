import { ICommand } from '../view/app/model';

export interface IHighlightFieldsCommand extends ICommand {
    column: string;
    tableName: string;
}
