Set oShell = CreateObject("WScript.Shell")
oShell.Run "powershell -Command ""Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d """"d:\PersonalWebSite\PersonalWebsite"""" && """"C:\Program Files\nodejs\npm.cmd"""" start' -WindowStyle Minimized""", 0, False
