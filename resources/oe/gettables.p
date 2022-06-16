def var i as integer no-undo.
def var c as char no-undo.
put unformatted "~{ ""tables"":[".
if num-dbs > 0 then do:
  i = 0.
  c = "".
  for each _file where _file._tbl-type = "T" no-lock by _file._file-name:
    put unformatted c + """" + _file._file-name + """".
    if i = 0 then do:
      c = ",".
      i = 1.
    end.
  end.
end.
put unformatted "]~}" skip.
quit.
