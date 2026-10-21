# Changelog / Ändringslogg

## 1.7.7 – 2026-10-22

- Bredare färgpalett för aktivitet och träningstyp i Statistik och kalendern: fler färger i stället för bara nyanser av din färg. Din färg går till det du tränat mest de senaste 30 dagarna, och varje aktivitet behåller sin färg
- Förslaget om fysio eller läkare ligger nu under diagrammet
- Swipa åt vänster eller höger för att gå mellan Logga pass, Statistik och Historik. Det fungerar inte när du drar i ett reglage, ett diagram, ett textfält eller nära skärmkanten, och inte när en ruta eller panel är öppen
- Förslaget om fysio eller läkare räknar nu på dina senaste loggade dagar (pass, vilodag eller sjukdag) i stället för kalenderdagar: smärta på 5 eller mer under minst 5 av de senaste 7 loggade dagarna, eller 10 av de senaste 14. Det tittar som mest 4 veckor bakåt, så gammal värk utlöser inget

## 1.7.6 – 2026-10-22

- Ny ruta Smärta i Statistik: välj kroppsdel och se hur smärtan har varit dag för dag, med belastningen svagt i bakgrunden. Dagar utan notering blir ett glapp i linjen, inte en nolla
- Om smärtan är ihållande (smärta på 5 eller mer under minst 5 av de senaste 7 dagarna eller 10 av de senaste 14) visas ett lugnt förslag om att kontakta fysio eller läkare
- Rättat: när du redigerade eller la till ett pass åt någon annan i Historik hoppade personvalet tillbaka till dig när panelen stängdes
- Rättat: en enhet som tillhör någon annan än Niva eller Grim kunde starta som Niva efter uppdatering av sidan. Nu behålls rätt person
- Rättat: i Vad är nytt rullar inte sidan bakom längre. Fortsätter du dra uppåt när du kommit till toppen stängs rutan, som ett alternativ till krysset

## 1.7.5 – 2026-10-21

- Kalendervy i Historik: växla mellan Lista och Kalender (valet sparas per enhet). Dagar med pass har prickar i aktivitetens färg, vilo- och sjukdagar en måne eller termometer och dagar med smärta en liten röd markering
- Tryck på en dag för att se dess pass under kalendern, med samma rader som i listan (fälla ut, redigera, ta bort)
- Dagar utan något loggat har ett plus. Det öppnar panelen med datumet ifyllt, så du kan logga det du missat utan att lämna Historik
- Filtren ligger nu bakom en filterknapp bredvid sökfältet och tar ingen plats när de inte behövs. Knappen visar hur många filter som är på
- Sök och filter fungerar i kalendern: dagar utan träff tonas ned. Sökning visar träffarna som lista

## 1.7.4 – 2026-10-21

- Redigeringspanelen i Historik anpassar sig nu till tangentbordet på telefonen, så det du skriver syns ovanför tangentbordet och Spara-knappen går att nå

## 1.7.3 – 2026-10-21

- Ny flik Historik: bläddra månad för månad med veckorubriker och veckosummor (pass, tid, belastning, distans, vilo- och sjukdagar och högsta smärta per kroppsdel)
- Sök: letar i sammanfattning, smärtnoteringar, kroppsdelar, aktiviteter och träningstyper. När du skriver söker den i alla månader
- Filter: Bara med smärta, Aktivitet, Träningstyp och Kroppsdel. Filtren kan kombineras
- Smärta syns som små markeringar under raden (till exempel Häl V 6)
- Pennan i Historik öppnar passet i en panel som glider upp, så du slipper lämna fliken. Det du höll på att skriva på Logga pass finns kvar när du stänger panelen

## 1.7.2 – 2026-10-21

- Ansträngning (1–10) väljs nu med en slider, som smärtan. Ingen siffra är vald från början, tryck eller dra för att välja, och kryssknappen tar bort valet
- Sliderns ändsiffror (1 och 10, 0 och 10 för smärta) står på samma rad som slidern, så den tar mindre plats
- Anteckningar heter nu Sammanfattning, i formuläret och i det öppnade passet

## 1.7.1 – 2026-10-21

- I det öppnade passet skiljs Anteckning från Mående och smärta med en linje och en egen rubrik
- Skala enligt Borg CR10 står nu direkt efter rubriken Ansträngning

## 1.7.0 – 2026-10-21

- Ny hopfällbar sektion Mående i loggformuläret, ovanför Anteckningar. Allt är valfritt och inget är förifyllt
- Sömn och Energi på skalan 1–5 (Sömn: Dålig till Toppen, Energi: Tömd till Laddad)
- Smärta per kroppsdel, 0–10 med en slider (ingen siffra är vald från början), och valfri notering. Snabbval för dina vanligaste kroppsdelar och Lägg till kroppsdel för resten. Vänster/höger (eller övre/nedre för rygg) väljs separat
- Går även att fylla i på vilodagar och sjukdagar (Smärta idag)
- Smärta syns direkt på raden i listan (till exempel Häl V 6), och allt visas i det öppnade passet
- CSV-filen har tre nya kolumner sist: Somn, Energi och Smarta. Äldre filer går att importera som förut

## 1.6.6 – 2026-10-21

- Tid kan anges med sekunder (min : sek). Sekunderna är valfria och gamla pass med hela minuter fungerar som förut
- Tempot räknas på exakt tid, till exempel 4,07 km på 40:46 ger 10:01 min/km
- CSV-filen skriver tiden som 40:46 när sekunder finns. Import förstår både 40:46 och hela minuter

## 1.6.5 – 2026-10-21

- Statistik per vecka: välj Vecka, Månad eller Alla månader. Bläddra med pilarna (både vecka och månad) eller tryck på veckan eller månaden för att hoppa till ett valfritt datum
- Snabbare statistiksida: diagrammen animeras inte längre, och det går att klicka direkt när du byter person

## 1.6.4 – 2026-10-21

- Ny uppgift: Distans (km) bredvid Tid. Syns i passlistan, i statistiken (Distans totalt) och i CSV-filen
- Tempo visas i det öppnade passet för löpning, promenad (min/km) och cykel (km/h)
- Statistiken visar nu den person du loggar som från början, och byter när du byter person i menyn

## 1.6.3 – 2026-10-20

- Ny aktivitet: Barmarksträning (före Pingis)

## 1.6.2 – 2026-10-20

- Nya aktiviteter: Handboll (efter Fotboll), Yoga och Pilates (före Annat)
- Ny träningstyp: Stretching

## 1.6.1 – 2026-10-20

- Ny sidfot: © 2026 Grim till vänster, versionsnummer och Vad är nytt? till höger. Skydd mot överskrivning står på egen rad
- Vad är nytt är nu ihopfällbart per version (1.6, 1.5 osv.). Den senaste visas öppen, äldre är hopfällda. Datumet står vid varje version

## 1.6.0 – 2026-10-20

- Mörkt läge: välj Auto, Ljust eller Mörkt under Utseende i personmenyn. Auto följer telefonens inställning. Valet sparas på enheten
- Mörk bakgrund och kort i mörkgrått, din färg ljusas upp automatiskt så att den är lätt att läsa
- Diagram, rutnät, förklaringsrutor, datumväljare och rullistor har även mörka varianter
- Datum-, månad- och textfält har samma mörka färg överallt

## 1.5.6 – 2026-10-20

- Längst ned på sidan står nu © 2026 Grim • Bastubacken

## 1.5.5 – 2026-10-20

- Personvalet (Loggar som) har flyttat från formuläret till en personmeny uppe till höger: tryck på ditt namn för att byta person
- I menyn finns också Hantera användare, Importera, Exportera, Kopiera kopplingslänk och Koppla bort enheten
- Formuläret börjar nu direkt med Pass / Vilodag / Sjukdag

## 1.5.4 – 2026-10-20

- Mer luft överst: rubriken och knapparna för import och export hamnar nu under iOS mjuka kant
- Knappen Vilo-/sjukdagar ligger nu vänsterställd direkt under rubriken Loggade pass

## 1.5.3 – 2026-10-19

- Ny knapp Rensa bredvid Spara: tömmer det du fyllt i, men behåller datum, person och val av Pass/Vilodag/Sjukdag
- Pass / Vilodag / Sjukdag ligger nu ovanför datumet, med en linje som skiljer personvalet från själva loggningen
- Lite mer luft överst så att rubriken inte hamnar i iOS mjuka kant när appen ligger på hemskärmen
- Loggade pass: knappen Vilo-/sjukdagar (öga) döljer eller visar vilo- och sjukdagar i listan. Valet sparas på enheten
- Nya aktiviteter: Cykel och Rullskidor. Skidor, Rullskidor och Alpint ligger bredvid varandra, liksom Löpning och Promenad

## 1.5.2 – 2026-10-19

- Vilodag och sjukdag: välj Pass, Vilodag eller Sjukdag när du loggar. Då behövs bara datum och anteckningar
- Vilo- och sjukdagar räknas inte som pass i statistiken, men syns i listan och i kortet Registrerade vilo-/sjukdagar
- Max en vilo- eller sjukdag per person och dag. Ett pass kan ligga på samma dag
- Ansträngningen syns nu i listan över loggade pass, t.ex. 6/10
- CSV har en ny kolumn Typ (Pass, Vilodag, Sjukdag). Äldre filer går fortfarande att importera

## 1.5.1 – 2026-10-19

- Aktivitet och Träningstyp: de tre du använder mest syns direkt, övriga finns under Fler
- Ordningen räknas på dina senaste 30 dagar och ändras bara när du öppnar appen, aldrig medan du loggar
- Samma som senast: fyller i aktivitet, träningstyp och tid från ditt senaste pass (inte ansträngning, datum eller anteckningar)

## 1.5.0 – 2026-10-19

- Säkrare sparning: om två enheter sparar samtidigt blir båda passen kvar
- Ej sparat: pass som inte kommer fram sparas på telefonen och skickas automatiskt när nätet är tillbaka
- Du kan spara igen, redigera eller radera ett pass som är Ej sparat
- Bekräftelse innan ett pass tas bort
- Att flytta ett pass till en annan månad kan inte längre tappa passet på vägen
- Sidfoten visar om skyddet mot överskrivning är på
- Export avbryts med ett tydligt fel om någon månad inte kunde hämtas, i stället för en ofullständig fil

## 1.4.7 – 2026-10-18

- Diagrammen på statistiksidan klipps inte längre av till vänster: siffrorna på den lodräta axeln syns nu
- Första punkten i diagrammet Ansträngning över tid ligger inte längre tryckt mot kanten

## 1.4.6 – 2026-10-17

- Knapparna längst ned följer användarens färgtema och har mer luft
- Annat tillagd som träningstyp

## 1.4.5 – 2026-10-17

- Månadsväljaren bland loggade pass ligger nu i linje med övrig text

## 1.4.4 – 2026-10-17

- Vad är nytt: den här listan över ändringar finns nu i appen
- Knappen för att ladda om heter nu Uppdatera sidan

## 1.4.3 – 2026-10-17

- Kategorin Sport heter nu Aktivitet
- Promenad tillagd som aktivitet
- Byt månad bland loggade pass med pilen bredvid månadsnamnet
- Statistiksidan går nu att scrolla ända ned i Chrome på dator

## 1.4.2 – 2026-10-17

- Statistiken hoppar inte längre till toppen när appen uppdateras i bakgrunden

## 1.4.1 – 2026-10-17

- Dölj en användare bara på den här enheten
- Arkivera en användare för alla enheter, med Återställ

## 1.4.0 – 2026-10-17

- Flera användare: lägg till, byt namn och välj färgtema
- Varje enhet minns vem som loggar

## 1.3.1 – 2026-10-17

- Knapp för att ladda om appen
- Ny data hämtas automatiskt när appen öppnas igen

## 1.3.0 – 2026-10-17

- Ansträngning på Borg CR10 (1–10). Äldre pass är omräknade (×2)

## 1.2.1 – 2026-10-17

- Skarpare hemskärmsikon (enhörningen)

## 1.2.0 – 2026-10-17

- Grönt färgtema för Grim
- Underrubriken Bastubackens finest
- Löpning, Alpint och Pingis som aktiviteter, och Lek som träningstyp

## 1.1.0 – 2026-10-16

- Anpassad för att användas som webbapp på mobilen
- Rubriken Träningsdagbok och versionsrad längst ned

## 1.0.0 – 2026-10-16

- Delad träningsdagbok i realtid för Niva och Grim
- Logga pass, anteckningar, redigering, export och import, statistik
