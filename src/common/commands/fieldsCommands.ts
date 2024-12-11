import { ICommand } from '@app/model';

export interface HighlightFieldsCommand extends ICommand {
    column: string;
    tableName: string;
}
