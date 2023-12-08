run myProc.

procedure myProc:

    DEFINE buffer b_vac for Vacation.
    DEFINE buffer b_vac for Customer.

    find first b_vac  
    no-lock no-error.

    if available b_vac
    then message b_vac.
    else message "Error Vacation".
end procedure.