Set oShell = CreateObject("WScript.Shell")
oShell.Run "powershell -Command ""Start-Process -FilePath 'cmd.exe' -ArgumentList '/c pm2 resurrect' -WindowStyle Minimized""", 0, False
