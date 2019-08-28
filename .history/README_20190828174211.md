            Pentru apartamente si case de cumparare, o sa arate si pretul pe metru patrat, pentru a scoate, adauga <b><u>&mp</u></b> la capat.<br>
            Pentru a nu inregistra numarul de anunturi noi pentru o categorie, adauga &#x26;notrack<br>
            Adauga <b>//</b> pentru a dezactiva o categorie, sterge numele categoriei pentru a disparea, dupa salvare <br><br>
            Pentru a face rost de datele cautarii, deschide olx.ro, fa o cautare cu parametrii doriti, apasa <b><u>CTRL+SHIFT+I</u></b> sau <b><u>F12</u></b> iar in Console scrie:<br>
            <b><u>$('#mainTopSearch').serialize()</u></b> <br>
            Copie textul si punel jos, se va formata singur.<br><br>
            Poti adauga <b><u>&exclude=</u></b> pentru a exclude anumite anunturi, poti adauga mai multe folosind caracterul | si poti sari caractere cu .* , Exemplu:
            <b><u>&exclude=CUG|Cas.|Popas|Reside.*</u></b><br>
            <b><u>&include=</u></b> functioneaza la fel, va arata doar anunturile care includ ce e specificat, spre exemplu vrei doar Pacurari si nu Popas Pacurari : &include=pacurari&exclude=popas<br>
            <b><u>&include=</u></b> este ok de folosit cand astepti anunturi noi, daca vrei sa le vezi pe cele din urma, la inceput unde este &q=& trebuie adauga &q=pacurari& sa faca o cautare pe Pacurari prima data<br>
            Nu tine cont de majuscule<br>