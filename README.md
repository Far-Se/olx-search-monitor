<u>Pentru</u> a adauga o cautare, apasa butonul de mai jos. Va cere o permisiune de "History"/"Tabs" pentru a avea access la Tabul cu OLX.ro<br>
Sau manual, pentru a face rost de datele cautarii, deschide olx.ro, fa o cautare cu parametrii doriti, apasa <b><u>CTRL+SHIFT+I</u></b> sau <b><u>F12</u></b> iar in Console scrie:<br>
<b><u>$('#mainTopSearch').serialize()</u></b> . Copie textul si punel jos, se va formata singur.<br><br>
Pentru apartamente si case de cumparare, va arata pretul pe metru patrat, pentru a scoate, adauga <b><u>&mp</u></b> la capat.<br>
Pentru a nu inregistra numarul de anunturi noi pentru o categorie, adauga <b><u>&#x26;notrack</u></b><br>
Adauga <b>//</b> pentru a dezactiva o categorie, sterge numele categoriei pentru a disparea, dupa salvare <br>
Poti adauga <b><u>&exclude=</u></b> pentru a exclude anumite anunturi, poti adauga mai multe folosind caracterul | si poti sari caractere cu .* , Exemplu:
<b><u>&exclude=CUG|Cas.|Popas|Reside.*</u></b><br>
<b><u>&include=</u></b> functioneaza la fel, va arata doar anunturile care includ ce e specificat, spre exemplu vrei doar Pacurari si nu Popas Pacurari : <u>&include=pacurari&exclude=popas</u><br>
<b><u>&include=</u></b> este de ajutor cand cauti anunturi noi pe diferite zone, cum ar fi Nicolina si Bucium, <u>&include=Nicolina|Bucium</u>.<br>
Nu tine cont de majuscule<br><br>