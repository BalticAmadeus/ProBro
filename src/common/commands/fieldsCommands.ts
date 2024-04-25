import { ICommand } from '../../view/app/model';

export interface HighlightFieldsCommand extends ICommand {
    column: string;
    tableName: string;
}
