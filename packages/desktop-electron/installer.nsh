!macro customInstall
  ; Copy pre-built cimicode.cmd from resources to install root
  CopyFiles "$INSTDIR\resources\cimicode.cmd" "$INSTDIR\cimicode.cmd"

  ; Add install directory to user PATH
  ReadRegStr $0 HKCU "Environment" "PATH"
  WriteRegExpandStr HKCU "Environment" "PATH" "$0;$INSTDIR"

  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
!macroend

!macro customUnInstall
  ; Remove install directory from user PATH
  ReadRegStr $R9 HKCU "Environment" "PATH"
  StrCpy $R8 ""

  StrCpy $R7 0

  loop:
    StrCpy $R6 $R7

  find_end:
    StrCpy $R5 $R9 1 $R6
    StrCmp $R5 ";" end_seg
    StrCmp $R5 "" end_seg
    IntOp $R6 $R6 + 1
    Goto find_end

  end_seg:
    IntOp $R5 $R6 - $R7
    IntCmp $R5 0 skip
    StrCpy $R4 $R9 $R5 $R7

    StrCmp $R4 $INSTDIR skip
    StrCmp "$R4\" "$INSTDIR\" skip

    StrCmp $R8 "" first
    StrCpy $R8 "$R8;$R4"
    Goto skip
  first:
    StrCpy $R8 $R4

  skip:
    IntOp $R7 $R6 + 1
    StrCpy $R5 $R9 1 $R6
    StrCmp $R5 "" done
    Goto loop

  done:
  WriteRegExpandStr HKCU "Environment" "PATH" $R8
  Delete "$INSTDIR\cimicode.cmd"

  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
!macroend
