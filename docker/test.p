run myProc.

procedure myProc:

    DEFINE buffer b_vacation for Vacation.
    DEFINE buffer b_orderLine for OrderLine.

    find first b_orderLine where b_orderLine.vacation = b_vacation.id
    no-lock no-error.

    if available b_orderLine
    then message b_orderLine.
    else message "Error OrderLine".
end procedure.