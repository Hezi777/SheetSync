[Setup]
AppName=SheetSync
AppVersion=1.0.0
AppPublisher=SheetSync
AppPublisherURL=https://github.com
DefaultDirName={autopf}\SheetSync
DefaultGroupName=SheetSync
OutputDir=tests\setup
OutputBaseFilename=SheetSync-Setup-1.0.0
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\SheetSync.exe
SetupIconFile=assets\icons\app.ico
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DisableProgramGroupPage=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked
Name: "startupentry"; Description: "Start SheetSync automatically at &login"; GroupDescription: "Startup:"

[Files]
Source: "dist\SheetSync.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\SheetSync";          Filename: "{app}\SheetSync.exe"
Name: "{group}\Uninstall SheetSync"; Filename: "{uninstallexe}"
Name: "{autodesktop}\SheetSync";     Filename: "{app}\SheetSync.exe"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "SheetSync"; ValueData: """{app}\SheetSync.exe"""; Flags: uninsdeletevalue; Tasks: startupentry

[Run]
Filename: "{app}\SheetSync.exe"; Description: "Launch SheetSync"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{userappdata}\SheetSync"
