put unformatted "~{".
if num-dbs > 0 then do:
  put unformatted """dbversion"":""" + dbversion(1) + """,".
  put unformatted """proversion"":""" + proversion(1) + """".
end.
put unformatted "~}" skip.
quit.
