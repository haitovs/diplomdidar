"""
Startup guide dialog showing test case instructions in Turkmen.
"""

import os
from .qt import QtCore, QtGui, QtWidgets

GUIDE_TEXT = """
<h1 style="color: #003366;">Tor Simulýatory — Synag Gollanmasy</h1>

<h2>Nädip başlamaly</h2>
<p><b>File &gt; Open Project</b> basyň — gerekli Case-i saýlaň.<br>
Ýaşyl <b>Play</b> düwmesini basyň — hemme enjamlar işläp başlar.<br>
Kompýutere (PC) iki gezek basyň — konsol açylar.<br>
Konsolda <code>ping</code> buýrugy bilen arabaglanyşygy barlaň.</p>

<h3>Peýdaly buýruklar (VPCS konsoly)</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
<tr style="background: #003366; color: white;">
  <th>Buýruk</th><th>Näme edýär</th>
</tr>
<tr><td><code>show</code></td><td>PC-niň IP, MAC, gateway maglumatlaryny görkez</td></tr>
<tr><td><code>show ip</code></td><td>Diňe IP sazlamalaryny görkez</td></tr>
<tr><td><code>ping 192.168.1.2</code></td><td>Beýleki kompýuter bilen baglanyşygy barla</td></tr>
<tr><td><code>ip 10.0.0.1/24</code></td><td>IP-adresi el bilen belläp goý</td></tr>
<tr><td><code>ip 10.0.0.1/24 10.0.0.254</code></td><td>IP + gateway bellemek</td></tr>
<tr><td><code>arp</code></td><td>ARP tablisasyny görkez (öwrenilen MAC-adresler)</td></tr>
<tr><td><code>trace 10.0.0.5</code></td><td>Paketiň geçýän ýolyny görkez</td></tr>
<tr><td><code>clear ip</code></td><td>IP sazlamalaryny arassala</td></tr>
<tr><td><code>save</code></td><td>Häzirki sazlamalary ýatda sakla</td></tr>
<tr><td><code>?</code></td><td>Buýruk kömegini görkez</td></tr>
</table>

<h3>Umumy tehnikalar (ähli Case-ler üçin)</h3>

<p><b>1. Enjama <i>sag basmak</i> menýusy:</b></p>
<ul>
  <li><b>Start / Stop</b> — enjamy aýry işlet ýa-da duruz</li>
  <li><b>Console</b> — konsoly aç (PC üçin)</li>
  <li><b>Configure</b> — sazlamalary üýtget (VLAN, portlar we ş.m.)</li>
  <li><b>Change symbol</b> — enjamyň şekilini üýtget</li>
  <li><b>Change hostname</b> — ady üýtget</li>
</ul>

<p><b>2. Kabel/baglanyşyk üstünde <i>sag basmak</i>:</b></p>
<ul>
  <li><b>Start capture</b> — Wireshark bilen paketleri basyp al</li>
  <li><b>Stop capture</b> — basyp almagy duruz</li>
  <li><b>Delete</b> — kabeli aýyr</li>
</ul>

<p><b>3. Kommutatorda VLAN sazlamak:</b></p>
<ol>
  <li>Kommutatora sag basyň → <b>Configure</b></li>
  <li><b>VLAN</b> goýmasyna geçiň</li>
  <li>Porty saýlaň, <b>Type</b> we <b>VLAN</b> belgilerini üýtgediň:
    <ul>
      <li><b>access</b> — kompýuter üçin (diňe bir VLAN)</li>
      <li><b>dot1q</b> — trunk üçin (hemme VLAN-lar)</li>
      <li><b>qinq</b> — VLAN içinde VLAN (öwrençde ulanylmaýar)</li>
    </ul>
  </li>
  <li><b>Apply</b> → <b>OK</b></li>
</ol>

<p><b>4. Paket basyp almak (Packet capture):</b></p>
<ol>
  <li>Kabele sag basyň → <b>Start capture</b></li>
  <li>Interfeýsi saýlaň (adatça birinjisi) → <b>OK</b></li>
  <li>Wireshark awtomatiki açylar (eger gurnalan bolsa)</li>
  <li>PC-den ping ediň — paketler Wireshark-da görüner</li>
  <li>Kabele ýaşyl nokat peýda bolar (capture aktiw)</li>
  <li>Gutaran soň: sag basyň → <b>Stop capture</b></li>
</ol>

<hr>

<h2>Case 1: Esasy ping synag</h2>
<p><b>Taslamadaky enjamlar:</b> 2 kompýuter (PC1, PC2) + 1 kommutator (Switch)</p>
<p><b>Näme barlaýarys:</b> Bir toruň içindäki iki kompýuteriň kommutator arkaly habarlaşyp bilýändigini.</p>
<p><b>Kommutator näme?</b> Kommutator (switch) — kompýuterleri bir ýerli tora birikdirýän enjam. Ol birikdirilen enjamlaryň adreslerini ýatda saklap, maglumatlary diňe gerekli adresata iberýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>192.168.1.1/24</code></li>
  <li>PC2: <code>192.168.1.2/24</code></li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case1-Basic-Ping</b> taslamasyny açyň</li>
  <li><b>Play</b> basyň</li>
  <li><b>PC1</b>-e iki gezek basyň — konsol açylar</li>
  <li>Ýazyň: <code>ping 192.168.1.2</code></li>
</ol>
<p><b>Netije:</b> Ping üstünlikli geçýär — iki kompýuter bir podsetde habarlaşyp bilýär.</p>

<hr>

<h2>Case 2: Podseti izolýasiýasy</h2>
<p><b>Taslamadaky enjamlar:</b> 3 kompýuter + 1 kommutator</p>
<p><b>Näme barlaýarys:</b> Dürli podsetlerdäki kompýuterleriň bir kommutator arkaly göni habarlaşyp bilmeýändigini.</p>
<p><b>Podset näme?</b> Podset — bir topardaky IP-adresler. Bir podsetdäki kompýuterler göni habarlaşyp bilýär. Dürli podsetler üçin marşrutizator (router) gerek.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>192.168.1.1/24</code> (A podseti)</li>
  <li>PC2: <code>192.168.1.2/24</code> (A podseti)</li>
  <li>PC3: <code>192.168.2.1/24</code> (B podseti — başga!)</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case2-Subnet-Isolation</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 konsolynda: <code>ping 192.168.1.2</code> → <b>işleýär</b></li>
  <li>PC1 konsolynda: <code>ping 192.168.2.1</code> → <b>işlemeýär</b></li>
</ol>
<p><b>Netije:</b> Bir podset — baglanyşyk bar. Dürli podset — baglanyşyk ýok (marşrutizator ýok).</p>

<hr>

<h2>Case 3: VLAN izolýasiýasy</h2>
<p><b>Taslamadaky enjamlar:</b> 3 kompýuter + VLAN sazlanan 1 kommutator</p>
<p><b>Näme barlaýarys:</b> VLAN-yň bir fiziki kommutatory birnäçe wirtual tora bölýändigini.</p>
<p><b>VLAN näme?</b> VLAN (Virtual LAN) — bir kommutatoryň portlaryny izolirlenip, dürli torlara bölýän tehnologiýa. Dürli VLAN-daky kompýuterler biri-birini görmeýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>10.0.10.1/24</code> — VLAN 10</li>
  <li>PC2: <code>10.0.10.2/24</code> — VLAN 10</li>
  <li>PC3: <code>10.0.10.3/24</code> — VLAN 20</li>
</ul>
<p><i>Üns beriň: hemme IP-adresler bir podsetde! Ýöne VLAN baglanyşygy petikleýär.</i></p>

<p><b>VLAN-y nädip sazlamaly (kommutatorda):</b></p>
<ol>
  <li>Kommutatora <b>sag basyň</b> → <b>Configure</b> saýlaň</li>
  <li>Täze penjirede <b>VLAN</b> goýmasyna geçiň</li>
  <li>Her porty saýlap, VLAN belgisini bellemeli:
    <ul>
      <li><code>Ethernet0</code> (PC1) → VLAN <b>10</b>, Type: <b>access</b></li>
      <li><code>Ethernet1</code> (PC2) → VLAN <b>10</b>, Type: <b>access</b></li>
      <li><code>Ethernet2</code> (PC3) → VLAN <b>20</b>, Type: <b>access</b></li>
    </ul>
  </li>
  <li><b>Apply</b> we <b>OK</b> basyň</li>
  <li><i>Bellik: Bu taslamada VLAN eýýäm öňünden sazlanan — göni synaga geçip bilersiňiz.</i></li>
</ol>

<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case3-VLAN-Isolation</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC2: <code>ping 10.0.10.2</code> → <b>işleýär</b> (ikisi-de VLAN 10)</li>
  <li>PC1 → PC3: <code>ping 10.0.10.3</code> → <b>işlemeýär</b> (PC3 VLAN 20-de)</li>
</ol>
<p><b>Netije:</b> VLAN kompýuterleri izolirleýär, hatda IP-adresler bir podsetde bolsa-da.</p>

<hr>

<h2>Case 4: Hab we Kommutator tapawudy</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 1 hab + 1 kommutator</p>
<p><b>Näme barlaýarys:</b> Habyň we kommutatoryň arasyndaky tapawudy.</p>
<p><b>Hab näme?</b> Hab (hub) — maglumatlary bir kompýuterden alyp, HEMME birikdirilen enjamlara iberýän ýönekeý enjam.</p>
<p><b>Kommutator näme tapawutly?</b> Kommutator MAC-adresler boýunça diňe gerekli adresata iberýär — has çalt we howpsuz.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1, PC2 — hab arkaly</li>
  <li>PC3, PC4 — kommutator arkaly</li>
  <li>Hemmesi: <code>10.0.0.x/24</code></li>
</ul>

<p><b>Paket basyp almak (packet capture) nädip edilýär:</b></p>
<p>Hab bilen kommutatoryň tapawudyny görmek üçin trafigi basyp almak gerek.</p>
<ol>
  <li>Habyň we PC2-niň arasyndaky <b>kabele sag basyň</b></li>
  <li><b>Start capture</b> saýlaň</li>
  <li>Interfeýsi saýlaň we <b>OK</b> basyň (Wireshark açylar)</li>
  <li>PC1 konsolyndan PC3-e ping ediň: <code>ping 10.0.0.3</code></li>
  <li>Wireshark-da PC2 habyň üstünden geçýän ähli paketleri görýär — hab her zady hemme ýere iberýär!</li>
  <li>Şol synagy kommutatordaky kabelde geçirip görüň: PC4 PC3-iň trafigini <b>görmeýär</b></li>
</ol>

<p><b>Synag:</b> Hemme kompýuterler biri-birini pingläp bilýär. Hab hemme portlara iberýär, kommutator diňe gerekli porta.</p>

<hr>

<h2>Case 5: Ýyldyz topologiýasy</h2>
<p><b>Taslamadaky enjamlar:</b> 6 kompýuter + 1 merkezi kommutator</p>
<p><b>Näme barlaýarys:</b> Ýyldyz topologiýasynyň işleýşini — ýerli torlaryň iň köp ulanylýan shemasy.</p>
<p><b>Ýyldyz topologiýasy näme?</b> Hemme enjamlar bir merkezi kommutatora birikdirilýär. Bir kompýuter öçse, beýlekiler işlemegini dowam edýär.</p>
<p><b>Tor sazlamalary:</b> PC1–PC6: <code>10.0.0.1</code> — <code>10.0.0.6</code> (hemmesi <code>/24</code>)</p>
<p><b>Synag:</b> Her PC beýleki hemme PC-leri pingläp bilýär.</p>

<hr>

<h2>Case 6: Birnäçe kommutator (Multi-Switch)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 2 kommutator (uplink bilen birleşdirilen)</p>
<p><b>Näme barlaýarys:</b> Kompýuterleriň birnäçe kommutator arkaly habarlaşyp bilýändigini.</p>
<p><b>Uplink näme?</b> Uplink — iki kommutatoryň arasyndaky baglanyşyk. Dürli kommutatorlardaky kompýuterleri bir tora birleşdirýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1, PC2 — Switch1</li>
  <li>PC3, PC4 — Switch2</li>
  <li>Hemmesi: <code>172.16.0.x/24</code></li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case6-Multi-Switch</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC2: <code>ping 172.16.0.2</code> → <b>işleýär</b> (bir kommutator)</li>
  <li>PC1 → PC4: <code>ping 172.16.0.4</code> → <b>işleýär</b> (uplink arkaly)</li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler habarlaşyp bilýär. Uplink iki kommutatoryň toparlaryny birleşdirýär.</p>

<hr>

<h2>Jemleýji tablisa</h2>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
<tr style="background: #003366; color: white;">
  <th>Synag</th><th>Näme barlaýarys</th><th>Netije</th>
</tr>
<tr><td>Case 1</td><td>Kommutator arkaly esasy ping</td><td>PC1 ↔ PC2: işleýär</td></tr>
<tr><td>Case 2</td><td>Podseti izolýasiýasy</td><td>Bir podset: işleýär, dürli: ýok</td></tr>
<tr><td>Case 3</td><td>VLAN izolýasiýasy</td><td>Bir VLAN: işleýär, dürli: ýok</td></tr>
<tr><td>Case 4</td><td>Hab we Kommutator</td><td>Hemmesi işleýär, hab hemme ýere iberýär</td></tr>
<tr><td>Case 5</td><td>Ýyldyz topologiýasy</td><td>6 PC 1 kommutator arkaly habarlaşýar</td></tr>
<tr><td>Case 6</td><td>Birnäçe kommutator</td><td>Hemme PC uplink arkaly habarlaşýar</td></tr>
<tr><td>Case 7</td><td>Halka topologiýasy</td><td>4 kommutator halka görnüşinde birikdirilen</td></tr>
<tr><td>Case 8</td><td>VLAN Trunk</td><td>2 kommutator arasynda trunk baglanyşyk</td></tr>
<tr><td>Case 9</td><td>Agaç topologiýasy</td><td>Ierarhiýa: merkez > bölüm > PC</td></tr>
<tr><td>Case 10</td><td>Broadcast domeni</td><td>Hab zynjyry — hemme enjamlar hemme zady görýär</td></tr>
<tr><td>Case 11</td><td>Tor segmentasiýasy</td><td>Bölümler izolirlenip, bir-birini görmeýär</td></tr>
<tr><td>Case 12</td><td>Doly mesh topologiýasy</td><td>Her kommutator beýlekisine birikdirilen</td></tr>
</table>

<hr>

<h2>Case 7: Halka topologiýasy (Ring Topology)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 4 kommutator (halka görnüşinde birikdirilen)</p>
<p><b>Näme barlaýarys:</b> Halka topologiýasynyň işleýşini — enjamlar tegelekleýin birikdirilýär.</p>
<p><b>Halka topologiýasy näme?</b> Her kommutator iki goňşusy bilen birikdirilýär, halkany (ring) emele getirýär. Maglumatlar halka boýunça geçýär.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>10.1.0.1/24</code> → Switch1</li>
  <li>PC2: <code>10.1.0.2/24</code> → Switch2</li>
  <li>PC3: <code>10.1.0.3/24</code> → Switch3</li>
  <li>PC4: <code>10.1.0.4/24</code> → Switch4</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case7-Ring-Topology</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 konsolynda: <code>ping 10.1.0.3</code> → <b>işleýär</b></li>
  <li>PC2 konsolynda: <code>ping 10.1.0.4</code> → <b>işleýär</b></li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler halka arkaly habarlaşyp bilýär.</p>

<hr>

<h2>Case 8: VLAN Trunk</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 2 kommutator (trunk baglanyşykly)</p>
<p><b>Näme barlaýarys:</b> Trunk portunyň birnäçe VLAN-y iki kommutator arasynda geçirip bilýändigini.</p>
<p><b>Trunk näme?</b> Trunk — bir kabel arkaly birnäçe VLAN-yň maglumatlaryny geçirýän baglanyşyk. Kadrlar (frames) VLAN belgileri bilen iberilýär (802.1Q standardy).</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>PC1: <code>10.10.0.1/24</code> — VLAN 10, Switch1</li>
  <li>PC2: <code>10.20.0.1/24</code> — VLAN 20, Switch1</li>
  <li>PC3: <code>10.10.0.2/24</code> — VLAN 10, Switch2</li>
  <li>PC4: <code>10.20.0.2/24</code> — VLAN 20, Switch2</li>
</ul>

<p><b>Trunk portuny nädip sazlamaly:</b></p>
<ol>
  <li>Kommutatora <b>sag basyň</b> → <b>Configure</b> → <b>VLAN</b> goýmasy</li>
  <li>Kompýuter birikdirilen portlar üçin:
    <ul>
      <li>Type: <b>access</b></li>
      <li>VLAN: degişli VLAN belgisi (10 ýa-da 20)</li>
    </ul>
  </li>
  <li>Trunk porty üçin (iki kommutatoryň arasyndaky kabel):
    <ul>
      <li>Type: <b>dot1q</b> (802.1Q — VLAN tag bilen ibermek)</li>
      <li>VLAN: <b>1</b> (native VLAN, ýöne ähli VLAN geçer)</li>
    </ul>
  </li>
  <li><b>Apply</b> we <b>OK</b> basyň</li>
  <li><i>Bellik: Bu taslamada trunk eýýäm sazlanan — Switch1 port 7 we Switch2 port 7 <b>dot1q</b> görnüşinde.</i></li>
</ol>

<p><b>Access we Trunk tapawudy:</b></p>
<ul>
  <li><b>Access port</b> — diňe bir VLAN-yň trafigini geçirýär (kompýuter birikmek üçin)</li>
  <li><b>Trunk port (dot1q)</b> — ähli VLAN-laryň trafigini bellik (tag) bilen geçirýär (kommutatorlar arasy)</li>
</ul>

<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case8-VLAN-Trunk</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC3: <code>ping 10.10.0.2</code> → <b>işleýär</b> (ikisi-de VLAN 10, trunk arkaly)</li>
  <li>PC1 → PC2: <code>ping 10.20.0.1</code> → <b>işlemeýär</b> (dürli VLAN)</li>
  <li>PC2 → PC4: <code>ping 10.20.0.2</code> → <b>işleýär</b> (ikisi-de VLAN 20, trunk arkaly)</li>
</ol>
<p><b>Netije:</b> Trunk bir kabel arkaly birnäçe VLAN-y geçirýär. VLAN izolýasiýasy saklanýar.</p>

<hr>

<h2>Case 9: Agaç topologiýasy (Tree / Hierarchical)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 3 kommutator (3 derejeli ierarhiýa)</p>
<p><b>Näme barlaýarys:</b> Agaç (ierarhik) topologiýasynyň işleýşini — uly torlaryň adaty gurluşy.</p>
<p><b>Agaç topologiýasy näme?</b> Enjamlar derejeler boýunça birikdirilýär: merkezi (core) kommutator → bölüm (distribution) kommutatorlary → kompýuterler. Bu uly korporatiw torlarda köp ulanylýar.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Core-Switch (merkez) → Dist-Switch1, Dist-Switch2</li>
  <li>PC1, PC2: <code>192.168.10.1-2/24</code> → Dist-Switch1</li>
  <li>PC3, PC4: <code>192.168.10.3-4/24</code> → Dist-Switch2</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case9-Tree-Topology</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC2: <code>ping 192.168.10.2</code> → <b>işleýär</b></li>
  <li>PC1 → PC4: <code>ping 192.168.10.4</code> → <b>işleýär</b> (merkez arkaly)</li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler ierarhiýa arkaly habarlaşyp bilýär.</p>

<hr>

<h2>Case 10: Broadcast domeni (Hub Chain)</h2>
<p><b>Taslamadaky enjamlar:</b> 6 kompýuter + 2 hab (zynjyr görnüşinde)</p>
<p><b>Näme barlaýarys:</b> Hablaryň zynjyrda birleşdirilende bir uly broadcast domenini döredýändigini.</p>
<p><b>Broadcast domeni näme?</b> Broadcast domeni — bir enjamyň iberen maglumaty HEMME beýleki enjamlara ýetýän ýer. Hab hemme maglumaty hemme ýere iberýär — şonuň üçin uly torlar üçin ýaramly däl.</p>
<p><b>Tor sazlamalary:</b> PC1–PC6: <code>10.5.0.1</code> — <code>10.5.0.6</code> (hemmesi <code>/24</code>)</p>

<p><b>Broadcast-y görmek üçin paket basyp almak:</b></p>
<ol>
  <li>Başga bir haba birikdirilen <b>kabele sag basyň</b> (meselem, PC5-iň kabeline)</li>
  <li><b>Start capture</b> saýlaň → interfeýsi tassyklaň → Wireshark açylar</li>
  <li>PC1-den PC3-e ping ediň: <code>ping 10.5.0.3</code></li>
  <li>Wireshark-da görersiňiz — PC5-iň kabelinden-de PC1↔PC3 paketleri geçip dur!</li>
  <li>Sebäbi hab zynjyrynda — hemme enjamlar bir broadcast domeninde</li>
</ol>

<p><b>Synag:</b> Hemme PC biri-birini pingläp bilýär. Islendik trafik hemme enjamlara ýetýär.</p>
<p><b>Näme üçin möhüm:</b> Uly torlarda bu nätogry — trafik artýar, howpsuzlyk peselýär. Şonuň üçin hablar ornuna kommutatorlar ulanylýar.</p>

<hr>

<h2>Case 11: Tor segmentasiýasy (Network Segmentation)</h2>
<p><b>Taslamadaky enjamlar:</b> 6 kompýuter + 3 kommutator (3 bölüm)</p>
<p><b>Näme barlaýarys:</b> Dürli bölümleriň aýry podsetler bilen izolirlenýändigini.</p>
<p><b>Segmentasiýa näme?</b> Tor segmentasiýasy — uly tory kiçi böleklere bölmek. Her bölüm (meselem, inžener, satyş, HR) öz podsetinde işleýär. Bu howpsuzlygy ýokarlandyrýar.</p>
<p><b>Tor sazlamalary:</b></p>
<ul>
  <li>Inžener bölümi: <code>10.1.1.1-2/24</code> → SW-Engineering</li>
  <li>Satyş bölümi: <code>10.2.1.1-2/24</code> → SW-Sales</li>
  <li>HR bölümi: <code>10.3.1.1-2/24</code> → SW-HR</li>
</ul>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case11-Network-Segmentation</b> açyň, <b>Play</b> basyň</li>
  <li>Eng-PC1 → Eng-PC2: <code>ping 10.1.1.2</code> → <b>işleýär</b> (bir bölüm)</li>
  <li>Eng-PC1 → Sales-PC1: <code>ping 10.2.1.1</code> → <b>işlemeýär</b> (dürli podset)</li>
</ol>
<p><b>Netije:</b> Bir bölümiň içinde baglanyşyk bar. Bölümler arasyndaky baglanyşyk petiklenen — howpsuzlyk üpjün edilýär.</p>

<hr>

<h2>Case 12: Doly mesh topologiýasy (Full Mesh)</h2>
<p><b>Taslamadaky enjamlar:</b> 4 kompýuter + 4 kommutator (her biri beýleki 3-e birikdirilen)</p>
<p><b>Näme barlaýarys:</b> Doly mesh topologiýasynyň artykmaçlygyny — her noduň beýleki hemme nodlara göni baglanyşygy bar.</p>
<p><b>Full Mesh näme?</b> Full mesh-de her kommutator beýleki hemme kommutatorlara birikdirilen. Bu iň ygtybarly topologiýa — bir baglanyşyk üzülse, beýleki ýollar arkaly maglumat geçýär.</p>
<p><b>Tor sazlamalary:</b> PC1–PC4: <code>172.20.0.1</code> — <code>172.20.0.4</code> (hemmesi <code>/24</code>)</p>
<p><b>Synag ädimleri:</b></p>
<ol>
  <li><b>Case12-Full-Mesh</b> açyň, <b>Play</b> basyň</li>
  <li>PC1 → PC3: <code>ping 172.20.0.3</code> → <b>işleýär</b></li>
  <li>PC2 → PC4: <code>ping 172.20.0.4</code> → <b>işleýär</b></li>
</ol>
<p><b>Netije:</b> Hemme kompýuterler habarlaşyp bilýär. Birnäçe ýol = ýokary ygtybarlylyk.</p>
"""


class GuideDialog(QtWidgets.QDialog):
    """Startup guide dialog with test case instructions in Turkmen."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Tor Simulýatory — Synag Gollanmasy")
        self.setMinimumSize(950, 650)
        self.resize(1080, 750)

        # Set window icon from branding
        branding_logo = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "branding", "logo.png"
        )
        if os.path.exists(branding_logo):
            self.setWindowIcon(QtGui.QIcon(branding_logo))

        layout = QtWidgets.QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Main content area: text on left, logo on right
        content_splitter = QtWidgets.QHBoxLayout()
        content_splitter.setContentsMargins(0, 0, 0, 0)
        content_splitter.setSpacing(0)

        # Scrollable HTML content
        text_browser = QtWidgets.QTextBrowser()
        text_browser.setOpenExternalLinks(True)
        text_browser.setHtml(
            '<div style="font-family: -apple-system, Helvetica, Arial, sans-serif; '
            'font-size: 14px; padding: 20px; line-height: 1.6;">'
            + GUIDE_TEXT +
            '</div>'
        )
        content_splitter.addWidget(text_browser, stretch=3)

        # Right-side logo panel
        logo_panel = QtWidgets.QWidget()
        logo_panel.setFixedWidth(220)
        logo_panel.setStyleSheet(
            "QWidget { background: qlineargradient(x1:0, y1:0, x2:0, y2:1, "
            "stop:0 #003366, stop:1 #001a33); }"
        )
        logo_layout = QtWidgets.QVBoxLayout(logo_panel)
        logo_layout.setContentsMargins(15, 30, 15, 30)
        logo_layout.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)

        # Logo image
        logo_img = QtWidgets.QLabel()
        if os.path.exists(branding_logo):
            pixmap = QtGui.QPixmap(branding_logo).scaled(
                160, 160,
                QtCore.Qt.AspectRatioMode.KeepAspectRatio,
                QtCore.Qt.TransformationMode.SmoothTransformation
            )
            logo_img.setPixmap(pixmap)
        logo_img.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        logo_img.setStyleSheet(
            "QLabel { background: #ffffff; border: 3px solid #ffffff; "
            "border-radius: 85px; padding: 8px; }"
        )
        logo_img.setFixedSize(170, 170)
        logo_layout.addWidget(logo_img, alignment=QtCore.Qt.AlignmentFlag.AlignCenter)

        logo_layout.addSpacing(15)

        # University name text
        uni_label = QtWidgets.QLabel("Oguz Han\nadyndaky\nInžener-tehnologiýalar\nuniversiteti")
        uni_label.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        uni_label.setWordWrap(True)
        uni_label.setStyleSheet(
            "QLabel { color: #ffffff; font-size: 13px; font-weight: bold; "
            "background: transparent; border: none; }"
        )
        logo_layout.addWidget(uni_label)

        logo_layout.addSpacing(10)

        # Subtitle
        sub_label = QtWidgets.QLabel("Tor Simulýatory")
        sub_label.setAlignment(QtCore.Qt.AlignmentFlag.AlignCenter)
        sub_label.setStyleSheet(
            "QLabel { color: #88bbee; font-size: 12px; font-style: italic; "
            "background: transparent; border: none; }"
        )
        logo_layout.addWidget(sub_label)

        logo_layout.addStretch()

        content_splitter.addWidget(logo_panel)

        content_widget = QtWidgets.QWidget()
        content_widget.setLayout(content_splitter)
        layout.addWidget(content_widget)

        # Bottom bar with checkbox + close button
        bottom = QtWidgets.QHBoxLayout()
        self._showOnStartup = QtWidgets.QCheckBox("Başlanda görkez / Show on startup")
        self._showOnStartup.setChecked(True)
        bottom.addWidget(self._showOnStartup)
        bottom.addStretch()

        close_btn = QtWidgets.QPushButton("Ýapmak / Close")
        close_btn.setFixedWidth(160)
        close_btn.clicked.connect(self.accept)
        bottom.addWidget(close_btn)

        bottom_widget = QtWidgets.QWidget()
        bottom_widget.setLayout(bottom)
        bottom_widget.setContentsMargins(10, 5, 10, 10)
        layout.addWidget(bottom_widget)

    def showOnStartup(self):
        return self._showOnStartup.isChecked()


# Settings file for show-on-startup preference
_GUIDE_SETTINGS = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "branding", "guide_setting.txt"
)


def should_show_guide():
    try:
        with open(_GUIDE_SETTINGS, "r") as f:
            return f.read().strip() != "hide"
    except FileNotFoundError:
        return True


def save_guide_preference(show):
    try:
        with open(_GUIDE_SETTINGS, "w") as f:
            f.write("show" if show else "hide")
    except Exception:
        pass
