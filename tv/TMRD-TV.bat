@echo off
rem TMRD na TV: abre o painel em TELA CHEIA (modo quiosque do Microsoft Edge), sem precisar de mouse.
rem Para abrir sozinho ao ligar o computador: Win+R, digite shell:startup e copie este arquivo para a pasta que abrir.
rem Para sair da tela cheia: Alt+F4.
rem Se o computador tiver mais de um monitor e o TMRD abrir no monitor errado, troque 0,0 pela posicao do monitor da TV (ex.: 1920,0).

start "" msedge --kiosk "https://tmrd-app.github.io/#tv" --edge-kiosk-type=fullscreen --no-first-run --window-position=0,0 --user-data-dir="%LOCALAPPDATA%\TMRD-TV"
